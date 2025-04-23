import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Retirement } from '../database/entities/Retirement';
import { SolanaService } from './solana.service';
import { WalletService } from './wallet.service';
import { TokenizedProjectService } from './tokenized-project.service';
import { AuditLogService } from './audit-log.service';

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
   * Retire carbon credits
   * @param walletAddress The wallet address retiring the credits
   * @param projectId The project ID or token ID
   * @param quantity The amount to retire
   * @param options Optional retirement options
   * @returns The created retirement record
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
    // Get wallet entity
    const wallet = await this.walletService.getOrCreateWallet(walletAddress);
    
    // Get project data to verify it exists and has enough supply
    const project = await this.tokenizedProjectService.getProjectById(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    if (project.available < quantity) {
      throw new Error('Insufficient supply for retirement');
    }
    
    // Interact with Solana to burn tokens
    const txHash = await this.solanaService.burnCredit(walletAddress, {
      tokenId: project.tokenId,
      amount: quantity,
      beneficiary: options?.beneficiary,
      retirementMessage: options?.retirementMessage
    });
    
    // Update project supply
    await this.tokenizedProjectService.updateProjectSupply(projectId, quantity, true);
    
    // Create retirement record
    const retirement = this.retirementRepository.create({
      walletId: wallet.id,
      tokenizedProjectId: project.id,
      quantity,
      txHash,
      proofUrl: options?.proofUrl,
      autoOffset: options?.autoOffset || false,
      reportingPeriodStart: options?.reportingPeriodStart,
      reportingPeriodEnd: options?.reportingPeriodEnd
    });
    
    const savedRetirement = await this.retirementRepository.save(retirement);
    
    // Log the action
    await this.auditLogService.createAuditLog(
      wallet.id,
      'CREDIT_RETIRE',
      'retirements',
      savedRetirement.id,
      {
        projectId: project.id,
        quantity,
        txHash,
        beneficiary: options?.beneficiary
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
      relations: ['wallet', 'tokenizedProject'],
      order: { retirementDate: 'DESC' }
    });
  }

  /**
   * Get retirements by organization wallet
   * @param walletAddress The organization wallet address
   * @returns List of retirements for the organization
   */
  async getRetirementsByOrganizationWallet(walletAddress: string): Promise<Retirement[]> {
    const wallet = await this.walletService.findByAddress(walletAddress);
    
    if (!wallet) {
      return [];
    }
    
    return this.retirementRepository.find({
      where: { walletId: wallet.id },
      relations: ['wallet', 'tokenizedProject'],
      order: { retirementDate: 'DESC' }
    });
  }

  /**
   * Get all retirements
   * @returns List of all retirements
   */
  async getAllRetirements(): Promise<Retirement[]> {
    return this.retirementRepository.find({
      relations: ['wallet', 'tokenizedProject'],
      order: { retirementDate: 'DESC' }
    });
  }
} 