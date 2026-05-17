# src/pages/membership/

In-website NexaSphere Membership Form. Submissions are sent to the Spring Boot backend and are visible in the admin dashboard.

## Files

| File | Purpose |
|---|---|
| `MembershipPage.jsx` | Full membership form component |

## Backend Integration

| Flow | Endpoint |
|---|---|
| Submit membership form | `POST /api/submissions/membership` |
| Admin list responses | `GET /api/admin/submissions/membership` |
| Admin update status | `PATCH /api/admin/submissions/membership/{id}/status` |

Duplicate submissions are checked server-side by `collegeEmail`. The backend returns `409 Conflict` when an email has already submitted.

## Form Sections

| Section | Key Fields |
|---|---|
| Personal Details | Full name, college email, roll number, course, branch, section, semester, WhatsApp |
| Domain Selection | NexaSphere groups, motivation |

## Success Screen

After submission, the user sees a confirmation message and links to the NexaSphere WhatsApp group and LinkedIn page.
