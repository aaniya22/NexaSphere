// server/services/backupStorage.ts
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';

export interface BackupStorageConfig {
  endpoint: string;
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  bucketName: string;
}

export class BackupStorageService {
  private client: S3Client;
  private bucket: string;

  constructor(config: BackupStorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: config.credentials,
      // For R2/B2 compatibility
      forcePathStyle: true,
    });
    this.bucket = config.bucketName;
  }

  /**
   * Uploads the backup file to the configured S3-compatible bucket.
   */
  async uploadBackup(filePath: string): Promise<string> {
    const fileContent = await fs.readFile(filePath);
    const fileName = path.basename(filePath);
    const objectKey = `backups/${fileName}`;

    console.log(`Uploading ${fileName} to bucket ${this.bucket}...`);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: fileContent,
    });

    await this.client.send(command);
    console.log(`Upload complete: s3://${this.bucket}/${objectKey}`);
    return objectKey;
  }

  /**
   * Cleans up expired backups based on the retention policy:
   * - Keep daily backups for 30 days
   * - Keep weekly backups for 12 weeks
   * - Keep monthly backups for 12 months
   */
  async applyRetentionPolicy(): Promise<void> {
    console.log('Applying retention policy...');
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: 'backups/',
    });

    const response = await this.client.send(command);
    if (!response.Contents) return;

    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    for (const object of response.Contents) {
      if (!object.Key || !object.LastModified) continue;

      const ageInDays = (now.getTime() - object.LastModified.getTime()) / msPerDay;
      const isDaily = ageInDays <= 30;
      const isWeekly = ageInDays <= 84 && object.LastModified.getDay() === 0; // Sunday
      const isMonthly = ageInDays <= 365 && object.LastModified.getDate() === 1; // 1st of month

      const shouldKeep = isDaily || isWeekly || isMonthly;

      if (!shouldKeep) {
        console.log(`Deleting expired backup: ${object.Key} (Age: ${Math.round(ageInDays)} days)`);
        await this.client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: object.Key,
          })
        );
      }
    }
  }
}
