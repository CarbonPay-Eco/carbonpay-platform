import { Project } from "../types";
import { TokenizedProject } from "../database/entities/TokenizedProject";
import { SolanaService } from "./solana.service";
import { SolanaOnchainService } from "./solana-onchain.service";
import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";

// Placeholder for database in memory
const projects: Project[] = [];

export class ProjectService {
  private solanaService: SolanaService;
  private solanaOnchainService: SolanaOnchainService;
  private projectRepository: Repository<TokenizedProject>;

  constructor() {
    this.solanaService = new SolanaService();
    this.solanaOnchainService = new SolanaOnchainService();
    this.projectRepository = AppDataSource.getRepository(TokenizedProject); // Initialize the repository
  }

  async createProject(
    data: Partial<TokenizedProject>,
    walletAddress: string
  ): Promise<TokenizedProject> {
    // Initialize project on-chain using the server wallet
    const onchainResult = await this.solanaOnchainService.initializeProject({
      projectName: data.projectName || "",
      projectSymbol: data.standard || "CRBN",
      projectUri: data.ipfsHash || `https://carbonpay.com/metadata/${Date.now()}`,
      amount: data.totalIssued || 0,
      pricePerToken: Math.floor((data.pricePerTon || 0) * 1_000_000), // Convert to micro-USDC
      carbonPayFee: 500, // 5% fee
    });

    console.log('✅ Project initialized on-chain:', onchainResult);

    // Create a new project entity with on-chain data
    const newProject = this.projectRepository.create({
      tokenId: onchainResult.nftMint,
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
      onChainMintTx: onchainResult.txHash,
      status: "available",
      projectImageUrl: data.projectImageUrl || "",
      tags: data.tags || [],
      // Store on-chain references
      onChainData: {
        projectPda: onchainResult.projectPda,
        nftMint: onchainResult.nftMint,
        tokenMint: onchainResult.tokenMint,
      } as any,
    });

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
