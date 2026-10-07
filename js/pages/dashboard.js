/* Progress dashboard — logging, targets vs intake, trends, warnings. */
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;

  function render() {
    const user = App.State.currentUser();
    App.State.ensureSeedLogs(user.id);
    const profile = user.profile;
    const targets = App.Profile.computeTargets(profile);
    const today = App.State.todayISO();
    const todays = App.State.logsByDate(user.id, today);
    const totals = App.Profile.sumItems(todays);

    return '<div class="container stack">' +
      '<div class="page-head"><div><h1>' + esc(t("nav_dashboard")) + "</h1>" +
      '<div class="subtitle">Track today\'s intake against your targets and see your week.</div></div>' +
      '<button class="btn btn-accent" id="db-add">＋ ' + esc(t("btn_addLog")) + "</button></div>" +

      '<div class="grid cols-4">' +
        '<div class="card center"><div class="row" style="justify-content:center">' + App.Charts.ring(totals.energy, targets.energy, { size: 130, aria: "Energy" }) + "</div>" +
          '<div class="stat-label mt-2">' + esc(t("kcal")) + " today</div></div>" +
        statCard("🥩", App.I18N.fmtNum(totals.protein) + " g", "of " + App.I18N.fmtNum(targets.protein) + " g " + t("protein")) +
        statCard("🌾", App.I18N.fmtNum(totals.carbs) + " g", "of " + App.I18N.fmtNum(targets.carbs) + " g " + t("carbs")) +
        statCard("🌿", App.I18N.fmtNum(totals.fiber) + " g", "of " + App.I18N.fmtNum(targets.fiber) + " g " + t("fiber")) +
      "</div>" +

      '<div class="grid cols-2" style="align-items:start">' +
        '<div class="card"><div class="card-title"><h3>' + esc(t("dashboard_targets")) + "</h3></div>" +
          bar(t("kcal"), totals.energy, targets.energy, "kcal", "green") +
          bar(t("protein"), totals.protein, targets.protein, "g", "blue") +
          bar(t("carbs"), totals.carbs, targets.carbs, "g", "orange") +
          bar(t("fat"), totals.fat, targets.fat, "g", "green") +
        "</div>" +
        '<div class="card"><div class="card-title"><h3>Condition limits</h3></div>' +
          (risk(t("sodium"), totals.sodium, targets.limits.sodium, "mg")) +
          (risk(t("sugar"), totals.sugar, targets.limits.sugar, "g")) +
          (risk(t("satFat"), totals.satFat, targets.limits.satFat, "g")) +
          (targets.flags.ckd ? risk(t("potassium"), totals.potassium, targets.limits.potassium, "mg") : "") +
          (targets.flags.ckd ? risk(t("phosphorus"), totals.phosphorus, targets.limits.phosphorus, "mg") : "") +
          insights(targets, totals) +
        "</div>" +
      "</div>" +

      '<div class="card"><div class="card-title"><h3>7-day energy trend</h3></div>' + trendHtml(user.id, targets.energy) + "</div>" +

      '<div class="card"><div class="card-title"><h3>Today\'s log</h3><span class="muted small">' + todays.length + " items</span></div>" +
        (todays.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Food</th><th>Meal</th><th class="num">Portion</th><th class="num">kcal</th><th></th></tr></thead><tbody>' +
          todays.map((l) => logRow(l)).join("") + "</tbody></table></div>"
          : '<p class="muted small">Nothing logged yet today. Tap “Log food”.</p>') +
      "</div>" +

      App.UI.disclaimer("disc_general") +
    "</div>";
  }

  function statCard(icon, value, label) {
    return '<div class="card stat"><div class="stat-icon">' + icon + '</div><div class="stat-value" style="font-size:var(--fs-xl)">' + esc(value) + '</div><div class="stat-label">' + esc(label) + "</div></div>";
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
    return "<tr><td>" + f.emoji + " " + esc(App.I18N.name(f)) + "</td><td>" + esc(slot ? App.I18N.name(slot) : l.slot) + '</td><td class="num">' + l.grams + ' g</td><td class="num">' + App.I18N.fmtNum(kcal) + '</td><td class="num"><button class="icon-btn" data-del="' + l.id + '" title="Remove">×</button></td></tr>';
  }

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

  App.Router.register("/dashboard", { render: render, mount: mount, auth: true, requiresProfile: true, title: "Dashboard" });
})();
