# Rainbow Food List — Dashboard Reorg Build Phases

Ordered implementation plan for reorganizing the prototype into the sections in
`Rainbow Food List – Web Application – Product & UI/UX Requirements` (v1.0, October 2026)
and rebuilding the member dashboard to the approved JavaScript "Nutrigo"-style reference.

**Approach:** plain vanilla stack (HTML/CSS/JS, no build step), static seeded data with full
add/edit at runtime (localStorage). Condition-aware engine, personas, premium/review flows and
the nutritionist/admin roles are kept and the new sections are layered on top. Implemented
phase by phase, in order.

**Reference dashboard (target):** light white sidebar with grouped nav + light `#f5f7fa` page
background + white rounded cards; green accent ≈ `#4caf50`, active nav `#e8f5e9`; pastel icon
tiles per stat card. Layout: greeting banner → 5 stat tiles (Calories, Nutrition, Activity,
Weight, Calendar) → Today's Goal / Energy Balance / Health Overview / Today's Meals →
Weight Progress / Today's Activity / Market Price / AI Recommendation / Diet Summary /
Food recommendations / Next Appointment.

**Section → route map**

| Section | Route | Module |
| --- | --- | --- |
| Dashboard | `#/dashboard` | `js/dashboards/member.js` |
| My Health | `#/health` | `js/pages/my-health.js` |
| Food Explorer | `#/explore` | `js/pages/explore.js` |
| AI Diet Planner | `#/planner` | `js/pages/planner.js` |
| My Diet Chart | `#/diet` | `js/pages/diet-chart.js` |
| Activity | `#/activity` | `js/pages/activity.js` |
| Calories Burned | `#/calories-burned` | `js/pages/calories-burned.js` |
| Progress | `#/progress` | `js/pages/progress.js` |
| Goals | `#/goals` | `js/pages/goals.js` |
| Appointments | `#/appointments` | `js/pages/appointments.js` |
| Profile | `#/profile` | `js/pages/profile.js` |
| Settings | `#/settings` | `js/pages/settings.js` |
| Help | `#/help` | `js/pages/help.js` |

---

## Phase 1 — Design system & app shell reorg

**Goal:** soft green/white visual refresh and a grouped sidebar exposing all 13 sections.

**Deliverables**
- `css/tokens.css` — softened green palette, `#f5f7fa` background, pastel tint tokens.
- `js/icons.js` — new icons: heart, activity, scale, target, chart, calendar, tag, robot, clock.
- `data/content.js` — nav + group i18n keys (en + bn).
- `js/auth.js` — `App.Auth.navGroups()` returning grouped nav (MENU / ACTIVITY / PROGRESS /
  APPOINTMENTS / ACCOUNT), role-aware.
- `js/app.js` — sidebar renders groups from `navGroups()`; topbar search placeholder + role label.

**Acceptance criteria**
- Sidebar shows Dashboard, My Health, Food Explorer, AI Diet Planner, My Diet Chart, Activity,
  Calories Burned, Progress, Goals, Appointments, Profile, Settings, Help.
- Active state + mobile drawer still work; no console errors; nutritionist/admin keep their nav.

## Phase 2 — Data & state foundation

**Goal:** model and seed every new domain so screens work end-to-end.

**Deliverables**
- `data/nutritionists.js`, `data/activityTypes.js`, `data/foodPrices.js` (new data files).
- `data/foods.js` — add `benefits` + `considerations`.
- `js/state.js` — collections `weightLogs`, `activityLogs`, `goals`, `appointments`,
  `notifications` added to `seed()` and backfilled in `load()`; APIs for each; `ensureSeedHealthData`.
- `index.html` — script tags for the new data files.

**Acceptance criteria** — each persona has seeded weight/activity/appointment data that persists;
`reset()` restores seeds; existing `rfl_state_v1` migrates without crashing.

## Phase 3 — Dashboard rebuild

**Goal:** member dashboard matches the approved reference layout, fed by real data.

**Deliverables** — `js/dashboards/member.js` + `css/dashboard.css` rebuilt: greeting banner, 5 stat
tiles, Today's Goal, Energy Balance, Health Overview, Today's Meals, Weight Progress (7D/30D/3M/6M),
Today's Activity, Market Price, AI Recommendation, Diet Summary, Food recommendations, Next Appointment.

**Acceptance criteria** — dashboard is personalized to the logged-in user; trend charts read stored
logs; every tile links to its section; nutritionist/admin dashboards unchanged.

## Phase 4 — My Health, Goals, Progress

**Deliverables** — `js/pages/my-health.js`, `js/pages/goals.js`, `js/pages/progress.js`.

**Acceptance criteria** — logging a weight updates My Health, Progress and the dashboard;
goal progress computes from start/current/target; range tabs switch 7D/30D/3M/6M.

## Phase 5 — Activity & Calories Burned

**Deliverables** — `js/pages/activity.js`, `js/pages/calories-burned.js`; MET-based calorie burn.

**Acceptance criteria** — adding walking/running/cycling/exercise updates Dashboard, Energy Balance
and Progress; steps/distance/calories computed (walking 6,240 steps ≈ 4.2 km / 38 min / 210 kcal).

## Phase 6 — Food Explorer, food detail, AI Diet Planner, market price

**Deliverables** — explore + food-detail show benefits/considerations/price metadata;
`js/pages/planner.js` (generate, cost, shopping list, save, log meals); `js/pages/diet-chart.js`
rebranded as My Diet Chart; market-price tile on dashboard.

**Acceptance criteria** — planner generates a personalized plan using the profile and preferences,
shows estimated cost + shopping list, saves, and meals can be logged.

## Phase 7 — Appointments

**Deliverables** — `js/pages/appointments.js` (directory, slots, booking, history);
dashboard Next Appointment card; notifications from bookings (bell reads `State.notifications`).

**Acceptance criteria** — browse → pick slot → book → confirmation; appears in history and the
dashboard card; reminder notification created; member-only guard holds.

## Phase 8 — Onboarding / Profile / Settings alignment, states, polish

**Deliverables** — onboarding fields per §6 (name, disliked foods, meals/day, budget, editable
confirmation step); profile split (personal vs health); settings notification/privacy toggles;
loading/empty/error/success states; responsive pass; i18n for new sections.

**Acceptance criteria** — the §13 acceptance checklist is satisfied; responsive desktop/tablet/mobile;
RBAC applied to nutritionist/admin features; no console errors.

---

## Verification

No test runner exists — verify manually: serve with `python3 -m http.server 8000` (or open
`index.html`), walk every section for each demo persona, exercise the add/edit flows and confirm
cross-section updates (log weight/activity/meal/appointment), reset demo data, and check
responsive breakpoints (1240 / 1000 / 900 / 760 / 560 px).
