/* Deterministic, explainable recommendation engine ("AI" for the prototype). */
window.App = window.App || {};

App.Engine = (function () {
  const ANIMAL = { fish: 1, meat: 1, egg: 1, dairy: 1 };

  function flags(food, profile) {
    const out = [];
    const th = App.DATA.rules.foodThresholds;
    const conditions = (profile && profile.conditions) || [];
    const stageFactor = profile && profile.ckdStage ? (App.DATA.rules.ckdStageFactor[profile.ckdStage] || 1) : 1;

    function check(key, value, factor) {
      if (value === null || value === undefined) return;
      const t = th[key];
      if (!t) return;
      const warn = t.warn * (factor || 1);
      const high = t.high * (factor || 1);
      if (value >= high) out.push({ nutrient: key, level: "high", value: value });
      else if (value >= warn) out.push({ nutrient: key, level: "warn", value: value });
    }

    if (conditions.includes("diabetes")) {
      check("sugar", food.micros.sugar);
      check("glycemic", food.micros.glycemic);
    }
    if (conditions.includes("heart")) {
      check("sodium", food.micros.sodium);
      check("satFat", food.micros.satFat);
    }
    if (conditions.includes("ckd")) {
      check("potassium", food.micros.potassium, stageFactor);
      check("phosphorus", food.micros.phosphorus, stageFactor);
      check("protein", food.per100g.protein, stageFactor);
      check("sodium", food.micros.sodium, stageFactor);
    }
    return out;
  }

  function exclusion(food, profile) {
    if (!profile) return null;
    const allergies = profile.allergies || [];
    const diet = profile.diet || [];
    const cats = App.DATA.substitutions.animalCategories;

    for (const a of allergies) {
      if ((food.allergens || []).includes(a)) return "Contains " + a + " (your declared allergy)";
    }
    if (diet.includes("vegan") && (ANIMAL[food.category] || false)) {
      return "Not vegan";
    }
    if (diet.includes("vegetarian") && (food.category === "fish" || food.category === "meat")) {
      return "Not vegetarian";
    }
    if (diet.includes("noBeef") && food.id === "beef") return "You avoid beef";

    // Safety blocks on top of warnings for higher CKD stages.
    if (profile.conditions && profile.conditions.includes("ckd") && profile.ckdStage >= 4) {
      if (food.micros.potassium >= 350) return "High potassium — restricted at your CKD stage";
      if (food.micros.phosphorus >= 150) return "High phosphorus — restricted at your CKD stage";
    }
    void cats;
    return null;
  }

  function score(food, profile, targets, ctx) {
    ctx = ctx || {};
    const p = food.per100g;
    const m = food.micros;
    const reasons = [];
    let s = 50;

    const fl = flags(food, profile);
    fl.forEach((f) => {
      if (f.level === "high") s -= 14;
      else if (f.level === "warn") s -= 6;
    });

    if (p.fiber >= 3) { s += 8; reasons.push("High fibre (" + App.I18N.fmtNum(p.fiber, 1) + " g/100 g) — supports blood-sugar and gut health"); }
    else if (p.fiber >= 1.5) s += 3;

    if (p.protein >= 12) { s += 7; reasons.push("Strong protein source (" + App.I18N.fmtNum(p.protein, 1) + " g/100 g)"); }
    else if (p.protein >= 6) s += 3;

    const density = p.energy;
    if (profile.goal === "weight-loss") {
      if (density <= 90) { s += 8; reasons.push("Low energy density — helpful for weight loss"); }
      else if (density >= 350) s -= 12;
    } else if (profile.goal === "weight-gain" && density >= 200) {
      s += 8; reasons.push("Energy-dense — helpful for weight gain");
    }

    if (profile.budgetSensitive || ctx.budgetMode) {
      if (food.costTier === "low") { s += 10; reasons.push("Low cost — fits your budget"); }
      else if (food.costTier === "high") s -= 9;
    }

    if (food.isPlantBased && (ctx.plantOnly || (profile.diet || []).length)) {
      s += 4;
      if ((profile.diet || []).includes("vegetarian") || (profile.diet || []).includes("vegan")) {
        reasons.push("Plant-based option");
      }
    }

    if ((profile.conditions || []).includes("diabetes") && m.glycemic !== null && m.glycemic <= 55 && p.carbs > 3) {
      s += 6; reasons.push("Low glycemic index (" + m.glycemic + ")");
    }
    if ((profile.conditions || []).includes("heart") && m.sodium <= 100 && m.satFat <= 1.5) {
      s += 5; reasons.push("Low in sodium and saturated fat");
    }
    if ((profile.conditions || []).includes("ckd")) {
      if (m.potassium <= 200 && m.phosphorus <= 120) { s += 6; reasons.push("Kidney-friendly: low potassium and phosphorus"); }
    }

    if (!reasons.length) reasons.push("Balanced everyday choice for your profile");
    return { score: Math.round(s), reasons: reasons.slice(0, 3), flags: fl };
  }

  function recommend(profile, opts) {
    opts = opts || {};
    const limit = opts.limit || 14;
    const targets = App.Profile.computeTargets(profile);
    const pool = App.State.allFoods();
    const scored = [];
    const excludedList = [];

    pool.forEach((food) => {
      const reason = exclusion(food, profile);
      if (reason) { excludedList.push({ food: food, reason: reason }); return; }
      if (opts.plantOnly && !food.isPlantBased) return;
      if (opts.category && food.category !== opts.category) return;
      const r = score(food, profile, targets, opts);
      scored.push({ food: food, score: r.score, reasons: r.reasons, flags: r.flags });
    });

    scored.sort((a, b) => b.score - a.score);

    // Diversity: cap how many items from one category appear in the top list.
    const perCat = {};
    const picked = [];
    for (const item of scored) {
      const c = item.food.category;
      perCat[c] = perCat[c] || 0;
      if (perCat[c] >= 3) continue;
      picked.push(item);
      perCat[c]++;
      if (picked.length >= limit) break;
    }

    return { items: picked, excluded: excludedList, targets: targets, total: scored.length };
  }

  function alternatives(foodId, profile, opts) {
    opts = opts || {};
    const food = App.State.foodById(foodId);
    if (!food) return [];
    const subs = App.DATA.substitutions;
    const ids = [];
    if (opts.plantOnly) {
      (subs.plantBasedFor[foodId] || []).forEach((id) => ids.push({ id: id, why: "Plant-based source with a similar nutrient role" }));
    }
    (subs.map[foodId] || []).forEach((id) => ids.push({ id: id, why: "Common equivalent / cheaper swap" }));
    if (food.isPlantBased) {
      // already vegetarian-friendly
    } else {
      (subs.plantBasedFor[foodId] || []).forEach((id) => ids.push({ id: id, why: "Plant-based alternative" }));
    }

    const seen = {};
    const out = [];
    ids.forEach((entry) => {
      if (entry.id === foodId || seen[entry.id]) return;
      seen[entry.id] = true;
      const f = App.State.foodById(entry.id);
      if (!f) return;
      if (exclusion(f, profile)) return;
      out.push({ food: f, why: entry.why });
    });

    // Fallback: nutrient-similar foods in the same category, cheaper if possible.
    if (out.length < 3) {
      App.State.allFoods().forEach((f) => {
        if (out.length >= 4 || f.id === foodId || seen[f.id]) return;
        if (f.category !== food.category) return;
        if (exclusion(f, profile)) return;
        seen[f.id] = true;
        out.push({ food: f, why: "Similar food in the same category" });
      });
    }
    return out.slice(0, 4);
  }

  /* ---------- Diet plan generation ---------- */
  const SLOT_CATEGORIES = {
    breakfast: ["grains", "egg", "dairy", "fruit", "legume"],
    lunch: ["grains", "legume", "meat", "fish", "veg", "leafy"],
    snack: ["fruit", "nuts", "beverage", "sweet"],
    dinner: ["grains", "fish", "meat", "legume", "veg", "leafy"],
  };

  function generatePlan(profile, opts) {
    opts = opts || {};
    const targets = App.Profile.computeTargets(profile);
    const rec = recommend(profile, { limit: 40, budgetMode: opts.budgetMode, plantOnly: opts.plantOnly });
    const byCategory = {};
    rec.items.forEach((it) => {
      (byCategory[it.food.category] = byCategory[it.food.category] || []).push(it);
    });
    if (opts.variant) {
      Object.keys(byCategory).forEach((k) => {
        const a = byCategory[k];
        const r = opts.variant % a.length;
        byCategory[k] = a.slice(r).concat(a.slice(0, r));
      });
    }

    const used = {};
    const slots = App.DATA.mealSlots.map((slot) => {
      const cats = SLOT_CATEGORIES[slot.id] || ["grains", "veg"];
      const budget = targets.energy * slot.pct;
      const picks = [];
      // Try each preferred category (up to 3 passes), never repeating a food.
      let attempts = 0;
      const maxAttempts = cats.length * 3;
      while (picks.length < 4 && attempts < maxAttempts) {
        const cat = cats[attempts % cats.length];
        attempts++;
        const list = (byCategory[cat] || []).filter((it) => !used[it.food.id]);
        if (!list.length) continue;
        const pick = list[0];
        used[pick.food.id] = true;
        picks.push({ foodId: pick.food.id, grams: pick.food.portionGrams });
      }
      // Scale portions so the meal lands near its energy budget.
      const raw = App.Profile.sumItems(picks);
      const factor = raw.energy > 0 ? Math.min(Math.max(budget / raw.energy, 0.6), 1.8) : 1;
      picks.forEach((p) => { p.grams = Math.max(10, Math.round((p.grams * factor) / 5) * 5); });
      return {
        id: slot.id, nameEn: slot.nameEn, nameBn: slot.nameBn, icon: slot.icon,
        items: picks, totals: App.Profile.sumItems(picks),
      };
    });

    const flat = [];
    slots.forEach((s) => s.items.forEach((i) => flat.push(i)));
    return { slots: slots, totals: App.Profile.sumItems(flat), targets: targets, createdAt: App.State.todayISO() };
  }

  return { flags, exclusion, score, recommend, alternatives, generatePlan };
})();
