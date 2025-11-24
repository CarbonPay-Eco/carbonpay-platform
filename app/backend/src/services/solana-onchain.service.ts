import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
} from '@solana/spl-token';
import { Program, AnchorProvider, web3, BN, Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import {
  SOLANA_NETWORK,
  SOLANA_PROGRAM_ID,
  SOLANA_SERVER_PRIVATE_KEY,
  SOLANA_RPC_URL
} from '../config/constants';

// Metaplex Token Metadata Program ID
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// CarbonPay Program ID
const PROGRAM_ID = new PublicKey(SOLANA_PROGRAM_ID);

interface InitializeProjectParams {
  projectName: string;
  projectSymbol: string;
  projectUri: string;
  amount: number;
  pricePerToken: number;
  carbonPayFee: number;
}

interface PurchaseCreditsParams {
  projectPda: string;
  projectOwner: string;
  projectTokenMint: string;
  buyerPublicKey: string;
  amount: number;
  usdcMint: string;
}

interface RequestOffsetParams {
  buyerPublicKey: string;
  purchasePda: string;
  projectPda: string;
  purchaseNftMint: string;
  tokenMint: string;
  amount: number;
  requestId: string;
}

export class SolanaOnchainService {
  private connection: Connection;
  private serverWallet: Keypair;
  private provider: AnchorProvider;
  private carbonCreditsPda: PublicKey | null = null;
  private carbonCreditsBump: number | null = null;

  constructor() {
    // Initialize connection
    const rpcUrl = SOLANA_RPC_URL || (SOLANA_NETWORK === 'mainnet'
      ? 'https://api.mainnet-beta.solana.com'
      : 'http://127.0.0.1:8899'); // Use localnet for development

    this.connection = new Connection(rpcUrl, 'confirmed');

    // Initialize server wallet from private key
    if (!SOLANA_SERVER_PRIVATE_KEY) {
      throw new Error('SOLANA_SERVER_PRIVATE_KEY is not set in environment variables');
    }

    try {
      const privateKeyBytes = bs58.decode(SOLANA_SERVER_PRIVATE_KEY);
      this.serverWallet = Keypair.fromSecretKey(privateKeyBytes);
      console.log('✅ Server wallet initialized:', this.serverWallet.publicKey.toBase58());
    } catch (error) {
      throw new Error('Invalid SOLANA_SERVER_PRIVATE_KEY format. Must be base58 encoded');
    }

    // Create provider
    const wallet = new Wallet(this.serverWallet);
    this.provider = new AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
  }

  /**
   * Get the server wallet public key
   */
  getServerPublicKey(): string {
    return this.serverWallet.publicKey.toBase58();
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address?: string): Promise<number> {
    const publicKey = address ? new PublicKey(address) : this.serverWallet.publicKey;
    const balance = await this.connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  /**
   * Derive CarbonCredits PDA
   */
  async getCarbonCreditsPda(): Promise<{ pda: PublicKey; bump: number }> {
    if (this.carbonCreditsPda && this.carbonCreditsBump !== null) {
      return { pda: this.carbonCreditsPda, bump: this.carbonCreditsBump };
    }

    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('carbon_credits')],
      PROGRAM_ID
    );

    this.carbonCreditsPda = pda;
    this.carbonCreditsBump = bump;

    return { pda, bump };
  }

  /**
   * Initialize the CarbonCredits PDA (only needed once)
   * This should be called by an admin during platform setup
   */
  async initializeCarbonCredits(usdcMint: PublicKey): Promise<string> {
    const { pda: carbonCreditsPda } = await this.getCarbonCreditsPda();

    // Get platform USDC vault (ATA for carbon_credits PDA)
    const platformUsdcVault = await getAssociatedTokenAddress(
      usdcMint,
      carbonCreditsPda,
      true // allowOwnerOffCurve for PDA
    );

    // In a real implementation, you would use the Anchor Program
    // For now, we'll return a mock transaction hash
    console.log('Initializing CarbonCredits PDA:', carbonCreditsPda.toBase58());
    console.log('USDC Mint:', usdcMint.toBase58());
    console.log('Platform USDC Vault:', platformUsdcVault.toBase58());

    // TODO: Implement actual Anchor program call
    // const program = new Program(IDL, PROGRAM_ID, this.provider);
    // const tx = await program.methods
    //   .initializeCarbonCredits()
    //   .accounts({
    //     admin: this.serverWallet.publicKey,
    //     usdcMint,
    //     usdcVault: platformUsdcVault,
    //     carbonCredits: carbonCreditsPda,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    //     systemProgram: SystemProgram.programId,
    //     rent: SYSVAR_RENT_PUBKEY,
    //   })
    //   .rpc();

    return `init_carbon_credits_tx_${Date.now()}`;
  }

  /**
   * Derive Project PDA
   */
  async getProjectPda(
    projectOwner: PublicKey,
    nftMint: PublicKey
  ): Promise<{ pda: PublicKey; bump: number }> {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [
        Buffer.from('project'),
        projectOwner.toBuffer(),
        nftMint.toBuffer(),
      ],
      PROGRAM_ID
    );

    return { pda, bump };
  }

  /**
   * Derive metadata PDA
   */
  async getMetadataPda(mint: PublicKey): Promise<PublicKey> {
    const [pda] = await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    return pda;
  }

  /**
   * Derive master edition PDA
   */
  async getMasterEditionPda(mint: PublicKey): Promise<PublicKey> {
    const [pda] = await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from('edition'),
      ],
      METADATA_PROGRAM_ID
    );

    return pda;
  }

  /**
   * Initialize a new carbon credit project on-chain
   * This is signed by the server wallet on behalf of the project owner
   */
  async initializeProject(params: InitializeProjectParams): Promise<{
    projectPda: string;
    nftMint: string;
    tokenMint: string;
    txHash: string;
  }> {
    const {
      projectName,
      projectSymbol,
      projectUri,
      amount,
      pricePerToken,
      carbonPayFee,
    } = params;

    // Create NFT mint (server wallet signs)
    const nftMint = Keypair.generate();

    // Create token mint for fungible tokens
    const tokenMint = Keypair.generate();

    // Get project PDA
    const { pda: projectPda } = await this.getProjectPda(
      this.serverWallet.publicKey,
      nftMint.publicKey
    );

    // Get CarbonCredits PDA
    const { pda: carbonCreditsPda } = await this.getCarbonCreditsPda();

    // Get ATAs
    const projectOwnerNftAccount = await getAssociatedTokenAddress(
      nftMint.publicKey,
      this.serverWallet.publicKey
    );

    const vaultAta = await getAssociatedTokenAddress(
      tokenMint.publicKey,
      carbonCreditsPda,
      true // allowOwnerOffCurve for PDA
    );

    // Get metadata PDAs
    const metadataPda = await this.getMetadataPda(nftMint.publicKey);
    const masterEditionPda = await this.getMasterEditionPda(nftMint.publicKey);

    console.log('🚀 Initializing project on-chain...');
    console.log('Project PDA:', projectPda.toBase58());
    console.log('NFT Mint:', nftMint.publicKey.toBase58());
    console.log('Token Mint:', tokenMint.publicKey.toBase58());
    console.log('Owner NFT Account:', projectOwnerNftAccount.toBase58());
    console.log('Vault ATA:', vaultAta.toBase58());

    // TODO: Implement actual Anchor program call
    // const program = new Program(IDL, PROGRAM_ID, this.provider);
    // const tx = await program.methods
    //   .initializeProject(
    //     new BN(amount),
    //     new BN(pricePerToken),
    //     new BN(carbonPayFee),
    //     projectUri,
    //     projectName,
    //     projectSymbol
    //   )
    //   .accounts({
    //     projectOwner: this.serverWallet.publicKey,
    //     project: projectPda,
    //     nftMint: nftMint.publicKey,
    //     tokenMint: tokenMint.publicKey,
    //     projectOwnerNftAccount,
    //     vault: vaultAta,
    //     carbonCredits: carbonCreditsPda,
    //     metadata: metadataPda,
    //     masterEdition: masterEditionPda,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     tokenMetadataProgram: METADATA_PROGRAM_ID,
    //     systemProgram: SystemProgram.programId,
    //     rent: SYSVAR_RENT_PUBKEY,
    //     associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    //   })
    //   .signers([nftMint, tokenMint])
    //   .rpc();

    const mockTxHash = `project_init_tx_${Date.now()}_${nftMint.publicKey.toBase58().slice(0, 8)}`;

    return {
      projectPda: projectPda.toBase58(),
      nftMint: nftMint.publicKey.toBase58(),
      tokenMint: tokenMint.publicKey.toBase58(),
      txHash: mockTxHash,
    };
  }

  /**
   * Derive Purchase PDA
   */
  async getPurchasePda(
    buyer: PublicKey,
    projectPda: PublicKey,
    purchaseNftMint: PublicKey
  ): Promise<{ pda: PublicKey; bump: number }> {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [
        Buffer.from('purchase'),
        buyer.toBuffer(),
        projectPda.toBuffer(),
        purchaseNftMint.toBuffer(),
      ],
      PROGRAM_ID
    );

    return { pda, bump };
  }

  /**
   * Purchase carbon credits (server signs on behalf of buyer)
   * In Web2.5 model, users don't need to sign - server handles everything
   */
  async purchaseCarbonCredits(params: PurchaseCreditsParams): Promise<{
    purchasePda: string;
    purchaseNftMint: string;
    txHash: string;
  }> {
    const {
      projectPda,
      projectOwner,
      projectTokenMint,
      buyerPublicKey,
      amount,
      usdcMint,
    } = params;

    const projectPdaKey = new PublicKey(projectPda);
    const projectOwnerKey = new PublicKey(projectOwner);
    const projectMintKey = new PublicKey(projectTokenMint);
    const buyerKey = new PublicKey(buyerPublicKey);
    const usdcMintKey = new PublicKey(usdcMint);

    // Generate purchase NFT mint
    const purchaseNftMint = Keypair.generate();

    // Get CarbonCredits PDA
    const { pda: carbonCreditsPda } = await this.getCarbonCreditsPda();

    // Get Purchase PDA
    const { pda: purchasePda } = await this.getPurchasePda(
      buyerKey,
      projectPdaKey,
      purchaseNftMint.publicKey
    );

    // Get all necessary ATAs
    const buyerNftAta = await getAssociatedTokenAddress(
      purchaseNftMint.publicKey,
      buyerKey
    );

    const buyerTokenAta = await getAssociatedTokenAddress(
      projectMintKey,
      buyerKey
    );

    const projectTokenAccount = await getAssociatedTokenAddress(
      projectMintKey,
      carbonCreditsPda,
      true
    );

    const buyerUsdcAccount = await getAssociatedTokenAddress(
      usdcMintKey,
      buyerKey
    );

    const projectOwnerUsdcAccount = await getAssociatedTokenAddress(
      usdcMintKey,
      projectOwnerKey
    );

    const platformUsdcVault = await getAssociatedTokenAddress(
      usdcMintKey,
      carbonCreditsPda,
      true
    );

    const purchaseMetadata = await this.getMetadataPda(purchaseNftMint.publicKey);

    console.log('💳 Processing purchase on-chain...');
    console.log('Purchase PDA:', purchasePda.toBase58());
    console.log('Purchase NFT Mint:', purchaseNftMint.publicKey.toBase58());
    console.log('Amount:', amount);

    // TODO: Implement actual Anchor program call
    // Server wallet signs the transaction
    // const program = new Program(IDL, PROGRAM_ID, this.provider);
    // const tx = await program.methods
    //   .purchaseCarbonCredits(new BN(amount))
    //   .accounts({
    //     project: projectPdaKey,
    //     projectOwner: projectOwnerKey,
    //     projectMint: projectMintKey,
    //     carbonCredits: carbonCreditsPda,
    //     projectTokenAccount,
    //     purchaseNftMint: purchaseNftMint.publicKey,
    //     buyerNftAccount: buyerNftAta,
    //     buyerTokenAccount: buyerTokenAta,
    //     purchase: purchasePda,
    //     usdcMint: usdcMintKey,
    //     buyerUsdcAccount,
    //     projectOwnerUsdcAccount,
    //     platformUsdcVault,
    //     purchaseMetadata,
    //     buyer: buyerKey,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     tokenMetadataProgram: METADATA_PROGRAM_ID,
    //     systemProgram: SystemProgram.programId,
    //     rent: SYSVAR_RENT_PUBKEY,
    //   })
    //   .signers([purchaseNftMint])
    //   .rpc();

    const mockTxHash = `purchase_tx_${Date.now()}_${purchaseNftMint.publicKey.toBase58().slice(0, 8)}`;

    return {
      purchasePda: purchasePda.toBase58(),
      purchaseNftMint: purchaseNftMint.publicKey.toBase58(),
      txHash: mockTxHash,
    };
  }

  /**
   * Derive OffsetRequest PDA
   */
  async getOffsetRequestPda(
    offsetRequester: PublicKey,
    purchasePda: PublicKey,
    requestId: string
  ): Promise<{ pda: PublicKey; bump: number }> {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [
        Buffer.from('offset_request'),
        offsetRequester.toBuffer(),
        purchasePda.toBuffer(),
        Buffer.from(requestId),
      ],
      PROGRAM_ID
    );

    return { pda, bump };
  }

  /**
   * Request offset (retirement) of carbon credits
   * Server signs on behalf of the buyer
   */
  async requestOffset(params: RequestOffsetParams): Promise<{
    offsetRequestPda: string;
    newNftMint: string | null;
    txHash: string;
  }> {
    const {
      buyerPublicKey,
      purchasePda,
      projectPda,
      purchaseNftMint,
      tokenMint,
      amount,
      requestId,
    } = params;

    const buyerKey = new PublicKey(buyerPublicKey);
    const purchasePdaKey = new PublicKey(purchasePda);
    const projectPdaKey = new PublicKey(projectPda);
    const originalNftMint = new PublicKey(purchaseNftMint);
    const tokenMintKey = new PublicKey(tokenMint);

    // Generate new NFT mint for residual (if partial offset)
    const newNftMint = Keypair.generate();

    // Get CarbonCredits PDA
    const { pda: carbonCreditsPda } = await this.getCarbonCreditsPda();

    // Get OffsetRequest PDA
    const { pda: offsetRequestPda } = await this.getOffsetRequestPda(
      buyerKey,
      purchasePdaKey,
      requestId
    );

    // Get all necessary accounts
    const originalNftAccount = await getAssociatedTokenAddress(
      originalNftMint,
      buyerKey
    );

    const newNftAccount = await getAssociatedTokenAddress(
      newNftMint.publicKey,
      buyerKey
    );

    const buyerTokenAccount = await getAssociatedTokenAddress(
      tokenMintKey,
      buyerKey
    );

    const newNftMetadata = await this.getMetadataPda(newNftMint.publicKey);

    console.log('♻️ Processing offset request on-chain...');
    console.log('Offset Request PDA:', offsetRequestPda.toBase58());
    console.log('Amount to offset:', amount);
    console.log('Request ID:', requestId);

    // TODO: Implement actual Anchor program call
    // const program = new Program(IDL, PROGRAM_ID, this.provider);
    // const tx = await program.methods
    //   .requestOffset(new BN(amount), requestId)
    //   .accounts({
    //     offsetRequester: buyerKey,
    //     purchase: purchasePdaKey,
    //     project: projectPdaKey,
    //     originalNftMint,
    //     originalNftAccount,
    //     newNftMint: newNftMint.publicKey,
    //     newNftAccount,
    //     newNftMetadata,
    //     tokenMint: tokenMintKey,
    //     buyerTokenAccount,
    //     carbonCredits: carbonCreditsPda,
    //     offsetRequest: offsetRequestPda,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     tokenMetadataProgram: METADATA_PROGRAM_ID,
    //     systemProgram: SystemProgram.programId,
    //     rent: SYSVAR_RENT_PUBKEY,
    //   })
    //   .signers([newNftMint])
    //   .rpc();

    const mockTxHash = `offset_tx_${Date.now()}_${requestId}`;

    return {
      offsetRequestPda: offsetRequestPda.toBase58(),
      newNftMint: newNftMint.publicKey.toBase58(),
      txHash: mockTxHash,
    };
  }

  /**
   * Airdrop SOL to an address (devnet/localnet only)
   */
  async airdropSol(address: string, amount: number = 1): Promise<string> {
    if (SOLANA_NETWORK === 'mainnet') {
      throw new Error('Airdrop not available on mainnet');
    }

    const publicKey = new PublicKey(address);
    const signature = await this.connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );

    await this.connection.confirmTransaction(signature);
    console.log(`✅ Airdropped ${amount} SOL to ${address}`);

    return signature;
  }
}
