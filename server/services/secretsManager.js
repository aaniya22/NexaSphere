import fs from 'fs';
import logger from '../utils/logger.js';
import { appContext } from '../config/appContext.js';

const VAULT_SECRETS_PATH = process.env.VAULT_SECRETS_PATH || 'vault-secrets.json';

class SecretsManager {
  constructor() {
    this.secrets = {};
    this.rotationMetadata = {};
    this.loadSecrets();
  }

  loadSecrets() {
    const env = process.env.NODE_ENV || 'development';
    
    // Default fallback secrets if vault-secrets.json doesn't exist
    if (!fs.existsSync(VAULT_SECRETS_PATH)) {
      console.warn(`Vault file not found at ${VAULT_SECRETS_PATH}. Initializing with defaults for ${env}...`);
      const defaultSecrets = {
        development: {
          JWT_SECRET: 'nexasphere-jwt-dev-secret-change-in-production',
          DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/nexasphere_dev',
          CORS_ORIGIN: 'http://localhost:5175',
          MONITORING_API_TOKEN: 'dev-monitoring-token-12345'
        },
        production: {
          JWT_SECRET: 'super-secret-jwt-key-for-prod',
          DATABASE_URL: 'postgresql://admin:prod-pass@prod-db:5432/nexasphere_prod',
          CORS_ORIGIN: 'https://nexasphere.example.com',
          MONITORING_API_TOKEN: 'prod-monitoring-token-98765'
        }
      };

      const meta = {};
      const now = new Date().toISOString();
      const currentEnvSecrets = defaultSecrets[env] || defaultSecrets.development;
      
      for (const key of Object.keys(currentEnvSecrets)) {
        meta[key] = {
          lastRotated: now,
          version: 1
        };
      }

      const fileData = {
        environment: env,
        secrets: currentEnvSecrets,
        metadata: meta
      };

      fs.writeFileSync(VAULT_SECRETS_PATH, JSON.stringify(fileData, null, 2));
    }

    try {
      const data = JSON.parse(fs.readFileSync(VAULT_SECRETS_PATH, 'utf8'));
      this.secrets = data.secrets || {};
      this.rotationMetadata = data.metadata || {};
      this.environment = data.environment || env;
      console.log(`Successfully loaded ${Object.keys(this.secrets).length} secrets from Vault store for environment: ${this.environment}`);
    } catch (err) {
      console.error('Failed to parse secrets vault:', err.message);
    }
  }

  getSecret(key) {
    const store = appContext.getStore();
    const reqId = store?.reqId || 'SYSTEM';
    
    // Audit secret access
    const auditMsg = `[Secrets Audit] Secret "${key}" accessed by reqId: ${reqId} in environment: ${this.environment}`;
    console.log(auditMsg);
    logger.info(auditMsg, { key, reqId, environment: this.environment });

    const secret = this.secrets[key] || process.env[key];

    if (secret) {
      // Check rotation age (90 days = quarterly)
      const meta = this.rotationMetadata[key];
      if (meta && meta.lastRotated) {
        const ageInMs = Date.now() - new Date(meta.lastRotated).getTime();
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
        if (ageInDays > 90) {
          const warnMsg = `[Secrets WARNING] Secret "${key}" has not been rotated in ${Math.round(ageInDays)} days! Quarterly rotation is required.`;
          console.warn(warnMsg);
          logger.warn(warnMsg, { key, ageInDays });
        }
      }
    }

    return secret;
  }

  checkAllSecretsAge() {
    const report = [];
    const now = Date.now();
    for (const [key, meta] of Object.entries(this.rotationMetadata)) {
      const ageInMs = now - new Date(meta.lastRotated).getTime();
      const ageInDays = Math.round(ageInMs / (1000 * 60 * 60 * 24));
      report.push({
        key,
        ageInDays,
        needsRotation: ageInDays > 90,
        lastRotated: meta.lastRotated
      });
    }
    return report;
  }
}

export const secretsManager = new SecretsManager();
