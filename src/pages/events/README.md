# 📅 NexaSphere Events Module

This directory manages the event timeline views and individual event showcase details.

---

## 🛠️ Data Integration & Flow

All events are dynamic and read directly from the backend database:
* **Data Origin**: Dynamic PostgreSQL database records.
* **Main Website**: Fetches events on startup from `/api/content/events` and passes them to `<EventsPage />` and `<EventsSection />`.
* **Details View**: Detail pages for KSS/Insight Sessions dynamically query event parameters based on active route keys.

---

## 💻 Management

To add, update, or remove an event:
1. Access the **Admin Portal** (`/admin-dashboard`).
2. Navigate to the **Events Manager** or **Activity Events Manager** panel.
3. Submit the event metadata form (Name, Short Name, Date, Description, Status, Icon, and Tags).
4. Save to instantly update the live public site timeline.
