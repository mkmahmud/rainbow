# Rainbow Food List — Static Prototype Build Plan (Phases)

> **Purpose of this document.** This is the phased build plan for a **clickable, fully-working static prototype** of the Rainbow Food List web app. It defines *what to build, in what order, and how we know each phase is done*. It does **not** contain the code itself.
>
> **Companion document:** `docs/project-requirements.md` (the PRD — requirements-level source of truth). All feature IDs referenced here (FR-x, NFR-x) come from that PRD.

---

## 1. Prototype Scope & Constraints

The prototype proves the **user experience and the logic flow** end-to-end. It is intentionally not the production system.

| Aspect | Prototype decision |
| --- | --- |
| Stack | Plain **HTML, CSS, JavaScript** only. No React/Vue, no build step, no npm. |
| Data | **Static**: hardcoded in JS/JSON files (`foods`, `conditions`, `rules`, sample users, logs, plans). |
| "AI" engine | Simulated by a **deterministic rule engine written in vanilla JS** (scoring + condition filters). No real model. |
| Auth | **Mock auth** using `localStorage` (register/login/logout, role selection). No server. |
| Persistence | Browser `localStorage` + `sessionStorage` only. No database, no API. |
| Platform | **One responsive web app** that serves *every* role (see Section 3). Desktop + mobile widths. |
| Localization | Static Bangla/English string toggle (no i18n library). |
| Hosting | Any static host (GitHub Pages / Netlify / local `file://`). |
| Safety | Every recommendation carries the *not-medical-advice* disclaimer (NFR-8). |

### 1.1 What "fully working" means here
Every button, form, filter, chart, and navigation path must actually function against the static data. No dead links, no "coming soon" placeholders on in-scope screens. Refreshing the page must not lose the user's mock session or logged data.

### 1.2 Explicitly out of scope for the prototype
- Real backend, database, or API (Phase 2–5 of the project plan).
- Real machine-learning model or real AI API calls.
- Real payment gateway (premium is a mock toggle).
- Real SMS/email, real auth security, real Bangla ML translation.
- Wearables, diagnosis, real dietitian video calls (per PRD §6.2).

---

## 2. Design System (Theme: Green + Blue with Orange)

Green = nutrition/health/trust. Blue = data/technology/calm. Orange = energy/urgency/CTA. Rule of thumb: **green and blue carry the UI, orange is reserved for calls-to-action, alerts, and highlights only** (never large background fills).

### 2.1 Color palette (CSS custom properties)

| Token | Hex | Use |
| --- | --- | --- |
| `--green-900` | `#1B5E20` | Headings on light, dark green surfaces |
| `--green-600` | `#2E7D32` | **Primary** buttons, active nav, health/positive states |
| `--green-400` | `#66BB6A` | Accents, chart series 1, hover tints |
| `--blue-900` | `#0D47A1` | Deep headers, dark surfaces |
| `--blue-600` | `#1565C0` | **Secondary** buttons, links, info states |
| `--blue-400` | `#42A5F5` | Chart series 2, secondary accents |
| `--orange-600` | `#EF6C00` | **Accent / CTA**, warnings, badges |
| `--orange-400` | `#FFA726` | Highlights, chart series 3, focus ring |
| `--bg` | `#F4F7FA` | App background |
| `--surface` | `#FFFFFF` | Cards, panels, modals |
| `--text` | `#16232E` | Primary text |
| `--muted` | `#5B6B7B` | Secondary text, captions |
| `--border` | `#DCE3EA` | Dividers, input borders |
| `--danger` | `#C62828` | Hard exclusions, exceeded-limit alerts |
| `--success` | `#2E7D32` | On-target / positive |
| `--warning` | `#EF6C00` | Approaching a limit |

- **Gradient (brand surfaces / hero):** `linear-gradient(135deg, var(--green-600), var(--blue-600))`.
- **Contrast:** all text pairs meet WCAG AA (NFR-6). Orange text is only used on white for large/bold text or on dark backgrounds.

### 2.2 Typography, spacing, components
- **Font:** system stack (`-apple-system, Segoe UI, Roboto, sans-serif`), scalable base size (respects zoom for accessibility).
- **Scale:** 12 / 14 / 16 / 20 / 24 / 32 px. **Spacing:** 4-8-12-16-24-32 px scale.
- **Radius:** 8 px (inputs/buttons), 16 px (cards), pill for chips/badges.
- **Component inventory (build once, reuse):** buttons (primary/secondary/ghost/danger), input, select, chip/tag, card, modal, toast, table, tabs, accordion, progress bar, nutrient bar, badge, avatar, empty-state, disclaimer banner, chart card.
- **A tiny `components.css` + `ui.js` helper set** so no page reinvents markup.

---

## 3. Roles & Access Matrix (one web app, all roles)

All roles live inside the same SPA-like static app. The mock login picks a role; the header/nav renders the appropriate menu. A **demo account switcher** in the footer/profile menu lets reviewers jump between roles instantly (no password needed) so every persona can be shown.

| Role (from PRD §4) | Sees | Key screens |
| --- | --- | --- |
| Guest | Public landing, food lookup (limited), auth | Landing, Sign in / Sign up, Food search (read-only) |
| Health-conscious user | Full free tier: profile, explore, recommendations, dashboard | Home, Profile, Explore, Recommendations, Dashboard |
| Chronic-condition patient | Same as above **+ condition-aware** limits, warnings, safe-food filters | Profile (conditions), Recommendations, Dashboard (limit alerts) |
| Dietary-restricted / vegetarian | Same + hard-exclusion filters + plant-based alternatives | Profile (allergies/diet), Explore, Alternatives |
| Budget-conscious user | Same + cost-tier filters and cheapest-first ranking | Profile (budget), Explore, Recommendations (budget mode) |
| Premium user | Everything + AI diet chart + nutritionist review request | Diet Chart, Nutritionist Review, Subscription |
| Admin / Content staff | Content console: manage foods, condition guidance, review queue, disclaimers, feedback | Admin Dashboard, Food CRUD, Review Queue, Feedback Inbox |

*Free vs premium boundaries and condition behavior are demoed with static data (see Phases 4, 7).*

---

## 4. Information Architecture / Screen Map

```
Public
├── Landing / Hero (brand gradient, value props, disclaimers)
├── Sign In / Sign Up (mock)
└── Food Search (guest, read-only)

App (authenticated)
├── Home / Today (summary cards, quick actions)
├── Explore Foods
│   ├── Search + filters (category, condition-safe, cost tier, plant-based)
│   ├── Food Detail (per-portion nutrients, condition flags, alternatives, bookmark)
│   └── Bookmarks / Recently viewed
├── Profile & Health
│   ├── Onboarding wizard (multi-step)
│   └── Edit profile (conditions, allergies, goals, budget, language)
├── Recommendations
│   ├── Suggestion list (with "why" reason)
│   ├── Meal planner / Diet chart (premium)
│   └── Alternatives & low-cost swaps
├── Dashboard
│   ├── Intake logging
│   ├── Targets vs intake (energy, macros, condition nutrients)
│   └── Trends + limit warnings
├── Premium
│   ├── Plan comparison (free vs premium)
│   └── Nutritionist review request (async, mock)
├── Admin (staff role only)
│   ├── Food management (add/edit/retire)
│   ├── Review/approval queue
│   ├── Condition guidance & disclaimers
│   └── Feedback inbox
└── Shared: Settings, Language toggle, Not-medical-advice disclaimer, Logout
```

---

## 5. Static Data Model (files under `/data`)

All data is authored by hand (seeded from the PRD's data requirements, §9). Keep it small but realistic — roughly 40–60 local foods is enough to demo searching, filtering, ranking, and charts.

| File | Shape (sketch) | Used by |
| --- | --- | --- |
| `foods.js` | `{ id, nameEn, nameBn, category, portionLabel, per100g:{energy,protein,carbs,fat,fiber}, perPortion:{...}, micros:{sodium,potassium,phosphorus,satFat,sugar,glycemic}, costTier, isPlantBased, allergens:[], source }` | Explore, Recommendations, Dashboard |
| `conditions.js` | `{ id, nameEn, nameBn, nutrientsOfConcern:[], description }` | Profile, rule engine |
| `rules.js` | Thresholds/limits per condition + stage (e.g. CKD stage sodium/potassium/phosphorus). **Configurable, not hardcoded in pages.** | Rule engine, Dashboard warnings |
| `substitutions.js` | `{ foodId, alternatives:[{foodId, reason}] }` or nutrient-similarity computed at runtime | Alternatives, swaps |
| `users.js` | 3–4 seeded demo profiles (healthy, diabetic, CKD, vegetarian/budget), plus premium flag | Role switcher, testing |
| `mealPlans.js` | Sample diet charts (free basic + premium full) | Diet chart, Dashboard |
| `content.js` | FAQ, disclaimers, condition guidance text, string table (EN/BN) | Static pages, localization |
| `feedback.js` | Seeded feedback/report entries | Admin inbox |

**Note:** Because there is no backend, anything the user "creates" (profile edits, logs, bookmarks, feedback, food edits) is written to `localStorage` on top of these seeds and merged at load. Provide a **Reset demo data** button in Settings.

---

## 6. Phased Build Plan

Each phase lists: **Goal → Deliverables → Key tasks → Data → Acceptance criteria (DoD).**
Build phases in order; each ends in a demoable state.

---

### Phase 0 — Foundations & Design System
**Goal:** A styled, navigable skeleton that proves the theme and layout before any features.

**Deliverables**
- Project folder structure (`/css`, `/js`, `/data`, `/assets`, pages).
- `tokens.css` (palette + spacing + typography above) and `base.css` (reset, layout primitives).
- `components.css` + `ui.js`: buttons, cards, inputs, chips, badges, modal, toast, tabs.
- App shell: responsive header (logo, nav, language toggle, role/profile menu), footer with disclaimer, mobile drawer nav.
- Lightweight **hash router** (`#/explore`, `#/dashboard`, …) in vanilla JS so pages share one shell.

**Data:** `content.js` string table (EN/BN) with just enough labels.

**Acceptance criteria**
- Theme renders exactly per palette; green/blue dominate, orange only on CTAs/alerts.
- Header/footer/shell are responsive down to 360 px and up to 1440 px.
- Router navigates between blank placeholder screens without full page reloads.
- Header contrast passes WCAG AA.

---

### Phase 1 — Mock Auth, Roles & Session
**Goal:** Users can sign up/in, pick a role, and the app renders the right navigation. (FR-1.1)

**Deliverables**
- Sign Up / Sign In forms with client-side validation.
- `auth.js`: mock user store in `localStorage`; session in `sessionStorage`; logout.
- **Demo role switcher** (Guest / Healthy / Diabetic / CKD / Vegetarian / Budget / Premium / Admin).
- Route guards: guest vs authenticated vs admin-only screens.

**Data:** `users.js` seeded demo accounts.

**Acceptance criteria**
- Can register, log in, log out, and stay logged in across refresh.
- Each role shows the correct nav items and is blocked from screens it should not see.
- Admin role is the only one that can open `/admin`.

---

### Phase 2 — Onboarding & Health Profile
**Goal:** Capture the full profile that drives all personalization. (FR-1.2, FR-1.3, FR-1.4)

**Deliverables**
- Multi-step onboarding wizard: basics → anthropometrics → activity → goals → conditions → allergies/diet → budget/language.
- Profile edit screen with live-updating summary (BMI, derived daily targets).
- Validation, progress indicator, save-to-`localStorage`.

**Data:** `conditions.js`; target-calculation helpers (energy/macros) in `profile.js`.

**Acceptance criteria**
- Completing the wizard produces a stored profile and a computed target set.
- Editing any field updates derived targets immediately.
- Allergies/diet selections appear as hard exclusions later (Phase 4).

---

### Phase 3 — Food & Nutrition Explorer
**Goal:** Browse/search foods and see full composition with condition relevance. (FR-2.1–FR-2.5)

**Deliverables**
- Explore screen: search box, category filter, condition-safe filter, cost-tier filter, plant-based filter, sort.
- Food Detail: per-portion **and** per-100g nutrients, micronutrients, condition flags (sodium/potassium/phosphorus/sugar/sat fat), cost tier, source citation.
- Bookmarks + recently viewed (localStorage).
- Empty, loading, and no-results states.

**Data:** `foods.js` (40–60 items), `conditions.js`.

**Acceptance criteria**
- Search matches English + Bangla names; filters combine correctly; result count is accurate.
- Every food shows portion-based values (FR-2.2) and key condition nutrients (FR-2.3).
- Bookmarking persists across refresh and appears on the Bookmarks screen.

---

### Phase 4 — Rule Engine & Personalized Recommendations
**Goal:** The core "AI" — deterministic, condition-aware, explainable suggestions. (FR-3.1–FR-3.3, FR-3.7)

**Deliverables**
- `engine.js`: scoring pipeline — hard exclusions (allergies/diet) → condition limit filtering → goal/preference/budget scoring → ranked output.
- `rules.js`: configurable thresholds per condition (diabetes carb/glycemic; heart sodium/sat fat; CKD stage-aware sodium/potassium/phosphorus/protein).
- Recommendation list UI: each card shows the food, portion, fit score, and a plain-language **"why suggested"** reason; flagged items show why they were flagged or filtered out.
- "Regenerate" and "exclude this food" controls (FR-3.6).

**Data:** `foods.js`, `rules.js`, `conditions.js`, `substitutions.js`.

**Acceptance criteria**
- A diabetic, a CKD, and a heart-disease profile each produce visibly different, correct suggestions.
- A declared allergy/diet is never suggested (hard exclusion demonstrable).
- Every suggestion displays a reason; excluded items explain the exclusion.
- Regenerate/exclude change the output and the change is explainable.

---

### Phase 5 — Diet Chart, Alternatives & Affordability
**Goal:** Turn suggestions into a plan, with safe swaps and budget-aware options. (FR-3.4, FR-3.5, FR-4.1–FR-4.4, FR-6.1)

**Deliverables**
- Meal planner / **diet chart** (breakfast/lunch/dinner/snacks) with portions and daily totals vs targets.
- Free basic chart vs premium full chart (gated — see Phase 7).
- Alternative suggestions: nutrient-similar swaps and **plant-based** alternatives for animal products.
- **Budget mode**: cheapest-first ranking, low-cost nutrient-dense highlighting.
- Print / export chart to a print-friendly view.

**Data:** `mealPlans.js`, `substitutions.js`, `foods.js`.

**Acceptance criteria**
- A generated chart totals energy/macros and respects condition limits.
- Swapping a food updates the day totals immediately.
- Plant-based alternatives are offered for every animal-based item.
- With budget mode on, ranking visibly favors lower cost tiers (FR-4.4).

---

### Phase 6 — Progress Dashboard & Insights
**Goal:** Log intake and see progress, trends, and limit warnings. (FR-5.1–FR-5.5)

**Deliverables**
- Intake logging (search-based add, portion adjust, meal assignment).
- **Pure-CSS/SVG charts** (no chart library): energy ring, macro bars, condition-nutrient bars, 7-day trend line.
- Intake vs targets with **green (on-target) / orange (approaching) / red (exceeded)** states.
- Plain-language insights and warnings; adherence indicator.

**Data:** `rules.js` + logged entries in `localStorage` (seeded history for demo).

**Acceptance criteria**
- Logging a food updates all charts and totals instantly.
- Approaching/exceeding a condition limit triggers the correct colored warning.
- Trend view shows the last 7 days from seeded + user-logged data.
- Charts render on mobile without horizontal scroll.

---

### Phase 7 — Premium Tier & Nutritionist Review (mock)
**Goal:** Demonstrate the free/premium split and async human review. (FR-6.1–FR-6.4)

**Deliverables**
- Plan comparison page (free vs premium) with clear feature boundaries.
- Mock **subscribe/upgrade** toggle that flips the premium flag (no real payment).
- Gated premium screens: full AI diet chart, nutritionist review request form + status tracker (Requested → In review → Reviewed) with a seeded response.

**Data:** `mealPlans.js`, `content.js`, seeded review record.

**Acceptance criteria**
- Non-premium users see the upgrade prompt instead of premium content.
- Upgrading unlocks premium screens immediately; downgrading re-locks them.
- Review request is created, stored, and its status advances through the mock states.

---

### Phase 8 — Admin / Content Console
**Goal:** Show how staff maintain data and guidance. (FR-7.1–FR-7.4)

**Deliverables**
- Admin dashboard (counts: foods, pending reviews, feedback, condition rules).
- **Food management**: list, add, edit, retire; validation; **preview** of how a food appears to users.
- **Review/approval queue**: draft → review → published workflow on static records.
- **Condition guidance & disclaimers** editor (text stored in `content.js` overlay).
- **Feedback inbox**: read seeded + user-submitted feedback, mark resolved (FR-5.4).

**Data:** `foods.js`, `content.js`, `feedback.js` + localStorage overlays.

**Acceptance criteria**
- Adding/editing a food changes what appears in Explore and Recommendations.
- Only admin routes are reachable by the admin role.
- Each food record shows a source/version field (FR-7.4, C-4).
- Publishing a draft moves it to the review queue and then to published.

---

### Phase 9 — Localization, Safety & Feedback Loop
**Goal:** Bangla/English, disclaimers everywhere, and user feedback. (FR-1.3, FR-5.4, NFR-7, NFR-8)

**Deliverables**
- EN/BN toggle switching all UI strings and food names (static table).
- **Not-medical-advice disclaimer** on every recommendation, diet chart, and condition screen.
- Feedback & "report this recommendation" forms wired to the admin inbox.
- Onboarding tips / help/FAQ page from `content.js`.

**Acceptance criteria**
- Toggling language flips strings without a reload and persists across refresh.
- The disclaimer is present on all in-scope screens (auditable list).
- Submitted feedback appears in the admin inbox.

---

### Phase 10 — Polish, Accessibility, QA & Deployment
**Goal:** Ship a dependable, reviewable demo. (NFR-1, NFR-6, NFR-10)

**Deliverables**
- Accessibility pass: keyboard nav, focus rings (orange), ARIA on interactive components, alt text, AA contrast.
- Responsive/device pass (360 / 768 / 1024 / 1440 px).
- Cross-browser check (Chrome, Firefox, Safari, Edge).
- Performance pass: no unnecessary re-renders, images optimized, instant interactions.
- **QA checklist** executed (Section 7), bug fixes, and a **Reset demo data** control.
- Deploy to a static host; write a short `README` (how to run + how to demo each role).

**Acceptance criteria**
- Full click-through of every role with no dead ends or console errors.
- Keyboard-only run of the core flow (login → profile → recommend → log → dashboard).
- Deployed URL loads fast and works on a mid-range mobile device.

---

## 7. Definition of Done / QA Checklist

- [ ] All in-scope screens from the Screen Map exist and render.
- [ ] Every role's nav and route guards are correct.
- [ ] All buttons/forms/filters/sorts do something real (no dead controls).
- [ ] Recommendations respect allergies (hard exclusion) and condition limits.
- [ ] Dashboard numbers match the underlying logged data.
- [ ] Language toggle and disclaimer banner work everywhere.
- [ ] No console errors; no broken links; refresh preserves state.
- [ ] Responsive at 360/768/1024/1440 px; keyboard accessible; AA contrast.
- [ ] Reset demo data restores the seeded state.
- [ ] README documents how to run and demo.

---

## 8. Suggested Folder Structure

```
/
├── index.html               (app shell + router mount)
├── docs/                    (this plan + PRD)
├── css/
│   ├── tokens.css           (palette, spacing, type)
│   ├── base.css             (reset, layout)
│   ├── components.css       (buttons, cards, charts, etc.)
│   └── pages.css            (screen-specific)
├── js/
│   ├── router.js
│   ├── state.js             (localStorage/session merge + reset)
│   ├── auth.js
│   ├── profile.js
│   ├── engine.js            (recommendation rule engine)
│   ├── charts.js            (SVG/CSS chart helpers)
│   ├── i18n.js
│   ├── ui.js                (toast, modal, components)
│   └── pages/               (one module per screen)
├── data/
│   ├── foods.js
│   ├── conditions.js
│   ├── rules.js
│   ├── substitutions.js
│   ├── users.js
│   ├── mealPlans.js
│   ├── content.js
│   └── feedback.js
└── assets/                  (logo, icons, food images, charts)
```

---

## 9. Build Dependencies (order matters)

```
Phase 0 (shell + theme)
  └─ Phase 1 (auth/roles)
       └─ Phase 2 (profile)
            ├─ Phase 3 (explore)
            │     └─ Phase 4 (engine/recommendations)
            │           └─ Phase 5 (diet chart/alternatives/affordability)
            │                 └─ Phase 7 (premium gating)
            └─ Phase 6 (dashboard: needs Phase 3 + Phase 4)
Phase 8 (admin)  ── needs Phase 3 data
Phase 9 (i18n/safety) ── can run alongside 5–8
Phase 10 (polish/QA/deploy) ── last
```

---

## 10. Summary of Phases

| Phase | Name | Primary PRD coverage |
| --- | --- | --- |
| 0 | Foundations & Design System | NFR-6, brand theme |
| 1 | Mock Auth, Roles & Session | FR-1.1 |
| 2 | Onboarding & Health Profile | FR-1.2, FR-1.3, FR-1.4 |
| 3 | Food & Nutrition Explorer | FR-2.1–FR-2.5 |
| 4 | Rule Engine & Recommendations | FR-3.1–FR-3.3, FR-3.7 |
| 5 | Diet Chart, Alternatives & Affordability | FR-3.4, FR-3.5, FR-4.1–FR-4.4 |
| 6 | Progress Dashboard & Insights | FR-5.1–FR-5.5 |
| 7 | Premium Tier & Nutritionist Review | FR-6.1–FR-6.4 |
| 8 | Admin / Content Console | FR-7.1–FR-7.4 |
| 9 | Localization, Safety & Feedback | FR-1.3, FR-5.4, NFR-7, NFR-8 |
| 10 | Polish, Accessibility, QA & Deployment | NFR-1, NFR-6, NFR-10 |

*End of Static Prototype Build Plan.*
