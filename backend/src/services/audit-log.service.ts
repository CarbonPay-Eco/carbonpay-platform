import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { AuditLog } from '../database/entities/AuditLog';

export class AuditLogService {
  private auditLogRepository: Repository<AuditLog>;

  constructor() {
    this.auditLogRepository = AppDataSource.getRepository(AuditLog);
  }

  /**
   * Create an audit log entry
   * @param walletId The wallet ID performing the action
   * @param action The action performed
   * @param entityType The entity type affected
   * @param entityId The entity ID affected
   * @param metadata Additional details about the action
   * @returns The created audit log
   */
  async createAuditLog(
    walletId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      walletId,
      action,
      entityType,
      entityId,
      metadata,
      timestamp: new Date()
    });

    return this.auditLogRepository.save(auditLog);
  }

  /**
   * Get all audit logs
   * @param limit Limit the number of results
   * @param offset Offset for pagination
   * @returns Array of audit logs
   */
  async getAuditLogs(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['wallet']
    });
  }

  /**
   * Get all audit logs
   * @returns List of all audit logs
   */
  async getAllAuditLogs(): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      relations: ['wallet'],
      order: { timestamp: 'DESC' }
    });
  }

  /**
   * Get audit logs for a wallet
   * @param walletId The wallet ID
   * @returns List of audit logs for the wallet
   */
  async getAuditLogsByWallet(walletId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { walletId },
      relations: ['wallet'],
      order: { timestamp: 'DESC' }
    });
  }

  /**
   * Get audit logs by entity
   * @param entityType The entity type
   * @param entityId The entity ID
   * @returns List of audit logs for the entity
   */
  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      relations: ['wallet'],
      order: { timestamp: 'DESC' }
    });
  }
} 