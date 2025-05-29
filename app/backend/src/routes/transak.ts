import { Router } from "express";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AppDataSource } from "../database/data-source";
import { Wallet } from "../entities/Wallet";
import { WalletService } from "../services/WalletService";

const router = Router();

const USDC_MINT = new PublicKey(process.env.USDC_MINT_ADDRESS || "");
const TRANSFER_AMOUNT = 1000000; // 1 USDC (6 decimals)

router.post("/webhook", async (req, res) => {
  try {
    const { status, transactionHash, userId } = req.body;

    if (status !== "completed") {
      return res.status(200).json({ message: "Payment not completed yet" });
    }

    // Get user's wallet
    const walletRepository = AppDataSource.getRepository(Wallet);
    const wallet = await walletRepository.findOneBy({ userId });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Initialize Solana connection
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
    );

    // Get user's keypair
    const keypair = await WalletService.getKeypair(
      wallet.id,
      process.env.WALLET_ENCRYPTION_KEY || ""
    );

    // Create USDC token account for user if it doesn't exist
    const userTokenAccount = await Token.getAssociatedTokenAddress(
      TOKEN_PROGRAM_ID,
      USDC_MINT,
      keypair.publicKey
    );

    // Create transfer transaction
    const transaction = new Transaction().add(
      Token.createAssociatedTokenAccountInstruction(
        TOKEN_PROGRAM_ID,
        USDC_MINT,
        userTokenAccount,
        keypair.publicKey,
        keypair.publicKey
      ),
      Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        new PublicKey(process.env.TREASURY_TOKEN_ACCOUNT || ""),
        userTokenAccount,
        new PublicKey(process.env.TREASURY_WALLET || ""),
        [],
        TRANSFER_AMOUNT
      )
    );

    // Sign and send transaction
    transaction.recentBlockhash = (
      await connection.getRecentBlockhash()
    ).blockhash;
    transaction.feePayer = keypair.publicKey;
    transaction.sign(keypair);

    const signature = await connection.sendRawTransaction(
      transaction.serialize()
    );
    await connection.confirmTransaction(signature);

    res.status(200).json({ message: "Payment processed successfully" });
  } catch (error) {
    console.error("Error processing Transak webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
