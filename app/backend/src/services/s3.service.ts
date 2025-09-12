import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export interface S3Document {
  key: string;
  contentType: string;
  size?: number;
  lastModified?: Date;
}

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'carbonpay-documents';
    
    // Log credentials for debugging (only first half for security)
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    
    console.log('S3Service initialization:');
    console.log('Bucket:', this.bucketName);
    console.log('Region:', process.env.AWS_REGION || 'us-east-1');
    console.log('Access Key ID (first half):', accessKeyId ? accessKeyId.substring(0, accessKeyId.length / 2) : 'NOT_SET');
    console.log('Secret Key (first half):', secretAccessKey ? secretAccessKey.substring(0, secretAccessKey.length / 2) : 'NOT_SET');
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Upload a document to S3
   */
  async uploadDocument(
    key: string,
    content: Buffer | string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<S3Document> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: content,
        ContentType: contentType,
        Metadata: metadata,
        CacheControl: 'public, max-age=31536000', // 1 year cache
      });

      await this.s3Client.send(command);

      const document = {
        key,
        contentType,
        size: Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content, 'utf8'),
        lastModified: new Date(),
      };

      // Log successful upload
      console.log('📤 Document uploaded to S3:');
      console.log('  Bucket:', this.bucketName);
      console.log('  Key:', key);
      console.log('  Content-Type:', contentType);
      console.log('  Size:', document.size, 'bytes');

      return document;
    } catch (error) {
      console.error('Error uploading document to S3:');
      console.error('Bucket:', this.bucketName);
      console.error('Key:', key);
      console.error('Region:', process.env.AWS_REGION);
      console.error('Error details:', error);
      throw new Error(`Failed to upload document to S3: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a document exists in S3
   */
  async documentExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a signed URL for a document (valid for 1 hour)
   */
  async getDocumentUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      // Log the S3 URL for debugging
      console.log('🔗 S3 URL Generated:');
      console.log('  Bucket:', this.bucketName);
      console.log('  Key:', key);
      console.log('  URL:', signedUrl.substring(0, 100) + '...');
      console.log('  Expires in:', expiresIn, 'seconds');
      
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate document URL');
    }
  }

  /**
   * Get document metadata
   */
  async getDocumentMetadata(key: string): Promise<S3Document | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      return {
        key,
        contentType: response.ContentType || 'application/octet-stream',
        size: response.ContentLength,
        lastModified: response.LastModified,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a unique key for a document
   */
  generateDocumentKey(type: 'certificate' | 'report', id: string, format: 'pdf' | 'html' | 'csv'): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `documents/${type}/${timestamp}/${id}.${format}`;
  }

  /**
   * Generate a key for retirement certificate
   */
  generateRetirementCertificateKey(retirementId: string, format: 'pdf' | 'html'): string {
    return this.generateDocumentKey('certificate', `retirement-${retirementId}`, format);
  }

  /**
   * Generate a key for user report
   */
  generateUserReportKey(userId: string, reportType: 'retirements' | 'purchases'): string {
    return this.generateDocumentKey('report', `user-${userId}-${reportType}`, 'csv');
  }
}

// Singleton instance
export const s3Service = new S3Service();
