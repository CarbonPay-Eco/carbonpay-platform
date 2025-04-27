import { Project } from '../types';
import { TokenizedProject } from '../database/entities/TokenizedProject';
import { SolanaService } from './solana.service';
import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';

// Placeholder for database in memory
const projects: Project[] = [];

export class ProjectService {
  private solanaService: SolanaService;
  private projectRepository: Repository<TokenizedProject>;

  constructor() {
    this.solanaService = new SolanaService();
    this.projectRepository = AppDataSource.getRepository(TokenizedProject); // Initialize the repository
  }

  async createProject(data: Partial<TokenizedProject>, walletAddress: string): Promise<TokenizedProject> {
    // Interact with Solana to mint new token
    const mintResult = await this.solanaService.mintCredit(walletAddress, {
      project: data.projectName || '',
      vintage: data.vintageYear?.toString() || '',
      standard: data.standard || '',
      amount: data.totalIssued || 0,
      metadata: { tags: data.tags || [] },
    });

    // Create a new project entity
    const newProject = this.projectRepository.create({
      tokenId: mintResult,
      projectName: data.projectName || '',
      location: data.location || '',
      description: data.description || '',
      certificationBody: data.certificationBody || '',
      projectRefId: data.projectRefId || '',
      methodology: data.methodology || '',
      verifierName: data.verifierName || '',
      vintageYear: data.vintageYear || new Date().getFullYear(),
      totalIssued: data.totalIssued || 0,
      available: data.totalIssued || 0, 
      pricePerTon: data.pricePerTon || 0,
      ipfsHash: data.ipfsHash || '',
      documentationUrl: data.documentationUrl || '',
      onChainMintTx: mintResult,
      status: 'available',
      projectImageUrl: data.projectImageUrl || '',
      tags: data.tags || [],
    });

    // Save the project to the database
    const savedProject = await this.projectRepository.save(newProject);

    return savedProject;
  }

  async getAllProjects(): Promise<Project[]> {
    return projects;
  }

  async getProjectById(id: string): Promise<Project | null> {
    const project = projects.find(p => p.id === id || p.tokenId === id);
    return project || null;
  }

  async updateProjectSupply(id: string, amount: number, isRetirement: boolean): Promise<Project | null> {
    const projectIndex = projects.findIndex(p => p.id === id || p.tokenId === id);
    
    if (projectIndex === -1) return null;
    
    const project = projects[projectIndex];
    
    // If it's a retirement, reduce the remaining supply
    if (isRetirement) {
      if (project.remainingSupply < amount) {
        throw new Error('Insufficient supply for retirement');
      }
      
      project.remainingSupply -= amount;
    } else {
      // If it's adding more supply
      project.totalSupply += amount;
      project.remainingSupply += amount;
    }
    
    project.updatedAt = new Date();
    projects[projectIndex] = project;
    
    return project;
  }
} 