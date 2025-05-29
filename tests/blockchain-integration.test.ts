import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as bs58 from "bs58";
import * as sodium from "libsodium-wrappers";
import { expect } from "chai";

// Mock WalletService
class MockWalletService {
  private static wallets: Map<string, { keypair: Keypair; password: string }> =
    new Map();

  public static async createWallet(
    userId: string,
    password: string
  ): Promise<{ id: string; publicKey: string }> {
    const keypair = Keypair.generate();
    const walletId = Math.random().toString(36).substring(7);

    this.wallets.set(walletId, { keypair, password });

    return {
      id: walletId,
      publicKey: keypair.publicKey.toBase58(),
    };
  }

  public static async getKeypair(
    walletId: string,
    password: string
  ): Promise<Keypair> {
    const wallet = this.wallets.get(walletId);
    if (!wallet || wallet.password !== password) {
      throw new Error("Wallet not found or invalid password");
    }
    return wallet.keypair;
  }
}

describe("Blockchain Integration Tests", function () {
  this.timeout(30000); // Increase timeout for all tests

  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  const USDC_MINT = new PublicKey(
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
  ); // Devnet USDC
  const TEST_USER_ID = "test-user-123";
  const TEST_PASSWORD = "test-password-123";
  let wallet: { id: string; publicKey: string };

  it("should create a new wallet for user", async () => {
    wallet = await MockWalletService.createWallet(TEST_USER_ID, TEST_PASSWORD);
    expect(wallet).to.be.an("object");
    expect(wallet.publicKey).to.be.a("string");
  });

  it("should fund the wallet with SOL", async () => {
    const keypair = await MockWalletService.getKeypair(
      wallet.id,
      TEST_PASSWORD
    );
    const signature = await connection.requestAirdrop(
      keypair.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);

    const balance = await connection.getBalance(keypair.publicKey);
    expect(balance).to.be.greaterThan(0);
  });

  it("should create USDC token account and check balance", async () => {
    const keypair = await MockWalletService.getKeypair(
      wallet.id,
      TEST_PASSWORD
    );
    const tokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      keypair.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Create token account if it doesn't exist
    try {
      await connection.getTokenAccountBalance(tokenAccount);
    } catch {
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          keypair.publicKey,
          tokenAccount,
          keypair.publicKey,
          USDC_MINT,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      transaction.recentBlockhash = (
        await connection.getRecentBlockhash()
      ).blockhash;
      transaction.feePayer = keypair.publicKey;
      transaction.sign(keypair);

      const signature = await connection.sendRawTransaction(
        transaction.serialize()
      );
      await connection.confirmTransaction(signature);
    }

    const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
    expect(accountInfo).to.be.an("object");
  });

  it("should transfer USDC between accounts", async function () {
    this.timeout(30000);

    // Create second wallet
    const secondWallet = Keypair.generate();
    const secondWalletPubkey = secondWallet.publicKey;

    // Fund second wallet
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: secondWalletPubkey,
        lamports: LAMPORTS_PER_SOL,
      })
    );

    await connection.sendTransaction(fundTx, [wallet]);
    await connection.confirmTransaction(await connection.getLatestBlockhash());

    // Create USDC account for second wallet
    const secondWalletUsdcAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      secondWalletPubkey
    );

    const createSecondAccountTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        secondWalletUsdcAccount,
        secondWalletPubkey,
        USDC_MINT
      )
    );

    await connection.sendTransaction(createSecondAccountTx, [wallet]);
    await connection.confirmTransaction(await connection.getLatestBlockhash());

    // Mint some USDC to the first wallet
    const mintAmount = 1000000; // 1 USDC (6 decimals)
    const mintTx = new Transaction().add(
      createMintToInstruction(
        USDC_MINT,
        secondWalletUsdcAccount,
        wallet.publicKey,
        mintAmount
      )
    );

    await connection.sendTransaction(mintTx, [wallet]);
    await connection.confirmTransaction(await connection.getLatestBlockhash());

    // Transfer USDC
    const transferAmount = 500000; // 0.5 USDC
    const transferTx = new Transaction().add(
      createTransferInstruction(
        secondWalletUsdcAccount,
        secondWalletUsdcAccount,
        wallet.publicKey,
        transferAmount
      )
    );

    await connection.sendTransaction(transferTx, [wallet]);
    await connection.confirmTransaction(await connection.getLatestBlockhash());

    // Check balances
    const firstWalletBalance = await connection.getTokenAccountBalance(
      secondWalletUsdcAccount
    );
    const secondWalletBalance = await connection.getTokenAccountBalance(
      secondWalletUsdcAccount
    );

    expect(Number(firstWalletBalance.value.amount)).to.equal(500000); // 0.5 USDC remaining
    expect(Number(secondWalletBalance.value.amount)).to.equal(500000); // 0.5 USDC received
  });
});
