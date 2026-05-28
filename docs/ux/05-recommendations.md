# UX Recommendations — Student Task Tracker

> These are not abstract suggestions — each recommendation is applied as a concrete
> design decision in the Information Architecture (03) and User Flows (04) documents.
> This file explains the problem, the decision, and where it lives in the product.

---

## Recommendation 1 — Add a Shareable Link as the Primary Sharing Mechanism

### The problem
The brief introduces a permission model (view / edit) but leaves user discovery undefined. The implicit assumption is "search by email" — but this creates a critical UX failure mode: the sharer must know the recipient's exact registered email address. Students share via Telegram, Viber, and Instagram DMs, not email lookups. If the first search attempt fails (wrong address, recipient not registered), most users will abandon the feature rather than retry.

This is not hypothetical: collaboration features with user-lookup-only discovery consistently show lower adoption than link-based sharing across all consumer productivity products.

### The decision
Task sharing supports two paths, both accessible from the Share Task Modal (Screen 9):

**Method A — Share by email** (existing flow from brief, kept as-is):
- Input field: search by email address
- Shows result if user is registered
- Set permission level → Share

**Method B — Share via link** (new, added per this recommendation):
- "Copy link" generates a unique, permission-scoped URL for the task
- Owner selects permission before copying: "Anyone with this link can: View / Edit"
- Link can be shared via any channel — no app required to receive it
- Recipient flow:
  - If logged in → task appears in their "Shared with Me" section automatically
  - If not logged in → prompted to register; task is added post-registration
- Owner can deactivate the link at any time from the Share Modal
- Generated links are **persistent** until revoked, so a user who generates a link and forgets to send it can retrieve and copy it again on next open

**Fallback integration:**
If Method A search returns "No user found," the modal shows: "No account found. Share via link instead?" with a direct shortcut to the Method B section — turning a dead end into a redirect.

### Where this is applied
- `03-information-architecture.md` — Screen 9 (Share Task Modal): full specification of both methods, link behavior, and error states
- `04-user-flows.md` — Flow 2 (Share via Link) and Alternative Path 2 (drop-off recovery via persistent link)

### What this requires technically
- Backend: generate a unique token per share action (UUID); store with task ID + permission level + active/inactive state
- API endpoint: `POST /tasks/{id}/share-link` returns `{ url, permission, active }`
- API endpoint: `DELETE /tasks/{id}/share-link` deactivates the link
- When an unauthenticated user opens the link: redirect to login/register, then redirect back to the task with the share automatically applied post-auth

---

## Recommendation 2 — Establish Strict Visual Hierarchy on the Dashboard

### The problem
The brief lists five simultaneous data points for the Dashboard:
1. Total task count
2. Completed task count
3. Tasks with upcoming deadlines
4. Progress per subject
5. Overdue tasks

Without a defined priority order, a developer building this screen will likely render all five sections at equal visual weight — producing a wall of information that feels like a status report rather than an actionable view. Students in high-stress periods (exam weeks, multiple deadlines) will experience this as noise and skip the dashboard entirely, navigating directly to whatever subject they already know they need.

The irony: the more overloaded the student is, the less useful the dashboard becomes — exactly when they need it most.

### The decision
The dashboard renders sections in a fixed priority order determined by urgency, not by brief order:

**Priority 1 — Overdue Tasks (shown conditionally)**
- Shown only when at least one task is overdue
- Visually dominant: red background or left border, positioned at the very top
- Each row shows: task name, subject tag, days overdue
- When zero overdue tasks exist → section is entirely hidden (no empty state, no placeholder)

**Priority 2 — Upcoming Deadlines**
- Top 3–5 tasks sorted by nearest deadline
- Relative time labels: "Due today", "Due tomorrow", "Due in 3 days" (not absolute dates)
- Each row shows: task name, subject tag, relative deadline
- Always visible (can show empty widget if no tasks exist within the next 7 days)

**Priority 3 — Per-Subject Progress**
- Compact list: subject name + "X/Y tasks" + mini progress bar
- Ordered by lowest completion percentage first (most at-risk subjects at top)
- Tappable rows navigate to Subject Detail

**Priority 4 — Summary Stats**
- Total tasks / Completed count
- Positioned last, in a less prominent visual treatment (smaller cards, lower contrast)
- These are informational, not actionable — they do not warrant top placement

**Special state — All tasks complete:**
- Overdue section: hidden
- Upcoming: hidden or shows "No pending deadlines"
- Progress bars: all at 100%
- A brief celebratory message replaces the overdue section slot

**Special state — Zero tasks (new user who skipped onboarding):**
- No metric cards or progress bars rendered at all
- Single full-width card: "Add your first subject to get started" with CTA button
- This prevents the absurd state of showing "Total: 0 / Completed: 0" to someone who just registered

### Where this is applied
- `03-information-architecture.md` — Screen 4 (Dashboard): full element list and priority order specified
- `04-user-flows.md` — Flow 3 (Monitor Progress): dashboard interaction with overdue task resolution
- `02-user-stories.md` — M1, M3: user stories that depend on this hierarchy working correctly

### What this requires technically
- Dashboard API should return: `{ overdue: [], upcoming: [], subjects: [{ name, done, total }], stats: { total, completed } }`
- Frontend renders sections conditionally based on array length (empty overdue array → section not mounted)
- Subject list in response should be pre-sorted by completion percentage ascending

---

## Recommendation 3 — Add a Guided Onboarding for First-Time Users

### The problem
The brief describes a feature-complete product but says nothing about the first two minutes of a new user's experience. This is the highest drop-off moment in task management tools across all demographics.

A student who registers and arrives at a blank dashboard with no guidance will close the tab. The dashboard, designed to show progress, shows nothing. The subjects list, designed to show subjects, shows nothing. Every empty state requires the student to already understand the product's mental model — that tasks live inside subjects, that subjects must be created first — before they can do anything.

This is a cold-start problem. Without solving it, the product's activation rate (users who take a meaningful action after registering) will be low regardless of how good the core feature set is.

### The decision
A two-step guided prompt is shown on first login only. It uses only features already specified in the brief — no new functionality is needed.

**Trigger:** First successful login (or first login after registration). A flag `onboarding_completed` is set on the user record; once true, the flow never appears again.

**Step 1 — Create your first subject:**
```
Screen prompt: "What subject do you have homework for today?"
Input: text field — placeholder: "e.g. Mathematics, English, Physics..."
Actions: [Next] [Skip for now]
```
- If the user clicks "Next": subject is created, proceed to Step 2
- If the user clicks "Skip for now": onboarding dismissed, user arrives at empty Dashboard with a persistent (non-modal) nudge card — not a blocking modal

**Step 2 — Add your first task:**
```
Screen prompt: "Add a task for [Subject Name]"
Inputs: Title (required), Deadline (optional), Priority (optional, default: Medium)
Actions: [Create task] [Skip]
```
- If the user clicks "Create task": task is created in the subject from Step 1
- If the user clicks "Skip": subject from Step 1 exists but has no tasks; user lands on empty Subject Detail

**Step 3 — Completion:**
```
Message: "You're all set. [Subject Name] is ready."
CTA: [Go to my tasks] → navigates to Subject Detail for the created subject
```

**If onboarding is skipped entirely (Step 1 → Skip):**
- Empty Dashboard shows a single full-width card: "Add your first subject to get started" with a "+ Add Subject" button
- This card disappears permanently once the user has created at least one subject
- No modal, no forced walkthrough — the student can always find their way in organically

**Why 2 steps and not more:**
Three or more onboarding steps consistently increase abandonment. Two steps match the minimum viable mental model: "subjects hold tasks." One step would leave the user with a subject but no task — an incomplete loop with no "first win" moment.

### Where this is applied
- `03-information-architecture.md` — Screen 3 (Onboarding): full step specification, skip behavior, and edge cases
- `04-user-flows.md` — Flow 1 (Full Task Lifecycle, New User): onboarding as the entry path; Alternative Path 3 (Onboarding skip + re-engagement)
- `02-user-stories.md` — O1 (create task in under 30 seconds): onboarding provides the first instance of this

### What this requires technically
- User model: add `onboarding_completed: boolean` field (default false)
- On first login: frontend checks this flag; if false, render Onboarding instead of Dashboard
- Subject creation and task creation in onboarding use the same API endpoints as the main flow — no special-case backend logic needed
- On completing Step 3 or skipping: `PATCH /users/me` sets `onboarding_completed: true`
