# Rainbow Food List — Static Prototype

A fully-working, **static** prototype of the Rainbow Food List web app — a nutrition
guide and personalized, condition-aware diet suggestion system for Bangladesh.

Built with **plain HTML, CSS and JavaScript**: no framework, no build step, no backend.
All data is static (in `data/`) and everything you create is stored in the browser
(`localStorage` / `sessionStorage`). The "AI" recommendation engine is a deterministic,
explainable rule engine written in vanilla JS.

---

## Run it

No build or install needed.

```bash
# Option 1 — just open the file
open index.html            # macOS  (or double-click it)

# Option 2 — serve locally (recommended for consistent behaviour)
python3 -m http.server 8000
# then open http://localhost:8000
```

Or deploy the folder as-is to any static host (GitHub Pages, Netlify, Vercel, S3).

---

## Demo roles

Use the **🎭 Demo roles** menu in the header (or the cards on the landing page) to jump
into any persona instantly — no password needed:

| Persona | Highlights |
| --- | --- |
| Health-conscious (Rahim) | Baseline free experience |
| Diabetes (Fatima) | Carb/sugar/glycemic filtering, low-GI picks |
| Kidney disease – CKD (Karim) | Stage-aware sodium/potassium/phosphorus/protein limits |
| Vegetarian + heart (Nusrat) | Hard exclusions, plant-based swaps, low-sodium |
| Budget-conscious (Jashim) | Cheapest-first ranking, Bangla UI |
| Premium (Ayesha) | 7-day chart + nutritionist review flow |
| Content admin (Admin) | Food CRUD, review queue, guidance & feedback |

Seeded login also works: `rahim@demo.bd` / `demo1234` (admin: `admin@demo.bd` / `admin1234`).

---

## What's included (by phase)

- **Phase 0 — Foundations:** design tokens (green + blue with orange accent), component
  library, responsive app shell, hash router.
- **Phase 1 — Auth & roles:** mock sign-up/in, session, route guards, demo role switcher.
- **Phase 2 — Profile:** multi-step onboarding wizard, health profile, computed targets.
- **Phase 3 — Explorer:** 58 local foods, search (English + Bangla), filters, detail with
  per-portion nutrition, condition flags, bookmarks, recently viewed.
- **Phase 4 — Engine:** explainable recommendations with a "why" for every pick,
  hard exclusions for allergies/diets, condition penalties, filtered-out explanations.
- **Phase 5 — Diet chart:** generated daily plan with portions, swaps, alternatives,
  budget mode, premium weekly chart, print view.
- **Phase 6 — Dashboard:** intake logging, energy ring + macro bars, condition-limit
  warnings, 7-day trend, plain-language insights.
- **Phase 7 — Premium:** plan comparison, mock subscribe/cancel, nutritionist review
  request with a status tracker.
- **Phase 8 — Admin:** overview, food add/edit/retire, review→publish queue, editable
  disclaimers & condition guidance, feedback inbox.
- **Phase 9 — i18n & safety:** English/Bangla toggle, disclaimers everywhere,
  feedback/report a problem.
- **Phase 10 — Polish:** keyboard/ARIA support, AA contrast, reduced-motion, responsive,
  reset-demo-data control.

---

## Project structure

```
index.html            app shell + script loading order
css/  tokens.css  base.css  components.css  pages.css
js/   i18n.js state.js ui.js charts.js auth.js profile.js engine.js router.js app.js
js/pages/  landing auth home explore food-detail bookmarks onboarding profile
           recommendations diet-chart dashboard premium admin help settings
data/ content.js conditions.js rules.js foods.js substitutions.js users.js
      mealPlans.js feedback.js
docs/ project-requirements.md       (PRD)
      prototype-build-phases.md     (this build plan)
```

Key extension point: tweak the engine via `data/rules.js` (thresholds and weights) and
`js/engine.js`, and the food database in `data/foods.js` — no code changes needed for
content edits (admins can also edit at runtime).

---

## Notes & limitations

- Prototype only: no real backend, database, payments, or ML model.
- The "AI" is a rule-based scoring engine — deterministic and explainable by design.
- Condition thresholds are simplified for demonstration and **must be validated by a
  qualified nutritionist** before any real use. Every recommendation shows a
  *not-medical-advice* disclaimer.
- Data stays in the browser; use **Settings → Reset demo data** to restore seeds.
