import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, '..', 'data', 'content.json');

export const activityEventsService = {
  async listAllActivities() {
    try {
      const raw = await fs.readFile(CONTENT_FILE, 'utf8');
      const data = JSON.parse(raw);
      return data.activityEvents || {};
    } catch {
      return {};
    }
  },
};
