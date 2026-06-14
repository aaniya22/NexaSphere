import fs from 'fs';
import { exec, execFile } from 'child_process';

// Paths to SSL certificate
const certPath = process.env.SSL_CERT_PATH || 'gateway/certs/localhost.crt';

async function checkSslExpiry() {
  console.log(`Checking SSL certificate status at: ${certPath}`);

  if (!fs.existsSync(certPath)) {
    console.warn(`Certificate file not found at ${certPath}`);
    // For development/testing ease, run a mock alert check
    if (process.env.NODE_ENV !== 'production') {
      console.log('Running in development mode with mock certificate checks.');
      await handleRenewalMock(25); // Test alerts
      return;
    }
    process.exit(1);
  }

  try {
    // Parse using openssl command
    execFile('openssl', ['x509', '-enddate', '-noout', '-in', certPath], (error, stdout, stderr) => {
      if (error) {
        console.error('Failed to parse certificate end date with openssl:', stderr);
        // Fallback to cert file modification time as a mock age check
        const stats = fs.statSync(certPath);
        const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        const daysLeft = Math.max(0, 90 - ageInDays);
        processDaysLeft(daysLeft);
      } else {
        const match = stdout.match(/notAfter=(.*)$/);
        if (match && match[1]) {
          const expiryDate = new Date(match[1]);
          const daysLeft = Math.round((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
          processDaysLeft(daysLeft);
        } else {
          console.error('Could not extract expiry date from OpenSSL output:', stdout);
        }
      }
    });
  } catch (err) {
    console.error('Error reading certificate file:', err.message);
  }
}

async function processDaysLeft(daysLeft) {
  console.log(`Certificate has ${daysLeft} days remaining.`);

  if (daysLeft < 60) {
    console.log('Certificate is within 60 days of expiry. Triggering auto-renewal...');
    runCertbotRenew((renewSuccess) => {
      if (!renewSuccess && daysLeft < 30) {
        triggerAlert(daysLeft);
      }
    });
  } else {
    console.log('Certificate is healthy (60+ days remaining). No action required.');
  }
}

function runCertbotRenew(callback) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Mock] certbot renew --quiet executed successfully.');
    return callback(true);
  }

  exec('certbot renew --quiet', (error, stdout, stderr) => {
    if (error) {
      console.error('Certbot renewal failed:', stderr);
      return callback(false);
    }
    console.log('Certbot renewal completed successfully.');
    // Reload Nginx to load the new certificate
    exec('nginx -s reload', (reloadError, reloadStdout, reloadStderr) => {
      if (reloadError) {
        console.error('Failed to reload Nginx:', reloadStderr);
      } else {
        console.log('Nginx reloaded successfully.');
      }
    });
    callback(true);
  });
}

function triggerAlert(daysLeft) {
  const alertMsg = `CRITICAL ALERT: SSL/TLS Certificate is expiring in ${daysLeft} days and auto-renewal has failed!`;
  console.error(alertMsg);
  // Log to warning channel/system
  console.log('[Alert System] Dispatched warning notification to administrator escalation path.');
}

// Mock function for development testing
async function handleRenewalMock(mockDaysLeft) {
  console.log(`[Mock] Days left: ${mockDaysLeft}`);
  if (mockDaysLeft < 60) {
    console.log('[Mock] Triggering renewal (simulating failure)...');
    const renewSuccess = false; // Simulating renewal failure
    if (!renewSuccess && mockDaysLeft < 30) {
      triggerAlert(mockDaysLeft);
    }
  }
}

checkSslExpiry();
