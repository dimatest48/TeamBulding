# Information Architecture — Student Task Tracker

> Reflects recommendations applied:
> - Dashboard visual hierarchy (overdue → upcoming → per-subject → stats)
> - Shareable link as primary sharing mechanism alongside email search
> - Onboarding screen for new users (empty-state guided flow)

---

## Screen Map Overview

```
Landing / Login
    ├── Registration
    └── [Authenticated]
        ├── Onboarding (first login only)
        ├── Dashboard (Home)
        │   └── → Subject Detail (via progress row)
        │   └── → Task Detail (via deadline/overdue widget)
        ├── Subjects List
        │   └── Subject Detail
        │       └── Task Creation / Edit Form
        │           └── Task Detail
        │               └── Share Task Modal
        ├── All Tasks (flat list, cross-subject)
        ├── Shared With Me
        │   └── Task Detail (read-only or edit, by permission)
        └── Profile / Settings
```

---

## Screen 1 — Landing / Login

**Purpose:**
Entry gate. Login is the default view (returning users outnumber new ones after week one). Registration is a tab on the same page — not a separate route — to keep the user in one mental context and reduce back-navigation confusion.

**Key elements:**
- App name + tagline: "Your academic tasks, organized"
- Login form: email + password (default active tab)
- "Register" tab (switches form in-place, no page navigation)
- "Forgot password" link
- Optional: "Continue with Google" (students expect this)

**Transition triggers:**
- Successful login → Dashboard (or Onboarding if first login)
- Switch to Register tab → Registration form (same page)
- Forgot password → Password Reset flow

**Errors / edge cases:**
- Wrong credentials → inline error below the form, no page reload, no field clearing
- Empty fields on submit → field-level validation before any server call
- Account not found → message: "No account with this email — register instead?" with direct link

---

## Screen 2 — Registration

**Purpose:**
Collect minimum data only. Every extra field costs conversion, especially with younger users (Olena). Name + email + password is sufficient for v1 — no school name, no date of birth, no phone number.

**Key elements:**
- Full name, email, password, confirm password
- Terms of service checkbox (legal baseline)
- "Create account" submit button
- Link back to login

**Transition triggers:**
- Successful submit → Onboarding (first-time guided flow)

**Errors / edge cases:**
- Email already registered → inline error: "This email is taken. Log in instead?" with direct link, email carries over to login form
- Password too weak → inline visual strength indicator (shown on typing, not blocking)
- Passwords don't match → field error on blur, before submit attempt
- Network error → toast notification, form data preserved

---

## Screen 3 — Onboarding (First Login Only)

**Purpose:**
This screen exists because of Recommendation 3: an empty dashboard without guidance is the primary drop-off point for new users. The goal is to create the "first win" — one subject created, one task added — before the student ever sees the full dashboard. This uses only features already in the brief; no new functionality is required.

**Shown only once**, on the first successful login. After completion or dismissal, the user never sees it again.

**Step 1 — Create your first subject:**
- Prompt: "What subject do you have homework for today?"
- Single text input with placeholder: "e.g. Mathematics, English, Physics..."
- "Next" button
- "Skip for now" link (dismisses onboarding, goes straight to Dashboard)

**Step 2 — Add your first task:**
- Prompt: "Add a task for [Subject name]"
- Title input (required)
- Deadline picker (optional)
- Priority selector (optional, default: Medium)
- "Create task" button
- "Skip" link

**Step 3 — Done:**
- Brief confirmation: "You're all set. [Subject] is ready."
- Single CTA: "Go to my tasks" → Subject Detail for the created subject
- Completed tasks visible on Dashboard immediately on arrival

**Errors / edge cases:**
- User skips Step 1 → goes to empty Dashboard with a persistent nudge card: "Add your first subject to get started" (not a modal, just a card in the empty space)
- User completes Step 1 but skips Step 2 → goes to empty Subject Detail with CTA

---

## Screen 4 — Dashboard (Home)

**Purpose:**
Academic health overview. The design challenge is hierarchy across five data points. Per **Recommendation 2**, the visual priority is strictly ordered:

1. **Overdue tasks** — urgent, actionable; dominates visually when present (red, top of page)
2. **Upcoming deadlines** — top 3–5 nearest tasks with relative time labels ("due tomorrow")
3. **Per-subject progress** — compact rows with mini progress bars
4. **Summary stats** — total tasks / completed (informational, sits at the bottom or in a collapsed section)

When no overdue tasks exist, the overdue section is fully hidden (not shown as an empty state). This prevents the visual hierarchy from becoming flat on low-stress days.

**Key elements:**
- Overdue section (shown conditionally): list of overdue tasks, each row red, with "days overdue" label
- Upcoming deadlines widget: top 3–5 tasks by nearest deadline, each row shows subject tag + relative deadline
- Per-subject progress list: subject name + "X/Y tasks" + mini progress bar
- Summary stat cards: Total / Completed (secondary position)
- Persistent "Add task" button (floating action button or top-bar)
- Bottom navigation: Dashboard | Subjects | Tasks | Shared | Profile

**Transition triggers:**
- Click overdue task row → Task Detail
- Click upcoming task row → Task Detail
- Click subject progress row → Subject Detail
- Click "Add task" → Task Creation form (subject selector pre-empty)

**Errors / edge cases:**
- Zero tasks (new user who skipped onboarding) → no metric cards; show a single prominent empty-state card: "Add your first subject to get started" with CTA button
- All tasks complete → progress section shows "100%" per subject; optional celebratory message replaces the overdue section slot
- Zero overdue tasks → overdue section hidden entirely

---

## Screen 5 — Subjects List

**Purpose:**
Students think subject-first ("I need to do math homework"), not task-first. This screen reflects that mental model. The subject card must surface enough context — task count and completion percentage — that the student can choose which subject to enter without having to open it first.

**Key elements:**
- Grid or list of subject cards: subject name, task count, completion %, optional color indicator
- "Add subject" button (top or floating)
- Edit (rename) and Delete actions per card via context menu or long-press
- Search bar appears when subject count ≥ 6

**Transition triggers:**
- Click subject card → Subject Detail
- Click "Add subject" → inline modal (name input only, single field)
- Click edit → inline rename directly on the card
- Click delete → confirmation dialog before any action

**Errors / edge cases:**
- Delete subject that contains tasks → destructive warning: "Deleting 'Mathematics' will also delete X tasks. This cannot be undone." Requires explicit confirmation click.
- Duplicate subject name → inline validation: "You already have a subject with this name"
- No subjects yet → empty state with CTA: "Add your first subject"

---

## Screen 6 — Subject Detail

**Purpose:**
Primary daily work screen. Students spend the most time here — scanning the task list for a specific subject, updating statuses, adding tasks. A "Programming" subject can accumulate 30+ tasks over a semester, making filter and sort essential, not optional.

**Key elements:**
- Subject name (editable inline — click to rename in place)
- Subject progress bar: "X of Y tasks completed"
- Filter chips: All / New / In Progress / Done
- Sort dropdown: By deadline (default) / By priority / By date added
- Task list rows: title, status badge (color-coded), priority dot, deadline date, quick-complete checkbox
- "Add task" button
- Back navigation to Subjects List

**Transition triggers:**
- Click task row → Task Detail
- Click quick-complete checkbox → status toggles to "done" inline without page navigation
- Click "Add task" → Task Creation form (subject pre-selected)
- Back → Subjects List

**Errors / edge cases:**
- No tasks in subject → empty state: "No tasks for [Subject Name] yet. Add one."
- Overdue task rows → highlighted in red, overdue label next to deadline
- All tasks done → progress bar 100%, optional celebratory inline message

---

## Screen 7 — Task Creation / Edit Form

**Purpose:**
Primary data entry point. Must be fast — students add tasks between classes. Design rule: required fields look required, optional fields look optional. If everything is visually equal, the student stalls. Only title is truly required; all other fields aid organization but must not block creation.

**Key elements:**
- Title — required, visually prominent (first field, large input)
- Subject selector — dropdown, pre-selected when arriving from Subject Detail
- Deadline — date picker; time picker optional (most deadlines are end-of-day)
- Status — segmented control: New / In Progress / Done (default: New)
- Priority — segmented control: Low / Medium / High (default: Medium)
- Description — textarea, visually labelled "Optional"
- Save (primary) / Cancel (secondary)

**Transition triggers:**
- Save → back to originating screen; task appears immediately in the list
- Cancel → back with no changes; if fields have content, show "Discard changes?" confirmation

**Errors / edge cases:**
- No title → block submission with inline error: "Task title is required"
- Past deadline selected → soft warning only, not a blocker (student may be logging past work retroactively)
- No subject selected → require or offer "General" as a default fallback subject
- Accidental back navigation with unsaved content → "Discard changes?" dialog

---

## Screen 8 — Task Detail

**Purpose:**
Full read view of one task. Sharing entry point. Separating reading from editing is intentional: it prevents accidental edits and is the correct affordance for view-only recipients (Dmytro's teammates). Edit and Share buttons are rendered only for the task owner — they are fully hidden (not greyed out) for recipients, which avoids confusion.

**Key elements:**
- Task title (large)
- Status badge + Priority badge
- Subject tag (tappable — navigates to that subject)
- Deadline with relative label: "Due tomorrow", "Overdue by 2 days"
- Description (shown only if present)
- "Mark as Done" quick action (toggles to "Mark as New" when done)
- "Edit" button (owner only)
- "Share" button (owner only)
- "Shared with" section: list of user names + access level badge
- Delete option (owner only, in overflow/kebab menu — destructive action kept out of primary UI)
- Created / updated timestamps in footer

**Transition triggers:**
- "Edit" → Task Edit form (same form as creation, pre-filled)
- "Share" → Share Task Modal (see Screen 9)
- Subject tag → Subject Detail
- "Mark as Done" → status updates inline with animation
- Back → originating screen

**Errors / edge cases:**
- View-only recipient: Edit / Share / Delete buttons not rendered
- Task deleted by owner while another user is viewing → "This task is no longer available"
- Task already done → button shows "Mark as New"

---

## Screen 9 — Share Task Modal

**Purpose:**
Collaboration gateway. Per **Recommendation 1**, sharing must support two paths: (1) search by email for known contacts, and (2) a shareable link for quick sharing via any messaging app. The link path removes the friction of requiring the recipient to be a registered user with a known email address.

**Two sharing methods:**

**Method A — Share by email (existing users):**
- Search field: "Enter user email"
- Search results: avatar + name shown when a match is found
- Access level toggle: "Can view" / "Can edit"
- "Share" button

**Method B — Share via link (Recommendation 1):**
- "Copy link" button generates a unique shareable URL
- Permission selector before copying: "Anyone with this link can: View / Edit"
- Copied link can be sent via any channel (Telegram, Viber, email)
- When recipient opens link: if logged in → task added to their "Shared with me"; if not logged in → prompted to register, then task is added automatically post-registration
- Link can be deactivated by the owner at any time

**Current sharing list:**
- List of users with whom the task is already shared
- Access level badge per user
- "Revoke" button per user

**Transition triggers:**
- Confirm share (Method A) → modal closes, "Shared with" section updates
- Copy link (Method B) → link copied to clipboard, toast confirmation
- Cancel → modal closes, no change

**Errors / edge cases:**
- Email not found (Method A) → "No account with this email. Share via link instead?" with quick shortcut to Method B
- Sharing with yourself → error: "You can't share a task with yourself"
- User already has access → show current access level + option to change, no duplicate entry
- Network error → retry prompt, modal stays open

---

## Screen 10 — Shared With Me

**Purpose:**
Dedicated inbox for received tasks, separated from personal tasks. This separation is critical: mixing received tasks into the personal task list destroys the cognitive distinction between "my work" and "work given to me" — a distinction that matters most to Dmytro's persona but affects all sharing users.

**Key elements:**
- List of tasks shared with this user (sorted by deadline by default)
- Per-task row: task title, shared by (name), subject, deadline, access level badge
- Filter: by access level (view / edit), by subject
- Empty state when no tasks have been shared

**Transition triggers:**
- Click task row → Task Detail (Edit button present only if "Can edit" access)

**Errors / edge cases:**
- Owner deletes shared task → disappears from list silently (v1); notification planned for v2
- Access revoked while user is actively viewing the task → on next action: "Access to this task has been removed"
- No tasks shared → empty state: "No one has shared tasks with you yet"

---

## Screen 11 — Profile / Settings

**Purpose:**
Low-traffic but essential. Primarily for account management. Logout must be prominently accessible — students frequently use shared or university computers.

**Key elements:**
- Display name (editable)
- Email (editable, triggers re-verification on change)
- Change password
- Logout button (prominent, separate from other actions)
- App version in footer

**Transition triggers:**
- Save → inline toast confirmation
- Logout → clears session, returns to Landing / Login
- Change password → form or confirmation email sent

**Errors / edge cases:**
- New password same as current → warn before submitting
- Session expired mid-edit → redirect to login, show message on return
- New email already registered → inline error
