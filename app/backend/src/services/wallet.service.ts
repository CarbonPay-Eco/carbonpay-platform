import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Wallet } from '../database/entities/Wallet';
import { v4 as uuidv4 } from 'uuid';

export class WalletService {
  private walletRepository: Repository<Wallet>;

  constructor() {
    this.walletRepository = AppDataSource.getRepository(Wallet);
  }

  /**
   * Find a wallet by address
   * @param walletAddress The wallet address to look for
   * @returns The found wallet or null
   */
  async findByAddress(walletAddress: string): Promise<Wallet | null> {
    return this.walletRepository.findOne({ where: { walletAddress } });
  }

  /**
   * Get or create a wallet entry
   * @param walletAddress The wallet address
   * @param provider Optional wallet provider name
   * @returns The wallet entity
   */
  async getOrCreateWallet(walletAddress: string, provider?: string): Promise<Wallet> {
    // First check if the wallet already exists
    let wallet = await this.findByAddress(walletAddress);

    // If not, create a new one
    if (!wallet) {
      const newWallet = this.walletRepository.create({
        walletAddress,
        provider,
        createdAt: new Date()
      });
      
      wallet = await this.walletRepository.save(newWallet);
    }

    return wallet;
  }

  /**
   * Set the role for a wallet
   * @param walletId The wallet ID
   * @param role The role to set
   * @returns The updated wallet
   */
  async setWalletRole(walletId: string, role: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOneBy({ id: walletId });
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    
    wallet.role = role;
    return this.walletRepository.save(wallet);
  }

  /**
   * Check if a wallet has a specific role
   * @param walletAddress The wallet address to check
   * @param role The role to check for
   * @returns True if the wallet has the role
   */
  async hasRole(walletAddress: string, role: string): Promise<boolean> {
    const wallet = await this.findByAddress(walletAddress);
    return wallet?.role === role;
  }
} 