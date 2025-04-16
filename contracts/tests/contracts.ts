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
  
  
});
