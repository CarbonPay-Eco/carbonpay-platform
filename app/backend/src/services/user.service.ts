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

  // Get existing UserWallet created by AuthService
  private async getUserWallet(userId: string): Promise<UserWallet> {
    const userWallet = await this.userWalletRepository.findOneBy({
      userId: userId,
    });

    if (!userWallet) {
      throw new Error(
        "User wallet not found. This should have been created during registration."
      );
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

    // Get project details
    const project = await this.projectRepository.findOneBy({ id: projectId });
    if (!project) {
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
    const organization = await this.organizationRepository.findOne({
      where: { walletId: userWallet.id }
    });

    return {
      ...user,
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
