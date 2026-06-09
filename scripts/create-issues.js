import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKLOG_PATH = path.join(__dirname, '../docs/extended-backlog.md');
const STATE_PATH = path.join(__dirname, 'create-issues-state.json');

// Soft, professional label colors
const LABEL_COLORS = {
  // Priorities
  P1: 'd93f0b',
  P2: 'fbca04',
  P3: '0e8a16',
  // Types
  feature: 'a2eeef',
  enhancement: '84b6eb',
  performance: 'c5def5',
  testing: 'fef2c0',
  devops: 'bfdadc',
  security: 'e99695',
  monitoring: 'c2e0c6',
  reliability: 'd4c5f9',
  architecture: 'd1c4e9',
  documentation: 'f9d0c4',
  qa: 'fef2c0',
  bug: 'e99695',
};

const DEFAULT_COMPONENT_COLOR = 'cfd8dc'; // Slate grey

function checkGitHubCli() {
  try {
    const version = execSync('gh --version', { encoding: 'utf8' });
    console.log(`✓ GitHub CLI is installed.`);
  } catch (error) {
    console.error(
      '✗ GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/'
    );
    process.exit(1);
  }

  try {
    execSync('gh auth status', { stdio: 'ignore' });
    console.log(`✓ GitHub CLI is authenticated.`);
  } catch (error) {
    if (process.env.GITHUB_TOKEN) {
      console.log('⚠️  Detecting invalid/unauthenticated GITHUB_TOKEN in environment.');
      console.log('Clearing GITHUB_TOKEN to fallback to your local GitHub session credentials...');
      delete process.env.GITHUB_TOKEN;
      try {
        execSync('gh auth status', { stdio: 'ignore' });
        console.log(`✓ GitHub CLI is authenticated (using local credentials).`);
        return;
      } catch (retryError) {
        // Fall through to warning below
      }
    }
    console.warn('\n⚠️  Warning: GitHub CLI is not authenticated.');
    console.log('Please run "gh auth login" in your terminal to authenticate before proceeding.');
    console.log('You can still run this script in DRY-RUN mode to parse the issues.\n');
  }
}

function parseBacklog() {
  if (!fs.existsSync(BACKLOG_PATH)) {
    console.error(`Backlog file not found at: ${BACKLOG_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(BACKLOG_PATH, 'utf8');
  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n');

  // Split by "#### Issue #"
  const parts = normalizedContent.split(/#### Issue #/);
  // First part is the preamble
  const preamble = parts[0];
  const issueParts = parts.slice(1);

  const issues = [];

  for (const part of issueParts) {
    const lines = part.split('\n');
    const firstLine = lines[0].trim();

    // Parse issue number and title from first line, e.g. "42: Portfolio GitHub Integration"
    const titleMatch = firstLine.match(/^(\d+)[:\s]*(.*)$/);
    if (!titleMatch) {
      continue;
    }

    const number = parseInt(titleMatch[1], 10);
    const title = titleMatch[2].trim();

    // The rest is the body
    const bodyContent = lines.slice(1).join('\n').trim();

    // Extract metadata
    const priorityMatch = bodyContent.match(/\*\*Priority\*\*:\s*([^\s|]+)/i);
    const typeMatch = bodyContent.match(/\*\*Type\*\*:\s*([^\s|\n\r]+)/i);
    const componentMatch = bodyContent.match(/\*\*Component\*\*:\s*([^\n\r]+)/i);

    const priority = priorityMatch ? priorityMatch[1].trim() : 'P2';
    const type = typeMatch ? typeMatch[1].trim() : 'Feature';
    const component = componentMatch ? componentMatch[1].trim() : '';

    // Clean component: remove markdown formatting if any
    const cleanComponent = component.replace(/[\*_`]/g, '').trim();

    // Format label list
    const labels = [];
    labels.push(priority.toUpperCase());
    labels.push(type.toLowerCase());
    if (cleanComponent) {
      const normComponent = cleanComponent
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      labels.push(`component: ${normComponent}`);
    }

    issues.push({
      number,
      title: `Issue #${number}: ${title}`,
      originalTitle: title,
      body: bodyContent,
      priority,
      type,
      component: cleanComponent,
      labels,
    });
  }

  return issues;
}

function loadState() {
  if (fs.existsSync(STATE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch (e) {
      console.warn('Could not parse state file, starting fresh.');
    }
  }
  return { createdIssues: {} };
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function ensureLabelsExist(issues, isDryRun) {
  if (isDryRun) return;

  console.log('\nChecking and creating required GitHub labels...');

  // Gather all unique labels
  const uniqueLabels = new Set();
  issues.forEach((issue) => {
    issue.labels.forEach((label) => uniqueLabels.add(label));
  });

  for (const label of uniqueLabels) {
    let color = DEFAULT_COMPONENT_COLOR;
    if (LABEL_COLORS[label]) {
      color = LABEL_COLORS[label];
    } else if (LABEL_COLORS[label.toLowerCase()]) {
      color = LABEL_COLORS[label.toLowerCase()];
    } else if (label.startsWith('component:')) {
      color = DEFAULT_COMPONENT_COLOR;
    }

    try {
      // Check if label exists by trying to create it
      // if it exists, it will throw an error which we catch
      execSync(
        `gh label create "${label}" --color "${color}" --description "Automated label for NexaSphere Backlog"`,
        { stdio: 'ignore' }
      );
      console.log(`  ✓ Created label: "${label}" with color #${color}`);
    } catch (e) {
      // Either exists or error, ignore
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('-d');

  console.log('================================================');
  console.log('   NexaSphere Bulk GitHub Issue Creator');
  console.log('================================================');

  checkGitHubCli();

  const issues = parseBacklog();
  console.log(`\nParsed ${issues.length} issues from docs/extended-backlog.md.`);

  if (issues.length === 0) {
    console.error('No issues parsed. Check formatting of docs/extended-backlog.md.');
    process.exit(1);
  }

  if (isDryRun) {
    console.log('\n--- DRY RUN MODE ---');
    console.log('The following issues would be created on GitHub:');
    issues.forEach((issue) => {
      console.log(`\n[#${issue.number}] ${issue.title}`);
      console.log(`    Labels: ${issue.labels.join(', ')}`);
      console.log(`    Component: ${issue.component || 'None'}`);
    });
    console.log('\nDry run completed. To create issues, run without --dry-run');
    return;
  }

  // Check auth again before proceeding with real run
  try {
    execSync('gh auth status', { stdio: 'ignore' });
  } catch (error) {
    console.error('\n✗ Error: You must be authenticated to create issues.');
    console.error('Please run "gh auth login" first, then retry this script.');
    process.exit(1);
  }

  const state = loadState();
  ensureLabelsExist(issues, isDryRun);

  console.log('\nStarting issue creation on GitHub...');
  let successCount = 0;

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const key = `issue-${issue.number}`;

    if (state.createdIssues[key]) {
      console.log(
        `[${i + 1}/${issues.length}] Skipping Issue #${issue.number} (already created: ${state.createdIssues[key]})`
      );
      continue;
    }

    console.log(`[${i + 1}/${issues.length}] Creating: ${issue.title}...`);

    // Build the command
    // gh issue create --title "Title" --body "Body" --label "Label1,Label2"
    const labelArg = issue.labels.map((l) => `"${l}"`).join(',');

    // Write body to temporary file to avoid command length limits or shell escaping issues
    const tempBodyFile = path.join(__dirname, `temp-issue-body-${issue.number}.md`);
    fs.writeFileSync(tempBodyFile, issue.body, 'utf8');

    try {
      const output = execSync(
        `gh issue create --title "${issue.title.replace(/"/g, '\\"')}" --body-file "${tempBodyFile}" --label ${labelArg}`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      const match = output.match(/https:\/\/github\.com\/[^\s]+/);
      const url = match ? match[0] : 'Created';

      state.createdIssues[key] = url;
      saveState(state);

      console.log(`  ✓ Success! URL: ${url}`);
      successCount++;

      // Small sleep to avoid hitting rate limits
      execSync('powershell -Command "Start-Sleep -Milliseconds 500"');
    } catch (e) {
      console.error(`  ✗ Failed to create Issue #${issue.number}:`, e.message);
      if (e.stderr) console.error(e.stderr);
      console.log('Stopping. You can run the script again to resume.');
      break;
    } finally {
      if (fs.existsSync(tempBodyFile)) {
        fs.unlinkSync(tempBodyFile);
      }
    }
  }

  console.log(`\nFinished. Created ${successCount} new issues.`);
  console.log(
    `Total created in project: ${Object.keys(state.createdIssues).length}/${issues.length}`
  );
}

main();
