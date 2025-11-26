import { Connection, Keypair, PublicKey, clusterApiUrl, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createMint, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { SOLANA_NETWORK, SOLANA_RPC_URL, SOLANA_SERVER_PRIVATE_KEY } from '../config/constants';
import bs58 from 'bs58';
import * as path from 'path';
import * as fs from 'fs';

// Load IDL at runtime - handle both local dev and Docker environments
// In Docker: __dirname is /app/dist/services/, target/ is at /app/target/
// Locally: __dirname is platform/app/backend/src/services/, target/ is at platform/target/
let idlPath: string;
if (__dirname.includes('/app/dist/') || __dirname.includes('\\app\\dist\\')) {
  // Docker environment: from /app/dist/services/ to /app/target/
  idlPath = path.join(__dirname, '../../target/idl/carbon_pay.json');
} else {
  // Local development: from platform/app/backend/src/services/ to platform/target/
  // Need to go up 4 levels: services -> src -> backend -> app -> platform
  idlPath = path.join(__dirname, '../../../../target/idl/carbon_pay.json');
}

// Fallback: try to find from process.cwd() if above paths don't work
if (!fs.existsSync(idlPath)) {
  // Try from current working directory (should be platform/ or platform/app/backend/)
  const cwdPath = path.join(process.cwd(), 'target/idl/carbon_pay.json');
  if (fs.existsSync(cwdPath)) {
    idlPath = cwdPath;
  } else {
    // Try from platform root (if cwd is app/backend/)
    const platformPath = path.join(process.cwd(), '../target/idl/carbon_pay.json');
    if (fs.existsSync(platformPath)) {
      idlPath = platformPath;
    } else {
      // Last resort: try absolute path from platform root
      const absolutePath = path.resolve(__dirname, '../../../../target/idl/carbon_pay.json');
      if (fs.existsSync(absolutePath)) {
        idlPath = absolutePath;
      }
    }
  }
}

if (!fs.existsSync(idlPath)) {
  throw new Error(`IDL file not found. Tried: ${idlPath}. Please ensure the Anchor program has been built (run 'anchor build' in the platform directory).`);
}

const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

// Type definition - CarbonPay is exported as a type from the generated types file
// We'll use the IDL structure directly for typing
type CarbonPay = any; // Anchor will infer from IDL

// Metadata Program ID
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export class AnchorService {
  private connection: Connection;
  private program: Program<CarbonPay>;
  private provider: AnchorProvider;
  private wallet: Wallet;
  private keypair: Keypair;

  constructor() {
    // Initialize connection
    let rpcUrl = SOLANA_RPC_URL;
    
    if (!rpcUrl) {
      if (SOLANA_NETWORK === 'mainnet') {
        rpcUrl = clusterApiUrl('mainnet-beta');
      } else if (SOLANA_NETWORK === 'devnet') {
        rpcUrl = clusterApiUrl('devnet');
      } else {
        // For localnet, try to use host.docker.internal if running in Docker
        // Otherwise fallback to localhost
        const isDocker = process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'production';
        rpcUrl = isDocker ? 'http://host.docker.internal:8899' : 'http://127.0.0.1:8899';
      }
    }
    
    this.connection = new Connection(rpcUrl, 'confirmed');

    // Initialize wallet from private key
    const privateKeyBytes = bs58.decode(SOLANA_SERVER_PRIVATE_KEY);
    this.keypair = Keypair.fromSecretKey(privateKeyBytes);
    this.wallet = new Wallet(this.keypair);

    // Initialize provider
    this.provider = new AnchorProvider(
      this.connection,
      this.wallet,
      { commitment: 'confirmed' }
    );

    // Initialize program - IDL already contains programId in address field
    this.program = new Program(
      idl as CarbonPay,
      this.provider
    );
  }

  /**
   * Find a PDA (Program Derived Address)
   */
  async findPDA(seeds: (Buffer | Uint8Array)[], programId?: PublicKey): Promise<[PublicKey, number]> {
    const pid = programId || this.program.programId;
    return PublicKey.findProgramAddress(seeds, pid);
  }

  /**
   * Get associated token address
   */
  async getAssociatedTokenAddress(
    mint: PublicKey,
    owner: PublicKey
  ): Promise<PublicKey> {
    return getAssociatedTokenAddress(mint, owner, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  }

  /**
   * Initialize a new project on-chain
   */
  async initializeProject(params: {
    projectOwner: PublicKey;
    amount: number;
    pricePerToken: number;
    carbonPayFee: number;
    uri: string;
    name: string;
    symbol: string;
  }): Promise<{
    tx: string;
    projectPDA: PublicKey;
    nftMint: PublicKey;
    tokenMint: PublicKey;
  }> {
    const {
      projectOwner,
      amount,
      pricePerToken,
      carbonPayFee,
      uri,
      name,
      symbol,
    } = params;

    // Generate new mints for NFT and token
    const nftMintKeypair = Keypair.generate();
    const tokenMintKeypair = Keypair.generate();
    const nftMint = nftMintKeypair.publicKey;
    const tokenMint = tokenMintKeypair.publicKey;

    // Create mints
    const nftMintAddress = await createMint(
      this.connection,
      this.keypair, // payer (Keypair)
      projectOwner, // mint authority
      projectOwner, // freeze authority
      0, // decimals (NFT)
      nftMintKeypair
    );

    const tokenMintAddress = await createMint(
      this.connection,
      this.keypair, // payer (Keypair)
      projectOwner, // mint authority
      projectOwner, // freeze authority
      0, // decimals (fungible tokens)
      tokenMintKeypair
    );

    // Find project PDA
    const [projectPDA] = await this.findPDA(
      [
        Buffer.from('project'),
        projectOwner.toBuffer(),
        nftMint.toBuffer(),
      ]
    );

    // Find carbon credits PDA
    const [carbonCreditsPDA] = await this.findPDA(
      [Buffer.from('carbon_credits')]
    );

    // Get ATAs
    const projectOwnerNftAccount = await this.getAssociatedTokenAddress(
      nftMint,
      projectOwner
    );
    const vault = await getAssociatedTokenAddress(
      tokenMint,
      carbonCreditsPDA,
      true // allowOwnerOffCurve: true for PDA
    );

    // Create ATAs in a transaction
    const createAtaTx = new Transaction()
      .add(
        createAssociatedTokenAccountInstruction(
          this.wallet.publicKey, // payer
          projectOwnerNftAccount,
          projectOwner, // owner
          nftMint
        )
      )
      .add(
        createAssociatedTokenAccountInstruction(
          this.wallet.publicKey, // payer
          vault,
          carbonCreditsPDA, // owner - the carbon_credits PDA
          tokenMint
        )
      );

    await this.provider.sendAndConfirm(createAtaTx);

    // Find metadata PDAs
    const [metadataPDA] = await this.findPDA(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        nftMint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    const [masterEditionPDA] = await this.findPDA(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        nftMint.toBuffer(),
        Buffer.from('edition'),
      ],
      METADATA_PROGRAM_ID
    );

    // Execute the initialize_project instruction
    const tx = await this.program.methods
      .initializeProject(
        new BN(amount),
        new BN(pricePerToken),
        new BN(carbonPayFee),
        uri,
        name,
        symbol
      )
      .accountsStrict({
        projectOwner,
        project: projectPDA,
        nftMint,
        tokenMint,
        projectOwnerNftAccount,
        vault,
        carbonCredits: carbonCreditsPDA,
        metadata: metadataPDA,
        masterEdition: masterEditionPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([nftMintKeypair, tokenMintKeypair])
      .rpc();

    return {
      tx,
      projectPDA,
      nftMint,
      tokenMint,
    };
  }

  /**
   * Get project data from on-chain
   */
  async getProject(projectPDA: PublicKey): Promise<any> {
    try {
      const project = await (this.program.account as any).project.fetch(projectPDA);
      return project;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }
}