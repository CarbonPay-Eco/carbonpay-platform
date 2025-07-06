import { SolanaService } from '../../services/solana.service';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { WalletSignature } from '../../types/solana';

// Mock dependencies first
jest.mock('tweetnacl', () => ({
  sign: {
    detached: {
      verify: jest.fn()
    }
  }
}));

jest.mock('bs58', () => ({
  decode: jest.fn().mockImplementation((value) => new Uint8Array([1, 2, 3]))
}));

// Mock @project-serum/anchor
jest.mock('@project-serum/anchor', () => ({
  Program: jest.fn(),
  AnchorProvider: jest.fn(),
  web3: {
    SystemProgram: {
      programId: 'mock-program-id'
    }
  }
}));

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => {
  const mockConnectionInstance = {
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: 'mock-blockhash',
      lastValidBlockHeight: 123456789
    })
  };

  return {
    Connection: jest.fn().mockImplementation(() => mockConnectionInstance),
    PublicKey: jest.fn().mockImplementation((value) => ({
      _bn: new Uint8Array([1, 2, 3]),
      toBytes: () => new Uint8Array([1, 2, 3]),
      toString: () => value || 'mock-public-key'
    })),
    clusterApiUrl: jest.fn().mockImplementation((network) => `https://api.${network}.solana.com`)
  };
});

describe('SolanaService', () => {
  let solanaService: SolanaService;
  let originalEnv: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env.SOLANA_NETWORK;
  });

  afterEach(() => {
    process.env.SOLANA_NETWORK = originalEnv;
  });

  describe('verifySignature', () => {
    beforeEach(() => {
      process.env.SOLANA_NETWORK = 'devnet';
      solanaService = new SolanaService();
    });

    it('should verify valid signature', async () => {
      const mockSignatureData: WalletSignature = {
        signature: 'test signature',
        address: 'test-address',
        message: 'test message'
      };

      (bs58.decode as jest.Mock).mockImplementation((input) => {
        if (input === mockSignatureData.signature) return new Uint8Array([1, 2, 3]);
        if (input === mockSignatureData.address) return new Uint8Array([4, 5, 6]);
        return new Uint8Array();
      });

      (nacl.sign.detached.verify as jest.Mock).mockReturnValue(true);

      const result = await solanaService.verifySignature(mockSignatureData);

      expect(result).toBe(true);
      expect(bs58.decode).toHaveBeenCalledWith(mockSignatureData.signature);
      expect(nacl.sign.detached.verify).toHaveBeenCalled();
    });

    it('should return false for invalid signature', async () => {
      const mockSignatureData: WalletSignature = {
        signature: 'invalid signature',
        address: 'test-address',
        message: 'test message'
      };

      (nacl.sign.detached.verify as jest.Mock).mockReturnValue(false);

      const result = await solanaService.verifySignature(mockSignatureData);

      expect(result).toBe(false);
    });
  });

  describe('connection', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    it('should initialize connection with devnet for non-mainnet environment', () => {
      process.env.SOLANA_NETWORK = 'devnet';
      const { Connection } = require('@solana/web3.js');
      const SolanaService = require('../../services/solana.service').SolanaService;
      new SolanaService();
      expect(Connection).toHaveBeenCalledWith(
        'https://api.devnet.solana.com',
        'confirmed'
      );
    });

    it('should initialize connection with mainnet for mainnet environment', () => {
      process.env.SOLANA_NETWORK = 'mainnet';
      const { Connection } = require('@solana/web3.js');
      const SolanaService = require('../../services/solana.service').SolanaService;
      new SolanaService();
      expect(Connection).toHaveBeenCalledWith(
        'https://api.mainnet-beta.solana.com',
        'confirmed'
      );
    });
  });

  // Add more tests for mintCredits and burnCredits methods if they are implemented
  // These would likely involve mocking Program interactions and transaction building
}); 