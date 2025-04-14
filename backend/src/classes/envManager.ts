import * as dotenv from 'dotenv';

dotenv.config();

/**
 * The `EnvManager` class provides methods to retrieve environment variables in TypeScript.
 * It allows you to get environment variables with optional fallback values and throw errors if required variables are missing.
 */
export default class EnvManager {
    static getEnv(key: string) {
        return process.env[key];
    }
    static getEnvOrThrow(key: string) {
        const value = this.getEnv(key);
        if (!value) {
            throw new Error(`Environment variable ${key} is not set.`);
        }
        return value;
    }
}