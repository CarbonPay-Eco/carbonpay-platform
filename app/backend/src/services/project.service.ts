import { Project } from "../types";
import { TokenizedProject } from "../database/entities/TokenizedProject";
import { AnchorService } from "./anchor.service";
import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { UserWallet } from "../entities/UserWallet";
import { PublicKey } from "@solana/web3.js";

export class ProjectService {
  private anchorService: AnchorService;
  private projectRepository: Repository<TokenizedProject>;
  private userWalletRepository: Repository<UserWallet>;

  constructor() {
    this.anchorService = new AnchorService();
    this.projectRepository = AppDataSource.getRepository(TokenizedProject);
    this.userWalletRepository = AppDataSource.getRepository(UserWallet);
  }

  /**
   * Get user wallet from userId, creating one if it doesn't exist
   */
  private async getUserWallet(userId: string): Promise<UserWallet> {
    let userWallet = await this.userWalletRepository.findOneBy({
      userId: userId,
    });

    // If wallet doesn't exist (e.g., user created via SQL), create one automatically
    if (!userWallet) {
      console.log(`Wallet not found for user ${userId}, creating one automatically...`);
      const { WalletService } = await import("./WalletService");
      // Use a default password for auto-created wallets (users created outside normal flow)
      // In production, users should reset their password after first login
      userWallet = await WalletService.createWallet(userId, "default-password-change-me");
      console.log(`Wallet created for user ${userId}: ${userWallet.publicKey}`);
    }

    return userWallet;
  }

  async createProject(
    data: Partial<TokenizedProject>,
    userId: string
  ): Promise<TokenizedProject> {
    // Get user wallet to get the public key
    const userWallet = await this.getUserWallet(userId);
    const projectOwner = new PublicKey(userWallet.publicKey);

    // Prepare metadata URI (can be IPFS hash or URL)
    const metadataUri = data.ipfsHash 
      ? `https://ipfs.io/ipfs/${data.ipfsHash}`
      : data.documentationUrl || `https://carbonpay.com/projects/${data.projectName?.toLowerCase().replace(/\s+/g, '-')}`;

    // Calculate price per token in micro-USDC (6 decimals)
    // pricePerTon is in USD, convert to micro-USDC (multiply by 1,000,000)
    const pricePerToken = Math.floor((data.pricePerTon || 0) * 1_000_000);

    // Carbon pay fee in basis points (e.g., 500 = 5%)
    const carbonPayFee = 500; // 5% default fee

    // Try to create project on-chain, but allow offline creation if RPC is unavailable
    let onChainResult: {
      tx: string;
      projectPDA: PublicKey;
      nftMint: PublicKey;
      tokenMint: PublicKey;
    } | null = null;
    try {
      onChainResult = await this.anchorService.initializeProject({
        projectOwner,
        amount: data.totalIssued || 0,
        pricePerToken,
        carbonPayFee,
        uri: metadataUri,
        name: data.projectName || "Carbon Project",
        symbol: data.standard?.substring(0, 6).toUpperCase() || "CARBON",
      });
      console.log("Project created on-chain successfully:", onChainResult.tx);
    } catch (error: any) {
      console.warn("Failed to create project on-chain (continuing offline):", error.message);
      // Continue with offline project creation
    }

    // Create a new project entity with on-chain data (if available)
    const projectData: Partial<TokenizedProject> = {
      tokenId: onChainResult 
        ? `CP-${Date.now()}-${onChainResult.projectPDA.toBase58().substring(0, 8)}`
        : `CP-${Date.now()}-OFFLINE`,
      projectName: data.projectName || "",
      location: data.location || "",
      description: data.description || "",
      certificationBody: data.certificationBody || "",
      projectRefId: data.projectRefId || "",
      methodology: data.methodology || "",
      verifierName: data.verifierName || "",
      vintageYear: data.vintageYear || new Date().getFullYear(),
      standard: data.standard || "",
      totalIssued: data.totalIssued || 0,
      available: data.totalIssued || 0,
      pricePerTon: data.pricePerTon || 0,
      ipfsHash: data.ipfsHash || "",
      documentationUrl: data.documentationUrl || "",
      onChainMintTx: onChainResult?.tx || "OFFLINE",
      projectPDA: onChainResult?.projectPDA.toBase58() || undefined,
      tokenMint: onChainResult?.tokenMint.toBase58() || undefined,
      nftMint: onChainResult?.nftMint.toBase58() || undefined,
      projectOwner: projectOwner.toBase58(),
      status: "available",
      projectImageUrl: data.projectImageUrl || "",
      tags: data.tags || [],
    };
    const newProject = this.projectRepository.create(projectData);

    // Save the project to the database
    const savedProject = await this.projectRepository.save(newProject);

    return savedProject;
  }

  async getAllProjects(): Promise<TokenizedProject[]> {
    // Get all projects from database
    return await this.projectRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async getAvailableProjects(): Promise<TokenizedProject[]> {
    // Get only projects with available supply > 0
    return await this.projectRepository
      .createQueryBuilder("project")
      .where("project.available > :minAvailable", { minAvailable: 0 })
      .andWhere("project.status = :status", { status: "available" })
      .orderBy("project.createdAt", "DESC")
      .getMany();
  }

  async getProjectById(id: string): Promise<Project | null> {
    const project = await this.projectRepository.findOne({
      where: [{ id }, { tokenId: id }]
    });
    return project;
  }

  async updateProjectSupply(projectId: string, amount: number, isRetirement: boolean): Promise<Project | null> {
    const project = await this.projectRepository.findOne({
      where: [{ id: projectId }, { tokenId: projectId }]
    });

    if (!project) {
      return null;
    }

    if (isRetirement) {
      if (project.available < amount) {
        throw new Error('Insufficient supply for retirement');
      }
      project.available -= amount;
      project.status = project.available === 0 ? 'sold_out' : 'available';
    } else {
      project.totalIssued += amount;
      project.available += amount;
    }

    return this.projectRepository.save(project);
  }
}
