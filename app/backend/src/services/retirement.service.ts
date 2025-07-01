import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Retirement } from "../database/entities/Retirement";
import { TokenizedProject } from "../database/entities/TokenizedProject";
import { SolanaService } from "./solana.service";
import { WalletService } from "./wallet.service";
import { TokenizedProjectService } from "./tokenized-project.service";
import { AuditLogService } from "./audit-log.service";

export class RetirementService {
  private retirementRepository: Repository<Retirement>;
  private solanaService: SolanaService;
  private walletService: WalletService;
  private tokenizedProjectService: TokenizedProjectService;
  private auditLogService: AuditLogService;

  constructor() {
    this.retirementRepository = AppDataSource.getRepository(Retirement);
    this.solanaService = new SolanaService();
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
    // Get the wallet
    const wallet = await this.walletService.findByAddress(walletAddress);
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

    // Execute the retirement on-chain (burn tokens)
    const txHash = await this.solanaService.burnCredit(wallet.walletAddress, {
      tokenId: project.tokenId,
      amount: quantity,
      beneficiary: options?.beneficiary,
      retirementMessage: options?.retirementMessage,
    });

    // Update project available supply
    await this.tokenizedProjectService.updateProjectSupply(
      projectId,
      quantity,
      false // subtract from available
    );

    // Create retirement record
    const retirement = this.retirementRepository.create({
      walletId: wallet.id,
      tokenizedProjectId: project.id,
      quantity,
      txHash,
      proofUrl: options?.proofUrl,
      autoOffset: options?.autoOffset || false,
      reportingPeriodStart: options?.reportingPeriodStart,
      reportingPeriodEnd: options?.reportingPeriodEnd,
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
        txHash,
        beneficiary: options?.beneficiary,
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
