import http from 'http';
import fs from 'fs';
import path from 'path';

const HEALTH_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:8787/api/monitoring/health';
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const INCIDENT_FILE = path.join(process.cwd(), 'logs', 'incidents.json');

// Ensure logs directory exists
if (!fs.existsSync(path.dirname(INCIDENT_FILE))) {
  fs.mkdirSync(path.dirname(INCIDENT_FILE), { recursive: true });
}

function loadIncidents() {
  if (fs.existsSync(INCIDENT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(INCIDENT_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveIncidents(incidents) {
  fs.writeFileSync(INCIDENT_FILE, JSON.stringify(incidents, null, 2));
}

function triggerAlert(errorMessage) {
  const message = `[Uptime Alert] NexaSphere is DOWN! Error: ${errorMessage}`;
  console.error(message);

  // Escalation Path Mock
  console.log(
    '[Escalation Path] Level 1: Sending SMS alert to Primary DevOps On-Call (Twilio API)...'
  );
  console.log(
    '[Escalation Path] Level 2: Triggering voice call escalation via PagerDuty (escalated)...'
  );
}

function checkUptime() {
  console.log(`[Uptime Monitor] Pinging health endpoint: ${HEALTH_URL}`);

  const start = Date.now();
  http
    .get(HEALTH_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const duration = Date.now() - start;
        if (res.statusCode === 200) {
          console.log(`[Uptime Monitor] Healthy. Response code 200. Latency: ${duration}ms`);
          handleServiceStatus(true, duration);
        } else {
          const errorMsg = `Service returned status code ${res.statusCode}`;
          console.warn(`[Uptime Monitor] Unhealthy! ${errorMsg}`);
          handleServiceStatus(false, 0, errorMsg);
        }
      });
    })
    .on('error', (err) => {
      console.error(`[Uptime Monitor] Ping request failed: ${err.message}`);
      handleServiceStatus(false, 0, err.message);
    });
}

function handleServiceStatus(isOnline, latency = 0, error = '') {
  const incidents = loadIncidents();
  const lastIncident = incidents[incidents.length - 1];

  if (!isOnline) {
    if (!lastIncident || lastIncident.resolvedAt) {
      const newIncident = {
        id: `inc-${Date.now()}`,
        status: 'investigating',
        startedAt: new Date().toISOString(),
        resolvedAt: null,
        error: error,
        updates: [
          {
            timestamp: new Date().toISOString(),
            message: `Downtime detected. Error: ${error}. Triggering DevOps escalation.`,
          },
        ],
      };
      incidents.push(newIncident);
      saveIncidents(incidents);
      triggerAlert(error);
    }
  } else {
    if (lastIncident && !lastIncident.resolvedAt) {
      lastIncident.resolvedAt = new Date().toISOString();
      lastIncident.status = 'resolved';
      lastIncident.updates.push({
        timestamp: new Date().toISOString(),
        message: 'System recovered. Uptime monitor verified health restoration.',
      });
      saveIncidents(incidents);
      console.log(`[Uptime Monitor] Resolved active incident: ${lastIncident.id}`);
    }
  }
}

// Run single check or start interval
if (process.argv.includes('--run-once')) {
  checkUptime();
} else {
  console.log(`Uptime monitor scheduled to run every 5 minutes.`);
  checkUptime();
  setInterval(checkUptime, CHECK_INTERVAL_MS);
}
