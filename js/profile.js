/* Health-profile maths: energy/macro targets and condition-aware daily limits. */
window.App = window.App || {};

App.Profile = (function () {
  const NUTRIENTS = [
    { key: "energy", labelKey: "kcal", unit: "kcal", group: "macro" },
    { key: "protein", labelKey: "protein", unit: "g", group: "macro" },
    { key: "carbs", labelKey: "carbs", unit: "g", group: "macro" },
    { key: "fat", labelKey: "fat", unit: "g", group: "macro" },
    { key: "fiber", labelKey: "fiber", unit: "g", group: "macro" },
    { key: "sodium", labelKey: "sodium", unit: "mg", group: "condition" },
    { key: "potassium", labelKey: "potassium", unit: "mg", group: "condition" },
    { key: "phosphorus", labelKey: "phosphorus", unit: "mg", group: "condition" },
    { key: "satFat", labelKey: "satFat", unit: "g", group: "condition" },
    { key: "sugar", labelKey: "sugar", unit: "g", group: "condition" },
  ];

  function nutrientMeta(key) {
    return NUTRIENTS.find((n) => n.key === key) || { key: key, labelKey: key, unit: "" };
  }
  function nutrientLabel(key) {
    const meta = nutrientMeta(key);
    return App.I18N.t(meta.labelKey) || key;
  }

  function bmi(profile) {
    if (!profile || !profile.heightCm || !profile.weightKg) return null;
    const m = profile.heightCm / 100;
    return profile.weightKg / (m * m);
  }
  function bmiCategory(value) {
    if (value === null) return { label: "—", tone: "muted" };
    if (value < 18.5) return { label: "Underweight", tone: "orange" };
    if (value < 25) return { label: "Healthy", tone: "green" };
    if (value < 30) return { label: "Overweight", tone: "orange" };
    return { label: "Obese", tone: "red" };
  }

  function activityFactor(profile) {
    const lvl = App.DATA.activityLevels.find((a) => a.id === (profile && profile.activity));
    return lvl ? lvl.factor : 1.375;
  }

  function energyTarget(profile) {
    const kg = profile.weightKg, cm = profile.heightCm, age = profile.age;
    let bmr;
    if (profile.sex === "male") bmr = 10 * kg + 6.25 * cm - 5 * age + 5;
    else if (profile.sex === "female") bmr = 10 * kg + 6.25 * cm - 5 * age - 161;
    else bmr = 10 * kg + 6.25 * cm - 5 * age - 78;
    let tdee = bmr * activityFactor(profile);
    if (profile.goal === "weight-loss") tdee *= 0.82;
    else if (profile.goal === "weight-gain") tdee *= 1.15;
    return Math.round(tdee);
  }

  function computeTargets(profile) {
    if (!profile) return null;
    const energy = energyTarget(profile);
    const hasCkd = (profile.conditions || []).includes("ckd");
    const hasDiabetes = (profile.conditions || []).includes("diabetes");
    const hasHeart = (profile.conditions || []).includes("heart");
    const stage = profile.ckdStage || 3;
    const stageFactor = App.DATA.rules.ckdStageFactor[stage] || 1;

    // Protein target / cap
    let proteinTarget = Math.round(profile.weightKg * (hasCkd ? 0.8 : 1.2));
    const fatTarget = Math.round((energy * 0.28) / 9);
    const carbsTarget = Math.max(0, Math.round((energy - proteinTarget * 4 - fatTarget * 9) / 4));

    const base = App.DATA.rules.dailyLimits;
    const limits = {
      sodium: hasHeart || hasCkd ? 1500 : base.sodium,
      potassium: hasCkd ? Math.round(3000 * stageFactor) : base.potassium,
      phosphorus: hasCkd ? Math.round(900 * stageFactor) : base.phosphorus,
      satFat: hasHeart ? 16 : base.satFat,
      sugar: hasDiabetes ? 20 : base.sugar,
      protein: hasCkd ? proteinTarget : null, // cap only when relevant
      fiber: base.fiber,
    };

    return {
      energy: energy,
      protein: proteinTarget,
      carbs: carbsTarget,
      fat: fatTarget,
      fiber: limits.fiber,
      limits: limits,
      flags: { ckd: hasCkd, diabetes: hasDiabetes, heart: hasHeart, stage: stage, stageFactor: stageFactor },
    };
  }

  function isComplete(profile) {
    return !!(profile && profile.age && profile.heightCm && profile.weightKg && profile.sex && profile.goal);
  }

  /* Sum nutrients for a set of {foodId, grams} items. */
  function sumItems(items, scale) {
    scale = scale || 1;
    const totals = { energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, potassium: 0, phosphorus: 0, satFat: 0, sugar: 0 };
    items.forEach((it) => {
      const food = App.State.foodById(it.foodId);
      if (!food) return;
      const grams = (it.grams || 0) * scale;
      const f = grams / 100;
      totals.energy += (food.per100g.energy || 0) * f;
      totals.protein += (food.per100g.protein || 0) * f;
      totals.carbs += (food.per100g.carbs || 0) * f;
      totals.fat += (food.per100g.fat || 0) * f;
      totals.fiber += (food.per100g.fiber || 0) * f;
      totals.sodium += (food.micros.sodium || 0) * f;
      totals.potassium += (food.micros.potassium || 0) * f;
      totals.phosphorus += (food.micros.phosphorus || 0) * f;
      totals.satFat += (food.micros.satFat || 0) * f;
      totals.sugar += (food.micros.sugar || 0) * f;
    });
    Object.keys(totals).forEach((k) => { totals[k] = Math.round(totals[k] * 10) / 10; });
    return totals;
  }

  return { NUTRIENTS, nutrientMeta, nutrientLabel, bmi, bmiCategory, computeTargets, energyTarget, isComplete, sumItems };
})();
