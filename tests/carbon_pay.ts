// tests/carbonpay.test.ts

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CarbonPay } from "../target/types/carbon_pay";
import assert from "assert";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Connection,
  Transaction,
} from "@solana/web3.js";
import {
  createMint,
  getMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("🌳 CarbonPay Program Test Suite", () => {

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.CarbonPay as Program<CarbonPay>;
  const connection = provider.connection;

  // CarbonCredits PDA and bump
  let carbonCreditsPda: PublicKey;
  let carbonCreditsBump: number;
  
  // Metadata program constant
  const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

  // Project variables
  let projectOwner: Keypair;
  let nftMint: PublicKey;
  let tokenMint: PublicKey;
  let projectOwnerNftAccount: PublicKey;
  let vaultPda: PublicKey;
  let vaultAta: PublicKey;
  let projectPda: PublicKey;
  let projectBump: number;
  
  // Project parameters
  const PROJECT_AMOUNT = 100;
  const PRICE_PER_TOKEN = 1_000_000_000; // 1 SOL
  const CARBON_PAY_FEE = 500; // 5%
  const PROJECT_URI = "https://uri.test/1";
  const PROJECT_NAME = "MyProject";
  const PROJECT_SYMBOL = "MPRJ";

  before(async () => {
    [carbonCreditsPda, carbonCreditsBump] =
      await PublicKey.findProgramAddress(
        [Buffer.from("carbon_credits")],
        program.programId
      );
    
    // Derive vault PDA
    [vaultPda] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), carbonCreditsPda.toBuffer()],
      program.programId
    );
    
    // Setup project owner
    projectOwner = Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        projectOwner.publicKey, 
        10 * anchor.web3.LAMPORTS_PER_SOL
      )
    );
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // 1) InitializeCarbonCreditsAccountConstraints
  // ──────────────────────────────────────────────────────────────────────────────
  it("1. Initialize CarbonCredits PDA", async () => {
    await program.methods
      .initializeCarbonCredits()
      .accountsPartial({
        admin: provider.wallet.publicKey,
        carbonCredits: carbonCreditsPda,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const cc = await program.account.carbonCredits.fetch(carbonCreditsPda);
    assert.equal(cc.bump, carbonCreditsBump);
    assert.equal(cc.totalCredits.toNumber(), 0);
    assert.equal(cc.offsetCredits.toNumber(), 0);
  });

  // ──────────────────────────────────────────────────────────────────────────────
  //  InitializeProject
  // ──────────────────────────────────────────────────────────────────────────────
  it("2. Initialize Project", async () => {
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
      vaultPda, 
      true // allowOwnerOffCurve: true - important for PDAs
    );
    console.log("Vault PDA:", vaultPda.toBase58());
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
          vaultPda, // owner - the vault PDA
          tokenMint
        )
      );
    
    const createAtaTxSig = await provider.sendAndConfirm(createAtaTx, [projectOwner]);
    console.log("ATAs creation: ", createAtaTxSig);
    
    // 5. Derive Project PDA
    [projectPda, projectBump] = await PublicKey.findProgramAddress(
      [Buffer.from("project"), projectOwner.publicKey.toBuffer(), nftMint.toBuffer()],
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
      assert.equal(projAcc.amount.toNumber(), PROJECT_AMOUNT, "Incorrect amount");
      assert.equal(projAcc.remainingAmount.toNumber(), PROJECT_AMOUNT, "Incorrect remainingAmount");
      assert.ok(projAcc.isActive, "Project is not active");
      
      // Verify that NFT was minted to the project owner
      const ownerNftBal = await connection.getTokenAccountBalance(projectOwnerNftAccount);
      assert.equal(ownerNftBal.value.amount, "1", "Owner should have 1 token (NFT)");
      
      // Verify that fungible tokens were minted to the vault
      const vaultTokenBal = await connection.getTokenAccountBalance(vaultAta);
      assert.equal(vaultTokenBal.value.amount, PROJECT_AMOUNT.toString(), "Vault should have PROJECT_AMOUNT tokens");
      
      // Verify that NFT mint authority was transferred
      const nftMintInfo = await getMint(connection, nftMint);
      assert.ok(
        nftMintInfo.mintAuthority === null || 
        nftMintInfo.mintAuthority?.toBase58() !== projectOwner.publicKey.toBase58(),
        "NFT mint authority was not transferred from project owner"
      );
      
      // Verify that token mint authority was transferred to carbon_credits PDA
      const tokenMintInfo = await getMint(connection, tokenMint);
      assert.equal(
        tokenMintInfo.mintAuthority?.toBase58(),
        carbonCreditsPda.toBase58(),
        "Incorrect token mint authority"
      );
      
    } catch (error) {
      console.error("Error during project initialization:", error);
      // Provide more error information for debugging
      if (error instanceof Error) {
        console.log("Error message:", error.message);
        if ('logs' in error) {
          console.log("Error logs:", (error as any).logs);
        }
      }
      throw error;
    }
  });

  // // ──────────────────────────────────────────────────────────────────────────────
  // // 3) PurchaseCarbonCredits
  // // ──────────────────────────────────────────────────────────────────────────────
  // let buyer: Keypair;
  // let purchaseNftMint: PublicKey;
  // let buyerNftAta: PublicKey;
  // let buyerTokenAta: PublicKey;
  // let purchasePda: PublicKey;
  // let purchaseBump: number;
  // const purchaseAmount = 10;

  // it("3. Purchase Carbon Credits (SOL → owner + fee, mint NFT and tokens)", async () => {
  //   // a) Setup buyer and airdrop
  //   buyer = Keypair.generate();
  //   await connection
  //     .requestAirdrop(buyer.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
  //     .then(sig => connection.confirmTransaction(sig));

  //   // b) Create mint for purchase NFT
  //   purchaseNftMint = await createMint(
  //     connection,
  //     buyer,
  //     buyer.publicKey,
  //     buyer.publicKey,
  //     0
  //   );

  //   // c) Derive buyer's ATAs
  //   buyerNftAta = await getAssociatedTokenAddress(
  //     purchaseNftMint,
  //     buyer.publicKey
  //   );
  //   buyerTokenAta = await getAssociatedTokenAddress(
  //     mint,
  //     buyer.publicKey
  //   );

  //   // d) Create ATAs (wallet pays)
  //   const ixBuyNftAta = createAssociatedTokenAccountInstruction(
  //     provider.wallet.publicKey,
  //     buyerNftAta,
  //     buyer.publicKey,
  //     purchaseNftMint
  //   );
  //   const ixBuyTokenAta = createAssociatedTokenAccountInstruction(
  //     provider.wallet.publicKey,
  //     buyerTokenAta,
  //     buyer.publicKey,
  //     mint
  //   );
  //   await provider.sendAndConfirm(
  //     new Transaction().add(ixBuyNftAta, ixBuyTokenAta)
  //   );

  //   // e) Derive Purchase PDA
  //   [purchasePda, purchaseBump] = await PublicKey.findProgramAddress(
  //     [
  //       Buffer.from("purchase"),
  //       buyer.publicKey.toBuffer(),
  //       projectPda.toBuffer(),
  //       purchaseNftMint.toBuffer(),
  //     ],
  //     program.programId
  //   );

  //   // f) Derive purchase metadata PDA
  //   const [purchaseMetadataPda] = await PublicKey.findProgramAddress(
  //     [
  //       Buffer.from("metadata"),
  //       METADATA_PROGRAM_ID.toBuffer(),
  //       purchaseNftMint.toBuffer(),
  //     ],
  //     METADATA_PROGRAM_ID
  //   );

  //   // g) Call purchaseCarbonCredits
  //   await program.methods
  //     .purchaseCarbonCredits(new BN(purchaseAmount))
  //     .accountsPartial({
  //       project: projectPda,
  //       projectOwner: projectOwner.publicKey,
  //       projectMint: mint,
  //       carbonCredits: carbonCreditsPda,
  //       projectTokenAccount: vaultAta,
  //       purchaseNftMint,
  //       buyerNftAccount: buyerNftAta,
  //       buyerTokenAccount: buyerTokenAta,
  //       purchase: purchasePda,
  //       purchaseMetadata: purchaseMetadataPda,
  //       buyer: buyer.publicKey,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       tokenMetadataProgram: METADATA_PROGRAM_ID,
  //       systemProgram: SystemProgram.programId,
  //       rent: SYSVAR_RENT_PUBKEY,
  //     })
  //     .signers([buyer])
  //     .rpc();

  //   // h) Post-purchase verifications
  //   const projAfter = await program.account.project.fetch(projectPda);
  //   assert.equal(
  //     projAfter.remainingAmount.toNumber(),
  //     100 - purchaseAmount
  //   );

  //   const buyNftBal = await connection.getTokenAccountBalance(buyerNftAta);
  //   assert.equal(buyNftBal.value.uiAmount, 1);

  //   const buyTokenBal = await connection.getTokenAccountBalance(buyerTokenAta);
  //   assert.equal(buyTokenBal.value.uiAmount, purchaseAmount);

  //   const purchaseAcc = await program.account.purchase.fetch(purchasePda);
  //   assert.equal(purchaseAcc.amount.toNumber(), purchaseAmount);
  //   assert.equal(purchaseAcc.remainingAmount.toNumber(), purchaseAmount);
  //   assert.equal(
  //     purchaseAcc.buyer.toBase58(),
  //     buyer.publicKey.toBase58()
  //   );
  // });

  // // ──────────────────────────────────────────────────────────────────────────────
  // // 4) RequestOffset
  // // ──────────────────────────────────────────────────────────────────────────────
  // it("4. Request Offset (burn NFT, partial mint and register)", async () => {
  //   const offsetAmount = 5;
  //   const requestId = "REQ123";

  //   // a) Derive OffsetRequest PDA
  //   const [offsetReqPda] = await PublicKey.findProgramAddress(
  //     [
  //       Buffer.from("offset_request"),
  //       buyer.publicKey.toBuffer(),
  //       purchasePda.toBuffer(),
  //       Buffer.from(requestId),
  //     ],
  //     program.programId
  //   );

  //   // b) Create new mint for residual NFT
  //   const newNftMint = await createMint(
  //     connection,
  //     buyer,
  //     buyer.publicKey,
  //     buyer.publicKey,
  //     0
  //   );
  //   const newNftAta = await getAssociatedTokenAddress(
  //     newNftMint,
  //     buyer.publicKey
  //   );
  //   await provider.sendAndConfirm(
  //     new Transaction().add(
  //       createAssociatedTokenAccountInstruction(
  //         provider.wallet.publicKey,
  //         newNftAta,
  //         buyer.publicKey,
  //         newNftMint
  //       )
  //     )
  //   );

  //   // c) Derive new NFT metadata PDA
  //   const [newNftMetadataPda] = await PublicKey.findProgramAddress(
  //     [
  //       Buffer.from("metadata"),
  //       METADATA_PROGRAM_ID.toBuffer(),
  //       newNftMint.toBuffer(),
  //     ],
  //     METADATA_PROGRAM_ID
  //   );

  //   // d) Call requestOffset
  //   await program.methods
  //     .requestOffset(new BN(offsetAmount), requestId)
  //     .accountsPartial({
  //       offsetRequester: buyer.publicKey,
  //       purchase: purchasePda,
  //       project: projectPda,
  //       originalNftMint: purchaseNftMint,
  //       originalNftAccount: buyerNftAta,
  //       newNftMint,
  //       newNftAccount: newNftAta,
  //       newNftMetadata: newNftMetadataPda,
  //       carbonCredits: carbonCreditsPda,
  //       offsetRequest: offsetReqPda,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       tokenMetadataProgram: METADATA_PROGRAM_ID,
  //       systemProgram: SystemProgram.programId,
  //       rent: SYSVAR_RENT_PUBKEY,
  //     })
  //     .signers([buyer])
  //     .rpc();

  //   // e) Final verifications
  //   const purchaseAfter = await program.account.purchase.fetch(purchasePda);
  //   assert.equal(
  //     purchaseAfter.remainingAmount.toNumber(),
  //     purchaseAmount - offsetAmount
  //   );

  //   const ccAfter = await program.account.carbonCredits.fetch(
  //     carbonCreditsPda
  //   );
  //   assert.equal(ccAfter.offsetCredits.toNumber(), offsetAmount);

  //   const offsetAcc = await program.account.offsetRequest.fetch(
  //     offsetReqPda
  //   );
  //   assert.equal(offsetAcc.amount.toNumber(), offsetAmount);
  //   assert.equal(offsetAcc.status, "pending"); // Pending

  //   const origBal = await connection.getTokenAccountBalance(buyerNftAta);
  //   assert.equal(origBal.value.uiAmount, 0);

  //   const newBal = await connection.getTokenAccountBalance(newNftAta);
  //   assert.equal(newBal.value.uiAmount, 1);
  // });
});
