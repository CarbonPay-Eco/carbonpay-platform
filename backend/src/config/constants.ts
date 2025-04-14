import EnvManager from "../classes/envManager";

export const PORT = EnvManager.getEnvOrThrow('PORT') || 3333;
export const NODE_ENV = EnvManager.getEnvOrThrow('NODE_ENV') || 'development';
export const JWT_SECRET = EnvManager.getEnvOrThrow('JWT_SECRET') || 'your-secret-key'; 
export const DB_USER = EnvManager.getEnvOrThrow('DB_USER');
export const DB_HOST = EnvManager.getEnvOrThrow('DB_HOST');
export const DB_NAME = EnvManager.getEnvOrThrow('DB_NAME');
export const DB_PASSWORD = EnvManager.getEnvOrThrow('DB_PASSWORD');
export const DB_PORT = Number(EnvManager.getEnvOrThrow('DB_PORT'));