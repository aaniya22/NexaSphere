import {
  supabaseRequest,
  supabaseBreaker,
  HAS_SUPABASE,
  requiredEnv,
  normalizePrivateKey,
} from '../storage/supabaseClient.js';
import { google } from 'googleapis';
import { ZodError } from 'zod';
import { normalizeFormSubmission } from '../validators/formSchemas.js';
import { getPublicAppUrl } from '../utils/publicAppUrl.js';
import { sendWelcomeVerificationEmail } from './emailService.js';
import { broadcastSSEEvent } from './sseService.js';
import { emitToRole } from '../config/socket.js';
import { CircuitBreaker, circuitBreakerRegistry } from '../utils/circuitBreaker.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let _sheetsClient = null;

function getSheetsClient() {
  if (_sheetsClient) return _sheetsClient;
  const auth = new google.auth.JWT({
    email: requiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    key: normalizePrivateKey(requiredEnv('GOOGLE_PRIVATE_KEY')),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  _sheetsClient = google.sheets({ version: 'v4', auth });
  return _sheetsClient;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_DIR = path.join(__dirname, '..', 'data', 'fallback-submissions');

function ensureFallbackDir() {
  if (!fs.existsSync(FALLBACK_DIR)) {
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
  }
}

function writeFallbackSubmission(formType, payload, error) {
  try {
    ensureFallbackDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${formType}-${timestamp}-${Date.now()}.json`;
    const filePath = path.join(FALLBACK_DIR, filename);
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          formType,
          payload,
          submittedAt: new Date().toISOString(),
          error: error?.message || 'Supabase unreachable',
        },
        null,
        2
      ),
      'utf8'
    );
    console.error(`[Forms Service] Supabase insertion failed — saved fallback to ${filePath}`);
  } catch (writeErr) {
    console.error('[Forms Service] Failed to write fallback submission file:', writeErr);
  }
}

function toSafeString(value, max = 4000) {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

async function _sheetAppend(spreadsheetId, sheetName, row, sheets) {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

const _sheetBreaker = circuitBreakerRegistry.register(
  'google-sheets',
  new CircuitBreaker(_sheetAppend, {
    name: 'google-sheets',
    failureThreshold: 3,
    successThreshold: 2,
    coolDownPeriod: 10000,
    maxCoolDownPeriod: 60000,
  })
);

export const formsService = {
  async appendToSupabaseForms(formType, payload) {
    if (!HAS_SUPABASE) return false;
    try {
      await supabaseBreaker.execute('form_submissions', {
        method: 'POST',
        body: [
          {
            form_type: formType,
            full_name: toSafeString(payload.fullName, 140),
            college_email: toSafeString(payload.collegeEmail, 140),
            whatsapp: toSafeString(payload.whatsapp, 40),
            payload,
          },
        ],
      });
      return true;
    } catch (err) {
      if (err.code === 'CIRCUIT_OPEN') {
        console.warn('[Forms Service] Supabase circuit breaker is OPEN, using fallback');
      } else {
        console.error('[Forms Service] Supabase insertion failed:', err?.message || err);
      }
      writeFallbackSubmission(formType, payload, err);
      return false;
    }
  },

  async appendFormToSheet(formType, payload) {
    const spreadsheetId = requiredEnv('GOOGLE_SHEET_ID');
    const sheets = getSheetsClient();

    const defaultTab = process.env.GOOGLE_SHEET_TAB_NAME || 'Responses';
    const tabMap = {
      membership: process.env.GOOGLE_MEMBERSHIP_TAB_NAME || 'MembershipResponses',
      recruitment: process.env.GOOGLE_RECRUITMENT_TAB_NAME || 'RecruitmentResponses',
      core_team: process.env.GOOGLE_CORE_TEAM_TAB_NAME || 'CoreTeamResponses',
    };
    const sheetName = tabMap[formType] || defaultTab;

    const now = new Date().toISOString();
    const row = [
      now,
      formType,
      toSafeString(payload.fullName, 140),
      toSafeString(payload.collegeEmail, 140),
      toSafeString(payload.whatsapp, 40),
      JSON.stringify(payload),
    ];

    await _sheetBreaker.execute(spreadsheetId, sheetName, row, sheets);
  },

  async handleForm(formType, body) {
    try {
      const payload = normalizeFormSubmission(formType, body || {});
      const savedToSupabase = await this.appendToSupabaseForms(formType, payload);
      try {
        await this.appendFormToSheet(formType, payload);
      } catch (sheetErr) {
        console.error('[Forms Service] Failed to append to Google Sheet:', sheetErr);
        if (!savedToSupabase) throw sheetErr;
      }

      try {
        const verifyUrl = `${getPublicAppUrl()}/verify?email=${encodeURIComponent(payload.collegeEmail)}`;
        await sendWelcomeVerificationEmail(payload.collegeEmail, payload.fullName, verifyUrl);
      } catch (emailErr) {
        console.error('[Forms Service] Failed to send welcome verification email:', emailErr);
      }

      try {
        broadcastSSEEvent('registration', {
          formType,
          fullName: payload.fullName,
          timestamp: new Date().toISOString(),
        });
        emitToRole('membership_admin', 'admin:new-registration', {
          formType,
          userName: payload.fullName,
          timestamp: new Date(),
        });
      } catch (realtimeErr) {
        console.error('[Forms Service] Failed to broadcast real-time updates:', realtimeErr);
      }

      return { ok: true };
    } catch (e) {
      if (e instanceof ZodError) {
        const issues = e.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        const err = new Error('Invalid form submission');
        err.details = issues;
        throw err;
      }
      throw e;
    }
  },
};
