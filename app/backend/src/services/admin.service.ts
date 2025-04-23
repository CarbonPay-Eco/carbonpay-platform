import { WalletService } from './wallet.service';
import { AuditLogService } from './audit-log.service';
import { TokenizedProjectService } from './tokenized-project.service';
import { RetirementService } from './retirement.service';

export class AdminService {
  private walletService: WalletService;
  private auditLogService: AuditLogService;
  private tokenizedProjectService: TokenizedProjectService;
  private retirementService: RetirementService;
  
  // List of admin wallet addresses - in a production app, this would be configurable or stored in the database
  private adminWallets = [
    'AdminWallet123456789',
    'AdminWallet987654321'
  ];
  
  constructor() {
    this.walletService = new WalletService();
    this.auditLogService = new AuditLogService();
    this.tokenizedProjectService = new TokenizedProjectService();
    this.retirementService = new RetirementService();
  }

  /**
   * Check if a wallet address has admin rights
   * @param walletAddress The wallet address to check
   * @returns True if the wallet has admin rights
   */
  async isAdmin(walletAddress: string): Promise<boolean> {
    // First check if the wallet has "admin" role in the database
    const hasAdminRole = await this.walletService.hasRole(walletAddress, 'admin');
    
    if (hasAdminRole) {
      return true;
    }
    
    // Fall back to the hardcoded list of admin wallets
    return this.adminWallets.includes(walletAddress);
  }

  /**
   * Create an audit log entry from controller
   * @param walletAddress The wallet address performing the action
   * @param action The action performed
   * @param metadata Additional metadata about the action
   */
  async createAuditLog(
    walletAddress: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get or create the wallet
      const wallet = await this.walletService.getOrCreateWallet(walletAddress);
      
      // Create the audit log using the wallet ID
      await this.auditLogService.createAuditLog(
        wallet.id,
        action,
        'system',
        wallet.id,
        metadata
      );
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Not throwing the error to prevent disrupting the main flow
    }
  }

  /**
   * Get all audit logs
   * @returns All audit logs
   */
  async getAuditLogs() {
    return this.auditLogService.getAllAuditLogs();
  }

  /**
   * Get all projects with admin-specific data
   * @returns All projects
   */
  async getAdminProjects() {
    return this.tokenizedProjectService.getAllProjects();
  }

  /**
   * Get all retirements
   * @returns All retirements
   */
  async getAllRetirements() {
    return this.retirementService.getAllRetirements();
  }

  /**
   * Set a wallet as admin by updating its role
   * @param adminWalletAddress The wallet address of the admin making the change
   * @param targetWalletAddress The wallet address to set as admin
   * @returns The updated wallet
   */
  async setWalletAsAdmin(adminWalletAddress: string, targetWalletAddress: string) {
    // Verify the requesting wallet is an admin
    const isRequestingWalletAdmin = await this.isAdmin(adminWalletAddress);
    
    if (!isRequestingWalletAdmin) {
      throw new Error('Only admins can set other wallets as admin');
    }
    
    // Get the target wallet
    const adminWallet = await this.walletService.findByAddress(adminWalletAddress);
    const targetWallet = await this.walletService.getOrCreateWallet(targetWalletAddress);
    
    // Update the target wallet's role
    const updatedWallet = await this.walletService.setWalletRole(targetWallet.id, 'admin');
    
    // Log the action
    if (adminWallet) {
      await this.auditLogService.createAuditLog(
        adminWallet.id,
        'SET_ADMIN_ROLE',
        'wallets',
        targetWallet.id,
        { targetWallet: targetWalletAddress }
      );
    }
    
    return updatedWallet;
  }
} 