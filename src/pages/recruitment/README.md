# src/pages/recruitment/

In-website NexaSphere Core Team Application Form. Submissions are sent to the Spring Boot backend and are visible in the admin dashboard.

## Files

| File | Purpose |
|---|---|
| `RecruitmentPage.jsx` | Full application form and roles guide modal |

## Backend Integration

| Flow | Endpoint |
|---|---|
| Submit recruitment form | `POST /api/submissions/recruitment` |
| Admin list responses | `GET /api/admin/submissions/recruitment` |
| Admin update status | `PATCH /api/admin/submissions/recruitment/{id}/status` |

Duplicate submissions are checked server-side by `collegeEmail`. The backend returns `409 Conflict` when an email has already submitted.

## Form Steps

| Step | Title | Key Fields |
|---|---|---|
| 0 | About NexaSphere | Informational |
| 1 | Personal Information | Full name, college email, WhatsApp, year, branch, section |
| 2 | Role & Domain Preference | Role applied for, areas of interest |
| 3 | Skills & Experience | Programming skills, communication languages, campus experience, GitHub |
| 4 | Commitment & Availability | Hours/week, campus attendance, assessment consent |
| 5 | Motivation & Statement | Why join, anything else |
| 6 | Declaration & Consent | Required agreement checkboxes |
