import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { TokenizedProject } from '../database/entities/TokenizedProject';
import { SolanaService } from './solana.service';
import { WalletService } from './wallet.service';
import { AuditLogService } from './audit-log.service';

export class TokenizedProjectService {
  private tokenizedProjectRepository: Repository<TokenizedProject>;
  private solanaService: SolanaService;
  private walletService: WalletService;
  private auditLogService: AuditLogService;

  constructor() {
    this.tokenizedProjectRepository = AppDataSource.getRepository(TokenizedProject);
    this.solanaService = new SolanaService();
    this.walletService = new WalletService();
    this.auditLogService = new AuditLogService();
  }

  /**
   * Create a new tokenized project
   * @param walletAddress The admin wallet address creating the project
   * @param projectData The project data
   * @returns The created project
   */
  async createProject(walletAddress: string, projectData: Partial<TokenizedProject>): Promise<TokenizedProject> {
    // Get wallet entity
    const wallet = await this.walletService.getOrCreateWallet(walletAddress);
    
    // Check if token ID already exists
    if (projectData.tokenId) {
      const existingProject = await this.tokenizedProjectRepository.findOne({
        where: { tokenId: projectData.tokenId }
      });
      
      if (existingProject) {
        throw new Error(`Project with token ID ${projectData.tokenId} already exists`);
      }
    }
    
    // Interact with Solana to mint the token
    const mintResult = await this.solanaService.mintCredit(walletAddress, {
      project: projectData.projectName || '',
      vintage: projectData.vintageYear ? projectData.vintageYear.toString() : '',
      standard: projectData.certificationBody || '',
      amount: projectData.totalIssued || 0,
      metadata: {
        location: projectData.location,
        description: projectData.description,
        methodology: projectData.methodology
      }
    });
    
    // Create the project entity
    const project = this.tokenizedProjectRepository.create({
      ...projectData,
      tokenId: projectData.tokenId || `CP-${Date.now()}`,
      available: projectData.totalIssued, // Initially, all issued tokens are available
      onChainMintTx: mintResult,
      status: 'available'
    });
    
    const savedProject = await this.tokenizedProjectRepository.save(project);
    
    // Log the action
    await this.auditLogService.createAuditLog(
      wallet.id,
      'PROJECT_CREATE',
      'tokenized_projects',
      savedProject.id,
      { project: savedProject }
    );
    
    return savedProject;
  }

  /**
   * Get all projects
   * @returns List of all projects
   */
  async getAllProjects(): Promise<TokenizedProject[]> {
    return this.tokenizedProjectRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get project by ID or token ID
   * @param id Project ID or token ID
   * @returns The project or null if not found
   */
  async getProjectById(id: string): Promise<TokenizedProject | null> {
    return this.tokenizedProjectRepository.findOne({
      where: [{ id }, { tokenId: id }]
    });
  }

  /**
   * Update project supply
   * @param id Project ID or token ID
   * @param amount Amount to adjust
   * @param isRetirement Whether the adjustment is due to a retirement
   * @returns The updated project
   */
  async updateProjectSupply(id: string, amount: number, isRetirement: boolean): Promise<TokenizedProject | null> {
    const project = await this.getProjectById(id);
    
    if (!project) {
      return null;
    }
    
    // If it's a retirement, reduce the available supply
    if (isRetirement) {
      if (project.available < amount) {
        throw new Error('Insufficient supply for retirement');
      }
      
      project.available -= amount;
      
      // Update status if no more credits available
      if (project.available === 0) {
        project.status = 'sold_out';
      }
    } else {
      // If it's adding more supply
      project.totalIssued += amount;
      project.available += amount;
    }
    
    return this.tokenizedProjectRepository.save(project);
  }

  /**
   * Get projects with available tokens
   * @returns List of projects with available tokens
   */
  async getAvailableProjects(): Promise<TokenizedProject[]> {
    return this.tokenizedProjectRepository.find({
      where: { status: 'available' },
      order: { createdAt: 'DESC' }
    });
  }
} 