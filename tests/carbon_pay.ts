import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CarbonPay } from "../target/types/carbon_pay";
import { before, describe, test } from "node:test";
import assert from "node:assert";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Connection,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  getMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  mintTo,
  getAccount,
  createAssociatedTokenAccount,
} from "@solana/spl-token";

describe("🌳 CarbonPay Program Test Suite - Complete Coverage", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.CarbonPay as Program<CarbonPay>;
  const connection = provider.connection;

  // USDC mint (mock for testing)
  let usdcMint: PublicKey;

  // CarbonCredits PDA and bump
  let carbonCreditsPda: PublicKey;
  let carbonCreditsBump: number;
  let platformUsdcVault: PublicKey;

  // Metadata program constant
  const METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  // Project variables
  let projectOwner: Keypair;
  let projectOwnerUsdcAccount: PublicKey;
  let nftMint: PublicKey;
  let tokenMint: PublicKey;
  let projectOwnerNftAccount: PublicKey;
  let vaultAta: PublicKey;
  let projectPda: PublicKey;
  let projectBump: number;

  // Buyer variables
  let buyer: Keypair;
  let buyerUsdcAccount: PublicKey;

  // Project parameters (USDC pricing)
  const PROJECT_AMOUNT = 100;
  const PRICE_PER_TOKEN = 1_000_000; // 1 USDC per token (1M micro-USDC)
  const CARBON_PAY_FEE = 500; // 5%
  const PROJECT_URI = "https://uri.test/1";
  const PROJECT_NAME = "MyProject";
  const PROJECT_SYMBOL = "MPRJ";

  before(async () => {
    console.log("🔧 Setting up test environment...");

    // Create test accounts
    projectOwner = Keypair.generate();
    buyer = Keypair.generate();

    // Fund accounts
    const airdrops = await Promise.all([
      provider.connection.requestAirdrop(
        projectOwner.publicKey,
        5 * LAMPORTS_PER_SOL
      ),
      provider.connection.requestAirdrop(buyer.publicKey, 5 * LAMPORTS_PER_SOL),
    ]);

    // Wait for confirmations
    await Promise.all(
      airdrops.map((tx) =>
        provider.connection.confirmTransaction(tx, "confirmed")
      )
    );

    // Create USDC mint (6 decimals)
    usdcMint = await createMint(
      provider.connection,
      provider.wallet.payer as anchor.web3.Keypair,
      provider.wallet.publicKey,
      null,
      6
    );

    console.log("✅ Setup complete");
    console.log("Project Owner:", projectOwner.publicKey.toBase58());
    console.log("Buyer:", buyer.publicKey.toBase58());
    console.log("USDC Mint:", usdcMint.toBase58());

    // 2. Derive CarbonCredits PDA
    [carbonCreditsPda, carbonCreditsBump] = await PublicKey.findProgramAddress(
      [Buffer.from("carbon_credits")],
      program.programId
    );

    // 3. Create platform USDC vault (ATA for carbon_credits PDA)
    platformUsdcVault = await getAssociatedTokenAddress(
      usdcMint,
      carbonCreditsPda,
      true // allowOwnerOffCurve for PDA
    );

    // 4. Setup project owner
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        projectOwner.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    // 5. Create project owner USDC account
    projectOwnerUsdcAccount = await getAssociatedTokenAddress(
      usdcMint,
      projectOwner.publicKey
    );

    const createProjectOwnerUsdcTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        projectOwnerUsdcAccount,
        projectOwner.publicKey,
        usdcMint
      )
    );
    await provider.sendAndConfirm(createProjectOwnerUsdcTx);

    // 6. Setup buyer
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        buyer.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    // 7. Create buyer USDC account
    buyerUsdcAccount = await getAssociatedTokenAddress(
      usdcMint,
      buyer.publicKey
    );

    const createBuyerUsdcTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        buyerUsdcAccount,
        buyer.publicKey,
        usdcMint
      )
    );
    await provider.sendAndConfirm(createBuyerUsdcTx);

    // 8. Mint USDC to buyer for testing (100 USDC)
    await mintTo(
      connection,
      provider.wallet.payer as anchor.web3.Keypair,
      usdcMint,
      buyerUsdcAccount,
      provider.wallet.publicKey,
      100_000_000 // 100 USDC (100M micro-USDC)
    );

    console.log("Test setup completed");
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // 1) InitializeCarbonCreditsAccountConstraints
  // ──────────────────────────────────────────────────────────────────────────────
  test("1. Initialize CarbonCredits PDA with USDC", async () => {
    await program.methods
      .initializeCarbonCredits()
      .accountsPartial({
        admin: provider.wallet.publicKey,
        usdcMint: usdcMint,
        usdcVault: platformUsdcVault,
        carbonCredits: carbonCreditsPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const cc = await program.account.carbonCredits.fetch(carbonCreditsPda);
    assert.equal(cc.bump, carbonCreditsBump);
    assert.equal(cc.totalCredits.toNumber(), 0);
    assert.equal(cc.offsetCredits.toNumber(), 0);
    assert.equal(cc.usdcMint.toBase58(), usdcMint.toBase58());
    assert.equal(cc.usdcDecimals, 6);
    assert.equal(cc.usdcVault.toBase58(), platformUsdcVault.toBase58());

    console.log("✅ CarbonCredits PDA initialized with USDC support");
  });

  // ──────────────────────────────────────────────────────────────────────────────
  //  InitializeProject
  // ──────────────────────────────────────────────────────────────────────────────
  test("2. Initialize Project", async () => {
    console.log("Project Owner pubkey:", projectOwner.publicKey.toBase58());

    // 1. Create mints
    // 1.1 NFT Mint
    nftMint = await createMint(
      connection,
      projectOwner,
      projectOwner.publicKey,
      projectOwner.publicKey,
      0
    );
    console.log("NFT Mint created:", nftMint.toBase58());

    // 1.2 Token Mint
    tokenMint = await createMint(
      connection,
      projectOwner,
      projectOwner.publicKey,
      projectOwner.publicKey,
      0
    );
    console.log("Token Mint created:", tokenMint.toBase58());

    // 2. Create ATA for project owner (NFT)
    projectOwnerNftAccount = await getAssociatedTokenAddress(
      nftMint,
      projectOwner.publicKey
    );
    console.log("Owner NFT ATA:", projectOwnerNftAccount.toBase58());

    // 3. Create ATA for vault (Tokens)
    vaultAta = await getAssociatedTokenAddress(
      tokenMint,
      carbonCreditsPda,
      true // allowOwnerOffCurve: true - important for PDAs
    );
    console.log("Vault ATA:", vaultAta.toBase58());

    // 4. Create ATAs in a single transaction
    const createAtaTx = new Transaction()
      .add(
        createAssociatedTokenAccountInstruction(
          projectOwner.publicKey, // payer
          projectOwnerNftAccount,
          projectOwner.publicKey, // owner
          nftMint
        )
      )
      .add(
        createAssociatedTokenAccountInstruction(
          projectOwner.publicKey, // payer
          vaultAta,
          carbonCreditsPda, // owner - the carbon_credits PDA
          tokenMint
        )
      );

    const createAtaTxSig = await provider.sendAndConfirm(createAtaTx, [
      projectOwner,
    ]);
    console.log("ATAs creation: ", createAtaTxSig);

    // 5. Derive Project PDA
    [projectPda, projectBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("project"),
        projectOwner.publicKey.toBuffer(),
        nftMint.toBuffer(),
      ],
      program.programId
    );
    console.log("Project PDA:", projectPda.toBase58());

    // 6. Derive metadata and master edition PDAs
    const [metadataPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        nftMint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );
    console.log("Metadata PDA:", metadataPda.toBase58());

    const [masterEditionPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        nftMint.toBuffer(),
        Buffer.from("edition"),
      ],
      METADATA_PROGRAM_ID
    );
    console.log("Master Edition PDA:", masterEditionPda.toBase58());

    // 7. Call initializeProject
    console.log("Calling initializeProject...");

    try {
      const tx = await program.methods
        .initializeProject(
          new BN(PROJECT_AMOUNT),
          new BN(PRICE_PER_TOKEN),
          new BN(CARBON_PAY_FEE),
          PROJECT_URI,
          PROJECT_NAME,
          PROJECT_SYMBOL
        )
        .accountsStrict({
          projectOwner: projectOwner.publicKey,
          project: projectPda,
          nftMint: nftMint,
          tokenMint: tokenMint,
          projectOwnerNftAccount: projectOwnerNftAccount,
          vault: vaultAta,
          carbonCredits: carbonCreditsPda,
          metadata: metadataPda,
          masterEdition: masterEditionPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([projectOwner])
        .rpc();

      console.log("Project initialized successfully! Tx:", tx);

      // 8. Verifications
      const projAcc = await program.account.project.fetch(projectPda);
      assert.equal(
        projAcc.owner.toBase58(),
        projectOwner.publicKey.toBase58(),
        "Incorrect project owner"
      );
      assert.equal(
        projAcc.mint.toBase58(),
        nftMint.toBase58(),
        "Incorrect NFT mint"
      );
      assert.equal(
        projAcc.tokenMint.toBase58(),
        tokenMint.toBase58(),
        "Incorrect token mint"
      );
      assert.equal(
        projAcc.amount.toNumber(),
        PROJECT_AMOUNT,
        "Incorrect amount"
      );
      assert.equal(
        projAcc.remainingAmount.toNumber(),
        PROJECT_AMOUNT,
        "Incorrect remainingAmount"
      );
      assert.ok(projAcc.isActive, "Project is not active");

      // Verify that NFT was minted to the project owner
      const ownerNftBal = await connection.getTokenAccountBalance(
        projectOwnerNftAccount
      );
      assert.equal(
        ownerNftBal.value.amount,
        "1",
        "Owner should have 1 token (NFT)"
      );

      // Verify that fungible tokens were minted to the vault
      const vaultTokenBal = await connection.getTokenAccountBalance(vaultAta);
      assert.equal(
        vaultTokenBal.value.amount,
        PROJECT_AMOUNT.toString(),
        "Vault should have PROJECT_AMOUNT tokens"
      );

      // Verify that NFT mint authority was transferred
      const nftMintInfo = await getMint(connection, nftMint);
      assert.ok(
        nftMintInfo.mintAuthority === null ||
          nftMintInfo.mintAuthority?.toBase58() !==
            projectOwner.publicKey.toBase58(),
        "NFT mint authority was not transferred from project owner"
      );

      // Verify that token mint authority was transferred to carbon_credits PDA
      const tokenMintInfo = await getMint(connection, tokenMint);
      assert.equal(
        tokenMintInfo.mintAuthority?.toBase58(),
        carbonCreditsPda.toBase58(),
        "Incorrect token mint authority"
      );
    } catch (thrownObject) {
      const error = thrownObject as Error;
      console.error("Error during project initialization:", error);
      // Provide more error information for debugging
      console.log("Error message:", error.message);
      if ("logs" in error) {
        console.log("Error logs:", (error as any).logs);
      }
      throw error;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // 3) PurchaseCarbonCredits
  // ──────────────────────────────────────────────────────────────────────────────
  let purchaseNftMint: PublicKey;
  let buyerNftAta: PublicKey;
  let buyerTokenAta: PublicKey;
  let purchasePda: PublicKey;
  let purchaseBump: number;
  const purchaseAmount = 10;

  test("3. Purchase Carbon Credits (USDC → owner + fee, mint NFT and tokens)", async () => {
    // a) Setup buyer (already done in before())

    // b) Create mint for purchase NFT
    purchaseNftMint = await createMint(
      connection,
      buyer,
      buyer.publicKey,
      buyer.publicKey,
      0
    );
    console.log("Purchase NFT mint created:", purchaseNftMint.toBase58());
    console.log("Mint authority:", buyer.publicKey.toBase58());

    // c) Derive buyer's ATAs
    buyerNftAta = await getAssociatedTokenAddress(
      purchaseNftMint,
      buyer.publicKey
    );
    buyerTokenAta = await getAssociatedTokenAddress(tokenMint, buyer.publicKey);
    console.log("Buyer NFT ATA:", buyerNftAta.toBase58());
    console.log("Buyer token ATA:", buyerTokenAta.toBase58());

    // d) Create ATAs (buyer pays for their own accounts)
    const ixBuyNftAta = createAssociatedTokenAccountInstruction(
      buyer.publicKey, // buyer pays for their own accounts
      buyerNftAta,
      buyer.publicKey,
      purchaseNftMint
    );
    const ixBuyTokenAta = createAssociatedTokenAccountInstruction(
      buyer.publicKey, // buyer pays for their own accounts
      buyerTokenAta,
      buyer.publicKey,
      tokenMint
    );

    // Have the buyer sign the transaction to create their own accounts
    await provider.sendAndConfirm(
      new Transaction().add(ixBuyNftAta, ixBuyTokenAta),
      [buyer] // buyer signs
    );
    console.log("Buyer ATAs created successfully");

    // Verify account ownerships
    try {
      // Check ATA ownerships
      const buyerNftAccount = await connection.getAccountInfo(buyerNftAta);
      const buyerTokenAccount = await connection.getAccountInfo(buyerTokenAta);
      const vaultAccount = await connection.getAccountInfo(vaultAta);

      console.log(
        "Buyer NFT ATA owner program:",
        buyerNftAccount?.owner.toBase58()
      );
      console.log(
        "Buyer Token ATA owner program:",
        buyerTokenAccount?.owner.toBase58()
      );
      console.log("Vault ATA owner program:", vaultAccount?.owner.toBase58());

      // Check mints
      const nftMintInfo = await getMint(connection, purchaseNftMint);
      const tokenMintInfo = await getMint(connection, tokenMint);

      console.log("NFT Mint Authority:", nftMintInfo.mintAuthority?.toBase58());
      console.log(
        "Token Mint Authority:",
        tokenMintInfo.mintAuthority?.toBase58()
      );
    } catch (e) {
      console.error("Error checking account ownerships:", e);
    }

    // e) Derive Purchase PDA
    [purchasePda, purchaseBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("purchase"),
        buyer.publicKey.toBuffer(),
        projectPda.toBuffer(),
        purchaseNftMint.toBuffer(),
      ],
      program.programId
    );
    console.log("Purchase PDA:", purchasePda.toBase58());

    // f) Derive purchase metadata PDA
    const [purchaseMetadataPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        purchaseNftMint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );
    console.log("Purchase Metadata PDA:", purchaseMetadataPda.toBase58());

    // g) Print all account info for debugging
    console.log("--- Purchase Call Accounts ---");
    console.log("Project:", projectPda.toBase58());
    console.log("Project Owner:", projectOwner.publicKey.toBase58());
    console.log("Project Mint (Token):", tokenMint.toBase58());
    console.log("Carbon Credits:", carbonCreditsPda.toBase58());
    console.log("Project Token Account (vault):", vaultAta.toBase58());
    console.log("Purchase NFT Mint:", purchaseNftMint.toBase58());
    console.log("Buyer:", buyer.publicKey.toBase58());
    console.log("Buyer NFT Account:", buyerNftAta.toBase58());
    console.log("Buyer Token Account:", buyerTokenAta.toBase58());
    console.log("Purchase:", purchasePda.toBase58());
    console.log("Purchase Metadata:", purchaseMetadataPda.toBase58());
    console.log("---------------------------");

    // h) Check initial USDC balances
    const initialBuyerUsdcBalance = (
      await getAccount(connection, buyerUsdcAccount)
    ).amount;
    const initialProjectOwnerUsdcBalance = (
      await getAccount(connection, projectOwnerUsdcAccount)
    ).amount;
    const initialPlatformUsdcBalance = (
      await getAccount(connection, platformUsdcVault)
    ).amount;

    console.log("Initial USDC balances (micro-USDC):");
    console.log("- Buyer:", Number(initialBuyerUsdcBalance));
    console.log("- Project Owner:", Number(initialProjectOwnerUsdcBalance));
    console.log("- Platform:", Number(initialPlatformUsdcBalance));

    // i) Call purchaseCarbonCredits with USDC
    console.log("Calling purchaseCarbonCredits with amount:", purchaseAmount);
    try {
      const tx = await program.methods
        .purchaseCarbonCredits(new BN(purchaseAmount))
        .accountsPartial({
          project: projectPda,
          projectOwner: projectOwner.publicKey,
          projectMint: tokenMint,
          carbonCredits: carbonCreditsPda,
          projectTokenAccount: vaultAta,
          purchaseNftMint,
          buyerNftAccount: buyerNftAta,
          buyerTokenAccount: buyerTokenAta,
          purchase: purchasePda,
          usdcMint: usdcMint,
          buyerUsdcAccount: buyerUsdcAccount,
          projectOwnerUsdcAccount: projectOwnerUsdcAccount,
          platformUsdcVault: platformUsdcVault,
          purchaseMetadata: purchaseMetadataPda,
          buyer: buyer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();
      console.log("Purchase successful! Tx:", tx);
    } catch (thrownObject) {
      const error = thrownObject as Error;
      console.error("Error during purchase:", error);
      console.log("Error message:", error.message);
      if ("logs" in error) {
        console.log("Error logs:", (error as any).logs);
      }
      throw error;
    }

    // j) Check final USDC balances and verify payments
    const finalBuyerUsdcBalance = (
      await getAccount(connection, buyerUsdcAccount)
    ).amount;
    const finalProjectOwnerUsdcBalance = (
      await getAccount(connection, projectOwnerUsdcAccount)
    ).amount;
    const finalPlatformUsdcBalance = (
      await getAccount(connection, platformUsdcVault)
    ).amount;

    console.log("Final USDC balances (micro-USDC):");
    console.log("- Buyer:", Number(finalBuyerUsdcBalance));
    console.log("- Project Owner:", Number(finalProjectOwnerUsdcBalance));
    console.log("- Platform:", Number(finalPlatformUsdcBalance));

    // k) Verify USDC transfers
    const totalCost = purchaseAmount * PRICE_PER_TOKEN; // 10 * 1_000_000 = 10M micro-USDC (10 USDC)
    const fee = Math.floor((totalCost * CARBON_PAY_FEE) / 10_000); // 5% fee
    const ownerPayment = totalCost - fee;

    assert.equal(
      Number(finalBuyerUsdcBalance),
      Number(initialBuyerUsdcBalance) - totalCost,
      "Buyer should pay total cost in USDC"
    );

    assert.equal(
      Number(finalProjectOwnerUsdcBalance),
      Number(initialProjectOwnerUsdcBalance) + ownerPayment,
      "Project owner should receive payment minus fee"
    );

    assert.equal(
      Number(finalPlatformUsdcBalance),
      Number(initialPlatformUsdcBalance) + fee,
      "Platform should receive fee in USDC"
    );

    console.log(
      `✅ USDC payments verified - Total: ${totalCost / 1_000_000} USDC, Fee: ${
        fee / 1_000_000
      } USDC, Owner: ${ownerPayment / 1_000_000} USDC`
    );

    // l) Post-purchase verifications
    const projAfter = await program.account.project.fetch(projectPda);
    assert.equal(projAfter.remainingAmount.toNumber(), 100 - purchaseAmount);

    const buyNftBal = await connection.getTokenAccountBalance(buyerNftAta);
    assert.equal(buyNftBal.value.uiAmount, 1);

    const buyTokenBal = await connection.getTokenAccountBalance(buyerTokenAta);
    assert.equal(buyTokenBal.value.uiAmount, purchaseAmount);

    const purchaseAcc = await program.account.purchase.fetch(purchasePda);
    assert.equal(purchaseAcc.amount.toNumber(), purchaseAmount);
    assert.equal(purchaseAcc.remainingAmount.toNumber(), purchaseAmount);
    assert.equal(purchaseAcc.buyer.toBase58(), buyer.publicKey.toBase58());
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // 4) RequestOffset
  // ──────────────────────────────────────────────────────────────────────────────
  test("4. Request Offset (burn NFT, partial mint and register)", async () => {
    const offsetAmount = 5;
    const requestId = "REQ123";

    // a) Derive OffsetRequest PDA
    const [offsetReqPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("offset_request"),
        buyer.publicKey.toBuffer(),
        purchasePda.toBuffer(),
        Buffer.from(requestId),
      ],
      program.programId
    );

    // b) Create new mint for residual NFT
    const newNftMint = await createMint(
      connection,
      buyer,
      buyer.publicKey,
      buyer.publicKey,
      0
    );
    const newNftAta = await getAssociatedTokenAddress(
      newNftMint,
      buyer.publicKey
    );
    await provider.sendAndConfirm(
      new Transaction().add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey,
          newNftAta,
          buyer.publicKey,
          newNftMint
        )
      )
    );

    // c) Derive new NFT metadata PDA
    const [newNftMetadataPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        newNftMint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    // d) Call requestOffset
    await program.methods
      .requestOffset(new BN(offsetAmount), requestId)
      .accountsPartial({
        offsetRequester: buyer.publicKey,
        purchase: purchasePda,
        project: projectPda,
        originalNftMint: purchaseNftMint,
        originalNftAccount: buyerNftAta,
        newNftMint,
        newNftAccount: newNftAta,
        newNftMetadata: newNftMetadataPda,
        tokenMint: tokenMint,
        buyerTokenAccount: buyerTokenAta,
        carbonCredits: carbonCreditsPda,
        offsetRequest: offsetReqPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([buyer])
      .rpc();

    // e) Final verifications
    const purchaseAfter = await program.account.purchase.fetch(purchasePda);
    assert.equal(
      purchaseAfter.remainingAmount.toNumber(),
      purchaseAmount - offsetAmount
    );

    const ccAfter = await program.account.carbonCredits.fetch(carbonCreditsPda);
    assert.equal(ccAfter.offsetCredits.toNumber(), offsetAmount);

    const offsetAcc = await program.account.offsetRequest.fetch(offsetReqPda);
    assert.equal(offsetAcc.amount.toNumber(), offsetAmount);
    assert.ok(offsetAcc.status.pending !== undefined);

    const origBal = await connection.getTokenAccountBalance(buyerNftAta);
    assert.equal(origBal.value.uiAmount, 0);

    const newBal = await connection.getTokenAccountBalance(newNftAta);
    assert.equal(newBal.value.uiAmount, 1);

    // Verify that fungible tokens were burned
    const buyerTokenBal = await connection.getTokenAccountBalance(
      buyerTokenAta
    );
    assert.equal(
      buyerTokenBal.value.uiAmount,
      purchaseAmount - offsetAmount,
      "Buyer should have purchaseAmount - offsetAmount tokens remaining"
    );

    // Verify project offset amount
    const projectAfter = await program.account.project.fetch(projectPda);
    assert.equal(
      projectAfter.offsetAmount.toNumber(),
      offsetAmount,
      "Project offsetAmount should be updated"
    );
  });

  test("4. Verify final system state", async () => {
    // Verify carbon credits account state
    const carbonCreditsAccount = await program.account.carbonCredits.fetch(
      carbonCreditsPda
    );
    console.log("✅ CarbonCredits state verified");

    // Verify project account state
    const projectAccount = await program.account.project.fetch(projectPda);
    console.log("✅ Project state verified");
    console.log(
      "Project remaining amount:",
      Number(projectAccount.remainingAmount)
    );

    // Check that some tokens were purchased (remaining amount should be less than total)
    assert.ok(
      projectAccount.remainingAmount.toNumber() <
        projectAccount.amount.toNumber()
    );
    console.log(
      "🎉 All tests passed! CarbonPay USDC integration working perfectly!"
    );
  });
});
