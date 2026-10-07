# Rainbow Food List — AI-Based Diet Suggestion System

## Project Requirements Document (PRD)

| Field | Value |
| --- | --- |
| Document type | Product & Project Requirements (requirements-level only — no design/implementation) |
| Product name | **Rainbow Food List** |
| System name | **AI-Based Diet Suggestion System** |
| Version | 1.0 |
| Status | Draft for stakeholder review |
| Primary sources | `Rainbow Food list Proposal Edited (.md/.pdf)`, `AI-Based Diet Suggestion System.docx` |
| External research | Bangladesh Food Composition Table, chronic-disease dietary guidance, AI nutrition research, Bangladesh data-protection law (sources in Appendix B) |

> **About this document.** This PRD consolidates two source documents (a *Project Charter* and a *Proposal*) that describe the same idea under two names and with several conflicting figures. It restates the idea as a single, consistent set of **requirements** and a **conceptual description of how the system works**. It deliberately does **not** cover coding, technology design, or implementation detail. Conflicts found in the source material are flagged in **Section 14** and must be resolved by stakeholders.

---

## 1. Vision

Build a free-to-use, Bangladesh-first nutrition companion that gives any user accurate food-composition data and gives each user **personalized, safe diet guidance** based on their health profile, goals, and budget — with an optional paid tier for AI-generated diet charts and professional nutritionist support.

The long-term aim is to reduce diet-related harm from chronic disease (diabetes, hypertension/heart disease, kidney disease) by turning unfamiliar nutrition data into simple, affordable, culturally appropriate food choices.

---

## 2. Problem Statement & Context

- **NCD burden is high and rising in Bangladesh.** Non-communicable diseases — hypertension, diabetes, and chronic kidney disease — are a growing share of the national disease burden, with substantial undiagnosed prevalence, especially in rural areas. Diet is a primary modifiable risk factor.
- **Nutrition data is inaccessible to ordinary users.** Authoritative composition data (e.g., the *Food Composition Table for Bangladesh*) exists but is not presented in a consumer-friendly, searchable form, and rarely in Bangla with local portion sizes.
- **Generic diet advice is unsafe for chronic conditions.** A single "healthy diet" fails people with kidney disease (who must limit sodium, potassium, phosphorus, and protein by stage), diabetes (carbohydrate/glycemic control), or heart disease (sodium, saturated fat). Advice must be **condition-aware**.
- **Affordability is a real constraint.** Many users cannot afford animal-based protein or imported "health foods"; they need the **cheapest food that meets a nutritional need**, not just the "healthiest".
- **Existing apps are not localized.** Most trackers assume Western foods and portions; a few local apps are emerging, so **local food accuracy and condition safety** is the differentiator.

---

## 3. Goals & Objectives

| ID | Objective |
| --- | --- |
| OBJ-1 | Provide detailed, searchable nutritional information (energy, protein, carbohydrate, fat, fiber, vitamins, minerals) for local foods. |
| OBJ-2 | Deliver personalized diet suggestions driven by user health data, goals, and dietary restrictions. |
| OBJ-3 | Support chronic conditions (diabetes, heart disease, kidney disease) with condition-specific guidance and safety limits. |
| OBJ-4 | Suggest low-cost, nutrient-dense **and** plant-based alternative foods that meet the same nutritional need. |
| OBJ-5 | Track progress and give understandable insights through a dashboard. |
| OBJ-6 | Offer a premium tier with AI-assisted diet charts and nutritionist support, sustaining the free tier. |

---

## 4. Target Users & Personas

| Persona | Description | Key needs |
| --- | --- | --- |
| Health-conscious individual | Wants to improve diet, manage weight, eat better. | Food lookup, simple recommendations, progress tracking. |
| Chronic-condition patient | Diabetes, hypertension/heart disease, or kidney disease, at various stages. | Condition-safe food lists, nutrient limits, warnings. |
| Dietary-restricted / vegetarian | Avoids animal products or has allergies/intolerances. | Equivalent plant-based and safe alternatives. |
| Budget-conscious user | Low income; needs affordable nutrition. | Cheapest nutrient-dense options, price-aware suggestions. |
| Premium user | Wants a structured plan / human guidance. | AI diet chart, nutritionist review. |
| Content/Admin staff (internal) | Maintains food data and guidance. | Data management, review, publication workflow. |

---

## 5. How the Idea Works (Conceptual Overview)

This is the **conceptual flow only** — no technology decisions are made here.

1. **User creates a profile.** Age, sex, height, weight, activity level, health goals, declared conditions (e.g., diabetes, CKD stage, heart disease), allergies, dietary restrictions, budget sensitivity, and language preference.
2. **User browses or asks for guidance.** They can look up any food's composition, or request a recommendation.
3. **The system computes the user's needs.** From the profile it derives targets and limits (e.g., daily energy and macronutrient targets; and for CKD, caps on sodium/potassium/phosphorus/protein).
4. **The recommendation engine matches foods to needs.**
   - It draws from a **curated food-composition database** (local foods, portions, and prices).
   - It applies **condition rules and safety constraints** so suggested foods do not violate a user's limits.
   - It ranks candidates by fit to goals, preference, availability, and **cost**.
   - It produces a **meal/diet suggestion** (foods, portions, and — in premium — a full diet chart).
5. **Alternative suggestions are offered.** If a food is unavailable, too expensive, or unsuitable, the system proposes equivalent alternatives (including plant-based) with similar nutrient contribution.
6. **User logs intake / follows the plan.** Logged consumption feeds the dashboard.
7. **The dashboard shows progress and insights.** Intake vs. targets, trends, warnings when a limit is approached, and plain-language feedback.
8. **Feedback loops back.** User feedback and outcomes inform periodic improvement of recommendations and content. Premium users may additionally have a nutritionist review their chart.

**Trust & safety is built into the flow:** every recommendation carries a *not-medical-advice* disclaimer, and condition-related suggestions are framed as guidance to discuss with a clinician.

---

## 6. Scope

### 6.1 In Scope (initial product)
- Curated food-composition database for commonly consumed local foods.
- User accounts, profiles, and health/dietary intake.
- Personalized diet recommendations (free tier: basic; premium tier: full AI diet chart).
- Condition-aware filtering/safety for diabetes, heart disease, and kidney disease.
- Plant-based / alternative and low-cost nutrient-dense suggestions.
- Progress dashboard and insights.
- Web + mobile access.
- Premium: AI-assisted diet charts and professional nutritionist review.
- Content/admin tooling to maintain the food database.

### 6.2 Out of Scope (initial product)
- Real-time human dietitian/video consultations.
- Fitness/workout tracking and exercise plans.
- Real-time integration with third-party health/wearable devices.
- Clinical diagnosis or treatment; the system does not replace medical care.
- Prescription or supplement dosing.

### 6.3 Roadmap (future, explicitly deferred)
- Wearable/fitness-device integration and holistic health insights.
- B2B/corporate wellness, white-label, and healthcare-provider partnerships.
- Deeper predictive analytics (e.g., long-term risk trends).

---

## 7. Functional Requirements

Priorities use MoSCoW: **M** = Must, **S** = Should, **C** = Could.

### 7.1 Accounts & Profiles
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1.1 | Users can register, log in, and manage an account (email/phone/social login). | M |
| FR-1.2 | Users can create/edit a health profile: age, sex, height, weight, activity level, goals (weight loss/gain/maintain, manage condition), declared conditions, allergies, dietary restrictions. | M |
| FR-1.3 | Users can declare a budget sensitivity and preferred language (Bangla/English). | S |
| FR-1.4 | Users can update their profile, and recommendations reflect changes. | M |

### 7.2 Food & Nutrition Information
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-2.1 | Users can search/browse foods and view composition: energy, protein, carbohydrate, fat, fiber, vitamins, minerals. | M |
| FR-2.2 | Data is presented per common local portion/household measure, not only per 100 g. | M |
| FR-2.3 | Each food shows its key condition-relevant nutrients (sodium, potassium, phosphorus, saturated fat, added sugar, glycemic relevance). | M |
| FR-2.4 | Foods indicate approximate local price/cost tier to support affordability guidance. | S |
| FR-2.5 | Users can save/bookmark foods and view recently viewed items. | C |

### 7.3 Personalized Recommendations
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-3.1 | System generates diet suggestions tailored to the user's profile, goals, and restrictions. | M |
| FR-3.2 | Recommendations respect declared allergies/dietary restrictions (hard exclusions). | M |
| FR-3.3 | Recommendations respect condition-specific limits for diabetes, heart disease, and kidney disease. | M |
| FR-3.4 | System can generate a structured daily/weekly diet chart (premium). | M |
| FR-3.5 | Suggestions include portion/quantity guidance. | S |
| FR-3.6 | Users can regenerate/refine suggestions (e.g., swap a meal, exclude a food). | S |
| FR-3.7 | System explains *why* a food was suggested or flagged (plain-language reason). | S |

### 7.4 Alternatives & Affordability
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-4.1 | System suggests alternative foods with similar nutritional contribution when a food is unsuitable or unavailable. | M |
| FR-4.2 | System suggests plant-based alternatives for users avoiding animal products. | M |
| FR-4.3 | System highlights low-cost, nutrient-dense foods meeting a given need. | M |
| FR-4.4 | Alternatives are ranked by cost and availability where budget sensitivity is set. | S |

### 7.5 Progress Dashboard & Feedback
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-5.1 | Users can log meals/intake (search-based; optional barcode/photo in roadmap). | M |
| FR-5.2 | Dashboard shows intake vs. targets (energy, macros, key condition nutrients) with charts. | M |
| FR-5.3 | Dashboard shows trends over time and flags approaching/exceeded limits. | S |
| FR-5.4 | Users can submit feedback and report a problem with a recommendation. | S |
| FR-5.5 | Users can track adherence to their plan and view simple progress indicators. | C |

### 7.6 Premium Services
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-6.1 | Premium users receive AI-assisted custom diet charts. | M |
| FR-6.2 | Premium users can request professional nutritionist review of their chart (asynchronous). | M |
| FR-6.3 | Subscription purchase/renewal and entitlements are managed in-app. | M |
| FR-6.4 | Free vs. premium feature boundaries are clearly communicated. | S |

### 7.7 Content & Administration
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-7.1 | Authorized staff can add/edit/retire food items and nutrient values. | M |
| FR-7.2 | Data changes go through a review/approval step before publishing. | S |
| FR-7.3 | Staff can manage condition guidance content and disclaimers. | M |
| FR-7.4 | System tracks data provenance/version for each food record. | C |

---

## 8. Non-Functional Requirements

| ID | Category | Requirement |
| --- | --- | --- |
| NFR-1 | Performance | Recommendations return fast enough for interactive use (target: within a few seconds for a diet chart; near-instant for food lookups). |
| NFR-2 | Scalability | Supports growth to a large public user base via elastic cloud infrastructure; food database and user data scale independently. |
| NFR-3 | Availability | High uptime suitable for daily-use consumer app, with monitoring and alerting. |
| NFR-4 | Security & Privacy | Encrypt sensitive health data in transit and at rest; strict access control; least-privilege admin access. |
| NFR-5 | Compliance | Comply with health-data privacy obligations (Bangladesh Personal Data Protection Act, 2026; align with GDPR/HIPAA principles if serving those regions). |
| NFR-6 | Usability & Accessibility | Simple, low-literacy-friendly UI; clear language; color contrast and text-size accessibility; works on low-end devices. |
| NFR-7 | Localization | Full Bangla and English; local food names, portions, and units. |
| NFR-8 | Safety | Every recommendation surfaces a *not-medical-advice* disclaimer; unsafe/edge combinations are blocked, not just warned. |
| NFR-9 | Data Quality | Nutrient data traceable to credible sources; changes reviewed; known limitations (e.g., raw vs. cooked, seasonal variation) documented. |
| NFR-10 | Maintainability | Food data and condition guidance updatable without code changes; documented for handover. |
| NFR-11 | Auditability | Recommendation history stored and inspectable by the user to support trust and support tickets. |

---

## 9. Data Requirements

### 9.1 Data Sources
- **Primary:** *Food Composition Table for Bangladesh* (FCTB) and national nutrition resources (FAO/BIRDEM/INFS lineage) for local foods.
- **Secondary/supplementary:** international composition databases (e.g., USDA FoodData Central) for foods absent from FCTB.
- **Guidance content:** evidence-based condition dietary guidance (kidney: sodium/potassium/phosphorus/protein limits by CKD stage; diabetes: carbohydrate/glycemic control; heart: sodium and saturated fat).
- **Approximate local pricing** data for affordability features.

### 9.2 Data Quality Rules
- Each food record has a credible source citation and version.
- Handling of raw vs. cooked states and edible portions is explicit.
- Missing values are handled and marked, not silently zeroed.
- Nutrients relevant to conditions are always populated or explicitly marked as unknown.
- Data is validated by a domain expert (dietitian/nutritionist) before publication.

### 9.3 User Data Collected
Demographics, anthropometrics, health conditions, dietary preferences/allergies, logged intake, recommendation history, feedback, and subscription status. All classified as **sensitive** and governed by NFR-4/NFR-5.

---

## 10. Condition-Specific Domain Requirements

The system must encode, at minimum, the following guidance. Exact thresholds to be validated and versioned by qualified nutritionists.

| Condition | Nutrients of concern | Required behavior |
| --- | --- | --- |
| Diabetes | Carbohydrate load, added sugar, glycemic impact | Prefer lower-glycemic, higher-fiber options; distribute carbs; flag high-sugar items. |
| Heart disease / hypertension | Sodium, saturated fat | Prioritize low-sodium, low-saturated-fat foods; flag high-sodium items. |
| Chronic kidney disease | Sodium, potassium, phosphorus, protein | Apply **stage-aware** limits; flag high-potassium/phosphorus foods; adjust protein. |
| Allergies/intolerances | Condition-specific allergens | Hard exclusion — never suggest. |

---

## 11. Service Tiers

- **Free tier:** nutrition lookup, basic recommendations, and the progress dashboard — free for all users.
- **Premium tier:** AI-assisted diet charts and professional nutritionist review.

---

## 12. Stakeholders & Team Roles

**Roles required (from source docs):** Project Manager/Product Owner; Backend Developer; Mobile App Developer (Android & iOS); Frontend Developer (web); ML/AI Engineer; Data Scientist; Data Engineer; UI/UX Designer; Food & Health Researcher; Nutritionist/Dietitian (domain expert); Database Administrator; DevOps Engineer; QA Engineer; Content Writer/Nutrition Specialist; Technical Writer; Marketing Manager; Customer Support; Financial Advisor/Accountant; Legal Advisor; Founders/Owners; Investors; Sponsors.

**RACI-style responsibilities:** the Project Manager owns delivery and coordination; the Nutritionist/Domain Expert owns the correctness/safety of dietary guidance; the ML/Data team owns recommendation quality; Legal owns privacy/compliance; Support/Operations own post-launch maintenance.

---

## 13. Phases & Timeline (consolidated from source)

### 13.1 Phases
| Phase | Scope | Duration (source) |
| --- | --- | --- |
| Phase 1 | AI-powered recommendation engine (data prep, feature engineering, model build, experimentation/selection, deployment & testing) | 196 days |
| Phase 2 | User-friendly web/mobile application (design, front-end, back-end, AI integration) | 151 days |
| Phase 3 | Progress dashboard & insights (design, data collection/storage, front-end, testing/optimization) | 137 days |
| Phase 4 | Database for profiles/preferences/recommendations | ~2–4 weeks per sub-task |
| Phase 5 | User manual & documentation | ~6–9 weeks total |
| Pilot | 2-month pilot with selected users | Date in source: 05/05/2026 |

### 13.2 Delivery Targets (from source)
- Pilot engagement rate ≥ 70%.
- Recommendation accuracy ≥ 85% against user health goals.
- Positive feedback on accuracy and usability during pilot.

---

## 14. Conflicts, Assumptions & Open Questions ⚠️

The two source documents disagree on several points. These must be decided before the project proceeds.

| # | Issue | Source A (Charter) | Source B (Proposal) | Needed decision |
| --- | --- | --- | --- | --- |
| C-1 | Project name | AI-Based Diet Suggestion System | Rainbow Food List | Confirm product name vs. system name (doc assumes both). |
| C-3 | Timeline | Kick-off 15 Sep 2024; pilot criteria 2 months | Pilot date 05/05/2026 | Confirm current schedule (both dates are now in the past). |
| C-4 | Platform | "Web or mobile" | Mobile app + web interface | Confirm initial platform priority. |
| C-5 | Human consultation | Out of scope (real-time dietitian) | Premium includes nutritionist consultation | Confirm async review in scope; real-time out. |
| C-6 | Wearables | Out of scope | Listed as a revenue opportunity | Confirm wearables are roadmap-only. |
| C-7 | Data sources | "Nutritional databases" (generic) | Not specified | Adopt FCTB as primary source (proposed here). |
| C-8 | Accuracy target | 85% recommendation accuracy | Not defined | Define how "accuracy" is measured and by whom. |
| C-9 | Segment | Not defined | Subscription/freemium/ad-based | Confirm the free vs. premium feature split. |
| C-10 | Region/regulatory | GDPR/HIPAA | Not stated | Decide launch region and governing law (Bangladesh PDPA 2026 proposed here). |

**Working assumptions in this PRD** (until decided): product = Rainbow Food List; system = AI-Based Diet Suggestion System; launch region = Bangladesh; primary data = FCTB; free + premium freemium model; mobile-first with web; async nutritionist review in scope; wearables/diagnosis out of scope; not-medical-advice disclaimer always shown.

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Inaccurate/unsafe recommendations | Harm to users, loss of trust | Curated reviewed data, condition rules, expert sign-off, disclaimers, feedback loop. |
| Poor data quality | Wrong nutrient values | Validation, provenance tracking, expert review, documented limitations. |
| Health-data breach / non-compliance | Legal and reputational damage | Encryption, access control, compliance with PDPA/GDPR/HIPAA principles, audits. |
| Team turnover | Knowledge loss | Documentation, cross-training, centralized knowledge base. |
| Low user adoption | No impact/adoption | Pilot with target users, iterate, differentiate on local accuracy + condition safety. |
| Regulatory / health-guideline non-compliance | Legal exposure | Legal review, adherence to published dietary guidance, versioned content. |
| Market competition | Overshadowed by competitors | Focus on local foods, affordability, and condition-aware safety as differentiators. |
| Over-reliance on AI | Wrong advice in edge cases | Human-in-the-loop for premium, expert rule constraints on top of model output. |

---

## 16. Success Metrics

- **Pilot:** engagement ≥ 70%; recommendation accuracy ≥ 85%; positive usability/accuracy feedback.
- **Product:** active users, retention, premium conversion rate, recommendation acceptance/swap rate, data-coverage of common local foods.
- **Health impact (long-term):** improved adherence to plan; user-reported outcomes (with appropriate caveats about attribution).
- **Operations:** uptime, support response time, model refresh cadence.

---

## 17. Glossary

- **FCTB** — Food Composition Table for Bangladesh.
- **CKD** — Chronic Kidney Disease.
- **NCD** — Non-Communicable Disease.
- **PRD** — Product/Project Requirements Document.
- **PDPA** — Personal Data Protection Act (Bangladesh, 2026).
- **MoSCoW** — Must/Should/Could/Won't prioritization.

---

## Appendix A — Requirement Traceability (source → this doc)

| Source section | Mapped to |
| --- | --- |
| Charter §3 Scope / §4 Deliverables | Sections 6, 7 |
| Charter §7 Risks | Section 15 |
| Charter §8 Pilot | Sections 13, 16 |
| Proposal §3 Features / §4 Audience | Sections 4, 7 |
| Proposal §6 Hardware/Software | Section 8 (technical constraints only) |

## Appendix B — External Sources Consulted

- Intelligent diet recommendation system (AI/ML nutrition) — https://www.sciencedirect.com/science/article/pii/S2405457725029249
- AI nutrition recommendation using a deep generative model — https://www.nature.com/articles/s41598-024-65438-x
- AI-driven knowledge-based personalized nutrition (rule/constraint-based) — https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2026.1894893/full
- Food Composition Table for Bangladesh — https://www.fao.org/fileadmin/templates/food_composition/documents/FCT_10_2_14_final_version.pdf
- Diabetes & kidney disease: what to eat (CDC) — https://www.cdc.gov/diabetes/healthy-eating/diabetes-and-kidney-disease-food.html
- CKD nutrition: sodium, potassium, phosphorus, protein (National Kidney Foundation) — https://www.kidney.org/kidney-topics/creating-kidney-friendly-plate
- Non-communicable disease burden in Bangladesh (Lancet Global Health) — https://www.thelancet.com/journals/langlo/article/PIIS2214-109X(23)00432-1/fulltext
- Bangladesh Personal Data Protection Act 2026 overview — https://www.recordinglaw.com/world-laws/world-data-privacy-laws/bangladesh-data-privacy-laws/
- Local competitor example (AI calorie tracker for Bangladeshi food) — https://samikhanfitness.com/mepe-khai/

---

*End of Project Requirements Document.*
