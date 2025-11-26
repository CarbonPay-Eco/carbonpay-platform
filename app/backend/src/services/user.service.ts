import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";
import { Organization } from "../database/entities/Organization";
import { TokenizedProject } from "../database/entities/TokenizedProject";
import { UserWallet } from "../entities/UserWallet";
import { Purchase } from "../database/entities/Purchase";
import { SolanaService } from "./solana.service";
import { AuditLogService } from "./audit-log.service";
import { WalletService } from './wallet.service';

export class UserService {
  private userRepository: Repository<User>;
  private organizationRepository: Repository<Organization>;
  private projectRepository: Repository<TokenizedProject>;
  private userWalletRepository: Repository<UserWallet>;
  private purchaseRepository: Repository<Purchase>;
  private solanaService: SolanaService;
  private auditLogService: AuditLogService;
  private walletService: WalletService;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.organizationRepository = AppDataSource.getRepository(Organization);
    this.projectRepository = AppDataSource.getRepository(TokenizedProject);
    this.userWalletRepository = AppDataSource.getRepository(UserWallet);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.solanaService = new SolanaService();
    this.auditLogService = new AuditLogService();
    this.walletService = new WalletService();
  }

  // Create organization data for user during registration
  async createUserOrganization(organizationData: any): Promise<Organization> {
    // Get the existing UserWallet created by AuthService
    const userWallet = await this.getUserWallet(organizationData.userId);

    // Create organization linked to the user wallet
    const organization = this.organizationRepository.create({
      ...organizationData,
      walletId: userWallet.id,
    });

    const savedOrganization = (await this.organizationRepository.save(
      organization
    )) as unknown as Organization;

    // Log the action
    await this.auditLogService.createAuditLog(
      userWallet.id,
      "ORGANIZATION_CREATE",
      "organizations",
      savedOrganization.id,
      { organization: savedOrganization }
    );

    return savedOrganization;
  }

  // Get existing UserWallet created by AuthService, creating one if it doesn't exist
  private async getUserWallet(userId: string): Promise<UserWallet> {
    let userWallet = await this.userWalletRepository.findOneBy({
      userId: userId,
    });

    // If wallet doesn't exist (e.g., user created via SQL), create one automatically
    if (!userWallet) {
      console.log(`Wallet not found for user ${userId}, creating one automatically...`);
      // Use a default password for auto-created wallets (users created outside normal flow)
      // In production, users should reset their password after first login
      userWallet = await WalletService.createWallet(userId, "default-password-change-me");
      console.log(`Wallet created for user ${userId}: ${userWallet.publicKey}`);
    }

    return userWallet;
  }

  // Add balance to user account (placeholder for payment integration)
  async addBalance(
    userId: string,
    amount: number,
    paymentMethod: string
  ): Promise<{
    transactionId: string;
    newBalance: number;
  }> {
    const userWallet = await this.getUserWallet(userId);

    // TODO: Implement actual payment processing
    // For now, simulate by just updating balance in database

    // Update wallet balance (assuming we add a balance field to Wallet entity)
    // This is a placeholder - in production you'd integrate with payment processors
    const transactionId = `txn_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // TODO: Update actual wallet balance in database
    // For now, just return simulated data
    const newBalance = 1000 + amount; // Placeholder logic

    // Log the action
    await this.auditLogService.createAuditLog(
      userWallet.id,
      "BALANCE_ADD",
      "user_wallets",
      userWallet.id,
      { amount, paymentMethod, transactionId }
    );

    return {
      transactionId,
      newBalance,
    };
  }

  // Purchase carbon credits using account balance
  async purchaseCredits(
    userId: string,
    projectId: string,
    quantity: number
  ): Promise<{
    id: string;
    totalCost: number;
    txHash: string;
    remainingBalance: number;
  }> {
    const userWallet = await this.getUserWallet(userId);

    // Get project details, handling UUID, token_id, and project_ref_id
    // Check if projectId looks like a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(projectId);

    let project;
    
    if (isUuid) {
      // If it's a UUID, try matching by ID first, then fallback to other fields
      // Cast UUID to text for comparison to avoid type mismatch in OR conditions
      project = await this.projectRepository
        .createQueryBuilder("project")
        .where("CAST(project.id AS TEXT) = :projectId", { projectId })
        .orWhere("project.token_id = :projectId", { projectId })
        .orWhere("project.projectRefId = :projectId", { projectId })
        .getOne();
    } else {
      // If it's not a UUID, only match against token_id and project_ref_id
      project = await this.projectRepository
        .createQueryBuilder("project")
        .where("project.token_id = :projectId", { projectId })
        .orWhere("project.projectRefId = :projectId", { projectId })
        .getOne();
    }

    if (!project) {
      console.error(`Project not found with ID: ${projectId}`);
      console.error(`Available projects: ${await this.projectRepository
        .createQueryBuilder("project")
        .select("project.id")
        .addSelect("project.token_id")
        .addSelect("project.projectRefId")
        .getMany()
        .then(projects => JSON.stringify(projects, null, 2))
      }`);
      throw new Error("Project not found");
    }

    // Check if enough credits available
    if (project.available < quantity) {
      throw new Error("Insufficient credits available");
    }

    // Calculate total cost using pricePerTon instead of pricePerCredit
    const totalCost = quantity * project.pricePerTon;

    // TODO: Check user balance and deduct
    // For now, simulate the purchase

    // Execute onchain transaction (mint credits to user's wallet)
    const txHash = await this.solanaService.mintCredit(userWallet.publicKey, {
      project: project.projectName,
      vintage: project.vintageYear.toString(),
      standard: project.certificationBody,
      amount: quantity,
      metadata: {
        location: project.location,
        description: project.description,
        methodology: project.methodology,
      },
    });

    // Update project availability
    project.available -= quantity;
    await this.projectRepository.save(project);

    // Create purchase record
    const purchase = this.purchaseRepository.create({
      userId,
      projectId,
      quantity,
      pricePerCredit: project.pricePerTon, // Using pricePerTon
      totalCost,
      txHash,
      status: "completed",
    });

    const savedPurchase = await this.purchaseRepository.save(purchase);

    // Log the action
    await this.auditLogService.createAuditLog(
      userWallet.id,
      "CREDITS_PURCHASE",
      "purchases",
      savedPurchase.id,
      { projectId, quantity, totalCost, txHash }
    );

    return {
      id: savedPurchase.id,
      totalCost,
      txHash,
      remainingBalance: 1000 - totalCost, // Placeholder
    };
  }

  // Get user profile information
  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      return null;
    }

    // Get organization data
    const userWallet = await this.getUserWallet(userId);
    if (!userWallet) {
      throw new Error("User wallet not found");
    }

    const organization = await this.organizationRepository.findOne({
      where: { walletId: userWallet.id }
    });

    // Return user profile without sensitive data
    const { passwordHash, ...userWithoutPassword } = user;
    
    return {
      ...userWithoutPassword,
      organization
    };
  }

  // Get user purchases with project details
  async getUserPurchases(userId: string): Promise<Purchase[]> {
    const purchases = await this.purchaseRepository.find({
      where: { userId },
      relations: ["project"],
      order: { createdAt: "DESC" },
    });

    return purchases;
  }
}
