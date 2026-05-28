# User Flows — Student Task Tracker

> Includes: happy path + 2 alternative paths (error / drop-off)
> Reflects all three UX recommendations as applied design decisions.

---

## Flow 1 — Happy Path: Full Task Lifecycle (New User)

```
[Landing / Login]
    → (new user clicks "Register" tab)
    → [Registration Form]
        → (fills: name, email, password — clicks "Create account")
        → [Onboarding — Step 1]
            → (types "Mathematics" as first subject — clicks "Next")
            → [Onboarding — Step 2]
                → (fills: title "Calculus HW #3", deadline: tomorrow, priority: High)
                → (clicks "Create task")
                → [Onboarding — Step 3: "You're all set"]
                    → (clicks "Go to my tasks")
                    → [Subject Detail — Mathematics]
                        (task "Calculus HW #3" | High | due tomorrow is visible)
                        → (user clicks task row)
                        → [Task Detail — Calculus HW #3]
                            → (user clicks "Mark as Done")
                            → [Task Detail — status: Done, button changes to "Mark as New"]
                                → (user navigates to Dashboard via bottom nav)
                                → [Dashboard]
                                    Overdue section: hidden (no overdue tasks)
                                    Upcoming deadlines: empty (task is done)
                                    Per-subject progress: Mathematics 1/1 (100%)
                                    Summary: Total 1 / Completed 1
```

---

## Flow 2 — Happy Path: Share a Task via Link (Recommendation 1 Applied)

```
[Subject Detail — Mathematics]
    → (user clicks task "Database Lab Project")
    → [Task Detail — Database Lab Project]
        → (user clicks "Share")
        → [Share Task Modal]
            → (user clicks "Copy link" — Method B)
            → (selects permission: "Can edit")
            → (clicks "Copy")
            → [Share Task Modal — toast: "Link copied to clipboard"]
                → (user pastes link into Telegram group chat)
                → [Teammate opens link in browser]
                    → [Login / Registration prompt — not logged in]
                        → (teammate registers or logs in)
                        → [Shared With Me — "Database Lab Project" appears]
                            → (teammate clicks task)
                            → [Task Detail — Database Lab Project]
                                (Edit button is visible — "Can edit" permission)
                                → (teammate changes status to "In Progress", clicks Save)
                                → [Task Detail — status updated]
```

---

## Flow 3 — Happy Path: Monitor Progress Across Subjects

```
[Dashboard]
    Overdue section: "History Essay" — overdue 1 day (red, top)
    Upcoming: "Math Lab" — due tomorrow, "Physics Test" — due in 3 days
    Per-subject: Math 3/7 | Physics 1/4 | History 2/5 | Programming 8/8

    → (user clicks "History Essay" in overdue section)
    → [Task Detail — History Essay]
        → (user clicks "Edit")
        → [Task Edit Form — pre-filled]
            → (user updates deadline to tomorrow, clicks Save)
            → [Task Detail — History Essay — deadline updated]
                → (user navigates back to Dashboard)
                → [Dashboard]
                    Overdue section: hidden (History Essay no longer overdue)
                    Upcoming: "History Essay" now appears in upcoming deadlines
```

---

## Alternative Path 1 — Error Flow: Registration Failure + Recovery

```
[Landing / Login]
    → (user clicks "Register" tab)
    → [Registration Form]
        → (user enters email already registered, submits)
        → [Registration Form — inline error:
           "This email is already registered. Log in instead?"]
            → (user clicks "Log in instead" — email carries over to login form)
            → [Login Form — email pre-filled]
                → (user enters incorrect password)
                → [Login Form — inline error: "Incorrect password. Forgot it?"]
                    → (user clicks "Forgot password")
                    → [Password Reset — email pre-filled, user submits]
                        → [Login Form — toast: "Reset link sent to your email"]
                            (user opens email, clicks reset link, sets new password)
                            → [Login Form]
                                → (user logs in with new password)
                                → [Dashboard]
```

---

## Alternative Path 2 — Drop-off Risk: Sharing via Email Fails

```
[Task Detail — "Group Presentation"]
    → (user clicks "Share")
    → [Share Task Modal]

        --- ATTEMPT 1: Method A (email search) ---

        → (user types classmate's email: wrong address)
        → [Share Task Modal — error:
           "No account found. Share via link instead?"]
            → (user clicks "Share via link instead" shortcut)

        --- REDIRECT TO: Method B (shareable link) ---

        → [Share Task Modal — link generator section active]
            → (user selects permission: "Can view")
            → (clicks "Copy link")
            → [Share Task Modal — toast: "Link copied"]
                → (user accidentally closes modal tab before sending link)

        ⚠️ DROP-OFF POINT: link is generated but user forgot to paste it anywhere.

        --- RECOVERY ---

        → (user re-opens Task Detail — "Shared with" section shows no users)
        → (user clicks "Share" again)
        → [Share Task Modal — previously generated link still active]
            (link is persistent until revoked — user can copy it again)
            → (user copies and sends link this time)
            ✓ Task shared successfully
```

---

## Alternative Path 3 — Onboarding Skip + Re-engagement

```
[Onboarding — Step 1]
    → (user clicks "Skip for now")
    → [Dashboard — empty state]
        No metric cards shown.
        Single card: "Add your first subject to get started" [+ Add Subject button]

        → (user closes the browser — returns the next day)
        → [Login Form]
            → (user logs in)
            → [Dashboard — empty state still shown, onboarding not repeated]
                → (user clicks "+ Add Subject" on the empty state card)
                → [Subjects List — inline subject creation modal opens]
                    → (user creates "Physics")
                    → [Subjects List — "Physics" card, 0 tasks]
                        → (user enters subject, adds first task)
                        → [Subject Detail — Physics — task visible]
                            → (user navigates to Dashboard)
                            → [Dashboard — progress now visible: Physics 0/1]
```

---

## Flow Summary Table

| Flow | Path | Key Risk | Mitigation Applied |
|------|------|----------|--------------------|
| New user first login | Onboarding → first task created | Empty dashboard causes drop-off | Guided 2-step onboarding (Rec. 3) |
| Share task | Copy link → send via any channel | Email search fails for unknown users | Shareable link as primary path (Rec. 1) |
| Monitor progress | Dashboard → subject progress rows | All widgets look equally important | Overdue section dominates visually (Rec. 2) |
| Registration failure | Email taken → recover to login | User frustrated, bounces | Email carries over, direct "Log in" link |
| Sharing drop-off | Link generated but not sent | Link is lost | Links persist until revoked — always re-copyable |
