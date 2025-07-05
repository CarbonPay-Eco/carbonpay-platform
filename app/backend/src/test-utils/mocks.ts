import { jest } from "@jest/globals";
import { Keypair } from "@solana/web3.js";
import * as jwt from "jsonwebtoken";

// Mock Solana dependencies
export const mockSolanaKeypair = {
  publicKey: {
    toBase58: jest.fn(() => "mockPublicKey123"),
  },
  secretKey: new Uint8Array(64),
};

export const mockSolanaConnection = {
  requestAirdrop: jest.fn(),
  confirmTransaction: jest.fn(),
  getBalance: jest.fn(),
  sendTransaction: jest.fn(),
};

// Mock JWT functions
export const mockJWT = {
  sign: jest.fn((payload: any) => "mock-jwt-token"),
  verify: jest.fn((token: string) => ({ userId: "test-user-id" })),
};

// Mock WalletService
export const mockWalletService = {
  createWallet: jest.fn(),
  getKeypair: jest.fn(() => Promise.resolve(mockSolanaKeypair)),
  encryptPrivateKey: jest.fn(),
  decryptPrivateKey: jest.fn(),
};

// Mock bcrypt
export const mockBcrypt = {
  hash: jest.fn((password: string) => Promise.resolve("hashedPassword")),
  compare: jest.fn((password: string, hash: string) => Promise.resolve(true)),
};

// Mock environment variables
export const mockEnvVars = {
  JWT_SECRET: "test-secret",
  DB_HOST: "localhost",
  DB_PORT: "5432",
  NODE_ENV: "test",
};

// Setup all mocks
export const setupMocks = () => {
  // Mock environment variables
  Object.entries(mockEnvVars).forEach(([key, value]) => {
    process.env[key] = value;
  });

  // Mock Solana Keypair
  jest.doMock("@solana/web3.js", () => ({
    Keypair: {
      generate: jest.fn(() => mockSolanaKeypair),
      fromSecretKey: jest.fn(() => mockSolanaKeypair),
    },
    Connection: jest.fn(() => mockSolanaConnection),
    LAMPORTS_PER_SOL: 1000000000,
  }));

  // Mock JWT
  jest.doMock("jsonwebtoken", () => mockJWT);

  // Mock bcrypt
  jest.doMock("bcryptjs", () => mockBcrypt);
};

// Clear all mocks
export const clearMocks = () => {
  jest.clearAllMocks();
  jest.resetModules();
};

// Test data factories
export const createTestUser = (overrides: Partial<any> = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  passwordHash: "hashedPassword",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestWallet = (overrides: Partial<any> = {}) => ({
  id: "test-wallet-id",
  userId: "test-user-id",
  publicKey: "mockPublicKey123",
  encryptedPrivateKey: "encryptedPrivateKey",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestOrganization = (overrides: Partial<any> = {}) => ({
  id: "test-org-id",
  walletId: "test-wallet-id",
  companyName: "Test Company",
  registrationNumber: "12345",
  sustainabilityCertifications: ["cert1", "cert2"],
  tracksEmissions: true,
  emissionSources: ["source1", "source2"],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestProject = (overrides: Partial<any> = {}) => ({
  id: "test-project-id",
  ownerWalletId: "test-wallet-id",
  name: "Test Carbon Project",
  description: "A test carbon credit project",
  totalCredits: 1000,
  pricePerToken: 1000000,
  carbonPayFee: 500,
  nftMint: "nft-mint-address",
  tokenMint: "token-mint-address",
  uri: "https://example.com/metadata",
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
}); 