import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { before, describe, test } from "node:test";
import assert from "node:assert";
import { CarbonPay } from "../target/types/carbon_pay";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("CarbonPay", async () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CarbonPay as Program<CarbonPay>;
  const admin = provider.wallet.publicKey;
  
  // Generate keypair for the mint
  const mintKeypair = Keypair.generate();
  
  // Store PDAs and keys
  let carbonCreditsKey: PublicKey;
  let carbonPayAuthorityKey: PublicKey;
  let projectKey: PublicKey;
  let purchaseKey: PublicKey;
  
  // Define constants for project
  const PROJECT_AMOUNT = 1000;
  const PRICE_PER_TOKEN = 0.1 * LAMPORTS_PER_SOL;
  const CARBON_PAY_FEE = 500;
  
  // Define constants for offset
  const OFFSET_AMOUNT = 500;
  const REQUEST_ID = "REQ-123";

  // Token Metadata Program ID
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

  before(async () => {
    // Airdrop SOL to admin if needed
    const connection = new Connection("http://localhost:8899", "confirmed");
    const balance = await connection.getBalance(admin);
    if (balance < LAMPORTS_PER_SOL) {
      const signature = await connection.requestAirdrop(admin, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);
    }

    // Find the PDA for carbon_credits
    const [carbonCreditsAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("carbon_credits")],
      program.programId
    );
    carbonCreditsKey = carbonCreditsAddress;
    
    carbonPayAuthorityKey = admin;
    
    const [projectPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("project"),
        admin.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      program.programId
    );
    projectKey = projectPDA;
  });

  test("Initialize Carbon Credits", async () => {
    try {
      const tx = await program.methods
        .initializeCarbonCredits()
        .accountsPartial({
          admin: admin,
          carbonCredits: carbonCreditsKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log("Transaction signature:", tx);
      
      const carbonCreditsAccount = await program.account.carbonCredits.fetch(carbonCreditsKey);
      assert.strictEqual(carbonCreditsAccount.authority.toString(), admin.toString());
      assert.strictEqual(carbonCreditsAccount.totalCredits.toNumber(), 0);
      assert.strictEqual(carbonCreditsAccount.offsetCredits.toNumber(), 0);
      assert.strictEqual(carbonCreditsAccount.totalFeesEarned.toNumber(), 0);
    } catch (error) {
      console.error("Error initializing carbon credits:", error);
      throw error;
    }
  });
  
  test("Initialize Project", async () => {
    try {
      const carbonPayTokenAccount = await anchor.utils.token.associatedAddress({
        mint: mintKeypair.publicKey,
        owner: carbonPayAuthorityKey,
      });
      
      // Find PDA for metadata account
      const metadataSeeds = [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBytes(),
        mintKeypair.publicKey.toBytes(),
      ];
      const [metadataAddress] = PublicKey.findProgramAddressSync(
        metadataSeeds,
        TOKEN_METADATA_PROGRAM_ID
      );

      // Find PDA for master edition account
      const masterEditionSeeds = [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBytes(),
        mintKeypair.publicKey.toBytes(),
        Buffer.from("edition"),
      ];
      const [masterEditionAddress] = PublicKey.findProgramAddressSync(
        masterEditionSeeds,
        TOKEN_METADATA_PROGRAM_ID
      );
      
      const tx = await program.methods
        .initializeProject(
          new anchor.BN(PROJECT_AMOUNT),
          new anchor.BN(PRICE_PER_TOKEN),
          new anchor.BN(CARBON_PAY_FEE),
          "https://arweave.net/your-project-metadata",
          "Carbon Credits Project",
          "CRBN"
        )
        .accountsPartial({
          projectOwner: admin,
          project: projectKey,
          mint: mintKeypair.publicKey,
          carbonPayTokenAccount: carbonPayTokenAccount,
          carbonPayAuthority: carbonPayAuthorityKey,
          carbonCredits: carbonCreditsKey,
          metadata: metadataAddress,
          masterEdition: masterEditionAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([mintKeypair])
        .rpc();
      
      console.log("Project initialized: ", tx);
      
      const projectAccount = await program.account.project.fetch(projectKey);
      console.log("projectAccount", projectAccount);
      assert.strictEqual(projectAccount.owner.toString(), admin.toString());
      assert.strictEqual(projectAccount.mint.toString(), mintKeypair.publicKey.toString());
      assert.strictEqual(projectAccount.amount.toNumber(), PROJECT_AMOUNT);
      assert.strictEqual(projectAccount.remainingAmount.toNumber(), PROJECT_AMOUNT);
      assert.strictEqual(projectAccount.offsetAmount.toNumber(), 0);
      assert.strictEqual(projectAccount.pricePerToken.toNumber(), PRICE_PER_TOKEN);
      assert.strictEqual(projectAccount.carbonPayFee.toNumber(), CARBON_PAY_FEE);
      assert.strictEqual(projectAccount.carbonPayAuthority.toString(), carbonPayAuthorityKey.toString());
      assert.strictEqual(projectAccount.isActive, true);
      
      const carbonCredits = await program.account.carbonCredits.fetch(carbonCreditsKey);
      assert.strictEqual(carbonCredits.totalCredits.toNumber(), PROJECT_AMOUNT);
      assert.strictEqual(carbonCredits.activeCredits.toNumber(), PROJECT_AMOUNT);
      
      const tokenAccountInfo = await provider.connection.getTokenAccountBalance(carbonPayTokenAccount);
      assert.strictEqual(parseInt(tokenAccountInfo.value.amount), PROJECT_AMOUNT);

      const metadataAccount = await program.provider.connection.getAccountInfo(metadataAddress);
      assert.notStrictEqual(metadataAccount, null, "Metadata account should exist");

      const masterEditionAccount = await program.provider.connection.getAccountInfo(masterEditionAddress);
      assert.notStrictEqual(masterEditionAccount, null, "Master edition account should exist");
    } catch (error) {
      console.error("Error initializing project:", error);
      throw error;
    }
  });
  
  test("Purchase Carbon Credits", async () => {
    // Generate keypair for the NFT mint
    const nftMintKeypair = Keypair.generate();
    
    // Amount of tokens to purchase
    const PURCHASE_AMOUNT = 500;
    
    // Find the purchase PDA
    const [purchasePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("purchase"),
        admin.toBuffer(),
        projectKey.toBuffer(),
        nftMintKeypair.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    // Find the buyer's token account for the NFT
    const buyerNftAccount = await anchor.utils.token.associatedAddress({
      mint: nftMintKeypair.publicKey,
      owner: admin,
    });
    
    // Execute the purchase transaction
    const tx = await program.methods
      .purchaseCarbonCredits(
        new anchor.BN(PURCHASE_AMOUNT)
      )
      .accountsPartial({
        buyer: admin,
        project: projectKey,
        projectOwner: admin, // Admin is the project owner in this example
        nftMint: nftMintKeypair.publicKey,
        buyerNftAccount: buyerNftAccount,
        purchase: purchasePDA,
        carbonPayAuthority: carbonPayAuthorityKey,
      })
      .signers([nftMintKeypair])
      .rpc();
    
    console.log("Purchase transaction signature:", tx);
    
    // Update the global purchaseKey variable for use in other tests
    purchaseKey = purchasePDA;
    
    // Verify purchase data
    const purchaseAccount = await program.account.purchase.fetch(purchasePDA);
    assert.strictEqual(purchaseAccount.buyer.toString(), admin.toString());
    assert.strictEqual(purchaseAccount.project.toString(), projectKey.toString());
    assert.strictEqual(purchaseAccount.amount.toNumber(), PURCHASE_AMOUNT);
    assert.strictEqual(purchaseAccount.remainingAmount.toNumber(), PURCHASE_AMOUNT);
    assert.strictEqual(purchaseAccount.nftMint.toString(), nftMintKeypair.publicKey.toString());
    
    // Verify project was updated
    const projectAccount = await program.account.project.fetch(projectKey);
    assert.strictEqual(
      projectAccount.remainingAmount.toNumber(), 
      PROJECT_AMOUNT - PURCHASE_AMOUNT, 
      "Project remaining amount should be reduced by purchase amount"
    );
    
    // Verify NFT was created (buyer should have 1 token)
    const buyerNftAccountInfo = await provider.connection.getTokenAccountBalance(buyerNftAccount);
    assert.strictEqual(parseInt(buyerNftAccountInfo.value.amount), 1, "Buyer should have 1 NFT token");
  });
  
  test("Request Offset", async () => {
    // If purchase was not initialized, skip this test
    if (!purchaseKey) {
      console.log("Skipping request_offset test because purchase was not initialized");
      return;
    }
    
    // Find the offset request PDA
    const [offsetRequestPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("offset_request"),
        admin.toBuffer(),
        purchaseKey.toBuffer(),
        Buffer.from(REQUEST_ID),
      ],
      program.programId
    );
    
    // obtain purchase account
    const purchaseAccount = await program.account.purchase.fetch(purchaseKey);
    const buyerNftAccount = await anchor.utils.token.associatedAddress({
      mint: purchaseAccount.nftMint,
      owner: admin,
    });
    
    try {
      // Request offset transaction
      const tx = await program.methods
        .requestOffset(
          new anchor.BN(OFFSET_AMOUNT),
          REQUEST_ID
        )
        .accountsPartial({
          offsetRequester: admin,
          purchase: purchaseKey,
          project: projectKey,
          buyerNftAccount: buyerNftAccount,
          carbonPayAuthority: carbonPayAuthorityKey,
          offsetRequest: offsetRequestPDA,
          carbonCredits: carbonCreditsKey,
        })
        .rpc();
      
      console.log("Offset request created:", tx);
      
      // Verify offset request data
      const offsetRequestAccount = await program.account.offsetRequest.fetch(offsetRequestPDA);
      
      assert.strictEqual(offsetRequestAccount.offsetRequester.toString(), admin.toString());
      assert.strictEqual(offsetRequestAccount.purchase.toString(), purchaseKey.toString());
      assert.strictEqual(offsetRequestAccount.project.toString(), projectKey.toString());
      assert.strictEqual(offsetRequestAccount.amount.toNumber(), OFFSET_AMOUNT);
      assert.strictEqual(offsetRequestAccount.requestId, REQUEST_ID);
      assert.deepStrictEqual(offsetRequestAccount.status, { pending: {} }); // Enum as object in TS
      assert.strictEqual(offsetRequestAccount.processedDate.toNumber(), 0); // Not processed yet
      assert.strictEqual(offsetRequestAccount.processor, null); // No processor yet
    } catch (error) {
      console.log("Error in request_offset execution:", error.message);
      throw error;
    }
  });
});
