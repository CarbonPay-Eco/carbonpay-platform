import { Connection, Keypair, PublicKey, clusterApiUrl, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createMint, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { SOLANA_NETWORK, SOLANA_RPC_URL, SOLANA_SERVER_PRIVATE_KEY } from '../config/constants';
import bs58 from 'bs58';
import * as path from 'path';
import * as fs from 'fs';

import IDL from '../../../../target/idl/carbon_pay.json';
import { CarbonPay } from '../../../../target/types/carbon_pay';

// Metadata Program ID
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export class AnchorService {
  private connection: Connection;
  private program: Program<CarbonPay>;
  private provider: AnchorProvider;
  private wallet: Wallet;
  private keypair: Keypair;

  /**
   * Get the server wallet's public key (used as fee payer and payer for account abstraction)
   */
  getServerPublicKey(): PublicKey {
    return this.keypair.publicKey;
  }

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
      IDL as CarbonPay,
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
   * Check if carbon_credits PDA is initialized
   */
  async isCarbonCreditsInitialized(carbonCreditsPDA: PublicKey): Promise<boolean> {
    try {
      const accountInfo = await this.connection.getAccountInfo(carbonCreditsPDA);
      return accountInfo !== null && accountInfo.data.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize a new project on-chain
   * @param projectOwnerKeypair - REQUIRED keypair for project owner (user's wallet)
   */
  async initializeProject(params: {
    projectOwner: PublicKey;
    projectOwnerKeypair: Keypair; // REQUIRED: user's keypair for signing
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
      projectOwnerKeypair, // REQUIRED - user's wallet keypair
      amount,
      pricePerToken,
      carbonPayFee,
      uri,
      name,
      symbol,
    } = params;

    // Verify projectOwner matches the keypair
    if (projectOwner.toBase58() !== projectOwnerKeypair.publicKey.toBase58()) {
      throw new Error(
        `Project owner public key mismatch. Expected ${projectOwner.toBase58()}, got ${projectOwnerKeypair.publicKey.toBase58()}`
      );
    }

    // No need to fund user wallet - server wallet will pay for account creation
    // This is account abstraction: user owns the project, server pays for it

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
    const [carbonCreditsPDA, carbonCreditsBump] = await this.findPDA(
      [Buffer.from('carbon_credits')]
    );

    // Check if carbon_credits PDA is initialized
    const needsCarbonCreditsInit = !(await this.isCarbonCreditsInitialized(carbonCreditsPDA));

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

    // Build instructions array
    const instructions: TransactionInstruction[] = [];

    // If carbon_credits PDA is not initialized, add initialization instruction
    if (needsCarbonCreditsInit) {
      console.log(`Carbon credits PDA not initialized. Adding initialization instruction...`);
      
      // Get USDC mint from environment
      // On devnet, we might need to create a test mint or use a different address
      const usdcMintAddress = process.env.SOLANA_USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      const usdcMint = new PublicKey(usdcMintAddress);
      
      // Verify the USDC mint account exists and is a valid token mint
      const usdcMintInfo = await this.connection.getAccountInfo(usdcMint);
      if (!usdcMintInfo) {
        throw new Error(
          `USDC mint account ${usdcMintAddress} does not exist on ${SOLANA_NETWORK}. ` +
          `Please create a test USDC mint on devnet or use a valid mint address. ` +
          `You can create one using: spl-token create-token --decimals 6`
        );
      }
      
      // Verify it's owned by the Token Program
      if (!usdcMintInfo.owner.equals(TOKEN_PROGRAM_ID)) {
        throw new Error(
          `USDC mint account ${usdcMintAddress} is not owned by Token Program. ` +
          `Owner: ${usdcMintInfo.owner.toBase58()}, Expected: ${TOKEN_PROGRAM_ID.toBase58()}`
        );
      }
      
      console.log(`Using USDC mint: ${usdcMintAddress} (verified on ${SOLANA_NETWORK})`);
      
      // Find USDC vault ATA for carbon_credits PDA
      const usdcVault = await getAssociatedTokenAddress(
        usdcMint,
        carbonCreditsPDA,
        true // allowOwnerOffCurve: true for PDA
      );

      // Build initializeCarbonCredits instruction
      const initCarbonCreditsInstruction = await this.program.methods
        .initializeCarbonCredits()
        .accountsStrict({
          admin: this.keypair.publicKey, // Server wallet is admin
          usdcMint,
          usdcVault,
          carbonCredits: carbonCreditsPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();

      instructions.push(initCarbonCreditsInstruction);
    }

      // Build the initializeProject instruction
      // Use server wallet as payer for account abstraction
      const initializeProjectInstruction = await this.program.methods
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
          payer: this.keypair.publicKey, // Server wallet pays for account creation
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
        .instruction();

    instructions.push(initializeProjectInstruction);

    // Create transaction manually
    // Server wallet is always the fee payer
    const transaction = new Transaction();
    for (const instruction of instructions) {
      transaction.add(instruction);
    }
    
    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.keypair.publicKey;

    // Build signers array
    // Always include server wallet (fee payer) + mint keypairs + project owner keypair
    const signers = [this.keypair, nftMintKeypair, tokenMintKeypair, projectOwnerKeypair];

    // Sign the transaction
    transaction.sign(...signers);

    // Send and confirm the transaction
    const tx = await this.connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // Wait for confirmation
    await this.connection.confirmTransaction(tx, 'confirmed');

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

  /**
   * Get purchase data from on-chain
   */
  async getPurchase(purchasePDA: PublicKey): Promise<any> {
    try {
      const purchase = await (this.program.account as any).purchase.fetch(purchasePDA);
      return purchase;
    } catch (error) {
      console.error('Error fetching purchase:', error);
      throw error;
    }
  }

  /**
   * Purchase carbon credits using on-chain program
   * @param buyerKeypair - User's keypair (must sign for USDC transfer)
   * @param projectPDA - The project PDA address
   * @param projectOwner - Project owner's public key
   * @param projectTokenMint - Project's fungible token mint
   * @param amount - Amount of credits to purchase (in tons, will be converted to smallest unit)
   * @returns Purchase PDA and transaction hash
   */
  async purchaseCarbonCredits(params: {
    buyerKeypair: Keypair;
    projectPDA: PublicKey;
    projectOwner: PublicKey;
    projectTokenMint: PublicKey;
    amount: number; // Amount in tons
  }): Promise<{
    tx: string;
    purchasePDA: PublicKey;
    nftMint: PublicKey;
  }> {
    const {
      buyerKeypair,
      projectPDA,
      projectOwner,
      projectTokenMint,
      amount,
    } = params;

    // Get USDC mint from environment
    const usdcMintAddress = process.env.SOLANA_USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const usdcMint = new PublicKey(usdcMintAddress);

    // Find carbon credits PDA
    const [carbonCreditsPDA] = await this.findPDA([Buffer.from('carbon_credits')]);

    // Get carbon credits account to find USDC vault
    const carbonCreditsAccount = await (this.program.account as any).carbonCredits.fetch(carbonCreditsPDA);
    const platformUsdcVault = carbonCreditsAccount.usdcVault;

    // Create purchase NFT mint keypair
    const purchaseNftMintKeypair = Keypair.generate();
    
    // Create the purchase NFT mint with buyer as mint authority
    // This must be done before the purchase instruction
    const purchaseNftMint = await createMint(
      this.connection,
      this.keypair, // payer (server wallet)
      buyerKeypair.publicKey, // mint authority (buyer)
      buyerKeypair.publicKey, // freeze authority (buyer)
      0, // decimals (NFT)
      purchaseNftMintKeypair
    );

    // Find buyer's NFT account (ATA for purchase NFT)
    const buyerNftAccount = await getAssociatedTokenAddress(
      purchaseNftMint,
      buyerKeypair.publicKey
    );

    // Find buyer's token account (ATA for fungible tokens)
    const buyerTokenAccount = await getAssociatedTokenAddress(
      projectTokenMint,
      buyerKeypair.publicKey
    );

    // Find buyer's USDC account
    const buyerUsdcAccount = await getAssociatedTokenAddress(
      usdcMint,
      buyerKeypair.publicKey
    );

    // Find project owner's USDC account
    const projectOwnerUsdcAccount = await getAssociatedTokenAddress(
      usdcMint,
      projectOwner
    );

    // Find project token vault (owned by carbon_credits PDA)
    const projectTokenVault = await getAssociatedTokenAddress(
      projectTokenMint,
      carbonCreditsPDA,
      true // allowOwnerOffCurve
    );

    // Find purchase PDA
    const [purchasePDA] = await this.findPDA(
      [
        Buffer.from('purchase'),
        buyerKeypair.publicKey.toBuffer(),
        projectPDA.toBuffer(),
        purchaseNftMint.toBuffer(),
      ]
    );

    // Find purchase metadata PDA
    const [purchaseMetadata] = await this.findPDA(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        purchaseNftMint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    // Tokens have 0 decimals, so amount is already in the correct units (1 token = 1 ton)
    // No conversion needed - pass amount directly
    const amountInTokens = Math.floor(amount);

    // Build the purchase instruction
    const purchaseInstruction = await this.program.methods
      .purchaseCarbonCredits(new BN(amountInTokens))
      .accountsStrict({
        project: projectPDA,
        projectOwner,
        payer: this.keypair.publicKey, // Server wallet pays for account creation
        projectMint: projectTokenMint,
        carbonCredits: carbonCreditsPDA,
        projectTokenAccount: projectTokenVault,
        purchaseNftMint: purchaseNftMint,
        buyerNftAccount,
        buyerTokenAccount,
        purchase: purchasePDA,
        usdcMint,
        buyerUsdcAccount,
        projectOwnerUsdcAccount,
        platformUsdcVault,
        purchaseMetadata,
        buyer: buyerKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    // Create transaction manually
    const transaction = new Transaction();
    
    // Add instruction to create buyer's NFT account if it doesn't exist
    try {
      const nftAccountInfo = await this.connection.getAccountInfo(buyerNftAccount);
      if (!nftAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.keypair.publicKey, // payer
            buyerNftAccount,
            buyerKeypair.publicKey, // owner
            purchaseNftMint
          )
        );
      }
    } catch (error) {
      // Account might not exist, add instruction to create it
      transaction.add(
        createAssociatedTokenAccountInstruction(
          this.keypair.publicKey, // payer
          buyerNftAccount,
          buyerKeypair.publicKey, // owner
          purchaseNftMint
        )
      );
    }

    // Add instruction to create buyer's token account if it doesn't exist
    try {
      const tokenAccountInfo = await this.connection.getAccountInfo(buyerTokenAccount);
      if (!tokenAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.keypair.publicKey, // payer
            buyerTokenAccount,
            buyerKeypair.publicKey, // owner
            projectTokenMint
          )
        );
      }
    } catch (error) {
      // Account might not exist, add instruction to create it
      transaction.add(
        createAssociatedTokenAccountInstruction(
          this.keypair.publicKey, // payer
          buyerTokenAccount,
          buyerKeypair.publicKey, // owner
          projectTokenMint
        )
      );
    }

    transaction.add(purchaseInstruction);

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.keypair.publicKey;

    // Signers: server wallet (fee payer) + buyer (for USDC transfer)
    const signers = [this.keypair, buyerKeypair];

    // Sign the transaction
    transaction.sign(...signers);

    // Send and confirm the transaction
    const tx = await this.connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    await this.connection.confirmTransaction(tx, 'confirmed');

    return {
      tx,
      purchasePDA,
      nftMint: purchaseNftMint,
    };
  }

  /**
   * Request offset for carbon credits (burns tokens and creates offset request)
   * @param offsetRequesterKeypair - User's keypair (must sign)
   * @param purchasePDA - The purchase PDA address
   * @param projectPDA - The project PDA address
   * @param amount - Amount of tokens to offset (in smallest unit, e.g., if 1 token = 1 ton, amount is in tons)
   * @param requestId - Unique request ID string
   */
  async requestOffset(params: {
    offsetRequesterKeypair: Keypair;
    purchasePDA: PublicKey;
    projectPDA: PublicKey;
    amount: number;
    requestId: string;
  }): Promise<{
    tx: string;
    offsetRequestPDA: PublicKey;
    newNftMint?: PublicKey; // New NFT mint if partial offset (remaining > 0)
  }> {
    const {
      offsetRequesterKeypair,
      purchasePDA,
      projectPDA,
      amount,
      requestId,
    } = params;

    // Fetch purchase account to get required addresses
    const purchaseAccount = await (this.program.account as any).purchase.fetch(purchasePDA);
    const projectAccount = await (this.program.account as any).project.fetch(projectPDA);

    const offsetRequester = offsetRequesterKeypair.publicKey;
    const purchaseNftMint = purchaseAccount.nftMint;
    const projectTokenMint = projectAccount.tokenMint;

    // Get ATAs
    const originalNftAccount = await this.getAssociatedTokenAddress(
      purchaseNftMint,
      offsetRequester
    );
    const buyerTokenAccount = await this.getAssociatedTokenAddress(
      projectTokenMint,
      offsetRequester
    );

    // Validate that the original NFT account exists and has balance
    try {
      const nftAccountInfo = await this.connection.getTokenAccountBalance(originalNftAccount);
      const nftBalance = Number(nftAccountInfo.value.amount);
      if (nftBalance === 0) {
        throw new Error(
          `NFT account has no balance. The purchase NFT may have already been burned. ` +
          `Purchase PDA: ${purchasePDA.toBase58()}, NFT Mint: ${purchaseNftMint.toBase58()}, ` +
          `NFT Account: ${originalNftAccount.toBase58()}. ` +
          `Purchase remaining_amount: ${purchaseAccount.remainingAmount.toString()}`
        );
      }
      console.log(`Original NFT account balance: ${nftBalance}`);
    } catch (error: any) {
      if (error.message && (error.message.includes("InvalidNFTAccount") || error.message.includes("no balance"))) {
        throw error;
      }
      // Account might not exist or connection error
      const accountInfo = await this.connection.getAccountInfo(originalNftAccount);
      if (!accountInfo) {
        throw new Error(
          `NFT account does not exist. ` +
          `Purchase PDA: ${purchasePDA.toBase58()}, NFT Mint: ${purchaseNftMint.toBase58()}, ` +
          `NFT Account: ${originalNftAccount.toBase58()}. ` +
          `The purchase NFT may have already been burned in a previous offset.`
        );
      }
      // Re-throw if it's a different error
      throw error;
    }

    // Validate that the buyer token account has sufficient balance
    try {
      const tokenAccountInfo = await this.connection.getTokenAccountBalance(buyerTokenAccount);
      const tokenBalance = Number(tokenAccountInfo.value.amount);
      if (tokenBalance < amount) {
        throw new Error(
          `Insufficient fungible token balance. ` +
          `Required: ${amount}, Available: ${tokenBalance}. ` +
          `Token Account: ${buyerTokenAccount.toBase58()}`
        );
      }
      console.log(`Buyer token account balance: ${tokenBalance}, Required: ${amount}`);
    } catch (error: any) {
      if (error.message && error.message.includes("Insufficient")) {
        throw error;
      }
      // Account might not exist
      const accountInfo = await this.connection.getAccountInfo(buyerTokenAccount);
      if (!accountInfo) {
        throw new Error(
          `Token account does not exist. ` +
          `Token Account: ${buyerTokenAccount.toBase58()}, Required: ${amount}. ` +
          `You may need to purchase credits first.`
        );
      }
      // Re-throw if it's a different error
      throw error;
    }

    // Log purchase account state for debugging
    console.log(`Purchase account state:`, {
      purchasePDA: purchasePDA.toBase58(),
      amount: purchaseAccount.amount.toString(),
      remainingAmount: purchaseAccount.remainingAmount.toString(),
      nftMint: purchaseAccount.nftMint.toBase58(),
    });

    // Always create a new NFT mint for offsets (needed for partial offsets, and program expects it)
    // This new NFT will represent the remaining balance after offset
    const newNftMintKeypair = Keypair.generate();
    
    // Create the new NFT mint with offset requester as mint authority
    const newNftMint = await createMint(
      this.connection,
      this.keypair, // payer (server wallet)
      offsetRequesterKeypair.publicKey, // mint authority (user)
      offsetRequesterKeypair.publicKey, // freeze authority (user)
      0, // decimals (NFT)
      newNftMintKeypair
    );
    
    const newNftAccount = await this.getAssociatedTokenAddress(
      newNftMint,
      offsetRequester
    );

    // Find metadata PDA for new NFT
    const [newNftMetadata] = await this.findPDA(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        newNftMint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    // Find carbon credits PDA
    const [carbonCreditsPDA] = await this.findPDA([Buffer.from('carbon_credits')]);

    // Find offset request PDA
    const [offsetRequestPDA] = await this.findPDA(
      [
        Buffer.from('offset_request'),
        offsetRequester.toBuffer(),
        purchasePDA.toBuffer(),
        Buffer.from(requestId),
      ]
    );

    // Build the requestOffset instruction
    const requestOffsetInstruction = await this.program.methods
      .requestOffset(new BN(amount), requestId)
      .accountsStrict({
        offsetRequester,
        payer: this.keypair.publicKey, // Server wallet pays for account creation
        purchase: purchasePDA,
        project: projectPDA,
        originalNftMint: purchaseNftMint,
        originalNftAccount,
        newNftMint,
        newNftAccount,
        newNftMetadata,
        tokenMint: projectTokenMint,
        buyerTokenAccount,
        carbonCredits: carbonCreditsPDA,
        offsetRequest: offsetRequestPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    // Create transaction manually
    const transaction = new Transaction();
    
    // Add instruction to create new NFT account if it doesn't exist
    // This is needed for partial offsets where a new NFT will be minted
    try {
      const newNftAccountInfo = await this.connection.getAccountInfo(newNftAccount);
      if (!newNftAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.keypair.publicKey, // payer
            newNftAccount,
            offsetRequester, // owner
            newNftMint
          )
        );
      }
    } catch (error) {
      // Account might not exist, add instruction to create it
      transaction.add(
        createAssociatedTokenAccountInstruction(
          this.keypair.publicKey, // payer
          newNftAccount,
          offsetRequester, // owner
          newNftMint
        )
      );
    }
    
    transaction.add(requestOffsetInstruction);

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.keypair.publicKey;

    // Signers: server wallet (fee payer) + offset requester (user) + new NFT mint (for creation)
    const signers = [this.keypair, offsetRequesterKeypair, newNftMintKeypair];

    // Sign the transaction
    transaction.sign(...signers);

    // Send and confirm the transaction
    const tx = await this.connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // Wait for confirmation
    await this.connection.confirmTransaction(tx, 'confirmed');

    // Fetch purchase account after offset to check if it's a partial offset
    const updatedPurchaseAccount = await (this.program.account as any).purchase.fetch(purchasePDA);
    const remainingAfterOffset = Number(updatedPurchaseAccount.remainingAmount);
    
    // If partial offset (remaining > 0), return the new NFT mint
    // The new NFT represents the remaining balance
    return {
      tx,
      offsetRequestPDA,
      newNftMint: remainingAfterOffset > 0 ? newNftMint : undefined
    };
  }
}