import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { before, describe, test } from "node:test";
import assert from "node:assert";
import { CarbonPay } from "../target/types/carbon_pay";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("🪴 CarbonPay Program Test Suite", async () => {
  // ──────────────────────────────────────────────────────────────────────────────
  // Setup: provider, program, keypairs & PDAs
  // ──────────────────────────────────────────────────────────────────────────────
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.CarbonPay as Program<CarbonPay>;
  const admin = provider.wallet.publicKey;

  const mintKeypair = Keypair.generate();
  let carbonCreditsPDA: PublicKey;
  let projectPDA: PublicKey;
  let purchasePDA: PublicKey;

  const PROJECT_AMOUNT  = 1_000;
  const PRICE_PER_TOKEN = 0.1 * LAMPORTS_PER_SOL;
  const CARBON_PAY_FEE  = 500;
  const PURCHASE_AMOUNT = 500;
  const OFFSET_AMOUNT   = 200;
  const REQUEST_ID      = "REQ-123";

  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  before(async () => {
    // ensure admin has SOL
    const conn = new Connection("http://localhost:8899", "confirmed");
    if ((await conn.getBalance(admin)) < 2 * LAMPORTS_PER_SOL) {
      console.log("➡️ Airdropping 2 SOL to admin");
      const sig = await conn.requestAirdrop(admin, 2 * LAMPORTS_PER_SOL);
      await conn.confirmTransaction(sig);
    }

    // carbon_credits PDA
    [carbonCreditsPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("carbon_credits")],
      program.programId
    );
    console.log("🔑 carbonCreditsPDA:", carbonCreditsPDA.toBase58());

    // project PDA
    [projectPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), admin.toBuffer(), mintKeypair.publicKey.toBuffer()],
      program.programId
    );
    console.log("🔑 projectPDA:", projectPDA.toBase58());
  });

  test("🛠 Initialize CarbonCredits account", async () => {
    console.log("\n--- Initialize CarbonCredits ---");
    const tx = await program.methods
      .initializeCarbonCredits()
      .accountsPartial({
        admin,
        carbonCredits: carbonCreditsPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("✅ Tx signature:", tx);

    const cc = await program.account.carbonCredits.fetch(carbonCreditsPDA);
    console.log("📄 carbonCredits state:", cc);

    assert.strictEqual(cc.authority.toBase58(), admin.toBase58(), "authority must be admin");
    assert.strictEqual(cc.totalCredits.toNumber(), 0, "totalCredits should start at 0");
    assert.strictEqual(cc.offsetCredits.toNumber(), 0, "offsetCredits should start at 0");
    assert.strictEqual(cc.totalFeesEarned.toNumber(), 0, "fees should start at 0");
  });

  test("🛠 Initialize Project", async () => {
    console.log("\n--- Initialize Project ---");
    // the vault ATA is owned by the project_owner (admin)
    const vault = await anchor.utils.token.associatedAddress({
      mint:  mintKeypair.publicKey,
      owner: admin,
    });
    console.log("💳 vault (project_token_account):", vault.toBase58());

    // PDAs for on-chain metadata & edition
    const metadataSeeds = [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBytes(),
      mintKeypair.publicKey.toBytes(),
    ];
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      metadataSeeds,
      TOKEN_METADATA_PROGRAM_ID
    );
    const masterEditionPDA = PublicKey.findProgramAddressSync(
      [...metadataSeeds, Buffer.from("edition")],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
    console.log("📇 metadataPDA:", metadataPDA.toBase58());
    console.log("📘 masterEditionPDA:", masterEditionPDA.toBase58());

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
        projectOwner:          admin,
        project:               projectPDA,
        mint:                  mintKeypair.publicKey,
        vault, // changed from carbonPayTokenAccount
        carbonCredits:         carbonCreditsPDA,
        metadata:              metadataPDA,
        masterEdition:         masterEditionPDA,
        tokenProgram:          TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenMetadataProgram:  TOKEN_METADATA_PROGRAM_ID,
        systemProgram:         anchor.web3.SystemProgram.programId,
        rent:                  anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mintKeypair])
      .rpc();
    console.log("✅ Tx signature:", tx);

    const proj = await program.account.project.fetch(projectPDA);
    console.log("📄 project state:", proj);
    assert.strictEqual(proj.amount.toNumber(), PROJECT_AMOUNT, "amount mismatch");
    assert.strictEqual(proj.remainingAmount.toNumber(), PROJECT_AMOUNT, "remainingAmount mismatch");

    const cc = await program.account.carbonCredits.fetch(carbonCreditsPDA);
    console.log("📄 carbonCredits post-project:", cc);
    assert.strictEqual(cc.totalCredits.toNumber(), PROJECT_AMOUNT, "totalCredits must equal project amount");
  });

  test("💳 Purchase Carbon Credits", async () => {
    console.log("\n--- Purchase Carbon Credits ---");
    const purchaseNftMint = Keypair.generate();
    [purchasePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("purchase"),
        admin.toBuffer(),
        projectPDA.toBuffer(),
        purchaseNftMint.publicKey.toBuffer(),
      ],
      program.programId
    );
    console.log("🔑 purchasePDA:", purchasePDA.toBase58());

    // both vault & buyerTokenAccount are owned by admin
    const vault = await anchor.utils.token.associatedAddress({
      mint:  mintKeypair.publicKey,
      owner: admin,
    });
    const buyerTokenAccount = await anchor.utils.token.associatedAddress({
      mint:  mintKeypair.publicKey,
      owner: admin,
    });
    const buyerNftAccount = await anchor.utils.token.associatedAddress({
      mint:  purchaseNftMint.publicKey,
      owner: admin,
    });
    console.log("💳 vault:", vault.toBase58());
    console.log("👤 buyerTokenAccount:", buyerTokenAccount.toBase58());
    console.log("🎟 buyerNftAccount:", buyerNftAccount.toBase58());

    const tx = await program.methods
      .purchaseCarbonCredits(new anchor.BN(PURCHASE_AMOUNT))
      .accountsPartial({
        buyer:               admin,
        project:             projectPDA,
        projectMint:         mintKeypair.publicKey,
        projectTokenAccount: vault,
        purchaseNftMint:     purchaseNftMint.publicKey,
        buyerNftAccount,
        buyerTokenAccount,
        purchase:            purchasePDA,
        carbonCredits:       carbonCreditsPDA,
      })
      .signers([purchaseNftMint])
      .rpc();
    console.log("✅ Tx signature:", tx);

    const purchaseAcct = await program.account.purchase.fetch(purchasePDA);
    console.log("📄 purchase state:", purchaseAcct);
    assert.strictEqual(purchaseAcct.amount.toNumber(), PURCHASE_AMOUNT, "purchase amount mismatch");

    const projPost = await program.account.project.fetch(projectPDA);
    console.log("📄 project after purchase:", projPost);
    assert.strictEqual(
      projPost.remainingAmount.toNumber(),
      PROJECT_AMOUNT - PURCHASE_AMOUNT,
      "remainingAmount did not decrease"
    );

    const nftBal = await provider.connection.getTokenAccountBalance(buyerNftAccount);
    assert.strictEqual(Number(nftBal.value.amount), 1, "buyer should have exactly 1 NFT");

    const tokBal = await provider.connection.getTokenAccountBalance(buyerTokenAccount);
    assert.strictEqual(Number(tokBal.value.amount), PURCHASE_AMOUNT, "buyer token balance mismatch");
  });

  test("🔄 Request Offset", async () => {
    console.log("\n--- Request Offset ---");
    if (!purchasePDA) {
      console.log("⚠️ Skipping: no purchasePDA");
      return;
    }

    const [offsetRequestPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("offset_request"),
        admin.toBuffer(),
        purchasePDA.toBuffer(),
        Buffer.from(REQUEST_ID),
      ],
      program.programId
    );
    console.log("🔑 offsetRequestPDA:", offsetRequestPDA.toBase58());

    // derive buyer's NFT ATA from on-chain purchase record
    const purchaseAcct = await program.account.purchase.fetch(purchasePDA);
    const buyerNftAccount = await anchor.utils.token.associatedAddress({
      mint:  purchaseAcct.nftMint,
      owner: admin,
    });

    const tx = await program.methods
      .requestOffset(new anchor.BN(OFFSET_AMOUNT), REQUEST_ID)
      .accountsPartial({
        offsetRequester: admin,
        purchase:        purchasePDA,
        project:         projectPDA,
        buyerNftAccount,
        carbonCredits:   carbonCreditsPDA,
        offsetRequest:   offsetRequestPDA,
      })
      .rpc();
    console.log("✅ Tx signature:", tx);

    const offsetAcct = await program.account.offsetRequest.fetch(offsetRequestPDA);
    console.log("📄 offsetRequest state:", offsetAcct);
    assert.strictEqual(offsetAcct.amount.toNumber(), OFFSET_AMOUNT, "offset amount mismatch");
    assert.strictEqual(offsetAcct.requestId, REQUEST_ID, "requestId mismatch");
    assert.deepStrictEqual(offsetAcct.status, { pending: {} }, "status should be pending");
  });
});
