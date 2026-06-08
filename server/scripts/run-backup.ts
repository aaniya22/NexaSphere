// server/scripts/run-backup.ts
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { BackupStorageService } from '../services/backupStorage';
import { BackupVerifierService } from '../services/backupVerifier';

const execAsync = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('Starting automated backup process...');

  const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME } =
    process.env;

  if (!S3_ENDPOINT || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET_NAME) {
    console.error('Error: Missing S3 configuration environment variables.');
    process.exit(1);
  }

  const config = {
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
    bucketName: S3_BUCKET_NAME,
  };

  const storageService = new BackupStorageService(config);
  const verifierService = new BackupVerifierService(config);

  try {
    // 1. Run the bash script to dump, compress, and encrypt
    const scriptPath = path.resolve(__dirname, '../../scripts/backup-database.sh');
    const { stdout, stderr } = await execAsync(scriptPath);

    if (stderr) {
      console.log('Script output:', stderr);
    }

    const backupFilePath = stdout.trim();
    if (!backupFilePath.endsWith('.enc')) {
      throw new Error(`Unexpected output from backup script: ${backupFilePath}`);
    }

    // 2. Upload to S3
    const objectKey = await storageService.uploadBackup(backupFilePath);

    // 3. Verify upload
    const isValid = await verifierService.verifyUpload(objectKey, backupFilePath);
    if (!isValid) {
      throw new Error('Upload verification failed. Checksums or sizes do not match.');
    }

    // 4. Apply retention policy
    await storageService.applyRetentionPolicy();

    console.log('Automated backup process completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Backup process failed:', error);
    process.exit(1);
  }
}

run();
