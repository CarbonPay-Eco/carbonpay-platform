import EnvManager from "../classes/envManager";

export const SERVER_PORT = EnvManager.getEnvOrThrow('SERVER_PORT') || 3333;
export const NODE_ENV = EnvManager.getEnvOrThrow('NODE_ENV') || 'development';
export const JWT_SECRET = EnvManager.getEnvOrThrow('JWT_SECRET') || 'your-secret-key';

// Postgres database connection info 
export const POSTGRES_USER = EnvManager.getEnvOrThrow('POSTGRES_USER');
export const POSTGRES_PASSWORD = EnvManager.getEnvOrThrow('POSTGRES_PASSWORD');
export const POSTGRES_DB = EnvManager.getEnvOrThrow('POSTGRES_DB');
export const POSTGRES_PORT = Number(EnvManager.getEnvOrThrow('POSTGRES_PORT'));
export const DB_HOST = EnvManager.getEnvOrThrow('DB_HOST');

// Solana
export const SOLANA_NETWORK = EnvManager.getEnvOrThrow('SOLANA_NETWORK');
export const SOLANA_PROGRAM_ID = EnvManager.getEnv('SOLANA_PROGRAM_ID') || '11111111111111111111111111111111';

// Encryption Configuration
export const ENCRYPTION_CONFIG = {
  // Default encryption algorithm
  DEFAULT_ALGORITHM: 'aes-256-gcm',
  
  // Key derivation function preferences
  DEFAULT_KDF: process.env.ENCRYPTION_KDF || 'scrypt',
  
  // Password requirements
  MIN_PASSWORD_LENGTH: parseInt(process.env.MIN_PASSWORD_LENGTH || '12'),
  REQUIRE_STRONG_PASSWORDS: process.env.REQUIRE_STRONG_PASSWORDS !== 'false',
  
  // Scrypt parameters (recommended for new encryptions)
  SCRYPT_N: parseInt(process.env.SCRYPT_N || '16384'), // CPU cost
  SCRYPT_R: parseInt(process.env.SCRYPT_R || '8'),     // Memory cost
  SCRYPT_P: parseInt(process.env.SCRYPT_P || '1'),     // Parallelization
  
  // PBKDF2 parameters (for backward compatibility)
  PBKDF2_ITERATIONS: parseInt(process.env.PBKDF2_ITERATIONS || '100000'),
  
  // Buffer sizes
  SALT_SIZE: 32,
  IV_SIZE: 16,
  AUTH_TAG_SIZE: 16,
  KEY_SIZE: 32,
  
  // Security settings
  CLEAR_MEMORY_AFTER_USE: process.env.CLEAR_MEMORY_AFTER_USE !== 'false',
  ENCRYPTION_VERSION: '1.0',
} as const;

// Encryption error messages
export const ENCRYPTION_ERRORS = {
  WEAK_PASSWORD: 'Password does not meet security requirements',
  INVALID_ENCRYPTED_DATA: 'Invalid or corrupted encrypted data',
  DECRYPTION_FAILED: 'Failed to decrypt private key - incorrect password or corrupted data',
  ENCRYPTION_FAILED: 'Failed to encrypt private key',
  WALLET_NOT_FOUND: 'Wallet not found',
  UNSUPPORTED_VERSION: 'Unsupported encryption version',
  UNSUPPORTED_KDF: 'Unsupported key derivation function',
} as const;