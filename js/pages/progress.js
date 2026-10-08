/* Progress — weight, calorie, nutrition and activity trends over 7D/30D/3M/6M. */
window.App = window.App || {};
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;
  const fmt = App.I18N.fmtNum;
  const icon = App.Icons.get;

  const RANGES = [
    { id: "7D", days: 7 },
    { id: "30D", days: 30 },
    { id: "3M", days: 90 },
    { id: "6M", days: 180 },
  ];
  let range = "30D";

  function r() { return RANGES.find((x) => x.id === range) || RANGES[1]; }
  function shortDate(iso) { return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  function thin(series, max) {
    if (series.length <= max) return series;
    const step = (series.length - 1) / (max - 1);
    const out = [];
    for (let i = 0; i < max; i++) out.push(series[Math.round(i * step)]);
    return out;
  }

  function datesBack(days) {
    const out = [];
    for (let i = days - 1; i >= 0; i--) out.push(App.State.offsetISO(-i));
    return out;
  }

  function dailyIntake(userId, days) {
    const from = App.State.offsetISO(-(days - 1));
    const byDate = {};
    App.State.logs(userId).forEach((l) => {
      if (l.date >= from) (byDate[l.date] = byDate[l.date] || []).push(l);
    });
    return datesBack(days).map((d) => {
      const totals = App.Profile.sumItems(byDate[d] || []);
      totals.date = d;
      return totals;
    });
  }

  function dailyActivity(userId, weight, days) {
    const from = App.State.offsetISO(-(days - 1));
    const byDate = {};
    App.State.activityLogs(userId).forEach((a) => {
      if (a.date >= from) (byDate[a.date] = byDate[a.date] || []).push(a);
    });
    return datesBack(days).map((d) => {
      const entries = byDate[d] || [];
      return {
        date: d,
        steps: entries.reduce((s, e) => s + (e.steps || 0), 0),
        minutes: entries.reduce((s, e) => s + (e.minutes || 0), 0),
        kcal: entries.reduce((s, e) => s + App.Profile.activityKcal(e, weight), 0),
      };
    });
  }

  function avg(list, key) {
    if (!list.length) return 0;
    return Math.round((list.reduce((s, x) => s + (x[key] || 0), 0) / list.length) * 10) / 10;
  }

  function render() {
    const user = App.State.currentUser();
    const profile = user.profile;
    if (!App.Profile.isComplete(profile)) {
      return '<div class="container">' + App.UI.emptyState("No profile yet", "Create your health profile to see progress.", "📈") +
        '<div class="center mt-3"><a class="btn btn-primary" href="#/onboarding">Start setup</a></div></div>';
    }
    App.State.ensureSeedHealthData(user.id);

    const span = r();
    const targets = App.Profile.computeTargets(profile);
    const weight = App.State.latestWeight(user.id) || profile.weightKg;
    const intake = dailyIntake(user.id, span.days);
    const activity = dailyActivity(user.id, weight, span.days);
    const weightPoints = App.State.weightInRange(user.id, span.days);

    const loggedDays = intake.filter((d) => d.energy > 0).length;
    const avgKcal = loggedDays ? Math.round(intake.reduce((s, d) => s + d.energy, 0) / loggedDays) : 0;
    const avgBurn = Math.round(activity.reduce((s, d) => s + d.kcal, 0) / activity.length);
    const weightChange = App.State.weightChange(user.id, span.days);
    const avgSteps = Math.round(activity.reduce((s, d) => s + d.steps, 0) / activity.length);

    const tabs = RANGES.map((x) => '<button data-range="' + x.id + '"' + (x.id === range ? ' class="active"' : "") + ">" + x.id + "</button>").join("");

    return '<div class="container stack">' +
      '<div class="page-head">' +
        '<div><h1>' + esc(t("nav_progress")) + '</h1><div class="subtitle">' + esc(t("sub_progress")) + "</div></div>" +
        '<div class="range-tabs">' + tabs + "</div>" +
      "</div>" +

      '<div class="grid cols-4">' +
        stat("🔥", fmt(avgKcal) + " kcal", t("lbl_avg") + " intake", avgKcal && targets ? Math.round((avgKcal / targets.energy) * 100) + "% of target" : "—", "orange") +
        stat("🏃", fmt(avgSteps), t("lbl_avg") + " steps", fmt(avgBurn) + " kcal burned/day", "blue") +
        stat("⚖️", fmt(weight) + " kg", t("lbl_current"), weightChange === 0 ? "Stable" : (weightChange < 0 ? "↓ " : "↑ ") + Math.abs(weightChange) + " kg", weightChange <= 0 ? "green" : "orange") +
        stat("🍽️", loggedDays + "/" + span.days, "Days logged", fmt(avg(intake, "protein")) + " g avg protein", "green") +
      "</div>" +

      chartCard("Weight trend", "weight", weightChart(user.id, weightPoints, span.days)) +
      '<div class="grid cols-2" style="align-items:start">' +
        chartCard(t("kcal") + " intake", "energy", intakeChart(intake)) +
        chartCard("Activity (steps)", "steps", activityChart(activity)) +
      "</div>" +
      nutritionCard(intake, targets) +

      App.UI.disclaimer("disc_general") +
    "</div>";
  }

  function stat(emoji, value, label, sub, tone) {
    return '<div class="card stat"><div class="stat-icon">' + emoji + "</div>" +
      '<div class="stat-value" style="font-size:var(--fs-xl)">' + esc(value) + "</div>" +
      '<div class="stat-label">' + esc(label) + "</div>" +
      (sub ? '<div class="xs mt-2"><span class="badge ' + tone + '">' + esc(sub) + "</span></div>" : "") + "</div>";
  }

  function chartCard(title, key, body) {
    return '<div class="card" data-chart="' + key + '"><div class="card-title"><h3>' + esc(title) + "</h3></div>" +
      '<div class="chart-box">' + body + "</div></div>";
  }

  function weightChart(userId, points, days) {
    if (points.length < 2) return '<p class="muted small">Not enough weigh-ins in this range.</p>';
    const series = thin(points.map((w) => ({ value: w.kg, label: shortDate(w.date) })), 12);
    const values = series.map((s) => s.value);
    return App.Charts.lineChart(series, { color: "var(--green-600)", max: Math.ceil(Math.max.apply(null, values) + 1), min: Math.floor(Math.min.apply(null, values) - 1), height: 220, aria: "Weight trend" });
  }

  function intakeChart(intake) {
    const series = thin(intake.map((d) => ({ value: d.energy, label: shortDate(d.date), color: "var(--orange-600)" })), 14);
    if (!series.some((s) => s.value > 0)) return '<p class="muted small">No meals logged in this range.</p>';
    return App.Charts.bars(series, { max: Math.max(1200, Math.max.apply(null, series.map((s) => s.value))), height: 220, aria: "Calorie intake by day" });
  }

  function activityChart(activity) {
    const series = thin(activity.map((d) => ({ value: d.steps, label: shortDate(d.date) })), 14);
    if (!series.some((s) => s.value > 0)) return '<p class="muted small">No activity logged in this range.</p>';
    return App.Charts.bars(series, { max: Math.max(5000, Math.max.apply(null, series.map((s) => s.value))), height: 220, aria: "Steps by day" });
  }

  function nutritionCard(intake, targets) {
    const days = intake.filter((d) => d.energy > 0).length || 1;
    const avgTotals = { energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    intake.forEach((d) => { avgTotals.energy += d.energy; avgTotals.protein += d.protein; avgTotals.carbs += d.carbs; avgTotals.fat += d.fat; avgTotals.fiber += d.fiber; });
    Object.keys(avgTotals).forEach((k) => { avgTotals[k] = Math.round((avgTotals[k] / days) * 10) / 10; });
    const nrow = (label, value, target, unit, tone) => {
      const pct = target ? Math.min((value / target) * 100, 100) : 0;
      const over = target && value > target * 1.05;
      return '<div class="nutrient-row"><span class="n-label">' + esc(label) + "</span>" +
        '<div class="bar ' + (over ? "red" : tone) + '"><span style="width:' + pct + '%"></span></div>' +
        '<span class="n-val">' + fmt(value) + " / " + fmt(target) + " " + unit + "</span></div>";
    };
    return '<div class="card"><div class="card-title"><h3>Average daily nutrition</h3>' +
      '<span class="muted small">' + esc(t("lbl_avg")) + " vs target</span></div>" +
      nrow(t("kcal"), avgTotals.energy, targets.energy, "kcal", "green") +
      nrow(t("protein"), avgTotals.protein, targets.protein, "g", "blue") +
      nrow(t("carbs"), avgTotals.carbs, targets.carbs, "g", "orange") +
      nrow(t("fat"), avgTotals.fat, targets.fat, "g", "green") +
      nrow(t("fiber"), avgTotals.fiber, targets.fiber, "g", "blue") +
    "</div>";
  }

  function mount(params, query, main) {
    main.addEventListener("click", (e) => {
      const b = e.target.closest("[data-range]");
      if (b) { range = b.getAttribute("data-range"); App.Router.refresh(); }
    });
  }

  App.Router.register("/progress", { render: render, mount: mount, auth: true, roles: ["member"], title: "Progress" });
})();
