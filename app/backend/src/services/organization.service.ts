import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Organization } from '../database/entities/Organization';
import { WalletService } from './wallet.service';
import { AuditLogService } from './audit-log.service';

// Define a interface extendida para permitir acesso indexado
interface OrganizationWithIndex extends Organization {
  [key: string]: any;
}

export class OrganizationService {
  private organizationRepository: Repository<Organization>;
  private walletService: WalletService;
  private auditLogService: AuditLogService;

  constructor() {
    this.organizationRepository = AppDataSource.getRepository(Organization);
    this.walletService = new WalletService();
    this.auditLogService = new AuditLogService();
  }

  /**
   * Create a new organization
   * @param walletAddress The wallet address of the organization owner
   * @param data Organization data
   * @returns The created organization
   */
  async createOrganization(walletAddress: string, data: Partial<Organization>): Promise<Organization> {
    // Get or create the wallet
    const wallet = await this.walletService.getOrCreateWallet(walletAddress);
    
    // Check if organization already exists for this wallet
    const existingOrg = await this.organizationRepository.findOne({
      where: { walletId: wallet.id }
    });
    
    if (existingOrg) {
      throw new Error('An organization already exists for this wallet');
    }
    
    // Set wallet role to 'organization'
    await this.walletService.setWalletRole(wallet.id, 'organization');
    
    // Create the organization
    const organization = this.organizationRepository.create({
      ...data,
      walletId: wallet.id,
    });
    
    const savedOrg = await this.organizationRepository.save(organization);
    
    // Log the action
    await this.auditLogService.createAuditLog(
      wallet.id,
      'ORGANIZATION_CREATE',
      'organizations',
      savedOrg.id,
      { organization: savedOrg }
    );
    
    return savedOrg;
  }

  /**
   * Get organization by wallet address
   * @param walletAddress The wallet address
   * @returns The organization or null if not found
   */
  async getOrganizationByWallet(walletAddress: string): Promise<Organization | null> {
    const wallet = await this.walletService.findByAddress(walletAddress);
    console.log('Wallet:', wallet);
    
    if (!wallet) {
      return null;
    }
    
    return this.organizationRepository.findOne({
      where: { walletId: wallet.id },
      relations: ['wallet']
    });
  }

  /**
   * Update an organization
   * @param walletAddress The wallet address of the organization owner
   * @param data Organization data to update
   * @returns The updated organization
   */
  async updateOrganization(walletAddress: string, data: Partial<Organization>): Promise<Organization | null> {
    const wallet = await this.walletService.findByAddress(walletAddress);
    
    if (!wallet) {
      return null;
    }
    
    const organization = await this.organizationRepository.findOne({
      where: { walletId: wallet.id }
    });
    
    if (!organization) {
      return null;
    }
    
    // Update only allowed fields
    const updatableFields = [
      'companyName', 'country', 'registrationNumber', 'industryType',
      'companySize', 'description', 'tracksEmissions', 'emissionSources',
      'sustainabilityCertifications', 'priorOffsetting', 'contactEmail',
      'websiteUrl', 'acceptedTerms'
    ];
    
    const orgWithIndex = organization as OrganizationWithIndex;
    const dataWithIndex = data as Record<string, any>;
    
    updatableFields.forEach(field => {
      // Only update if field is provided and is different from current value
      if (field in data && dataWithIndex[field] !== undefined) {
        orgWithIndex[field] = dataWithIndex[field];
      }
    });
    
    const updatedOrg = await this.organizationRepository.save(organization);
    
    // Log the action
    await this.auditLogService.createAuditLog(
      wallet.id,
      'ORGANIZATION_UPDATE',
      'organizations',
      organization.id,
      { organization: updatedOrg }
    );
    
    return updatedOrg;
  }

  /**
   * Get all organizations
   * @returns List of all organizations
   */
  async getAllOrganizations(): Promise<Organization[]> {
    return this.organizationRepository.find({
      relations: ['wallet']
    });
  }
} 