import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Retirement } from "../database/entities/Retirement";
import { TokenizedProject } from "../database/entities/TokenizedProject";
import { Purchase } from "../database/entities/Purchase";
import { SolanaService } from "./solana.service";
import { SolanaOnchainService } from "./solana-onchain.service";
import { WalletService } from "./wallet.service";
import { TokenizedProjectService } from "./tokenized-project.service";
import { AuditLogService } from "./audit-log.service";

export class RetirementService {
  private retirementRepository: Repository<Retirement>;
  private purchaseRepository: Repository<Purchase>;
  private solanaService: SolanaService;
  private solanaOnchainService: SolanaOnchainService;
  private walletService: WalletService;
  private tokenizedProjectService: TokenizedProjectService;
  private auditLogService: AuditLogService;

  constructor() {
    this.retirementRepository = AppDataSource.getRepository(Retirement);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.solanaService = new SolanaService();
    this.solanaOnchainService = new SolanaOnchainService();
    this.walletService = new WalletService();
    this.tokenizedProjectService = new TokenizedProjectService();
    this.auditLogService = new AuditLogService();
  }

  /**
   * Retire carbon credits for emissions offsetting
   * @param walletAddress The wallet address of the retirer
   * @param projectId The project ID to retire credits from
   * @param quantity The quantity of credits to retire
   * @param options Additional retirement options
   * @returns The retirement record
   */
  async retireCredits(
    walletAddress: string,
    projectId: string,
    quantity: number,
    options?: {
      proofUrl?: string;
      autoOffset?: boolean;
      reportingPeriodStart?: Date;
      reportingPeriodEnd?: Date;
      beneficiary?: string;
      retirementMessage?: string;
    }
  ): Promise<Retirement> {
    // Get or create a wallet entry (ensure it exists for audit linkage)
    const wallet = await this.walletService.getOrCreateWallet(walletAddress);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Get the project
    const project = await this.tokenizedProjectService.getProjectById(
      projectId
    );
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if project has enough available credits
    if (project.available < quantity) {
      throw new Error(
        `Insufficient available credits. Project has ${project.available} but tried to retire ${quantity}`
      );
    }

    // Find the user's purchase for this project to get on-chain data
    const purchase = await this.purchaseRepository.findOne({
      where: { projectId: projectId },
      order: { createdAt: 'DESC' },
    });

    if (!purchase || !purchase.metadata) {
      throw new Error("No purchase found for this project. Cannot retire credits.");
    }

    const purchaseMetadata = purchase.metadata as any;
    const onChainData = project.onChainData as any;

    if (!purchaseMetadata.purchasePda || !purchaseMetadata.purchaseNftMint) {
      throw new Error("Purchase on-chain data not found.");
    }

    if (!onChainData || !onChainData.projectPda || !onChainData.tokenMint) {
      throw new Error("Project on-chain data not found.");
    }

    // Generate unique request ID for the offset
    const requestId = `OFFSET_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Execute the retirement on-chain (burn tokens and create offset request)
    const offsetResult = await this.solanaOnchainService.requestOffset({
      buyerPublicKey: walletAddress,
      purchasePda: purchaseMetadata.purchasePda,
      projectPda: onChainData.projectPda,
      purchaseNftMint: purchaseMetadata.purchaseNftMint,
      tokenMint: onChainData.tokenMint,
      amount: quantity,
      requestId,
    });

    console.log('✅ Offset completed on-chain:', offsetResult);

    // Update project available supply
    await this.tokenizedProjectService.updateProjectSupply(
      projectId,
      quantity,
      true // is retirement -> subtract available with validation
    );

    // Compute a public verification hash (deterministic from tx + project + qty)
    const publicHash = require("crypto")
      .createHash("sha256")
      .update(`${offsetResult.txHash}|${project.tokenId}|${quantity}`)
      .digest("hex");

    // Create retirement record with on-chain data
    const retirement = this.retirementRepository.create({
      walletId: wallet.id,
      tokenizedProjectId: project.id,
      quantity,
      txHash: offsetResult.txHash,
      publicHash,
      proofUrl: options?.proofUrl,
      autoOffset: options?.autoOffset || false,
      reportingPeriodStart: options?.reportingPeriodStart,
      reportingPeriodEnd: options?.reportingPeriodEnd,
      // Store on-chain offset data
      metadata: {
        offsetRequestPda: offsetResult.offsetRequestPda,
        newNftMint: offsetResult.newNftMint,
        requestId,
        onChainTxHash: offsetResult.txHash,
        beneficiary: options?.beneficiary,
        retirementMessage: options?.retirementMessage,
      } as any,
    });

    const savedRetirement = await this.retirementRepository.save(retirement);

    // Log the action
    await this.auditLogService.createAuditLog(
      wallet.id,
      "CREDIT_RETIRE",
      "retirements",
      savedRetirement.id,
      {
        projectId: project.id,
        quantity,
        txHash: offsetResult.txHash,
        beneficiary: options?.beneficiary,
        offsetRequestPda: offsetResult.offsetRequestPda,
        requestId,
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
