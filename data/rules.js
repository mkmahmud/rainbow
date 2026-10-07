/* Configurable thresholds for the recommendation engine and dashboard.
   Food thresholds are per 100 g. Daily limits are baseline values that
   profile.js adjusts by personal factors and CKD stage. */
window.App = window.App || {};
App.DATA = App.DATA || {};

App.DATA.rules = {
  /* How to flag a single food per 100 g */
  foodThresholds: {
    sodium: { warn: 200, high: 400, unit: "mg", labelEn: "Sodium", labelBn: "সোডিয়াম" },
    potassium: { warn: 250, high: 350, unit: "mg", labelEn: "Potassium", labelBn: "পটাশিয়াম" },
    phosphorus: { warn: 120, high: 150, unit: "mg", labelEn: "Phosphorus", labelBn: "ফসফরাস" },
    protein: { warn: 12, high: 18, unit: "g", labelEn: "Protein", labelBn: "প্রোটিন" },
    satFat: { warn: 3, high: 5, unit: "g", labelEn: "Saturated fat", labelBn: "সম্পৃক্ত চর্বি" },
    sugar: { warn: 10, high: 15, unit: "g", labelEn: "Sugar", labelBn: "চিনি" },
    glycemic: { warn: 56, high: 70, unit: "", labelEn: "Glycemic index", labelBn: "গ্লাইসেমিক সূচক" },
  },

  /* Which nutrients each condition cares about */
  conditionNutrients: {
    diabetes: ["sugar", "glycemic", "fiber"],
    heart: ["sodium", "satFat"],
    ckd: ["sodium", "potassium", "phosphorus", "protein"],
  },

  /* Baseline daily limits for an average adult (adjusted per person) */
  dailyLimits: {
    sodium: 2000,      // mg
    potassium: 3500,   // mg
    phosphorus: 1000,  // mg
    protein: 60,       // g (adjusted by weight)
    satFat: 20,        // g
    sugar: 30,         // g
    fiber: 25,         // g (target, not a cap)
  },

  /* CKD stage scaling for the sensitive nutrients */
  ckdStageFactor: { 1: 1.35, 2: 1.2, 3: 1.0, 4: 0.78, 5: 0.6 },

  /* Scoring weights (higher = matters more) */
  weights: {
    goalFit: 3,
    fiberBonus: 1.2,
    lowCostBonus: 1.5,
    diabetesPenalty: 2.5,
    heartPenalty: 2.5,
    ckdPenalty: 3.0,
    variety: 1,
  },
};
