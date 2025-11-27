import { Project } from "../types";
import { TokenizedProject } from "../database/entities/TokenizedProject";
import { AnchorService } from "./anchor.service";
import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { UserWallet } from "../entities/UserWallet";
import { PublicKey, Keypair } from "@solana/web3.js";

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
      // Use server master password for consistency (derived from JWT_SECRET + userId)
      const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
      const serverMasterKey = process.env.SERVER_WALLET_MASTER_KEY;
      const serverPassword = serverMasterKey 
        ? `${serverMasterKey}-${userId}` 
        : `${jwtSecret}-${userId}`;
      userWallet = await WalletService.createWallet(userId, serverPassword);
      console.log(`Wallet created for user ${userId}: ${userWallet.publicKey}`);
    }

    return userWallet;
  }

  async createProject(
    data: Partial<TokenizedProject>,
    userId: string
  ): Promise<TokenizedProject> {
    // Get user wallet - MUST use user's wallet as project owner
    const userWallet = await this.getUserWallet(userId);
    
    // Get user's keypair for signing the transaction
    // This will throw an error if decryption fails - wallet must be recreated
    const { WalletService } = await import("./WalletService");
    const projectOwnerKeypair = await WalletService.getKeypairByUserId(userId);
    
    // Always use the user's wallet as project owner
    const projectOwner = projectOwnerKeypair.publicKey;
    
    // Verify the keypair matches the stored public key
    if (projectOwner.toBase58() !== userWallet.publicKey) {
      throw new Error(
        `Wallet public key mismatch for user ${userId}. ` +
        `Stored: ${userWallet.publicKey}, Decrypted: ${projectOwner.toBase58()}. ` +
        `Please run 'npm run migrate:wallets' to fix this.`
      );
    }
    
    console.log(`Using user wallet ${projectOwner.toBase58()} as project owner signer`);

    // Prepare metadata URI (can be IPFS hash or URL)
    const metadataUri = data.ipfsHash 
      ? `https://ipfs.io/ipfs/${data.ipfsHash}`
      : data.documentationUrl || `https://carbonpay.com/projects/${data.projectName?.toLowerCase().replace(/\s+/g, '-')}`;

    // Calculate price per token in micro-USDC (6 decimals)
    // pricePerTon is in USD, convert to micro-USDC (multiply by 1,000,000)
    const pricePerToken = Math.floor((data.pricePerTon || 0) * 1_000_000);

    // Carbon pay fee in basis points (e.g., 500 = 5%)
    const carbonPayFee = 500; // 5% default fee


    // Create project on-chain - this will throw if it fails
    // We want to fail fast rather than creating offline projects
    let onChainResult: {
      tx: string;
      projectPDA: PublicKey;
      nftMint: PublicKey;
      tokenMint: PublicKey;
    };
    
    try {
      // Token Metadata Program has a 32 character limit for the name field
      // Truncate the project name if it's too long
      const maxNameLength = 32;
      const projectName = data.projectName || "Carbon Project";
      const truncatedName = projectName.length > maxNameLength 
        ? projectName.substring(0, maxNameLength - 3) + "..."
        : projectName;

      onChainResult = await this.anchorService.initializeProject({
        projectOwner,
        projectOwnerKeypair, // REQUIRED: User's keypair for signing
        amount: data.totalIssued || 0,
        pricePerToken,
        carbonPayFee,
        uri: metadataUri,
        name: truncatedName,
        symbol: data.standard?.substring(0, 6).toUpperCase() || "CARBON",
      });
      console.log("Project created on-chain successfully:", onChainResult.tx);
    } catch (error: any) {
      console.error("Failed to create project on-chain:", error);
      throw new Error(`Failed to create project on-chain: ${error.message}`);
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
      onChainMintTx: onChainResult.tx,
      projectPDA: onChainResult.projectPDA.toBase58(),
      tokenMint: onChainResult.tokenMint.toBase58(),
      nftMint: onChainResult.nftMint.toBase58(),
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
