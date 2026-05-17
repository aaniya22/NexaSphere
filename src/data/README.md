# 📊 NexaSphere Live Data & Portal Architecture

All site content is now fully dynamic and managed via the **NexaSphere Spring Boot Backend** and **PostgreSQL Database**. Future maintainers should **not** modify or create static JS arrays for content.

---

## 🛠️ How to Manage Content & Submissions

To add, update, or remove events, activities, core team members, and review applications, use the official **Admin Dashboard**:
1. Open the [admin-dashboard/](file:///c:/Users/itzza/NexaSphere/admin-dashboard/) directory.
2. Run `npm install` and `npm run dev` to start the portal.
3. Access the dashboard at `http://localhost:5174` (or the deployed admin domain).
4. Login using your authorized administrative email and password.

---

## 📡 Active REST API Envs & Endpoints

The website uses the following production endpoints:

### Public Read API (Main Website)
* **Events Timeline**: `GET /api/content/events` -> Returns `{ "events": [...] }`
* **Core Team Grid**: `GET /api/content/team` -> Returns `{ "members": [...] }`
* **Activity Events**: `GET /api/content/activity-events/{activityKey}` -> Returns `{ "events": [...] }`

### Public Submission Write API (Forms)
* **Membership Application**: `POST /api/submissions/membership`
* **Recruitment Application**: `POST /api/submissions/recruitment`
  > [!NOTE]
  > Duplicate submissions are strictly validated server-side based on the `@glbajajgroup.org` college email address. The system returns a `409 Conflict` if the email is already registered.

### Authenticated CRUD API (Admin Portal)
* **Manage Events**: `GET` / `POST` / `PUT` / `DELETE` at `/api/admin/events`
* **Manage Core Team**: `GET` / `POST` / `PUT` / `DELETE` at `/api/admin/core-team`
* **Manage Submissions**: `GET` / `PATCH` at `/api/admin/submissions/membership` and `/api/admin/submissions/recruitment`

---

## 💾 Server & Database Configurations

All persistent database configurations are set in [application.properties](file:///c:/Users/itzza/NexaSphere/server-java/src/main/resources/application.properties). Default admin credentials and datasource connection strings support dynamic environment variables:
* `ADMIN_EMAIL` / `ADMIN_PASSWORD` (Administrative login)
* `DB_URL` / `DB_USER` / `DB_PASS` (PostgreSQL connection configuration)
