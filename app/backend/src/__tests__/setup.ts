import { DataSource } from 'typeorm';
import { AppDataSource } from '../database/data-source';

// Mock TypeORM's AppDataSource
jest.mock('../database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SOLANA_NETWORK = 'devnet';
process.env.SOLANA_PROGRAM_ID = 'DummyProgramIdForTesting11111111111111111111111';
process.env.SERVER_PORT = '3000';
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
process.env.USDC_MINT_ADDRESS = 'test-usdc-mint';
process.env.POSTGRES_USER = 'test-user';
process.env.POSTGRES_PASSWORD = 'test-password';
process.env.POSTGRES_DB = 'test-db';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';
process.env.DB_HOST = 'localhost';

// Mock Solana dependencies
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue(1000000),
    getRecentBlockhash: jest.fn().mockResolvedValue({
      blockhash: 'mock-blockhash',
      lastValidBlockHeight: 1000
    })
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toString: () => key,
    toBase58: () => key
  })),
  Keypair: {
    generate: jest.fn().mockReturnValue({
      publicKey: {
        toString: () => 'mock-public-key',
        toBase58: () => 'mock-public-key'
      },
      secretKey: new Uint8Array(32)
    })
  }
}));

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 