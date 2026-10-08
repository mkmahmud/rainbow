/* Meal planner / diet chart with swaps, alternatives and premium weekly view. */
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;
  const state = { budgetMode: false, plantOnly: false };

  function plan(user, profile) {
    let p = App.State.getPlan(user.id);
    if (!p) {
      p = App.Engine.generatePlan(profile, { budgetMode: state.budgetMode, plantOnly: state.plantOnly });
      App.State.setPlan(user.id, p);
    }
    return p;
  }
  function regenerate(user, profile) {
    const p = App.Engine.generatePlan(profile, { budgetMode: state.budgetMode, plantOnly: state.plantOnly });
    App.State.setPlan(user.id, p);
    return p;
  }

  function render() {
    const user = App.State.currentUser();
    const profile = user.profile;
    const p = plan(user, profile);
    const targets = p.targets;

    return '<div class="container stack">' +
      '<div class="page-head"><div><h1>' + esc(t("nav_diet")) + "</h1>" +
      '<div class="subtitle">A daily plan built from your safe, ranked foods — with portions.</div></div>' +
      '<div class="row no-print">' +
        '<a class="btn btn-outline" href="#/planner">🤖 ' + esc(t("nav_planner")) + "</a>" +
        '<button class="btn btn-outline" id="dc-print">🖨️ Print</button>' +
        '<button class="btn btn-accent" id="dc-regen">↻ ' + esc(t("btn_regenerate")) + "</button>" +
      "</div></div>" +

      '<div class="card pad-sm no-print"><div class="row">' +
        '<button class="chip' + (state.budgetMode ? " active" : "") + '" id="dc-budget">💰 Budget mode</button>' +
        '<button class="chip' + (state.plantOnly ? " active" : "") + '" id="dc-plant">🌱 Plant-based only</button>' +
        '<span class="spacer"></span><span class="muted small">' + esc("Tap an item to swap or remove it") + "</span>" +
      "</div></div>" +

      '<div id="dc-body">' + bodyHtml(user, profile, p, targets) + "</div>" +

      App.UI.disclaimer("disc_diet") +
    "</div>";
  }

  function bodyHtml(user, profile, p, targets) {
    const total = p.totals;
    return '<div class="grid cols-2" style="align-items:start">' +
      '<div class="stack">' +
        p.slots.map((s) => slotCard(s)).join("") +
      "</div>" +
      '<div class="stack">' +
        '<div class="card"><div class="card-title"><h3>Daily totals</h3></div>' +
          totBar(t("kcal"), total.energy, targets.energy, "green") +
          totBar(t("protein"), total.protein, targets.protein, "blue") +
          totBar(t("carbs"), total.carbs, targets.carbs, "orange") +
          totBar(t("fat"), total.fat, targets.fat, "green") +
          totBar(t("fiber"), total.fiber, targets.fiber, "blue") +
        "</div>" +
        (targets.flags.ckd || targets.flags.heart || targets.flags.diabetes ?
          '<div class="card"><div class="card-title"><h3>Condition limits</h3></div>' +
            condBar(t("sodium"), total.sodium, targets.limits.sodium, "mg", targets.flags.heart || targets.flags.ckd) +
            condBar(t("sugar"), total.sugar, targets.limits.sugar, "g", targets.flags.diabetes) +
            condBar(t("satFat"), total.satFat, targets.limits.satFat, "g", targets.flags.heart) +
            (targets.flags.ckd ? condBar(t("potassium"), total.potassium, targets.limits.potassium, "mg", true) : "") +
            (targets.flags.ckd ? condBar(t("phosphorus"), total.phosphorus, targets.limits.phosphorus, "mg", true) : "") +
          "</div>" : "") +
        (user.premium ? weeklyHtml(profile) : premiumTeaser()) +
      "</div>" +
    "</div>";
  }

  function slotCard(s) {
    return '<div class="card"><div class="card-title"><h3>' + s.icon + " " + esc(App.I18N.name(s)) + '</h3>' +
      '<span class="muted small">' + App.I18N.fmtNum(s.totals.energy) + " kcal</span></div>" +
      (s.items.length ? '<div class="stack">' + s.items.map((it) => itemRow(it, s)).join("") + "</div>"
        : '<p class="muted small">No safe foods found for this meal — adjust your filters.</p>') +
    "</div>";
  }
  function itemRow(it, slot) {
    const f = App.State.foodById(it.foodId);
    if (!f) return "";
    const kcal = (f.per100g.energy * it.grams) / 100;
    return '<div class="row between" style="border-bottom:1px solid var(--border);padding:6px 0">' +
      '<span>' + f.emoji + " <a href=\"#/food/" + f.id + '" style="color:inherit">' + esc(App.I18N.name(f)) + "</a>" +
      ' <span class="muted xs">' + it.grams + " g</span></span>" +
      '<span class="row" style="gap:4px"><span class="muted small">' + App.I18N.fmtNum(kcal) + ' kcal</span>' +
      '<button class="btn btn-ghost btn-sm no-print" data-swap="' + slot.id + "|" + it.foodId + '">Swap</button>' +
      '<button class="icon-btn no-print" data-remove="' + slot.id + "|" + it.foodId + '" title="Remove">×</button></span>' +
    "</div>";
  }

  function totBar(label, value, target, tone) {
    const pct = target ? Math.min((value / target) * 100, 100) : 0;
    return '<div class="mt-3"><div class="row between small"><span>' + esc(label) + '</span><span class="muted">' + App.I18N.fmtNum(value) + " / " + App.I18N.fmtNum(target) + '</span></div><div class="bar ' + tone + ' mt-2"><span style="width:' + pct + '%"></span></div></div>';
  }
  function condBar(label, value, target, unit, active) {
    const ratio = target ? value / target : 0;
    const over = ratio > 1;
    return '<div class="mt-3"><div class="row between small"><span>' + esc(label) + (over ? " ⚠" : "") + '</span><span class="muted">' + App.I18N.fmtNum(value) + " / " + App.I18N.fmtNum(target) + " " + unit + '</span></div><div class="bar thin mt-2"><span style="width:' + Math.min(ratio * 100, 100) + "%;background:" + (over ? "var(--danger)" : active ? "var(--orange-600)" : "var(--blue-400)") + '"></span></div></div>';
  }

  function weeklyHtml(profile) {
    const days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
    return '<div class="card"><div class="card-title"><h3>Weekly chart</h3><span class="badge green">Premium</span></div>' +
      '<div class="stack">' + days.map((d, i) => {
        const p = App.Engine.generatePlan(profile, { budgetMode: state.budgetMode, plantOnly: state.plantOnly, variant: i + 1 });
        const names = [];
        p.slots.forEach((s) => s.items.forEach((it) => { const f = App.State.foodById(it.foodId); if (f) names.push(f.emoji); }));
        return '<div class="row between" style="border-bottom:1px solid var(--border);padding:6px 0"><strong class="small">' + d + "</strong>" +
          '<span class="small">' + names.join(" ") + '</span><span class="muted small">' + App.I18N.fmtNum(p.totals.energy) + " kcal</span></div>";
      }).join("") + "</div></div>";
  }
  function premiumTeaser() {
    return '<div class="card center"><div class="stat-icon" style="margin:0 auto var(--s-3);font-size:24px">⭐</div>' +
      "<h3>Weekly chart is premium</h3>" +
      '<p class="muted small mt-2">Upgrade to see a 7-day plan and request a nutritionist review.</p>' +
      '<div class="mt-3"><a class="btn btn-accent" href="#/premium">' + esc(t("btn_switchPremium")) + "</a></div></div>";
  }

  function persistPlan(user, p) { App.State.setPlan(user.id, p); }

  function update(main) {
    const user = App.State.currentUser();
    const p = App.State.getPlan(user.id);
    main.querySelector("#dc-body").innerHTML = bodyHtml(user, user.profile, p, p.targets);
  }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    main.addEventListener("click", (e) => {
      if (e.target.id === "dc-regen") { regenerate(user, user.profile); update(main); App.UI.toast("New plan generated"); }
      if (e.target.id === "dc-budget") { state.budgetMode = !state.budgetMode; regenerate(user, user.profile); App.Router.refresh(); }
      if (e.target.id === "dc-plant") { state.plantOnly = !state.plantOnly; regenerate(user, user.profile); App.Router.refresh(); }
      if (e.target.id === "dc-print") { window.print(); }

      const rm = e.target.closest("[data-remove]");
      if (rm) {
        const [slotId, foodId] = rm.getAttribute("data-remove").split("|");
        const p = App.State.getPlan(user.id);
        const slot = p.slots.find((s) => s.id === slotId);
        slot.items = slot.items.filter((it) => it.foodId !== foodId);
        slot.totals = App.Profile.sumItems(slot.items);
        recomputeTotals(p);
        persistPlan(user, p); update(main);
        return;
      }
      const sw = e.target.closest("[data-swap]");
      if (sw) {
        const [slotId, foodId] = sw.getAttribute("data-swap").split("|");
        openSwap(slotId, foodId, user, main);
      }
    });
  }

  function recomputeTotals(p) {
    const flat = [];
    p.slots.forEach((s) => s.items.forEach((i) => flat.push(i)));
    p.totals = App.Profile.sumItems(flat);
  }

  function openSwap(slotId, foodId, user, main) {
    const alt = App.Engine.alternatives(foodId, user.profile);
    const body = alt.length
      ? '<div class="stack">' + alt.map((a) =>
          '<button class="card card-hover pad-sm" data-pick="' + a.food.id + '" style="cursor:pointer;text-align:left;width:100%">' +
          '<div class="food-item"><div class="food-thumb">' + a.food.emoji + "</div>" +
          "<div><strong>" + esc(App.I18N.name(a.food)) + '</strong><div class="muted xs">' + App.I18N.fmtNum(a.food.per100g.energy) + " kcal/100 g</div></div></div>" +
          '<p class="muted xs mt-2">' + esc(a.why) + "</p></button>"
        ).join("") + "</div>"
      : '<p class="muted">No alternatives available.</p>';

    const m = App.UI.modal({
      title: "Swap " + App.I18N.name(App.State.foodById(foodId)),
      bodyHtml: body,
      onMount: (root, close) => {
        App.UI.on(root, "click", "[data-pick]", function (e, el) {
          const newId = el.getAttribute("data-pick");
          const p = App.State.getPlan(user.id);
          const slot = p.slots.find((s) => s.id === slotId);
          const item = slot.items.find((it) => it.foodId === foodId);
          item.foodId = newId;
          item.grams = App.State.foodById(newId).portionGrams;
          slot.totals = App.Profile.sumItems(slot.items);
          recomputeTotals(p);
          persistPlan(user, p);
          close();
          update(main);
          App.UI.toast("Swapped");
        });
      },
    });
    void m;
  }

  App.Router.register("/diet", { render: render, mount: mount, auth: true, roles: ["member"], requiresProfile: true, title: "My Diet Chart" });
})();
