/* Profile & health — summary, targets, condition limits. */
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;

  function render() {
    const user = App.State.currentUser();
    const profile = user.profile;
    if (!App.Profile.isComplete(profile)) {
      return '<div class="container">' + App.UI.emptyState("No profile yet", "Create your health profile to unlock personalization.", "📝") +
        '<div class="center mt-3"><a class="btn btn-primary" href="#/onboarding">Start setup</a></div></div>';
    }
    const targets = App.Profile.computeTargets(profile);
    const bmi = App.Profile.bmi(profile);
    const bmiCat = App.Profile.bmiCategory(bmi);

    return '<div class="container stack">' +
      '<div class="page-head"><div><h1>' + esc(user.name) + "</h1>" +
      '<div class="subtitle">' + esc(user.email) + " · " + (user.premium ? "⭐ Premium" : "Free tier") + "</div></div>" +
      '<a class="btn btn-primary" href="#/onboarding">' + esc(t("common_edit")) + " profile</a></div>" +

      '<div class="grid cols-4">' +
        stat("⚖️", App.I18N.fmtNum(bmi, 1), bmiCat.label) +
        stat("🎯", App.I18N.fmtNum(targets.energy), "kcal / day") +
        stat("🥩", App.I18N.fmtNum(targets.protein) + " g", t("protein")) +
        stat("🌾", App.I18N.fmtNum(targets.carbs) + " g", t("carbs")) +
      "</div>" +

      '<div class="grid cols-2" style="align-items:start">' +
        '<div class="card"><div class="card-title"><h3>Personal</h3>' +
          '<a class="link small" href="#/onboarding">' + esc(t("common_edit")) + "</a></div>" +
          kv("Name", user.name) +
          kv("Email", user.email) +
          kv("Age", profile.age + " yrs") +
          kv("Sex", profile.sex) +
          kv("Height", profile.heightCm + " cm") +
          kv("Weight", (App.State.latestWeight(user.id) || profile.weightKg) + " kg") +
          kv("Activity", App.I18N.name(App.DATA.activityLevels.find((a) => a.id === profile.activity) || {})) +
          kv("Goal", App.I18N.name(App.DATA.goals.find((g) => g.id === profile.goal) || {})) +
          kv("Language", profile.language === "bn" ? "বাংলা" : "English") +
        "</div>" +

        '<div class="card"><div class="card-title"><h3>Health & diet</h3>' +
          '<a class="link small" href="#/health">' + esc(t("nav_my_health")) + "</a></div>" +
          '<div class="field"><label>Conditions</label>' +
            chipList((profile.conditions || []).map((c) => { const x = App.DATA.conditions.find((y) => y.id === c); return x ? x.icon + " " + App.I18N.name(x) : c; }), "None declared", "green") +
          "</div>" +
          (profile.conditions.includes("ckd") ? '<div class="field"><label>Kidney stage</label><div>' + esc(App.I18N.L(App.DATA.ckdStages.find((s) => s.value === profile.ckdStage) || {}, "label")) + "</div></div>" : "") +
          '<div class="field"><label>Allergies (excluded)</label>' +
            chipList((profile.allergies || []).map((a) => { const x = App.DATA.allergens.find((y) => y.id === a); return x ? App.I18N.name(x) : a; }), "None", "red") +
          "</div>" +
          '<div class="field"><label>Dietary preferences</label>' +
            chipList((profile.diet || []).map((d) => { const x = App.DATA.dietaryPrefs.find((y) => y.id === d); return x ? App.I18N.name(x) : d; }), "No restrictions", "blue") +
          "</div>" +
          '<div class="field"><label>Disliked foods (excluded)</label>' +
            chipList((profile.dislikedFoods || []).map((id) => { const f = App.State.foodById(id); return f ? App.I18N.name(f) : id; }), "None", "grey") +
          "</div>" +
          '<div class="field"><label>Meals per day</label><div>' + (profile.mealsPerDay || 4) + "</div></div>" +
          (profile.budgetSensitive ? '<div class="notice">💰 Budget-aware ranking is on</div>' : "") +
        "</div>" +
      "</div>" +

      '<div class="card"><div class="card-title"><h3>Your daily targets & limits</h3>' +
        '<span class="muted small">Adjusted for your profile' + (targets.flags.ckd ? " (CKD stage " + targets.flags.stage + ")" : "") + "</span></div>" +
        '<div class="grid auto-280">' +
          targetBar(t("kcal"), targets.energy, "kcal", "green") +
          targetBar(t("protein"), targets.protein, "g", "blue") +
          targetBar(t("carbs"), targets.carbs, "g", "orange") +
          targetBar(t("fat"), targets.fat, "g", "green") +
          targetBar(t("fiber"), targets.fiber, "g", "blue") +
        "</div>" +
        '<hr class="mt-4" style="border:none;border-top:1px solid var(--border)" />' +
        '<div class="grid auto-280 mt-4">' +
          limitBar(t("sodium"), targets.limits.sodium, "mg", targets.flags.heart || targets.flags.ckd) +
          limitBar(t("sugar"), targets.limits.sugar, "g", targets.flags.diabetes) +
          limitBar(t("satFat"), targets.limits.satFat, "g", targets.flags.heart) +
          (targets.flags.ckd ? limitBar(t("potassium"), targets.limits.potassium, "mg", true) : "") +
          (targets.flags.ckd ? limitBar(t("phosphorus"), targets.limits.phosphorus, "mg", true) : "") +
        "</div>" +
      "</div>" +

      App.UI.disclaimer("disc_condition") +
    "</div>";
  }

  function stat(icon, value, label) {
    return '<div class="card stat"><div class="stat-icon">' + icon + '</div><div class="stat-value">' + esc(value) + '</div><div class="stat-label">' + esc(label) + "</div></div>";
  }
  function kv(k, v) { return '<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="muted">' + esc(k) + '</span><strong>' + esc(v) + "</strong></div>"; }
  function chipList(items, empty, tone) {
    if (!items.length) return '<span class="muted small">' + esc(empty) + "</span>";
    return '<div class="row" style="gap:6px">' + items.map((i) => '<span class="badge ' + tone + '">' + esc(i) + "</span>").join("") + "</div>";
  }
  function targetBar(label, value, unit, tone) {
    return '<div><div class="row between small"><span>' + esc(label) + '</span><strong>' + App.I18N.fmtNum(value) + " " + unit + '</strong></div><div class="bar ' + tone + ' mt-2"><span style="width:70%"></span></div></div>';
  }
  function limitBar(label, value, unit, highlighted) {
    const width = highlighted ? 100 : 40;
    const color = highlighted ? "var(--orange-600)" : "var(--blue-400)";
    return '<div class="' + (highlighted ? "" : "muted") + '">' +
      '<div class="row between small"><span>' + esc(label) + (highlighted ? " ⚠" : "") + "</span>" +
      "<strong>" + App.I18N.fmtNum(value) + " " + unit + " / day</strong></div>" +
      '<div class="bar thin mt-2"><span style="width:' + width + "%;background:" + color + '"></span></div></div>';
  }

  App.Router.register("/profile", { render: render, auth: true, roles: ["member"], title: "Profile" });
})();
