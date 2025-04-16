import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { before, describe, test } from "node:test";
import assert from "node:assert";
import { Contracts } from "../target/types/contracts";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("CarbonPay Contracts", async () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Contracts as Program<Contracts>;
  const admin = provider.wallet.publicKey;
  
  // Generate keypair for the mint
  const mintKeypair = Keypair.generate();
  
  // Store PDAs and keys
  let carbonCreditsKey: PublicKey;
  let carbonPayAuthorityKey: PublicKey;
  let projectKey: PublicKey;
  let purchaseKey: PublicKey; // To store the purchase PDA
  
  // Define constants for project
  const PROJECT_AMOUNT = 1000;
  const PRICE_PER_TOKEN = 0.1 * LAMPORTS_PER_SOL; // 0.1 SOL per token
  const CARBON_PAY_FEE = 500; // 5% fee (out of 10000)
  
  // Define constants for offset
  const OFFSET_AMOUNT = 500; // Offset 500 tokens
  const REQUEST_ID = "REQ-123"; // Unique request ID

  before(async () => {
    // Find the PDA for carbon_credits
    const [carbonCreditsAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("carbon_credits")],
      program.programId
    );
    carbonCreditsKey = carbonCreditsAddress;
    
    // Use admin as carbon pay authority for testing
    carbonPayAuthorityKey = admin;
    
    // Find the PDA for project
    const [projectPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("project"),
        admin.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      program.programId
    );
    projectKey = projectPDA;
    
    // Purchase PDA will be set after purchase is made
  });

  test("Initialize Carbon Credits", async () => {
    // Initialize the global carbon credits account
    const tx = await program.methods
      .initializeCarbonCredits()
      .accountsPartial({
        admin: admin,
        carbonCredits: carbonCreditsKey, 
      })
      .rpc();
    
    console.log("Transaction signature:", tx);
    
    // Fetch the account data to verify it's properly initialized
    const carbonCreditsAccount = await program.account.carbonCredits.fetch(carbonCreditsKey);
    assert.strictEqual(carbonCreditsAccount.authority.toString(), admin.toString());
    console.log("carbonCreditsAccount.totalCredits", carbonCreditsAccount);
    assert.strictEqual(carbonCreditsAccount.totalCredits.toNumber(), 0);
    assert.strictEqual(carbonCreditsAccount.offsetCredits.toNumber(), 0);
    assert.strictEqual(carbonCreditsAccount.totalFeesEarned.toNumber(), 0);
  });
  
  test("Initialize Project", async () => {
    // Get token account address for carbon pay authority
    const carbonPayTokenAccount = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: carbonPayAuthorityKey,
    });
    
    // Initialize project
    const tx = await program.methods
      .initializeProject(
        new anchor.BN(PROJECT_AMOUNT),
        new anchor.BN(PRICE_PER_TOKEN),
        new anchor.BN(CARBON_PAY_FEE)
      )
      .accountsPartial({
        projectOwner: admin,
        project: projectKey,
        mint: mintKeypair.publicKey,
        carbonPayTokenAccount: carbonPayTokenAccount,
        carbonPayAuthority: carbonPayAuthorityKey,
        carbonCredits: carbonCreditsKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mintKeypair])
      .rpc();
    
    console.log("Project initialized: ", tx);
    
    // Verify project data
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
    
    // Verify carbon credits metrics were updated
    const carbonCredits = await program.account.carbonCredits.fetch(carbonCreditsKey);
    assert.strictEqual(carbonCredits.totalCredits.toNumber(), PROJECT_AMOUNT);
    assert.strictEqual(carbonCredits.activeCredits.toNumber(), PROJECT_AMOUNT);
    
    // Verify tokens were minted to the carbon pay authority
    const tokenAccountInfo = await provider.connection.getTokenAccountBalance(carbonPayTokenAccount);
    assert.strictEqual(parseInt(tokenAccountInfo.value.amount), PROJECT_AMOUNT);
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
