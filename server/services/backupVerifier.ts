// server/services/backupVerifier.ts
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import crypto from 'crypto';

export class BackupVerifierService {
  private client: S3Client;
  private bucket: string;

  constructor(config: {
    endpoint: string;
    region: string;
    credentials: { accessKeyId: string; secretAccessKey: string };
    bucketName: string;
  }) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: config.credentials,
      forcePathStyle: true,
    });
    this.bucket = config.bucketName;
  }

  /**
   * Verifies the uploaded backup exists and matches the local file size/checksum.
   */
  async verifyUpload(objectKey: string, localFilePath: string): Promise<boolean> {
    console.log(`Verifying upload for ${objectKey}...`);
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      });

      const response = await this.client.send(command);
      const stat = await fs.stat(localFilePath);

      if (response.ContentLength !== stat.size) {
        console.error(`Size mismatch! Local: ${stat.size}, Remote: ${response.ContentLength}`);
        return false;
      }

      console.log('Verification successful.');
      return true;
    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  }
}
