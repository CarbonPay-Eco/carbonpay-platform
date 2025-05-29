import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletService } from "./WalletService";

export class BlockchainService {
  private static connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
  );
  private static USDC_MINT = new PublicKey(process.env.USDC_MINT_ADDRESS || "");

  public static async getUSDCBalance(
    walletId: string,
    password: string
  ): Promise<number> {
    const keypair = await WalletService.getKeypair(walletId, password);

    const tokenAccount = await Token.getAssociatedTokenAddress(
      TOKEN_PROGRAM_ID,
      this.USDC_MINT,
      keypair.publicKey
    );

    try {
      const accountInfo = await this.connection.getTokenAccountBalance(
        tokenAccount
      );
      return (
        Number(accountInfo.value.amount) /
        Math.pow(10, accountInfo.value.decimals)
      );
    } catch (error) {
      return 0; // Account doesn't exist yet
    }
  }

  public static async transferUSDC(
    fromWalletId: string,
    toPublicKey: string,
    amount: number,
    password: string
  ): Promise<string> {
    const fromKeypair = await WalletService.getKeypair(fromWalletId, password);
    const toPublicKeyObj = new PublicKey(toPublicKey);

    // Get token accounts
    const fromTokenAccount = await Token.getAssociatedTokenAddress(
      TOKEN_PROGRAM_ID,
      this.USDC_MINT,
      fromKeypair.publicKey
    );

    const toTokenAccount = await Token.getAssociatedTokenAddress(
      TOKEN_PROGRAM_ID,
      this.USDC_MINT,
      toPublicKeyObj
    );

    // Create transaction
    const transaction = new Transaction().add(
      // Create destination token account if it doesn't exist
      Token.createAssociatedTokenAccountInstruction(
        TOKEN_PROGRAM_ID,
        this.USDC_MINT,
        toTokenAccount,
        toPublicKeyObj,
        fromKeypair.publicKey
      ),
      // Transfer tokens
      Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        fromTokenAccount,
        toTokenAccount,
        fromKeypair.publicKey,
        [],
        amount * Math.pow(10, 6) // Convert to USDC decimals
      )
    );

    // Sign and send transaction
    transaction.recentBlockhash = (
      await this.connection.getRecentBlockhash()
    ).blockhash;
    transaction.feePayer = fromKeypair.publicKey;
    transaction.sign(fromKeypair);

    const signature = await this.connection.sendRawTransaction(
      transaction.serialize()
    );
    await this.connection.confirmTransaction(signature);

    return signature;
  }
}
