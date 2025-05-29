import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { BlockchainService } from "../services/BlockchainService";
import { AppDataSource } from "../database/data-source";
import { Wallet } from "../entities/Wallet";

const router = Router();

// Get USDC balance
router.get("/balance", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const walletRepository = AppDataSource.getRepository(Wallet);
    const wallet = await walletRepository.findOneBy({ userId: req.userId });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const balance = await BlockchainService.getUSDCBalance(
      wallet.id,
      process.env.WALLET_ENCRYPTION_KEY || ""
    );

    res.json({ balance });
  } catch (error) {
    console.error("Error getting balance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Transfer USDC
router.post("/transfer", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { toPublicKey, amount } = req.body;

    if (!toPublicKey || !amount) {
      return res
        .status(400)
        .json({ error: "Destination address and amount are required" });
    }

    const walletRepository = AppDataSource.getRepository(Wallet);
    const wallet = await walletRepository.findOneBy({ userId: req.userId });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const signature = await BlockchainService.transferUSDC(
      wallet.id,
      toPublicKey,
      amount,
      process.env.WALLET_ENCRYPTION_KEY || ""
    );

    res.json({ signature });
  } catch (error) {
    console.error("Error transferring USDC:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
