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
export const SOLANA_PROGRAM_ID = EnvManager.getEnv('SOLANA_PROGRAM_ID') || 'bGiephq1pZ8kxJVumdgCMEa2BjCEJuviCSwHgL9rdfg';
export const SOLANA_RPC_URL = EnvManager.getEnv('SOLANA_RPC_URL') || 'http://127.0.0.1:8899';
export const SOLANA_SERVER_PRIVATE_KEY = EnvManager.getEnvOrThrow('SOLANA_SERVER_PRIVATE_KEY');
export const SOLANA_USDC_MINT = EnvManager.getEnv('SOLANA_USDC_MINT') || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // Mainnet USDC