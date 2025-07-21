import { EncryptionService, EncryptionConfig } from '../../services/encryption.service';
import { randomBytes } from 'crypto';

describe('EncryptionService', () => {
  const testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const strongPassword = 'TestPassword123!@#Strong';
  const weakPassword = 'weak';

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const validation = EncryptionService.validatePassword(strongPassword);
      
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThan(80);
      expect(validation.requirements.length).toBe(true);
      expect(validation.requirements.lowercase).toBe(true);
      expect(validation.requirements.uppercase).toBe(true);
      expect(validation.requirements.numbers).toBe(true);
      expect(validation.requirements.specialChars).toBe(true);
    });

    it('should reject weak passwords', () => {
      const validation = EncryptionService.validatePassword(weakPassword);
      
      expect(validation.isValid).toBe(false);
      expect(validation.score).toBeLessThan(60);
      expect(validation.feedback.length).toBeGreaterThan(0);
    });

    it('should detect common password patterns', () => {
      const commonPasswords = ['password123', 'admin123', 'qwerty123'];
      
      commonPasswords.forEach(password => {
        const validation = EncryptionService.validatePassword(password);
        expect(validation.requirements.commonPatterns).toBe(false);
      });
    });

    it('should require minimum length', () => {
      const shortPassword = 'Test123!';
      const validation = EncryptionService.validatePassword(shortPassword);
      
      expect(validation.requirements.length).toBe(false);
      expect(validation.feedback).toContain('Password must be at least 12 characters long');
    });

    it('should require character variety', () => {
      const tests = [
        { password: 'testpassword123!', missing: 'uppercase' },
        { password: 'TESTPASSWORD123!', missing: 'lowercase' },
        { password: 'TestPassword!@#', missing: 'numbers' },
        { password: 'TestPassword123', missing: 'specialChars' },
      ];

      tests.forEach(test => {
        const validation = EncryptionService.validatePassword(test.password);
        expect(validation.requirements[test.missing as keyof typeof validation.requirements]).toBe(false);
      });
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt data successfully', () => {
      const encrypted = EncryptionService.encrypt(testData, strongPassword);
      const decrypted = EncryptionService.decrypt(encrypted, strongPassword);
      
      expect(decrypted).toEqual(testData);
    });

    it('should fail decryption with wrong password', () => {
      const encrypted = EncryptionService.encrypt(testData, strongPassword);
      
      expect(() => {
        EncryptionService.decrypt(encrypted, 'WrongPassword123!');
      }).toThrow();
    });

    it('should generate different encrypted output for same input', () => {
      const encrypted1 = EncryptionService.encrypt(testData, strongPassword);
      const encrypted2 = EncryptionService.encrypt(testData, strongPassword);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same data
      const decrypted1 = EncryptionService.decrypt(encrypted1, strongPassword);
      const decrypted2 = EncryptionService.decrypt(encrypted2, strongPassword);
      
      expect(decrypted1).toEqual(testData);
      expect(decrypted2).toEqual(testData);
    });

    it('should handle large data encryption', () => {
      const largeData = new Uint8Array(10000);
      largeData.fill(42);
      
      const encrypted = EncryptionService.encrypt(largeData, strongPassword);
      const decrypted = EncryptionService.decrypt(encrypted, strongPassword);
      
      expect(decrypted).toEqual(largeData);
    });

    it('should handle empty data', () => {
      const emptyData = new Uint8Array(0);
      
      const encrypted = EncryptionService.encrypt(emptyData, strongPassword);
      const decrypted = EncryptionService.decrypt(encrypted, strongPassword);
      
      expect(decrypted).toEqual(emptyData);
    });
  });

  describe('Configuration-based Encryption', () => {
    const customConfig: EncryptionConfig = {
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      saltSize: 32,
      ivSize: 16,
      tagSize: 16,
      pbkdf2Iterations: 50000,
      scryptN: 8192,
      scryptR: 8,
      scryptP: 1,
      keySize: 32,
    };

    it('should work with custom PBKDF2 configuration', () => {
      const encrypted = EncryptionService.encrypt(testData, strongPassword, customConfig);
      const decrypted = EncryptionService.decrypt(encrypted, strongPassword);
      
      expect(decrypted).toEqual(testData);
    });

    it('should work with scrypt configuration', () => {
      const scryptConfig: EncryptionConfig = {
        ...customConfig,
        keyDerivation: 'scrypt',
      };
      
      const encrypted = EncryptionService.encrypt(testData, strongPassword, scryptConfig);
      const decrypted = EncryptionService.decrypt(encrypted, strongPassword);
      
      expect(decrypted).toEqual(testData);
    });
  });

  describe('Password Verification', () => {
    it('should verify correct password', () => {
      const encrypted = EncryptionService.encrypt(testData, strongPassword);
      const isValid = EncryptionService.verifyPassword(encrypted, strongPassword);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', () => {
      const encrypted = EncryptionService.encrypt(testData, strongPassword);
      const isValid = EncryptionService.verifyPassword(encrypted, 'WrongPassword123!');
      
      expect(isValid).toBe(false);
    });

    it('should handle invalid encrypted data format', () => {
      const isValid = EncryptionService.verifyPassword('invalid-base64-data', strongPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract encryption metadata', () => {
      const encrypted = EncryptionService.encrypt(testData, strongPassword);
      const metadata = EncryptionService.getEncryptionMetadata(encrypted);
      
      expect(metadata.version).toBe(1);
      expect(metadata.kdfType).toBe('scrypt'); // Default configuration
      expect(metadata.algorithm).toBe('aes-256-gcm');
      expect(metadata.timestamp).toBeDefined();
    });

    it('should handle invalid encrypted data for metadata', () => {
      expect(() => {
        EncryptionService.getEncryptionMetadata('invalid-data');
      }).toThrow();
    });

    it('should extract metadata for different KDF types', () => {
      const pbkdf2Config: EncryptionConfig = {
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2',
        saltSize: 32,
        ivSize: 16,
        tagSize: 16,
        pbkdf2Iterations: 100000,
        scryptN: 16384,
        scryptR: 8,
        scryptP: 1,
        keySize: 32,
      };

      const encrypted = EncryptionService.encrypt(testData, strongPassword, pbkdf2Config);
      const metadata = EncryptionService.getEncryptionMetadata(encrypted);
      
      expect(metadata.kdfType).toBe('pbkdf2');
    });
  });

  describe('Password Re-encryption', () => {
    it('should re-encrypt with new password', () => {
      const newPassword = 'NewStrongPassword456!@#';
      const encrypted = EncryptionService.encrypt(testData, strongPassword);
      
      const reEncrypted = EncryptionService.reEncrypt(encrypted, strongPassword, newPassword);
      
      // Should not decrypt with old password
      expect(() => {
        EncryptionService.decrypt(reEncrypted, strongPassword);
      }).toThrow();
      
      // Should decrypt with new password
      const decrypted = EncryptionService.decrypt(reEncrypted, newPassword);
      expect(decrypted).toEqual(testData);
    });

    it('should re-encrypt with new configuration', () => {
      const newPassword = 'NewStrongPassword456!@#';
      const newConfig: EncryptionConfig = {
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2',
        saltSize: 32,
        ivSize: 16,
        tagSize: 16,
        pbkdf2Iterations: 150000,
        scryptN: 16384,
        scryptR: 8,
        scryptP: 1,
        keySize: 32,
      };
      
      const encrypted = EncryptionService.encrypt(testData, strongPassword);
      const reEncrypted = EncryptionService.reEncrypt(encrypted, strongPassword, newPassword, newConfig);
      
      const metadata = EncryptionService.getEncryptionMetadata(reEncrypted);
      expect(metadata.kdfType).toBe('pbkdf2');
      
      const decrypted = EncryptionService.decrypt(reEncrypted, newPassword);
      expect(decrypted).toEqual(testData);
    });

    it('should fail re-encryption with wrong old password', () => {
      const newPassword = 'NewStrongPassword456!@#';
      const encrypted = EncryptionService.encrypt(testData, strongPassword);
      
      expect(() => {
        EncryptionService.reEncrypt(encrypted, 'WrongOldPassword123!', newPassword);
      }).toThrow();
    });
  });

  describe('Secure Password Generation', () => {
    it('should generate password with correct length', () => {
      const password = EncryptionService.generateSecurePassword(20);
      expect(password.length).toBe(20);
    });

    it('should generate password with default length', () => {
      const password = EncryptionService.generateSecurePassword();
      expect(password.length).toBe(24);
    });

    it('should generate passwords that pass validation', () => {
      const password = EncryptionService.generateSecurePassword();
      const validation = EncryptionService.validatePassword(password);
      
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThan(80);
    });

    it('should generate different passwords each time', () => {
      const password1 = EncryptionService.generateSecurePassword();
      const password2 = EncryptionService.generateSecurePassword();
      
      expect(password1).not.toBe(password2);
    });

    it('should include all character types', () => {
      const password = EncryptionService.generateSecurePassword();
      
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted encrypted data', () => {
      const encrypted = EncryptionService.encrypt(testData, strongPassword);
      const corrupted = encrypted.slice(0, -10) + 'corrupted';
      
      expect(() => {
        EncryptionService.decrypt(corrupted, strongPassword);
      }).toThrow();
    });

    it('should handle invalid base64 data', () => {
      expect(() => {
        EncryptionService.decrypt('invalid-base64-!@#', strongPassword);
      }).toThrow();
    });

    it('should handle too short encrypted data', () => {
      const shortData = Buffer.from('short').toString('base64');
      
      expect(() => {
        EncryptionService.decrypt(shortData, strongPassword);
      }).toThrow();
    });

    it('should handle unsupported version', () => {
      // Create fake encrypted data with unsupported version
      const fakeData = Buffer.alloc(70);
      fakeData[0] = 0xFF; // Unsupported version
      const fakeEncrypted = fakeData.toString('base64');
      
      expect(() => {
        EncryptionService.decrypt(fakeEncrypted, strongPassword);
      }).toThrow('Unsupported encryption version');
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle both scrypt and pbkdf2 encrypted data', () => {
      const scryptConfig: EncryptionConfig = {
        algorithm: 'aes-256-gcm',
        keyDerivation: 'scrypt',
        saltSize: 32,
        ivSize: 16,
        tagSize: 16,
        pbkdf2Iterations: 100000,
        scryptN: 16384,
        scryptR: 8,
        scryptP: 1,
        keySize: 32,
      };

      const pbkdf2Config: EncryptionConfig = {
        ...scryptConfig,
        keyDerivation: 'pbkdf2',
      };

      const scryptEncrypted = EncryptionService.encrypt(testData, strongPassword, scryptConfig);
      const pbkdf2Encrypted = EncryptionService.encrypt(testData, strongPassword, pbkdf2Config);

      // Both should decrypt correctly
      const scryptDecrypted = EncryptionService.decrypt(scryptEncrypted, strongPassword);
      const pbkdf2Decrypted = EncryptionService.decrypt(pbkdf2Encrypted, strongPassword);

      expect(scryptDecrypted).toEqual(testData);
      expect(pbkdf2Decrypted).toEqual(testData);

      // Metadata should reflect the correct KDF
      const scryptMetadata = EncryptionService.getEncryptionMetadata(scryptEncrypted);
      const pbkdf2Metadata = EncryptionService.getEncryptionMetadata(pbkdf2Encrypted);

      expect(scryptMetadata.kdfType).toBe('scrypt');
      expect(pbkdf2Metadata.kdfType).toBe('pbkdf2');
    });
  });

  describe('Performance Tests', () => {
    it('should complete encryption/decryption within reasonable time', () => {
      const start = Date.now();
      
      const encrypted = EncryptionService.encrypt(testData, strongPassword);
      const decrypted = EncryptionService.decrypt(encrypted, strongPassword);
      
      const duration = Date.now() - start;
      
      expect(decrypted).toEqual(testData);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => {
        const data = new Uint8Array([i, i + 1, i + 2]);
        const password = `TestPassword${i}123!@#`;
        
        return async () => {
          const encrypted = EncryptionService.encrypt(data, password);
          const decrypted = EncryptionService.decrypt(encrypted, password);
          return { original: data, decrypted };
        };
      });

      const results = await Promise.all(operations.map(op => op()));
      
      results.forEach(result => {
        expect(result.decrypted).toEqual(result.original);
      });
    });
  });
}); 