import { z } from 'zod';

const WhatsAppSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'WhatsApp must be exactly 10 digits');

const EmailSchema = z.string().trim().email('Invalid email address').max(140);

const SectionSchema = z.string().trim().min(1, 'Section is required').max(20);

const OptionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value.trim() : undefined));

const TextList = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, 12);
    }
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
  });

const CommonIdentitySchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required').max(120),
    collegeEmail: EmailSchema,
    whatsapp: WhatsAppSchema,
    branch: z.string().trim().min(1, 'Branch is required').max(100),
    section: SectionSchema,
    submittedAt: z.string().trim().max(80).optional(),
    userAgent: z.string().trim().max(255).optional(),
    formType: z.string().trim().max(40).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    email: EmailSchema.optional(),
    reason: z.string().trim().min(1).max(1200).optional(),
    whyJoin: z.string().trim().min(1).max(1200).optional(),
  })
  .strip();

const RecruitmentExtrasSchema = z
  .object({
    year: z.string().trim().max(40).optional(),
    role: OptionalText(80),
    interests: TextList,
    skills: OptionalText(400),
    comms: OptionalText(400),
    campusExp: OptionalText(60),
    campusExpDetails: OptionalText(600),
    links: OptionalText(600),
    commitHours: OptionalText(40),
    attendCampus: OptionalText(40),
    assessmentOk: OptionalText(40),
    anythingElse: OptionalText(1200),
    declarations: z.record(z.string(), z.unknown()).optional(),
    semester: OptionalText(40),
    rollNumber: OptionalText(40),
    course: OptionalText(80),
    groups: TextList,
  })
  .strip();

const MembershipExtrasSchema = z
  .object({
    rollNumber: OptionalText(40),
    course: OptionalText(80),
    semester: z.string().trim().min(1, 'Semester is required').max(40),
    groups: TextList,
    whyJoin: z.string().trim().max(1200).optional(),
  })
  .strip();

function pickString(primary, fallback) {
  const value = String(primary ?? fallback ?? '').trim();
  return value;
}

function normalizeBase(data) {
  const reason = pickString(data.reason, data.whyJoin);

  return {
    fullName: pickString(data.fullName, data.name),
    collegeEmail: pickString(data.collegeEmail, data.email).toLowerCase(),
    whatsapp: String(data.whatsapp || '').trim(),
    branch: pickString(data.branch),
    section: String(data.section || '').trim(),
    reason,
    submittedAt: pickString(data.submittedAt, new Date().toISOString()),
    userAgent: pickString(data.userAgent),
    formType: pickString(data.formType),
  };
}

const recruitmentSubmissionSchema = CommonIdentitySchema.merge(RecruitmentExtrasSchema)
  .superRefine((data, ctx) => {
    if (!String(data.year || '').trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['year'], message: 'Year is required' });
    }
    if (!data.reason && !data.whyJoin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'Reason is required',
      });
    }
  })
  .transform((data) => {
    const normalized = normalizeBase(data);
    return {
      ...normalized,
      year: String(data.year || '').trim(),
      role: data.role || null,
      interests: data.interests,
      skills: data.skills || null,
      comms: data.comms || null,
      campusExp: data.campusExp || null,
      campusExpDetails: data.campusExpDetails || null,
      links: data.links || null,
      commitHours: data.commitHours || null,
      attendCampus: data.attendCampus || null,
      assessmentOk: data.assessmentOk || null,
      anythingElse: data.anythingElse || null,
      declarations: data.declarations || null,
      semester: data.semester || null,
      rollNumber: data.rollNumber || null,
      course: data.course || null,
      groups: data.groups,
      whyJoin: normalized.reason,
    };
  });

const coreTeamApplicationSchema = recruitmentSubmissionSchema;

const membershipSubmissionSchema = CommonIdentitySchema.merge(MembershipExtrasSchema)
  .superRefine((data, ctx) => {
    if (!data.reason && !data.whyJoin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['whyJoin'],
        message: 'Reason is required',
      });
    }
  })
  .transform((data) => {
    const normalized = normalizeBase(data);
    return {
      ...normalized,
      rollNumber: data.rollNumber || null,
      course: data.course || null,
      semester: String(data.semester || '').trim(),
      groups: data.groups,
      whyJoin: normalized.reason,
      reason: normalized.reason,
    };
  });

export function normalizeFormSubmission(formType, body) {
  if (formType === 'membership') {
    return membershipSubmissionSchema.parse(body || {});
  }

  if (formType === 'recruitment' || formType === 'core_team') {
    return coreTeamApplicationSchema.parse(body || {});
  }

  throw new Error(`Unsupported form type: ${formType}`);
}

export { coreTeamApplicationSchema, membershipSubmissionSchema, recruitmentSubmissionSchema };
