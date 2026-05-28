# User Stories — Student Task Tracker

> Format: "As a [role], I want to [action], so that [value/outcome]"  
> Prioritized using MoSCoW: Must / Should / Could / Won't

---

## Mykhailo — The Overwhelmed Freshman

| # | User Story | Priority |
|---|-----------|----------|
| M1 | As a university student, I want to see all my tasks sorted by nearest deadline on my dashboard, so that I never miss a submission date. | **Must** |
| M2 | As a university student, I want to filter tasks by subject, so that I can focus on one course at a time without being distracted by everything else. | **Must** |
| M3 | As a university student, I want to see a progress bar per subject showing tasks done vs. total, so that I can immediately spot which courses are falling behind. | **Should** |

---

## Olena — The Diligent High-Schooler

| # | User Story | Priority |
|---|-----------|----------|
| O1 | As a high-school student, I want to create a task in under 30 seconds with only a title and subject required, so that I can log homework quickly between classes without filling every field. | **Must** |
| O2 | As a high-school student, I want to share a specific task with a classmate via a link, so that we both work from the same assignment details without needing to know each other's email. | **Should** |
| O3 | As a high-school student, I want to mark a task as "done" with a single click from the task list, so that I feel a sense of accomplishment without opening the full task detail page. | **Must** |

---

## Dmytro — The Group Project Leader

| # | User Story | Priority |
|---|-----------|----------|
| D1 | As a group leader, I want to share a task with a specific teammate and grant them edit access, so that they can update its status and description as they work. | **Must** |
| D2 | As a group leader, I want to see a list of all tasks I have shared and with whom, so that I never lose track of what I have delegated. | **Should** |
| D3 | As a group leader, I want to view tasks shared with me in a section separate from my own tasks, so that delegated work and personal work never get mixed up. | **Should** |

---

## Full MoSCoW Summary

### Must Have
- Authentication (register, login, logout)
- Task CRUD (create, read, update, delete)
- Subject management (create, rename, delete)
- Task fields: title, subject, deadline, status, priority
- Dashboard: overdue tasks, upcoming deadlines, per-subject progress
- Inline "Mark as done" from task list (no full-page navigation required)
- Task sharing with view / edit permissions

### Should Have
- Per-subject progress bar (tasks done / total)
- Filter and sort within subject task list
- "Shared with me" dedicated section in navigation
- Shareable link for tasks (as alternative to email search)
- Guided empty-state onboarding for new users

### Could Have
- User avatar / profile photo
- Deadline reminders (email or browser notifications)
- Task descriptions with rich text
- Color-coded subjects
- Quick-add task from Dashboard without navigating to subject

### Won't Have (v1)
- Public task discovery or social feed
- File attachments to tasks
- Group / team workspaces
- Calendar view of tasks
- Mobile native app (web responsive only in v1)
