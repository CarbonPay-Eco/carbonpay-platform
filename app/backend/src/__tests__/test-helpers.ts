import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';

export const mockRepository = () => {
  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };
  return repo as unknown as Repository<any>;
};

export const setupRepositoryMock = (entityName: string) => {
  const repository = mockRepository();
  jest.spyOn(AppDataSource, 'getRepository').mockReturnValue(repository);
  return repository;
};

export const mockSolanaService = () => ({
  connection: {
    getTokenAccountBalance: jest.fn(),
  },
  verifySignature: jest.fn(),
  mintCredits: jest.fn(),
  burnCredits: jest.fn(),
});

export const mockWalletService = () => ({
  findByAddress: jest.fn(),
  getOrCreateWallet: jest.fn(),
  getWalletByAddress: jest.fn(),
});

export const mockAuditLogService = () => ({
  createAuditLog: jest.fn(),
});

export const mockTokenizedProjectService = () => ({
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
}); 