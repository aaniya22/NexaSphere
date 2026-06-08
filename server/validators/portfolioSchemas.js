/**
 * Portfolio content validation schemas.
 *
 * Layered defense for issue #969: the Zod schema rejects obviously
 * malicious input up-front (longer than limits, wrong types, dangerous
 * URL protocols), and `sanitizePortfolioRecord` in
 * `server/utils/sanitize.js` strips anything that slips through.
 *
 * The Zod schema alone is not sufficient because string fields like
 * `bio` legitimately contain characters that Zod's string validators
 * would accept but which still encode XSS payloads (e.g. `<script>`
 * inside an otherwise short string).
 */

import { z } from 'zod';

const SAFE_URL_PATTERN = /^(https?:\/|\/[^\/])/i;
const URL_MAX = 2048;

function safeUrlSchema(max = URL_MAX) {
  return z
    .string()
    .trim()
    .max(max)
    .refine(
      (value) => !/^\s*(javascript|data|vbscript|file|about|chrome|jar|mocha):/i.test(value),
      { message: 'URL protocol is not allowed' }
    )
    .refine((value) => SAFE_URL_PATTERN.test(value), {
      message: 'URL must use http(s):// or be a relative path',
    });
}

const OptionalSafeUrl = z.union([z.literal(''), safeUrlSchema()]).optional();

const SkillSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    level: z.string().trim().max(40).optional(),
    category: z.string().trim().max(60).optional(),
  })
  .strict();

const ProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).optional(),
    shortDesc: z.string().trim().max(500).optional(),
    techStack: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
    link: OptionalSafeUrl,
    github: OptionalSafeUrl,
    demo: OptionalSafeUrl,
  })
  .strict();

const RoadmapSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).optional(),
    milestones: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(200),
            description: z.string().trim().max(2000).optional(),
            completed: z.boolean().optional(),
          })
          .strict()
      )
      .max(100)
      .optional(),
  })
  .strict();

const EducationSchema = z
  .object({
    institution: z.string().trim().min(1).max(200),
    degree: z.string().trim().max(200).optional(),
    field: z.string().trim().max(200).optional(),
    startYear: z.string().trim().max(20).optional(),
    endYear: z.string().trim().max(20).optional(),
    gpa: z.string().trim().max(10).optional(),
  })
  .strict();

const WorkExperienceSchema = z
  .object({
    company: z.string().trim().min(1).max(200),
    role: z.string().trim().max(200).optional(),
    startDate: z.string().trim().max(20).optional(),
    endDate: z.string().trim().max(20).optional(),
    description: z.string().trim().max(5000).optional(),
    current: z.boolean().optional(),
  })
  .strict();

const BadgeSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).optional(),
    tier: z.string().trim().max(40).optional(),
    iconUrl: OptionalSafeUrl,
  })
  .strict();

const SocialLinksSchema = z
  .record(z.string().trim().min(1).max(40), safeUrlSchema(URL_MAX))
  .refine((obj) => Object.keys(obj).length <= 20, {
    message: 'Too many social links (max 20)',
  });

const SeoMetadataSchema = z
  .record(z.string().trim().min(1).max(60), z.string().trim().max(500))
  .refine((obj) => Object.keys(obj).length <= 20, {
    message: 'Too many SEO metadata fields (max 20)',
  });

const VisibleSectionsSchema = z
  .record(z.string().trim().min(1).max(40), z.boolean())
  .refine((obj) => Object.keys(obj).length <= 20, {
    message: 'Too many visible sections (max 20)',
  });

/**
 * Schema for the body of `PUT /api/portfolio`.  Username and
 * passkey are validated here; the content body is validated
 * separately via `portfolioContentSchema` so that re-validation
 * remains cheap when only credentials are sent.
 */
export const portfolioPutSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(100)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric, underscore, hyphen'),
    passkey: z.string().min(12, 'Passkey must be at least 12 characters').max(256),
  })
  .strict();

export const portfolioContentSchema = z
  .object({
    theme: z.string().trim().min(1).max(50).optional(),
    visibleSections: VisibleSectionsSchema.optional(),
    socialLinks: SocialLinksSchema.optional(),
    customDomain: z.string().trim().max(255).optional(),
    seoMetadata: SeoMetadataSchema.optional(),
    skills: z.array(SkillSchema).max(100).optional(),
    badges: z.array(BadgeSchema).max(100).optional(),
    projects: z.array(ProjectSchema).max(50).optional(),
    roadmaps: z.array(RoadmapSchema).max(50).optional(),
    bio: z.string().trim().max(5000).optional(),
    title: z.string().trim().max(200).optional(),
    avatarUrl: z.string().trim().max(2048).optional(),
    education: z.array(EducationSchema).max(20).optional(),
    workExperience: z.array(WorkExperienceSchema).max(20).optional(),
  })
  .strict();

export const portfolioPatchSchema = portfolioContentSchema;

/**
 * Validate a single URL string against the same rules used by
 * `portfolioContentSchema`.  Returns `true` if the URL is safe to
 * use in an href attribute, `false` otherwise.  Useful for
 * ad-hoc checks (e.g. tests).
 */
export function isUrlSafe(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > URL_MAX) return false;
  if (/^\s*(javascript|data|vbscript|file|about|chrome|jar|mocha):/i.test(trimmed)) {
    return false;
  }
  return SAFE_URL_PATTERN.test(trimmed);
}
