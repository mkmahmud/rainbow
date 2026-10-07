/* Member dashboard — "today" + progress in one place, where a member
   manages their own intake, targets and trends. */
window.App = window.App || {};
App.Dash = App.Dash || {};

App.Dash.Member = (function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;

  function firstName(n) { return (n || "").split(" ")[0]; }
  function greet() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }
  function conditionSummary(profile) {
    const parts = [];
    (profile.conditions || []).forEach((c) => {
      const cond = App.DATA.conditions.find((x) => x.id === c);
      if (cond) parts.push(App.I18N.name(cond));
    });
    if (profile.diet && profile.diet.length) parts.push(profile.diet.join(", "));
    if (profile.budgetSensitive) parts.push("budget-aware");
    return parts.length ? "Personalized for: " + parts.join(" · ") : "Personalized for your goals";
  }

  function render() {
    const user = App.State.currentUser();
    const profile = user.profile;

    if (!App.Profile.isComplete(profile)) {
      return '<div class="container stack">' +
        '<div class="page-head"><div><h1>' + esc(greet()) + ", " + esc(firstName(user.name)) + "</h1>" +
        '<div class="subtitle">' + esc(t("dash_member_sub")) + "</div></div></div>" +
        '<div class="card center">' +
          '<div class="stat-icon" style="margin:0 auto var(--s-3);font-size:26px">📝</div>' +
          "<h3>Complete your health profile</h3>" +
          '<p class="muted mt-2" style="max-width:520px;margin:0 auto">Tell us your age, weight, goals and any conditions so we can tailor food suggestions and safety limits.</p>' +
          '<div class="mt-4"><a class="btn btn-primary btn-lg" href="#/onboarding">Start setup</a></div>' +
        "</div>" +
        disclaimer() +
      "</div>";
    }

    App.State.ensureSeedLogs(user.id);
    const targets = App.Profile.computeTargets(profile);
    const bmi = App.Profile.bmi(profile);
    const bmiCat = App.Profile.bmiCategory(bmi);
    const todays = App.State.logsByDate(user.id, App.State.todayISO());
    const totals = App.Profile.sumItems(todays);
    const rec = App.Engine.recommend(profile, { limit: 3 });

    return '<div class="container stack">' +
      '<div class="page-head">' +
        '<div><h1>' + esc(greet()) + ", " + esc(firstName(user.name)) + "</h1>" +
        '<div class="subtitle">' + esc(conditionSummary(profile)) + "</div></div>" +
        '<div class="row">' +
          '<a class="btn btn-outline" href="#/recommendations">' + esc(t("btn_generate")) + "</a>" +
          '<button class="btn btn-accent" id="db-add">＋ ' + esc(t("btn_addLog")) + "</button>" +
        "</div>" +
      "</div>" +

      '<div class="grid cols-4">' +
        '<div class="card center"><div class="row" style="justify-content:center">' + App.Charts.ring(totals.energy, targets.energy, { size: 130, aria: "Energy" }) + "</div>" +
          '<div class="stat-label mt-2">' + esc(t("kcal")) + " today</div></div>" +
        statCard("🥩", App.I18N.fmtNum(totals.protein) + " g", "of " + App.I18N.fmtNum(targets.protein) + " g " + t("protein")) +
        statCard("🌾", App.I18N.fmtNum(totals.carbs) + " g", "of " + App.I18N.fmtNum(targets.carbs) + " g " + t("carbs")) +
        statCard("🌿", App.I18N.fmtNum(totals.fiber) + " g", "of " + App.I18N.fmtNum(targets.fiber) + " g " + t("fiber")) +
      "</div>" +

      '<div class="grid cols-4">' +
        stat("🎯", App.I18N.fmtNum(targets.energy), "Daily energy target (kcal)") +
        stat("⚖️", App.I18N.fmtNum(bmi, 1) + (bmi ? " · " + bmiCat.label : ""), "Body mass index") +
        stat("🩺", String((profile.conditions || []).length), "Declared conditions") +
        stat(user.premium ? "⭐" : "🆓", user.premium ? "Premium" : "Free", "Subscription tier") +
      "</div>" +

      '<div class="grid cols-2" style="align-items:start">' +
        '<div class="card"><div class="card-title"><h3>' + esc(t("dashboard_targets")) + "</h3></div>" +
          bar(t("kcal"), totals.energy, targets.energy, "kcal", "green") +
          bar(t("protein"), totals.protein, targets.protein, "g", "blue") +
          bar(t("carbs"), totals.carbs, targets.carbs, "g", "orange") +
          bar(t("fat"), totals.fat, targets.fat, "g", "green") +
        "</div>" +
        '<div class="card"><div class="card-title"><h3>Condition limits</h3></div>' +
          risk(t("sodium"), totals.sodium, targets.limits.sodium, "mg") +
          risk(t("sugar"), totals.sugar, targets.limits.sugar, "g") +
          risk(t("satFat"), totals.satFat, targets.limits.satFat, "g") +
          (targets.flags.ckd ? risk(t("potassium"), totals.potassium, targets.limits.potassium, "mg") : "") +
          (targets.flags.ckd ? risk(t("phosphorus"), totals.phosphorus, targets.limits.phosphorus, "mg") : "") +
          insights(targets, totals) +
        "</div>" +
      "</div>" +

      '<div class="card"><div class="card-title"><h3>7-day energy trend</h3><a class="btn btn-ghost btn-sm" href="#/diet">' + esc(t("nav_diet")) + "</a></div>" + trendHtml(user.id, targets.energy) + "</div>" +

      '<div class="card"><div class="card-title"><h3>Today\'s log</h3><span class="muted small">' + todays.length + " items</span></div>" +
        (todays.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Food</th><th>Meal</th><th class="num">Portion</th><th class="num">kcal</th><th></th></tr></thead><tbody>' +
          todays.map((l) => logRow(l)).join("") + "</tbody></table></div>"
          : '<p class="muted small">Nothing logged yet today. Tap “Log this food”.</p>') +
      "</div>" +

      '<div class="grid cols-2" style="align-items:start">' +
        '<div class="card"><div class="card-title"><h3>Quick actions</h3></div>' +
          '<div class="grid cols-2">' +
            quick("#/explore", "🔍", "Explore foods") +
            quick("#/recommendations", "🍽️", "Suggestions") +
            quick("#/diet", "📋", "Diet chart") +
            quick("#/premium", "⭐", t("nav_premium")) +
          "</div>" +
        "</div>" +
        '<div class="card"><div class="card-title"><h3>Top suggestions for you</h3><a class="btn btn-ghost btn-sm" href="#/recommendations">See all</a></div>' +
          '<div class="stack">' + rec.items.map((it) => suggestRow(it)).join("") + "</div>" +
        "</div>" +
      "</div>" +

      disclaimer() +
    "</div>";
  }

  function stat(icon, value, label) {
    return '<div class="card stat"><div class="stat-icon">' + icon + '</div><div class="stat-value">' + esc(value) + '</div><div class="stat-label">' + esc(label) + "</div></div>";
  }
  function statCard(icon, value, label) {
    return '<div class="card stat"><div class="stat-icon">' + icon + '</div><div class="stat-value" style="font-size:var(--fs-xl)">' + esc(value) + '</div><div class="stat-label">' + esc(label) + "</div></div>";
  }
  function quick(href, icon, label) {
    return '<a class="card card-hover center pad-sm" href="' + href + '" style="text-decoration:none;color:inherit"><div style="font-size:22px">' + icon + '</div><div class="small mt-2">' + esc(label) + "</div></a>";
  }
  function bar(label, value, target, unit, tone) {
    const pct = target ? Math.min((value / target) * 100, 125) : 0;
    return '<div class="mt-3"><div class="row between small"><span>' + esc(label) + '</span><span class="muted">' + App.I18N.fmtNum(value) + " / " + App.I18N.fmtNum(target) + " " + unit + "</span></div>" +
      '<div class="bar ' + tone + ' mt-2"><span style="width:' + Math.min(pct, 100) + '%"></span></div></div>';
  }
  function risk(label, value, limit, unit) {
    const ratio = limit ? value / limit : 0;
    const over = ratio > 1, near = ratio > 0.85 && !over;
    const color = over ? "red" : near ? "orange" : "blue";
    return '<div class="mt-3"><div class="row between small"><span>' + esc(label) +
      (over ? ' <span class="badge red">over</span>' : near ? ' <span class="badge orange">near</span>' : "") + "</span>" +
      '<span class="muted">' + App.I18N.fmtNum(value) + " / " + App.I18N.fmtNum(limit) + " " + unit + "</span></div>" +
      '<div class="bar thin ' + color + ' mt-2"><span style="width:' + Math.min(ratio * 100, 100) + '%"></span></div></div>';
  }
  function insights(targets, totals) {
    const out = [];
    if (totals.fiber < targets.fiber * 0.6) out.push("Fibre is below target — add vegetables, pulses or fruit.");
    if (targets.flags.diabetes && totals.sugar > targets.limits.sugar) out.push("Sugar is over your diabetes limit today.");
    if (targets.flags.heart && totals.sodium > targets.limits.sodium) out.push("Sodium is over your heart-health limit today.");
    if (targets.flags.ckd && totals.potassium > targets.limits.potassium) out.push("Potassium exceeds your kidney-stage limit.");
    if (!out.length) out.push("You're on track against your key targets today.");
    return '<div class="notice mt-4">' + out.map((o) => "• " + o).join("<br>") + "</div>";
  }
  function trendHtml(userId, targetEnergy) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = App.State.offsetISO(-i);
      const totals = App.Profile.sumItems(App.State.logsByDate(userId, date));
      days.push({ label: App.UI.fmtDate(date), value: Math.round(totals.energy), color: "var(--blue-600)" });
    }
    return App.Charts.lineChart(days, { max: Math.max(targetEnergy * 1.15, 1), color: "var(--blue-600)", aria: "Energy over the last 7 days" });
  }
  function logRow(l) {
    const f = App.State.foodById(l.foodId);
    if (!f) return "";
    const slot = App.DATA.mealSlots.find((s) => s.id === l.slot);
    const kcal = (f.per100g.energy * l.grams) / 100;
    return "<tr><td>" + f.emoji + " " + esc(App.I18N.name(f)) + "</td><td>" + esc(slot ? App.I18N.name(slot) : l.slot) + '</td><td class="num">' + l.grams + ' g</td><td class="num">' + App.I18N.fmtNum(kcal) + '</td><td class="num"><button class="icon-btn" data-del="' + l.id + '" title="Remove" aria-label="Remove entry">×</button></td></tr>';
  }
  function suggestRow(it) {
    return '<a class="card card-hover pad-sm" href="#/food/' + it.food.id + '" style="text-decoration:none;color:inherit">' +
      '<div class="food-item"><div class="food-thumb">' + it.food.emoji + "</div>" +
      "<div><strong>" + esc(App.I18N.name(it.food)) + '</strong><div class="muted xs">' + it.reasons[0] + "</div></div>" +
      '<div class="spacer"></div><span class="badge green">' + it.score + "</span></div></a>";
  }
  function disclaimer() { return App.UI.disclaimer("disc_recommendation"); }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    main.addEventListener("click", (e) => {
      if (e.target.id === "db-add") { openAdd(user); return; }
      const del = e.target.closest("[data-del]");
      if (del) { App.State.removeLog(user.id, del.getAttribute("data-del")); App.Router.refresh(); }
    });
  }

  function openAdd(user) {
    const foods = App.State.allFoods().slice().sort((a, b) => App.I18N.name(a).localeCompare(App.I18N.name(b)));
    const slots = App.DATA.mealSlots;
    App.UI.modal({
      title: "Log a food",
      bodyHtml:
        '<div class="field"><label>Food</label><select class="select" id="db-food">' +
          foods.map((f) => '<option value="' + f.id + '">' + f.emoji + " " + esc(App.I18N.name(f)) + " (" + f.portionLabel + ")</option>").join("") +
        "</select></div>" +
        '<div class="field"><label>Meal</label><select class="select" id="db-slot">' +
          slots.map((s) => '<option value="' + s.id + '">' + s.icon + " " + esc(App.I18N.name(s)) + "</option>").join("") +
        "</select></div>" +
        '<div class="field"><label>Portion (g)</label><input class="input" id="db-grams" type="number" min="1" value="100" /></div>',
      footerHtml: '<button class="btn btn-outline" data-close>' + esc(t("common_cancel")) + '</button><button class="btn btn-primary" data-save>Log it</button>',
      onMount: (root, close) => {
        const sel = root.querySelector("#db-food");
        const setPortion = () => { const f = App.State.foodById(sel.value); const g = root.querySelector("#db-grams"); if (f && g) g.value = f.portionGrams; };
        sel.addEventListener("change", setPortion);
        setPortion();
        root.querySelector("[data-save]").addEventListener("click", () => {
          const foodId = sel.value;
          const slot = root.querySelector("#db-slot").value;
          const grams = Math.max(1, parseInt(root.querySelector("#db-grams").value || "0", 10) || 100);
          App.State.addLog(user.id, { foodId: foodId, grams: grams, slot: slot });
          close();
          App.Router.refresh();
          App.UI.toast("Logged");
        });
      },
    });
  }

  return { render, mount };
})();
