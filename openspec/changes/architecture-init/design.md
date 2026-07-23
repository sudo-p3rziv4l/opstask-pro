# Design: OpsTask Pro

## 1. Directory Structure (App Router)
- `app/api/auth/[...path]/route.js`
- `app/api/tasks/route.js`
- `app/(dashboard)/layout.js` (Sidebar & Topbar)
- `app/(dashboard)/board/page.js` (Kanban Board)
- `components/ui/` (Reusable buttons, cards)

## 2. Design System (Tailwind)
- **Background:** `bg-gradient-to-br from-sky-50 to-emerald-50`
- **Cards:** `bg-white rounded-2xl shadow-sm border border-slate-100`
- **Typography:** Inter/Poppins.

## 3. Database Schema (PostgreSQL)
Table `users`: id, username, password_hash, role
Table `tasks`: id, redmine_id, title, description, status (todo, in_progress, done), assignee, updated_at
