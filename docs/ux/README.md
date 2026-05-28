# UX Documentation — Student Task Tracker

> Source: Brief.pdf  
> Platform: Web (React + Python REST API)  
> Audience: Students of schools, colleges, and universities

---

## Contents

| File | Description |
|------|-------------|
| [01-personas.md](01-personas.md) | 3 user personas derived from the brief |
| [02-user-stories.md](02-user-stories.md) | User stories per persona, MoSCoW prioritized |
| [03-information-architecture.md](03-information-architecture.md) | All screens: purpose, elements, transitions, edge cases |
| [04-user-flows.md](04-user-flows.md) | Happy path + 2 alternative paths (error / drop-off) |
| [05-recommendations.md](05-recommendations.md) | 3 UX recommendations applied as concrete design decisions |

---

## Applied Recommendations Summary

### 1. Shareable link for tasks (Screen 9 — Share Modal)
Email-only user discovery causes the sharing feature to fail silently for most students.
A link-based sharing path (with permission scoping) is added alongside email search.
Full spec: `03-information-architecture.md` Screen 9, `04-user-flows.md` Flow 2.

### 2. Dashboard visual hierarchy (Screen 4 — Dashboard)
Five equal-weight data points become noise under stress. The dashboard renders sections
in fixed priority order: Overdue → Upcoming → Per-subject progress → Summary stats.
Overdue section is hidden when empty. Full spec: `03-information-architecture.md` Screen 4.

### 3. Guided onboarding for first-time users (Screen 3 — Onboarding)
An empty dashboard is the highest drop-off point for new users. A 2-step guided flow
(create subject → add first task) runs on first login only, creating a "first win" before
the student sees the full product. Full spec: `03-information-architecture.md` Screen 3.

---

## Clarifications Assumed (not in brief)

| Topic | Assumption |
|-------|------------|
| User discovery for sharing | Search by email + shareable link |
| Notifications | None in v1 |
| Business model | Free (academic/portfolio project) |
| Mobile | Responsive web design required |
| Onboarding | Guided 2-step flow on first login |
