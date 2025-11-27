import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Retirement } from "../database/entities/Retirement";
import { TokenizedProject } from "../database/entities/TokenizedProject";
import { Purchase } from "../database/entities/Purchase";
import { AnchorService } from "./anchor.service";
import { WalletService } from "./wallet.service";
import { TokenizedProjectService } from "./tokenized-project.service";
import { AuditLogService } from "./audit-log.service";
import { EmissionService } from "./emission.service";
import { PublicKey } from "@solana/web3.js";
import { WalletService as UserWalletService } from "./WalletService";

export class RetirementService {
  private retirementRepository: Repository<Retirement>;
  private purchaseRepository: Repository<Purchase>;
  private anchorService: AnchorService;
  private walletService: WalletService;
  private tokenizedProjectService: TokenizedProjectService;
  private auditLogService: AuditLogService;
  private emissionService: EmissionService;

  constructor() {
    this.retirementRepository = AppDataSource.getRepository(Retirement);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.anchorService = new AnchorService();
    this.walletService = new WalletService();
    this.tokenizedProjectService = new TokenizedProjectService();
    this.auditLogService = new AuditLogService();
    this.emissionService = new EmissionService();
  }

  /**
   * Request offset for carbon credits using on-chain program
   * @param userId The user ID requesting the offset
   * @param projectId The project ID to offset credits from
   * @param quantity The quantity of credits to offset (in tons)
   * @param options Additional offset options including optional emissionId
   * @returns The retirement record with on-chain transaction hash
   */
  async retireCredits(
    userId: string,
    projectId: string,
    quantity: number,
    options?: {
      proofUrl?: string;
      autoOffset?: boolean;
      reportingPeriodStart?: Date;
      reportingPeriodEnd?: Date;
      beneficiary?: string;
      retirementMessage?: string;
      emissionId?: string; // Optional: link to emission record
      purchaseId?: string; // Optional: specific purchase to offset from
    }
  ): Promise<Retirement> {
    // Get user's keypair for signing (this also verifies the wallet exists)
    const { WalletService } = await import("./WalletService");
    const userKeypair = await WalletService.getKeypairByUserId(userId);
    
    // Get the project
    const project = await this.tokenizedProjectService.getProjectById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (!project.projectPDA) {
      throw new Error("Project does not have an on-chain PDA. Project must be created on-chain first.");
    }

    // Find a purchase for this user and project
    // If purchaseId is provided, try to use it; if invalid, fall back to finding another valid purchase
    let purchase: Purchase | null = null;
    
    // Helper function to validate a purchase
    const validatePurchase = async (candidatePurchase: Purchase): Promise<boolean> => {
      if (!candidatePurchase.purchasePDA) {
        return false;
      }

      try {
        const purchasePDA = new PublicKey(candidatePurchase.purchasePDA);
        const purchaseAccount = await this.anchorService.getPurchase(purchasePDA);
        
        const onChainRemaining = Number(purchaseAccount.remainingAmount);
        
        // Check if purchase has enough remaining balance
        if (onChainRemaining < quantity) {
          console.log(`Purchase ${candidatePurchase.purchasePDA} has insufficient remaining: ${onChainRemaining} < ${quantity}`);
          return false;
        }

        // Check if NFT account exists and has balance
        const { getAssociatedTokenAddress } = await import('@solana/spl-token');
        const { Connection } = await import('@solana/web3.js');
        const { SOLANA_RPC_URL, SOLANA_NETWORK } = await import('../config/constants');
        const { clusterApiUrl } = await import('@solana/web3.js');
        
        const rpcUrl = SOLANA_RPC_URL || 
          (SOLANA_NETWORK === 'devnet' 
            ? clusterApiUrl('devnet').toString()
            : clusterApiUrl('mainnet-beta').toString());
        const connection = new Connection(rpcUrl, 'confirmed');
        
        const offsetRequester = userKeypair.publicKey;
        // Use database nftMint if available (updated after partial offsets),
        // otherwise fall back to on-chain nftMint (original NFT)
        const purchaseNftMint = candidatePurchase.nftMint
          ? new PublicKey(candidatePurchase.nftMint)
          : purchaseAccount.nftMint;
        const originalNftAccount = await getAssociatedTokenAddress(
          purchaseNftMint,
          offsetRequester
        );

        // Check NFT account balance
        try {
          const nftAccountInfo = await connection.getTokenAccountBalance(originalNftAccount);
          const nftBalance = Number(nftAccountInfo.value.amount);
          if (nftBalance === 0) {
            console.log(`Purchase ${candidatePurchase.purchasePDA} NFT already burned (balance: 0, remaining_amount: ${onChainRemaining})`);
            return false;
          }
          
          // Purchase is valid!
          return true;
        } catch (nftError: any) {
          // NFT account doesn't exist or has no balance
          const accountInfo = await connection.getAccountInfo(originalNftAccount);
          if (!accountInfo) {
            console.log(`Purchase ${candidatePurchase.purchasePDA} NFT account does not exist (remaining_amount: ${onChainRemaining})`);
          } else {
            console.log(`Purchase ${candidatePurchase.purchasePDA} NFT account error: ${nftError.message} (remaining_amount: ${onChainRemaining})`);
          }
          return false;
        }
      } catch (error: any) {
        // Purchase account doesn't exist or other error
        console.warn(`Could not validate purchase ${candidatePurchase.purchasePDA}: ${error.message}`);
        return false;
      }
    };

    // Try to use specified purchase if provided
    if (options?.purchaseId) {
      const candidatePurchase = await this.purchaseRepository.findOne({
        where: { id: options.purchaseId, userId, projectId },
      });
      
      if (candidatePurchase && candidatePurchase.purchasePDA) {
        const isValid = await validatePurchase(candidatePurchase);
        if (isValid) {
          purchase = candidatePurchase;
          console.log(`Using specified purchase: ${candidatePurchase.purchasePDA}`);
        } else {
          console.log(`Specified purchase ${options.purchaseId} is invalid, searching for alternatives...`);
        }
      }
    }

    // If no valid purchase found yet, search through all purchases
    if (!purchase) {
      const allPurchases = await this.purchaseRepository.find({
        where: { userId, projectId },
        order: { createdAt: "DESC" },
      });

      // Validate each purchase on-chain to find one with remaining balance and valid NFT
      for (const candidatePurchase of allPurchases) {
        // Skip if this is the purchase we already tried and failed
        if (options?.purchaseId && candidatePurchase.id === options.purchaseId) {
          continue;
        }

        const isValid = await validatePurchase(candidatePurchase);
        if (isValid) {
          purchase = candidatePurchase;
          console.log(`Found valid purchase:`, {
            purchasePDA: candidatePurchase.purchasePDA,
            purchaseId: candidatePurchase.id,
          });
          break; // Found a valid purchase, stop searching
        }
      }
    }

    if (!purchase || !purchase.purchasePDA) {
      throw new Error(
        "No valid purchase found with remaining balance and valid NFT. " +
        "You may need to purchase more credits, or all your purchases have been fully offset."
      );
    }

    // Final validation of the selected purchase
    try {
      const purchasePDA = new PublicKey(purchase.purchasePDA);
      const purchaseAccount = await this.anchorService.getPurchase(purchasePDA);
      
      const onChainRemaining = Number(purchaseAccount.remainingAmount);
      if (onChainRemaining < quantity) {
        throw new Error(
          `Insufficient remaining tokens in purchase. ` +
          `Requested: ${quantity}, Available: ${onChainRemaining}. ` +
          `Purchase PDA: ${purchase.purchasePDA}`
        );
      }
      
      console.log(`Using purchase for offset:`, {
        purchasePDA: purchase.purchasePDA,
        totalAmount: Number(purchaseAccount.amount),
        remainingAmount: onChainRemaining,
        requestedAmount: quantity,
      });
    } catch (error: any) {
      // This shouldn't happen if validation above worked, but handle it anyway
      throw new Error(
        `Failed to validate purchase: ${error.message}. ` +
        `Purchase PDA: ${purchase.purchasePDA}`
      );
    }

    // Generate unique request ID
    const requestId = `offset-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Tokens have 0 decimals, so amount is already in the correct units (1 token = 1 ton)
    // No conversion needed - pass quantity directly
    const amountInTokens = Math.floor(quantity);

    // Execute on-chain offset request
    const { tx, offsetRequestPDA, newNftMint } = await this.anchorService.requestOffset({
      offsetRequesterKeypair: userKeypair,
      purchasePDA: new PublicKey(purchase.purchasePDA),
      projectPDA: new PublicKey(project.projectPDA),
      amount: amountInTokens,
      requestId,
    });

    // If partial offset, update the purchase's nftMint in database to track the new NFT
    // This allows future offsets to use the correct NFT (the new one, not the burned one)
    if (newNftMint) {
      purchase.nftMint = newNftMint.toBase58();
      await this.purchaseRepository.save(purchase);
      console.log(`Updated purchase ${purchase.id} nftMint to ${newNftMint.toBase58()} after partial offset`);
    }

    // Update project available supply (subtract from available)
    await this.tokenizedProjectService.updateProjectSupply(
      projectId,
      quantity,
      false
    );

    // Get wallet for retirement record (from wallets table)
    const wallet = await this.walletService.getOrCreateWallet(userId);

    // Get UserWallet for audit log (from user_wallets table)
    // Audit logs require a UserWallet ID, not a Wallet ID
    const { UserWallet } = await import("../entities/UserWallet");
    const userWalletRepository = AppDataSource.getRepository(UserWallet);
    const userWallet = await userWalletRepository.findOneBy({ userId });
    
    if (!userWallet) {
      throw new Error(`UserWallet not found for user ${userId}`);
    }
    
    // Create retirement record
    const retirement = this.retirementRepository.create({
      walletId: wallet.id,
      tokenizedProjectId: project.id,
      quantity,
      txHash: tx,
      proofUrl: options?.proofUrl,
      autoOffset: options?.autoOffset || false,
      reportingPeriodStart: options?.reportingPeriodStart,
      reportingPeriodEnd: options?.reportingPeriodEnd,
    });
    
    const savedRetirement = await this.retirementRepository.save(retirement);
    
    // Link to emission if emissionId is provided
    if (options?.emissionId) {
      await this.emissionService.updateEmissionOffset(
        options.emissionId,
        userId,
        quantity,
        projectId,
        offsetRequestPDA.toBase58()
      );
    }

    // Log the action (use UserWallet ID for audit logs)
    await this.auditLogService.createAuditLog(
      userWallet.id,
      "CREDIT_RETIRE",
      "retirements",
      savedRetirement.id,
      {
        projectId: project.id,
        quantity,
        txHash: tx,
        offsetRequestPDA: offsetRequestPDA.toBase58(),
        beneficiary: options?.beneficiary,
        emissionId: options?.emissionId,
      }
    );
    
    return savedRetirement;
  }

  /**
   * Get retirements by wallet
   * @param walletAddress The wallet address
   * @returns List of retirements for the wallet
   */
  async getRetirementsByWallet(walletAddress: string): Promise<Retirement[]> {
    const wallet = await this.walletService.findByAddress(walletAddress);
    
    if (!wallet) {
      return [];
    }
    
    return this.retirementRepository.find({
      where: { walletId: wallet.id },
      relations: ["wallet", "tokenizedProject"],
      order: { retirementDate: "DESC" },
    });
  }

  /**
   * Get retirements by organization wallet
   * @param walletAddress The organization wallet address
   * @returns List of retirements for the organization
   */
  async getRetirementsByOrganizationWallet(
    walletAddress: string
  ): Promise<Retirement[]> {
    const wallet = await this.walletService.findByAddress(walletAddress);
    
    if (!wallet) {
      return [];
    }
    
    return this.retirementRepository.find({
      where: { walletId: wallet.id },
      relations: ["wallet", "tokenizedProject"],
      order: { retirementDate: "DESC" },
    });
  }

  /**
   * Get all retirements
   * @returns List of all retirements
   */
  async getAllRetirements(): Promise<Retirement[]> {
    return this.retirementRepository.find({
      relations: ["wallet", "tokenizedProject"],
      order: { retirementDate: "DESC" },
    });
  }

  /**
   * Get user's wallet address for retirement operations
   */
  async getUserWalletAddress(userId: string): Promise<string> {
    const wallet = await this.walletService.getOrCreateWallet(userId);
    return wallet.walletAddress;
  }

  /**
   * Get user's retirements by user ID
   */
  async getUserRetirements(userId: string): Promise<Retirement[]> {
    // Get user's wallet
    const wallet = await this.walletService.getOrCreateWallet(userId);

    // Get retirements for this wallet
    return this.retirementRepository.find({
      where: { walletId: wallet.id },
      relations: ["tokenizedProject"],
      order: { retirementDate: "DESC" },
    });
  }

  /**
   * Get retirement by ID (with user validation)
   */
  async getRetirementById(
    retirementId: string,
    userId: string
  ): Promise<Retirement | null> {
    // Get user's wallet
    const wallet = await this.walletService.getOrCreateWallet(userId);

    // Get retirement for this user only
    return this.retirementRepository.findOne({
      where: {
        id: retirementId,
        walletId: wallet.id,
      },
      relations: ["tokenizedProject"],
    });
  }

  /**
   * Get public retirements for a wallet address (legacy method)
   */
  async getPublicRetirements(walletAddress: string): Promise<Retirement[]> {
    // Find wallet by address
    const wallet = await this.walletService.getWalletByAddress(walletAddress);

    if (!wallet) {
      return [];
    }

    return this.retirementRepository.find({
      where: { walletId: wallet.id },
      relations: ["tokenizedProject"],
      order: { retirementDate: "DESC" },
    });
  }
} 
