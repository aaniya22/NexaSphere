# 👥 NexaSphere Core Team Module

This directory manages the core team section on the homepage and the dedicated team page.

---

## 🛠️ Data Integration & Flow

The list of team members is retrieved in real-time from the backend database:
* **Endpoint**: `GET /api/content/team` -> Returns `{ "members": [...] }`
* **Local State**: Fetch hooks dynamically populate `<TeamSection />` and `<TeamPage />`.
* **Database Fields**: Each member's record contains `name`, `role`, `branch`, `year`, `section`, `photo` (URL/base64), `linkedin`, `github`, `whatsapp`, `instagram`, and `bio`.

---

## 💻 Management

To add or update core team members:
1. Open the **Admin Portal** (`/admin-dashboard`).
2. Go to the **Core Team Manager** page.
3. Submit a new team member's details.
4. Save to see the changes instantly reflected on both the homepage and full team page.
