/* AI Diet Planner — generate a personalized plan with cost, shopping list,
   save and one-tap meal logging. */
window.App = window.App || {};
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;
  const fmt = App.I18N.fmtNum;
  const icon = App.Icons.get;

  const opts = { budgetMode: false, plantOnly: false };
  let preview = null;

  function build(user, profile) {
    preview = App.Engine.generatePlan(profile, { budgetMode: opts.budgetMode, plantOnly: opts.plantOnly });
    return preview;
  }

  function render() {
    const user = App.State.currentUser();
    const profile = user.profile;
    if (!App.Profile.isComplete(profile)) {
      return '<div class="container">' + App.UI.emptyState("No profile yet", "Create your health profile to generate a plan.", "🤖") +
        '<div class="center mt-3"><a class="btn btn-primary" href="#/onboarding">Start setup</a></div></div>';
    }
    const plan = preview || App.State.getPlan(user.id) || build(user, profile);
    const cost = App.State.estimatedPlanCost(plan);
    const targets = plan.targets;

    return '<div class="container stack">' +
      '<div class="page-head">' +
        '<div><h1>' + esc(t("nav_planner")) + '</h1><div class="subtitle">' + esc(t("sub_planner")) + "</div></div>" +
        '<div class="row">' +
          '<button class="btn btn-outline" data-regen>' + icon("spark", 18) + " " + esc(t("btn_regenerate")) + "</button>" +
          '<button class="btn btn-primary" data-save>' + esc(t("common_save")) + "</button>" +
        "</div>" +
      "</div>" +

      optionsCard(profile) +

      '<div class="grid cols-2" style="align-items:start">' +
        '<div class="stack">' + plan.slots.map((s) => slotCard(s)).join("") + "</div>" +
        '<div class="stack">' +
          costCard(plan, cost) +
          totalsCard(plan, targets) +
          '<div class="card"><div class="card-title"><h3>Actions</h3></div>' +
            '<div class="stack">' +
              '<button class="btn btn-primary" data-logmeals>' + icon("check", 18) + " " + esc("Log today's meals") + "</button>" +
              '<a class="btn btn-outline" href="#/diet">' + icon("diet", 18) + " " + esc("Open My Diet Chart") + "</a>" +
              '<p class="muted small">Saving stores this plan for your dashboard. Logging adds every item to today\'s intake.</p>' +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>" +

      App.UI.disclaimer("disc_diet") +
    "</div>";
  }

  function optionsCard(profile) {
    const disliked = (profile.dislikedFoods || []).length;
    return '<div class="card pad-sm"><div class="row">' +
      '<button class="chip' + (opts.budgetMode ? " active" : "") + '" data-opt="budgetMode">💰 Budget mode</button>' +
      '<button class="chip' + (opts.plantOnly ? " active" : "") + '" data-opt="plantOnly">🌱 Plant-based only</button>' +
      '<span class="spacer"></span>' +
      '<span class="muted small">' + esc((profile.mealsPerDay || 4) + " meals/day") + (disliked ? " · " + disliked + " disliked excluded" : "") + "</span>" +
    "</div></div>";
  }

  function slotCard(s) {
    const rows = s.items.length
      ? s.items.map((it) => {
          const f = App.State.foodById(it.foodId);
          if (!f) return "";
          const kcal = Math.round((f.per100g.energy * it.grams) / 100);
          return '<div class="row between" style="border-bottom:1px solid var(--border);padding:7px 0">' +
            '<span>' + f.emoji + ' <a href="#/food/' + f.id + '" style="color:inherit">' + esc(App.I18N.name(f)) + "</a>" +
            ' <span class="muted xs">' + it.grams + " g</span></span>" +
            '<span class="muted small">' + fmt(kcal) + " kcal</span></div>";
        }).join("")
      : '<p class="muted small">No safe foods matched this meal — relax the filters.</p>';
    return '<div class="card"><div class="card-title"><h3>' + s.icon + " " + esc(App.I18N.name(s)) + "</h3>" +
      '<span class="muted small">' + fmt(s.totals.energy) + " kcal</span></div>" + rows + "</div>";
  }

  function costCard(plan, cost) {
    const rows = cost.items.map((i) => {
      const f = App.State.foodById(i.foodId);
      return '<div class="row between small" style="padding:6px 0;border-bottom:1px solid var(--border)">' +
        '<span>' + (f ? f.emoji + " " + esc(App.I18N.name(f)) : i.foodId) + ' <span class="muted xs">' + i.grams + " g</span></span>" +
        "<strong>৳ " + fmt(i.cost) + "</strong></div>";
    }).join("");
    return '<div class="card"><div class="card-title"><h3>' + esc(t("sec_shopping_list")) + "</h3>" +
      '<span class="badge green">' + esc(t("sec_estimated_cost")) + " ৳ " + fmt(cost.total) + "</span></div>" +
      '<div class="stack">' + (rows || '<p class="muted small">No items.</p>') + "</div>" +
      '<div class="row between mt-3"><span class="muted small">Daily total</span><strong>৳ ' + fmt(cost.total) + " / day</strong></div>" +
      '<div class="row between mt-2"><span class="muted small">≈ per month</span><strong>৳ ' + fmt(cost.total * 30) + "</strong></div></div>";
  }

  function totalsCard(plan, targets) {
    const total = plan.totals;
    const row = (label, value, target, unit, tone) => {
      const pct = target ? Math.min((value / target) * 100, 100) : 0;
      const over = target && value > target * 1.05;
      return '<div class="nutrient-row"><span class="n-label">' + esc(label) + "</span>" +
        '<div class="bar ' + (over ? "red" : tone) + '"><span style="width:' + pct + '%"></span></div>' +
        '<span class="n-val">' + fmt(value) + " / " + fmt(target) + " " + unit + "</span></div>";
    };
    const cond = [];
    if (targets.flags.heart || targets.flags.ckd) cond.push(["Sodium", total.sodium, targets.limits.sodium, "mg"]);
    if (targets.flags.diabetes) cond.push(["Sugar", total.sugar, targets.limits.sugar, "g"]);
    if (targets.flags.heart) cond.push(["Saturated fat", total.satFat, targets.limits.satFat, "g"]);
    if (targets.flags.ckd) cond.push(["Potassium", total.potassium, targets.limits.potassium, "mg"]);
    if (targets.flags.ckd) cond.push(["Phosphorus", total.phosphorus, targets.limits.phosphorus, "mg"]);
    const condRows = cond.map((c) => {
      const over = c[1] > c[2];
      return '<div class="row between small" style="padding:5px 0"><span class="muted">' + esc(c[0]) + (over ? " ⚠" : "") + "</span>" +
        "<strong>" + fmt(c[1]) + " / " + fmt(c[2]) + " " + c[3] + "</strong></div>";
    }).join("");
    return '<div class="card"><div class="card-title"><h3>' + esc(t("sec_plan_totals")) + "</h3>" +
      '<span class="muted small">' + fmt(total.energy) + " kcal</span></div>" +
      row(t("kcal"), total.energy, targets.energy, "kcal", "green") +
      row(t("protein"), total.protein, targets.protein, "g", "blue") +
      row(t("carbs"), total.carbs, targets.carbs, "g", "orange") +
      row(t("fat"), total.fat, targets.fat, "g", "green") +
      row(t("fiber"), total.fiber, targets.fiber, "g", "blue") +
      (condRows ? '<div class="xs muted mt-4" style="text-transform:uppercase;letter-spacing:.05em">' + esc(t("sec_condition_limits")) + "</div>" + condRows : "") +
    "</div>";
  }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    main.addEventListener("click", (e) => {
      const opt = e.target.closest("[data-opt]");
      if (opt) {
        const key = opt.getAttribute("data-opt");
        opts[key] = !opts[key];
        build(user, user.profile);
        App.Router.refresh();
        return;
      }
      if (e.target.closest("[data-regen]")) { build(user, user.profile); App.UI.toast("New plan generated"); App.Router.refresh(); return; }
      if (e.target.closest("[data-save]")) {
        App.State.setPlan(user.id, preview || App.State.getPlan(user.id));
        App.UI.toast("Plan saved");
        return;
      }
      if (e.target.closest("[data-logmeals]")) {
        const plan = preview || App.State.getPlan(user.id);
        App.State.setPlan(user.id, plan);
        const n = App.State.logMealPlan(user.id, plan);
        App.UI.toast(n + " items logged for today");
      }
    });
  }

  App.Router.register("/planner", { render: render, mount: mount, auth: true, roles: ["member"], requiresProfile: true, title: "AI Diet Planner" });
})();
