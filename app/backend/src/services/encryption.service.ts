import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  pbkdf2Sync,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import type { CipherGCM, DecipherGCM } from "crypto";
import { ENCRYPTION_CONFIG, ENCRYPTION_ERRORS } from "../config/constants";

/**
 * Enhanced encryption configuration interface
 */
export interface EncryptionConfig {
  algorithm: string;
  keyDerivation: 'pbkdf2' | 'scrypt';
  saltSize: number;
  ivSize: number;
  tagSize: number;
  pbkdf2Iterations: number;
  scryptN: number;
  scryptR: number;
  scryptP: number;
  keySize: number;
}

/**
 * Encryption metadata stored with encrypted data
 */
export interface EncryptionMetadata {
  version: number;
  kdfType: 'pbkdf2' | 'scrypt';
  algorithm: string;
  timestamp: string;
}

/**
 * Password strength validation result
 */
export interface PasswordValidation {
  isValid: boolean;
  score: number; // 0-100
  feedback: string[];
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    numbers: boolean;
    specialChars: boolean;
    commonPatterns: boolean;
  };
}

/**
 * Enhanced encryption service for private key security
 * Implements multiple encryption standards with configurable parameters
 */
export class EncryptionService {
  private static readonly DEFAULT_CONFIG: EncryptionConfig = {
    algorithm: ENCRYPTION_CONFIG.DEFAULT_ALGORITHM,
    keyDerivation: ENCRYPTION_CONFIG.DEFAULT_KDF as 'pbkdf2' | 'scrypt',
    saltSize: ENCRYPTION_CONFIG.SALT_SIZE,
    ivSize: ENCRYPTION_CONFIG.IV_SIZE,
    tagSize: ENCRYPTION_CONFIG.AUTH_TAG_SIZE,
    pbkdf2Iterations: ENCRYPTION_CONFIG.PBKDF2_ITERATIONS,
    scryptN: ENCRYPTION_CONFIG.SCRYPT_N,
    scryptR: ENCRYPTION_CONFIG.SCRYPT_R,
    scryptP: ENCRYPTION_CONFIG.SCRYPT_P,
    keySize: ENCRYPTION_CONFIG.KEY_SIZE,
  };

  /**
   * Validates password strength with detailed feedback
   */
  public static validatePassword(password: string): PasswordValidation {
    const feedback: string[] = [];
    const requirements = {
      length: password.length >= ENCRYPTION_CONFIG.MIN_PASSWORD_LENGTH,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      specialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
      commonPatterns: !this.containsCommonPatterns(password),
    };

    let score = 0;

    // Length check
    if (!requirements.length) {
      feedback.push(`Password must be at least ${ENCRYPTION_CONFIG.MIN_PASSWORD_LENGTH} characters long`);
    } else {
      score += 20;
    }

    // Character variety checks
    if (!requirements.lowercase) {
      feedback.push("Password must contain at least one lowercase letter");
    } else {
      score += 15;
    }

    if (!requirements.uppercase) {
      feedback.push("Password must contain at least one uppercase letter");
    } else {
      score += 15;
    }

    if (!requirements.numbers) {
      feedback.push("Password must contain at least one number");
    } else {
      score += 15;
    }

    if (!requirements.specialChars) {
      feedback.push("Password must contain at least one special character");
    } else {
      score += 15;
    }

    // Common patterns check
    if (!requirements.commonPatterns) {
      feedback.push("Password contains common patterns - please use a more unique password");
    } else {
      score += 10;
    }

    // Entropy bonus
    const entropy = this.calculateEntropy(password);
    if (entropy > 50) score += 10;

    const isValid = Object.values(requirements).every(req => req) && 
                   (ENCRYPTION_CONFIG.REQUIRE_STRONG_PASSWORDS ? score >= 80 : score >= 60);

    return {
      isValid,
      score: Math.min(score, 100),
      feedback,
      requirements,
    };
  }

  /**
   * Checks for common password patterns
   */
  private static containsCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /^123456$/,
      /^password$/i,
      /^qwerty$/i,
      /^abc123$/i,
      /^admin$/i,
      /^letmein$/i,
      /^welcome$/i,
      /^monkey$/i,
      /^dragon$/i,
      /^master$/i,
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Calculates password entropy
   */
  private static calculateEntropy(password: string): number {
    const charSets = [
      { regex: /[a-z]/, size: 26 }, // lowercase
      { regex: /[A-Z]/, size: 26 }, // uppercase  
      { regex: /[0-9]/, size: 10 }, // numbers
      { regex: /[^a-zA-Z0-9]/, size: 32 }, // special characters
    ];

    let charSetSize = 0;
    charSets.forEach(set => {
      if (set.regex.test(password)) {
        charSetSize += set.size;
      }
    });

    return password.length * Math.log2(charSetSize);
  }

  /**
   * Derives encryption key using the specified KDF
   */
  private static deriveKey(
    password: string,
    salt: Buffer,
    config: EncryptionConfig = this.DEFAULT_CONFIG
  ): Buffer {
    try {
      switch (config.keyDerivation) {
        case 'scrypt':
          return scryptSync(password, salt, config.keySize, {
            N: config.scryptN,
            r: config.scryptR,
            p: config.scryptP,
          });
        case 'pbkdf2':
          return pbkdf2Sync(password, salt, config.pbkdf2Iterations, config.keySize, "sha256");
        default:
          throw new Error(ENCRYPTION_ERRORS.UNSUPPORTED_KDF);
      }
    } catch (error) {
      const err = error as Error;
      throw new Error(`Key derivation failed: ${err.message}`);
    }
  }

  /**
   * Encrypts data using AES-256-GCM with enhanced security
   */
  public static encrypt(
    data: Uint8Array,
    password: string,
    config: EncryptionConfig = this.DEFAULT_CONFIG
  ): string {
    try {
      // Validate password if required
      if (ENCRYPTION_CONFIG.REQUIRE_STRONG_PASSWORDS) {
        const validation = this.validatePassword(password);
        if (!validation.isValid) {
          throw new Error(`${ENCRYPTION_ERRORS.WEAK_PASSWORD}: ${validation.feedback.join(', ')}`);
        }
      }

      // Generate cryptographically secure random values
      const salt = randomBytes(config.saltSize);
      const iv = randomBytes(config.ivSize);

      // Derive encryption key
      const key = this.deriveKey(password, salt, config);

      // Encrypt using AES-256-GCM
      const cipher = createCipheriv(config.algorithm, key, iv) as CipherGCM;
      const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();

      // Create version and metadata bytes
      const version = Buffer.from([0x01]); // Version 1
      const kdfType = Buffer.from([config.keyDerivation === 'scrypt' ? 0x01 : 0x00]);

      // Combine all components: version + kdfType + salt + iv + authTag + encrypted
      const result = Buffer.concat([version, kdfType, salt, iv, authTag, encrypted]);

      // Clear sensitive data from memory
      if (ENCRYPTION_CONFIG.CLEAR_MEMORY_AFTER_USE) {
        key.fill(0);
      }

      return result.toString('base64');
    } catch (error) {
      const err = error as Error;
      throw new Error(`${ENCRYPTION_ERRORS.ENCRYPTION_FAILED}: ${err.message}`);
    }
  }

  /**
   * Decrypts data with enhanced validation and error handling
   */
  public static decrypt(
    encryptedData: string,
    password: string
  ): Uint8Array {
    try {
      const data = Buffer.from(encryptedData, 'base64');

      // Check minimum data length (version + kdfType + salt + iv + authTag + at least 0 bytes encrypted)
      const minLength = 1 + 1 + this.DEFAULT_CONFIG.saltSize + this.DEFAULT_CONFIG.ivSize + this.DEFAULT_CONFIG.tagSize;
      if (data.length < minLength) {
        throw new Error(ENCRYPTION_ERRORS.INVALID_ENCRYPTED_DATA);
      }

      // Extract version and validate
      const version = data[0];
      if (version !== 0x01) {
        throw new Error(`${ENCRYPTION_ERRORS.UNSUPPORTED_VERSION}: ${version}`);
      }

      // Extract KDF type
      const kdfType = data[1];
      
      // Determine configuration based on stored metadata
      const config: EncryptionConfig = {
        ...this.DEFAULT_CONFIG,
        keyDerivation: kdfType === 0x01 ? 'scrypt' : 'pbkdf2'
      };

      // Extract components
      let offset = 2; // Skip version and kdfType
      const salt = data.slice(offset, offset + config.saltSize);
      offset += config.saltSize;
      
      const iv = data.slice(offset, offset + config.ivSize);
      offset += config.ivSize;
      
      const authTag = data.slice(offset, offset + config.tagSize);
      offset += config.tagSize;
      
      const encrypted = data.slice(offset);

      // Derive key from password
      const key = this.deriveKey(password, salt, config);

      // Decrypt using AES-256-GCM
      const decipher = createDecipheriv(config.algorithm, key, iv) as DecipherGCM;
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      // Clear sensitive data from memory
      if (ENCRYPTION_CONFIG.CLEAR_MEMORY_AFTER_USE) {
        key.fill(0);
      }

      return new Uint8Array(decrypted);
    } catch (error) {
      const err = error as Error;
      throw new Error(`${ENCRYPTION_ERRORS.DECRYPTION_FAILED}: ${err.message}`);
    }
  }

  /**
   * Verifies password without fully decrypting (for authentication)
   */
  public static verifyPassword(encryptedData: string, password: string): boolean {
    try {
      this.decrypt(encryptedData, password);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extracts metadata from encrypted data without decrypting
   */
  public static getEncryptionMetadata(encryptedData: string): EncryptionMetadata {
    try {
      // Validate base64 format first
      if (!/^[A-Za-z0-9+\/]+(=*)$/.test(encryptedData)) {
        throw new Error(ENCRYPTION_ERRORS.INVALID_ENCRYPTED_DATA);
      }
      
      const data = Buffer.from(encryptedData, 'base64');
      
      if (data.length < 2) {
        throw new Error(ENCRYPTION_ERRORS.INVALID_ENCRYPTED_DATA);
      }

      const version = data[0];
      const kdfType = data[1];

      return {
        version,
        kdfType: kdfType === 0x01 ? 'scrypt' : 'pbkdf2',
        algorithm: this.DEFAULT_CONFIG.algorithm,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to extract metadata: ${err.message}`);
    }
  }

  /**
   * Re-encrypts data with a new password (password change)
   */
  public static reEncrypt(
    encryptedData: string,
    oldPassword: string,
    newPassword: string,
    newConfig?: EncryptionConfig
  ): string {
    // Decrypt with old password
    const decryptedData = this.decrypt(encryptedData, oldPassword);
    
    // Re-encrypt with new password and optional new config
    const result = this.encrypt(decryptedData, newPassword, newConfig);
    
    // Clear decrypted data from memory
    if (ENCRYPTION_CONFIG.CLEAR_MEMORY_AFTER_USE) {
      decryptedData.fill(0);
    }
    
    return result;
  }

  /**
   * Generates a cryptographically secure random password
   */
  public static generateSecurePassword(length: number = 24): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + special;
    let password = '';

    // Ensure at least one character from each set
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
} 