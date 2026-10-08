/* My Health — BMI, weight, health indicators, condition limits and goals. */
window.App = window.App || {};
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;
  const fmt = App.I18N.fmtNum;
  const icon = App.Icons.get;

  function clampPct(n) { return Math.max(0, Math.min(100, Math.round(n))); }
  function shortDate(iso) { return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  function thin(series, max) {
    if (series.length <= max) return series;
    const step = (series.length - 1) / (max - 1);
    const out = [];
    for (let i = 0; i < max; i++) out.push(series[Math.round(i * step)]);
    return out;
  }

  function notReady() {
    return '<div class="container">' +
      '<div class="card center mt-2">' +
        '<div class="stat-icon" style="margin:0 auto var(--s-3);font-size:26px">❤️</div>' +
        "<h3>Complete your health profile</h3>" +
        '<p class="muted mt-2" style="max-width:520px;margin:0 auto">Add your age, height, weight and goals so we can show your BMI, targets and safe limits.</p>' +
        '<div class="mt-4"><a class="btn btn-primary btn-lg" href="#/onboarding">Start setup</a></div>' +
      "</div></div>";
  }

  function render() {
    const user = App.State.currentUser();
    const profile = user.profile;
    if (!App.Profile.isComplete(profile)) return notReady();

    App.State.ensureSeedHealthData(user.id);

    const targets = App.Profile.computeTargets(profile);
    const weight = App.State.latestWeight(user.id) || profile.weightKg;
    const bmi = App.Profile.bmi(profile);
    const cat = App.Profile.bmiCategory(bmi);
    const goal = App.State.getGoal(user.id);
    const start = goal ? goal.startWeightKg : weight;
    const target = goal ? goal.targetWeightKg : weight;
    const remaining = Math.round(Math.abs(weight - target) * 10) / 10;
    const denom = start - target;
    const pct = denom !== 0
      ? clampPct(((start - weight) / denom) * 100)
      : (Math.abs(weight - target) < 0.5 ? 100 : 0);
    const change7 = App.State.weightChange(user.id, 7);
    const change30 = App.State.weightChange(user.id, 30);
    const lvl = App.DATA.activityLevels.find((a) => a.id === profile.activity) || {};

    return '<div class="container stack">' +
      '<div class="page-head">' +
        '<div><h1>' + esc(t("nav_my_health")) + '</h1><div class="subtitle">' + esc(t("sub_my_health")) + "</div></div>" +
        '<div class="row"><button class="btn btn-primary" data-logw>' + icon("plus", 18) + " " + esc(t("btn_log_weight")) + "</button></div>" +
      "</div>" +

      '<div class="grid cols-4">' +
        stat("⚖️", fmt(weight) + " kg", t("lbl_current"), change30 === 0 ? "Stable" : (change30 < 0 ? "↓ " : "↑ ") + Math.abs(change30) + " kg / 30d", change30 <= 0 ? "green" : "orange") +
        stat("🧭", bmi ? fmt(bmi, 1) : "—", "BMI", cat.label, cat.tone === "muted" ? "grey" : cat.tone) +
        stat("🎯", fmt(target) + " kg", t("lbl_target"), remaining + " kg to go", "blue") +
        stat("📈", pct + "%", t("lbl_progress"), fmt(start) + " → " + fmt(target) + " kg", "green") +
      "</div>" +

      '<div class="grid cols-2" style="align-items:start">' +
        overviewCard(profile, targets, { weight: weight, change7: change7, change30: change30, lvl: lvl, cat: cat, bmi: bmi }) +
        targetsCard(targets) +
      "</div>" +

      trendCard(user.id, target) +
      weightLogCard(user.id) +

      '<div class="row"><a class="btn btn-outline" href="#/goals">' + icon("target", 18) + " " + esc(t("nav_goals")) + '</a>' +
        '<a class="btn btn-outline" href="#/progress">' + icon("chart", 18) + " " + esc(t("nav_progress")) + "</a></div>" +

      App.UI.disclaimer("disc_condition") +
    "</div>";
  }

  function stat(emoji, value, label, sub, tone) {
    return '<div class="card stat">' +
      '<div class="stat-icon">' + emoji + "</div>" +
      '<div class="stat-value">' + esc(value) + "</div>" +
      '<div class="stat-label">' + esc(label) + "</div>" +
      (sub ? '<div class="xs mt-2"><span class="badge ' + (tone || "grey") + '">' + esc(sub) + "</span></div>" : "") +
    "</div>";
  }

  function row(k, v, tone) {
    return '<div class="overview-row"><span class="k">' + esc(k) + '</span>' +
      (tone ? '<span class="badge ' + tone + '">' + esc(v) + "</span>" : "<strong>" + esc(v) + "</strong>") + "</div>";
  }

  function overviewCard(profile, targets, d) {
    const goal = App.DATA.goals.find((g) => g.id === profile.goal) || {};
    return '<div class="card"><div class="card-title"><h3>' + esc(t("sec_overview")) + "</h3></div>" +
      '<div class="overview-list">' +
        row("Age", profile.age + " yrs") +
        row("Sex", profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1)) +
        row("Height", profile.heightCm + " cm") +
        row("Weight", fmt(d.weight) + " kg") +
        row("BMI", (d.bmi ? fmt(d.bmi, 1) : "—") + " · " + d.cat.label, d.cat.tone === "muted" ? "grey" : d.cat.tone) +
        row("Activity level", d.lvl.nameEn ? d.lvl.nameEn.split(" (")[0] : "—") +
        row("Goal", App.I18N.name(goal) || "—") +
        row("7-day trend", d.change7 === 0 ? "Stable" : (d.change7 < 0 ? "↓ " : "↑ ") + Math.abs(d.change7) + " kg", d.change7 <= 0 ? "green" : "orange") +
        row("30-day trend", d.change30 === 0 ? "Stable" : (d.change30 < 0 ? "↓ " : "↑ ") + Math.abs(d.change30) + " kg", d.change30 <= 0 ? "green" : "orange") +
      "</div></div>";
  }

  function targetRow(label, value, unit) {
    return '<div class="row between small" style="padding:5px 0;border-bottom:1px solid var(--border)">' +
      '<span class="muted">' + esc(label) + "</span><strong>" + fmt(value) + (unit ? " " + unit : "") + "</strong></div>";
  }

  function targetsCard(targets) {
    const limits = targets.limits;
    const cond = [];
    if (targets.flags.heart || targets.flags.ckd) cond.push(["Sodium", limits.sodium, "mg"]);
    if (targets.flags.diabetes) cond.push(["Sugar", limits.sugar, "g"]);
    if (targets.flags.heart) cond.push(["Saturated fat", limits.satFat, "g"]);
    if (targets.flags.ckd) cond.push(["Potassium", limits.potassium, "mg"]);
    if (targets.flags.ckd) cond.push(["Phosphorus", limits.phosphorus, "mg"]);

    return '<div class="card"><div class="card-title"><h3>' + esc(t("sec_daily_targets")) + "</h3>" +
      '<span class="muted small">per day</span></div>' +
      targetRow(t("kcal"), targets.energy, "kcal") +
      targetRow(t("protein"), targets.protein, "g") +
      targetRow(t("carbs"), targets.carbs, "g") +
      targetRow(t("fat"), targets.fat, "g") +
      targetRow(t("fiber"), targets.fiber, "g") +
      (cond.length
        ? '<div class="xs muted mt-4" style="text-transform:uppercase;letter-spacing:.05em">' + esc(t("sec_condition_limits")) + "</div>" +
          '<div class="mt-2">' + cond.map((c) => targetRow("≤ " + c[0], c[1], c[2])).join("") + "</div>"
        : '<p class="muted small mt-3">No condition-specific limits — standard targets apply.</p>') +
    "</div>";
  }

  function trendCard(userId, target) {
    const points = App.State.weightInRange(userId, 30);
    const series = thin(points.map((w) => ({ value: w.kg, label: shortDate(w.date) })), 10);
    const values = series.map((s) => s.value);
    const minV = values.length ? Math.floor(Math.min.apply(null, values.concat([target])) - 1) : 0;
    const maxV = values.length ? Math.ceil(Math.max.apply(null, values.concat([target])) + 1) : 100;
    const chart = series.length >= 2
      ? App.Charts.lineChart(series, { color: "var(--green-600)", max: maxV, min: minV, height: 200, aria: "Weight trend" })
      : '<p class="muted small">Log a few weigh-ins to see your trend.</p>';
    return '<div class="card"><div class="card-title"><h3>Weight trend</h3>' +
      '<span class="muted small">Last 30 days</span></div>' +
      '<div class="chart-box">' + chart + "</div></div>";
  }

  function weightLogCard(userId) {
    const list = App.State.weightLogs(userId).slice().reverse().slice(0, 10);
    const rows = list.length
      ? list.map((w, i) => {
          const prev = App.State.weightLogs(userId).slice().reverse()[i + 1];
          const diff = prev ? Math.round((w.kg - prev.kg) * 10) / 10 : 0;
          return '<div class="log-row"><div><strong>' + fmt(w.kg) + ' kg</strong>' +
            '<div class="muted xs">' + esc(App.UI.fmtDate(w.date)) + "</div></div>" +
            (diff === 0 ? '<span class="muted xs">—</span>' : '<span class="badge ' + (diff < 0 ? "green" : "orange") + '">' + (diff < 0 ? "↓ " : "↑ ") + Math.abs(diff) + " kg</span>") +
            '<button class="icon-btn" data-delw="' + w.id + '" title="Remove" aria-label="Remove">×</button></div>';
        }).join("")
      : App.UI.emptyState(t("empty_no_weight"), "Tap “Log weight” to add your first entry.", "⚖️");
    return '<div class="card"><div class="card-title"><h3>' + esc(t("sec_weight_log")) + "</h3>" +
      '<button class="btn btn-outline btn-sm" data-logw>' + icon("plus", 16) + " " + esc(t("btn_log_weight")) + "</button></div>" +
      '<div class="stack">' + rows + "</div></div>";
  }

  function openWeightModal(user, onDone) {
    App.UI.modal({
      title: t("btn_log_weight"),
      bodyHtml:
        '<div class="field"><label for="mh-kg">Weight (kg)</label>' +
          '<input class="input" id="mh-kg" type="number" min="20" max="400" step="0.1" value="' + (App.State.latestWeight(user.id) || user.profile.weightKg) + '" /></div>' +
        '<div class="field"><label for="mh-date">Date</label>' +
          '<input class="input" id="mh-date" type="date" value="' + App.State.todayISO() + '" /></div>',
      footerHtml: '<button class="btn btn-outline" data-close>' + esc(t("common_cancel")) + '</button><button class="btn btn-primary" data-save>' + esc(t("common_save")) + "</button>",
      onMount: (root, close) => {
        root.querySelector("[data-save]").addEventListener("click", () => {
          const kg = parseFloat(root.querySelector("#mh-kg").value);
          const date = root.querySelector("#mh-date").value || App.State.todayISO();
          if (!kg || kg < 20 || kg > 400) { App.UI.toast("Enter a valid weight (20–400 kg).", "error"); return; }
          App.State.addWeightLog(user.id, { kg: Math.round(kg * 10) / 10, date: date });
          App.State.updateUser(user.id, { profile: Object.assign({}, user.profile, { weightKg: Math.round(kg * 10) / 10 }) });
          close();
          App.UI.toast("Weight logged");
          if (onDone) onDone();
        });
      },
    });
  }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    main.addEventListener("click", (e) => {
      if (e.target.closest("[data-logw]")) { openWeightModal(user, () => App.Router.refresh()); return; }
      const del = e.target.closest("[data-delw]");
      if (del) {
        const id = del.getAttribute("data-delw");
        App.UI.confirm("Remove this weight entry?", { danger: true, okText: "Remove" }).then((ok) => {
          if (ok) { App.State.removeWeightLog(user.id, id); App.Router.refresh(); }
        });
      }
    });
  }

  App.Router.register("/health", { render: render, mount: mount, auth: true, roles: ["member"], title: "My Health" });
})();
