import {
  supabaseRequest,
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

function toSafeString(value, max = 4000) {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

export const formsService = {
  async appendToSupabaseForms(formType, payload) {
    if (!HAS_SUPABASE) return false;
    try {
      await supabaseRequest('form_submissions', {
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
    } catch {
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

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });
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

      // Trigger standard welcome verification email
      try {
        const verifyUrl = `${getPublicAppUrl()}/verify?email=${encodeURIComponent(payload.collegeEmail)}`;
        await sendWelcomeVerificationEmail(payload.collegeEmail, payload.fullName, verifyUrl);
      } catch (emailErr) {
        console.error('[Forms Service] Failed to send welcome verification email:', emailErr);
      }

      // Broadcast real-time metric updates via SSE and Socket
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
