import { v4 as uuidv4 } from 'uuid';
import { Project } from '../types';
import { SolanaService } from './solana.service';

// Placeholder for database in memory
const projects: Project[] = [];

export class ProjectService {
  private solanaService: SolanaService;

  constructor() {
    this.solanaService = new SolanaService();
  }

  async createProject(data: Partial<Project>, walletAddress: string): Promise<Project> {
    // Interact with Solana to mint new token
    const mintResult = await this.solanaService.mintCredit(walletAddress, {
      project: data.name || '',
      vintage: data.vintage || '',
      standard: data.standard || '',
      amount: data.totalSupply || 0,
      metadata: data.metadata || {},
    });

    const newProject: Project = {
      id: uuidv4(),
      name: data.name || '',
      description: data.description || '',
      location: data.location || '',
      vintage: data.vintage || '',
      standard: data.standard || '',
      tokenId: data.tokenId || mintResult, // In real implementation, this would come from the mint result
      totalSupply: data.totalSupply || 0,
      remainingSupply: data.totalSupply || 0,
      certificationUrl: data.certificationUrl,
      imageUrl: data.imageUrl,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real application, this would save to a database
    projects.push(newProject);
    
    return newProject;
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