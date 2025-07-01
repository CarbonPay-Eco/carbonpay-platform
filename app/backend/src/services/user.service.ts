import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";
import { Organization } from "../database/entities/Organization";
import { TokenizedProject } from "../database/entities/TokenizedProject";
import { Wallet } from "../database/entities/Wallet";
import { Purchase } from "../database/entities/Purchase";
import { SolanaService } from "./solana.service";
import { AuditLogService } from "./audit-log.service";
import { WalletService } from "../services/WalletService";

export class UserService {
  private userRepository: Repository<User>;
  private organizationRepository: Repository<Organization>;
  private projectRepository: Repository<TokenizedProject>;
  private walletRepository: Repository<Wallet>;
  private purchaseRepository: Repository<Purchase>;
  private solanaService: SolanaService;
  private auditLogService: AuditLogService;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.organizationRepository = AppDataSource.getRepository(Organization);
    this.projectRepository = AppDataSource.getRepository(TokenizedProject);
    this.walletRepository = AppDataSource.getRepository(Wallet);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.solanaService = new SolanaService();
    this.auditLogService = new AuditLogService();
  }

  // Create organization data for user during registration
  async createUserOrganization(organizationData: any): Promise<Organization> {
    // Get or create wallet for the user
    const wallet = await this.getOrCreateUserWallet(organizationData.userId);

    // Create organization linked to the wallet
    const organization = this.organizationRepository.create({
      ...organizationData,
      walletId: wallet.id,
    });

    const savedOrganization = (await this.organizationRepository.save(
      organization
    )) as unknown as Organization;

    // Log the action
    await this.auditLogService.createAuditLog(
      wallet.id,
      "ORGANIZATION_CREATE",
      "organizations",
      savedOrganization.id,
      { organization: savedOrganization }
    );

    return savedOrganization;
  }

  // Get or create wallet for user (Web 2.5 - backend manages wallets)
  private async getOrCreateUserWallet(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOneBy({
      walletAddress: userId, // Using userId as wallet identifier for Web 2.5
    });

    if (!wallet) {
      // Create wallet automatically with system password
      const systemPassword =
        process.env.WALLET_ENCRYPTION_KEY || "default-system-password";

      // Create a wallet entry in our database
      wallet = this.walletRepository.create({
        walletAddress: `user_${userId}_${Date.now()}`, // Generate a unique address
        provider: "system",
        role: "user",
      });

      wallet = await this.walletRepository.save(wallet);
    }

    return wallet;
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
    const wallet = await this.getOrCreateUserWallet(userId);

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
      wallet.id,
      "BALANCE_ADD",
      "wallets",
      wallet.id,
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
    const wallet = await this.getOrCreateUserWallet(userId);

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
    const txHash = await this.solanaService.mintCredit(wallet.walletAddress, {
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
      wallet.id,
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
  async getUserProfile(userId: string): Promise<{
    email: string;
    fullName?: string;
    companyName?: string;
    organization?: Organization | null;
  }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error("User not found");
    }

    // Get organization data
    const wallet = await this.getOrCreateUserWallet(userId);
    const organization = await this.organizationRepository.findOneBy({
      walletId: wallet.id,
    });

    return {
      email: user.email,
      fullName: organization?.fullName,
      companyName: organization?.companyName,
      organization: organization || null,
    };
  }
}
