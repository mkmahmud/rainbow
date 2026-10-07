/* Member dashboard — laid out like the reference: KPI row, gauge + macro
   charts, meal progress, recommended menu, and a right rail with the week,
   today's meals and recent activity. */
window.App = window.App || {};
App.Dash = App.Dash || {};

App.Dash.Member = (function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;

  function first(name) { return (name || "").split(" ")[0]; }

  function render() {
    const user = App.State.currentUser();
    const profile = user.profile;

    if (!App.Profile.isComplete(profile)) {
      return '<div class="container">' +
        '<div class="card center mt-2">' +
          '<div class="stat-icon" style="margin:0 auto var(--s-3);font-size:26px">📝</div>' +
          "<h3>Complete your health profile</h3>" +
          '<p class="muted mt-2" style="max-width:520px;margin:0 auto">Tell us your age, weight, goals and any conditions so we can tailor food suggestions and safety limits.</p>' +
          '<div class="mt-4"><a class="btn btn-primary btn-lg" href="#/onboarding">Start setup</a></div>' +
        "</div>" + App.UI.disclaimer("disc_recommendation") + "</div>";
    }

    App.State.ensureSeedLogs(user.id);
    const targets = App.Profile.computeTargets(profile);
    const todays = App.State.logsByDate(user.id, App.State.todayISO());
    const totals = App.Profile.sumItems(todays);
    const plan = App.State.getPlan(user.id) || App.Engine.generatePlan(profile, {});
    const rec = App.Engine.recommend(profile, { limit: 4 });

    return '<div class="container">' +
      '<div class="dash-grid">' +
        '<div class="dash-main">' +
          kpiRow(user, targets, totals) +
          chartRow(targets, totals) +
          mealProgress(plan, todays, targets) +
          recommendedMenu(plan) +
          suggestedFoods(rec) +
          '<div class="dash-note">' + App.UI.disclaimer("disc_recommendation") + "</div>" +
          '<footer class="dash-foot"><div>© ' + new Date().getFullYear() + " " + esc(t("appName")) + "</div>" +
            '<div class="dash-foot-links"><a href="#/help">' + esc(t("nav_help")) + '</a><a href="#/settings">' + esc(t("nav_settings")) + '</a><a href="#/profile">' + esc(t("nav_profile")) + "</a></div></footer>" +
        "</div>" +
        '<aside class="dash-rail">' +
          railWeek() +
          railMeals(plan) +
          railActivity(user) +
        "</aside>" +
      "</div>" +
    "</div>";
  }

  /* ---------- KPI row ---------- */
  function kpiRow(user, targets, totals) {
    const remaining = Math.max(Math.round(targets.energy - totals.energy), 0);
    const pLeft = Math.max(Math.round(targets.protein - totals.protein), 0);
    const pPct = targets.protein ? Math.round((totals.protein / targets.protein) * 100) : 0;
    const cLeft = Math.max(Math.round(targets.carbs - totals.carbs), 0);
    const cPct = targets.carbs ? Math.round((totals.carbs / targets.carbs) * 100) : 0;

    return '<section class="kpi-row">' +
      '<div class="kpi"><div class="kpi-top"><span class="kpi-ic">' + App.Icons.get("flame", 18) + "</span><span class=\"kpi-label\">" + esc(t("kcal")) + "</span></div>" +
        '<div class="kpi-ring">' + App.Charts.ring(totals.energy, targets.energy, { size: 74, stroke: 8, aria: "Energy" }) + "</div>" +
        '<div class="kpi-sub">' + App.I18N.fmtNum(remaining) + " kcal left</div></div>" +

      '<div class="kpi"><div class="kpi-top"><span class="kpi-ic">' + App.Icons.get("leaf", 18) + "</span><span class=\"kpi-label\">" + esc(t("protein")) + "</span></div>" +
        '<div class="kpi-value">' + pPct + "%</div>" +
        '<div class="kpi-bar"><span style="width:' + Math.min(pPct, 100) + '%;background:var(--blue-600)"></span></div>' +
        '<div class="kpi-sub">' + App.I18N.fmtNum(pLeft) + " g left</div></div>" +

      '<div class="kpi"><div class="kpi-top"><span class="kpi-ic">' + App.Icons.get("spark", 18) + "</span><span class=\"kpi-label\">" + esc(t("fiber")) + "</span></div>" +
        '<div class="spark">' + sparkline(lastDays(user.id, 7)) + "</div>" +
        '<div class="kpi-value sm">' + App.I18N.fmtNum(totals.fiber) + " / " + App.I18N.fmtNum(targets.fiber) + " g</div></div>" +

      '<div class="kpi"><div class="kpi-top"><span class="kpi-ic">' + App.Icons.get("drop", 18) + "</span><span class=\"kpi-label\">" + esc(t("carbs")) + "</span></div>" +
        '<div class="kpi-value">' + App.I18N.fmtNum(totals.carbs) + " <small>g</small></div>" +
        '<div class="kpi-bar"><span style="width:' + Math.min(cPct, 100) + '%;background:var(--orange-600)"></span></div>' +
        '<div class="kpi-sub">' + App.I18N.fmtNum(cLeft) + " g left</div></div>" +
    "</section>";
  }

  /* ---------- charts ---------- */
  function chartRow(targets, totals) {
    const remaining = Math.max(Math.round(targets.energy - totals.energy), 0);
    const over = totals.energy > targets.energy;
    return '<section class="chart-row">' +
      '<div class="panel">' +
        '<div class="panel-head"><h3>Energy today</h3><span class="badge ' + (over ? "red" : "green") + '">' + esc(over ? "Over target" : "On track") + "</span></div>" +
        '<div class="gauge-wrap">' + App.Charts.gauge(totals.energy, targets.energy, { center: App.I18N.fmtNum(totals.energy), unit: "", sub: "of " + App.I18N.fmtNum(targets.energy) + " kcal", minLabel: "0", maxLabel: App.I18N.fmtNum(targets.energy), aria: "Energy today" }) + "</div>" +
        '<div class="gauge-caption"><strong>' + App.I18N.fmtNum(remaining) + " kcal left</strong> today</div>" +
        '<p class="muted small chart-note">Progress is progress, no matter how slow. Keep going — you\'re getting closer to your goal every day.</p>' +
      "</div>" +
      '<div class="panel">' +
        '<div class="panel-head"><h3>Calories intake</h3></div>' +
        '<div class="donut-row">' +
          '<div class="donut">' + App.Charts.ring(totals.energy, targets.energy, { size: 150, stroke: 14, aria: "Calories" }) + "</div>" +
          '<div class="donut-stats">' +
            '<div class="donut-stat"><strong>' + App.I18N.fmtNum(totals.energy) + '</strong><span>kcal eaten</span></div>' +
            '<div class="donut-stat"><strong>' + App.I18N.fmtNum(targets.energy) + '</strong><span>kcal target</span></div>' +
          "</div>" +
        "</div>" +
        '<div class="macro-bars">' +
          macro(t("carbs"), totals.carbs, targets.carbs, "var(--orange-600)") +
          macro(t("protein"), totals.protein, targets.protein, "var(--blue-600)") +
          macro(t("fat"), totals.fat, targets.fat, "var(--green-600)") +
        "</div>" +
      "</div>" +
    "</section>";
  }
  function macro(label, value, target, color) {
    const pct = target ? Math.round((value / target) * 100) : 0;
    return '<div class="macro"><div class="macro-head"><span>' + esc(label) + "</span><span class=\"muted\">" +
      App.I18N.fmtNum(value) + " / " + App.I18N.fmtNum(target) + " g · " + pct + '%</span></div>' +
      '<div class="bar thin"><span style="width:' + Math.min(pct, 100) + "%;background:" + color + '"></span></div></div>';
  }

  /* ---------- meal progress ---------- */
  function mealProgress(plan, todays, targets) {
    const tones = ["green", "blue", "orange", "green"];
    return '<section class="panel">' +
      '<div class="panel-head"><h3>Today\'s meals</h3>' +
        '<button class="btn btn-accent btn-sm" data-addlog>＋ ' + esc(t("btn_addLog")) + "</button></div>" +
      '<div class="meal-progress">' + plan.slots.map((s, i) => {
        const logged = todays.filter((l) => l.slot === s.id).reduce((a, l) => {
          const f = App.State.foodById(l.foodId);
          return a + (f ? (f.per100g.energy * l.grams) / 100 : 0);
        }, 0);
        const budget = targets.energy * (App.DATA.mealSlots.find((m) => m.id === s.id) || { pct: 0.25 }).pct;
        const pct = budget ? Math.min(Math.round((logged / budget) * 100), 100) : 0;
        return '<div class="meal-card ' + tones[i % tones.length] + '">' +
          '<div class="mc-top"><span>' + s.icon + " " + esc(App.I18N.name(s)) + "</span><strong>" + pct + "%</strong></div>" +
          '<div class="mc-sub">' + App.I18N.fmtNum(logged) + " / " + App.I18N.fmtNum(budget) + " kcal</div>" +
          '<div class="mc-bar"><span style="width:' + pct + '%"></span></div>' +
        "</div>";
      }).join("") + "</div>" +
    "</section>";
  }

  /* ---------- recommended menu ---------- */
  function recommendedMenu(plan) {
    const picks = plan.slots.filter((s) => s.id === "breakfast" || s.id === "lunch").slice(0, 2);
    return '<section class="panel">' +
      '<div class="panel-head"><h3>Recommended menu</h3><a class="btn btn-ghost btn-sm" href="#/diet">' + esc(t("nav_diet")) + "</a></div>" +
      '<div class="rec-menu">' + picks.map((s) => {
        const items = s.items.map((it) => App.State.foodById(it.foodId)).filter(Boolean);
        const title = items[0] ? App.I18N.name(items[0]) : App.I18N.name(s);
        const rest = items.slice(1).map((f) => App.I18N.name(f)).join(", ");
        return '<article class="rec-card">' +
          '<div class="rec-thumb">' + (items[0] ? items[0].emoji : s.icon) + "</div>" +
          '<div class="rec-body">' +
            '<div class="rec-top"><span class="badge green">' + esc(App.I18N.name(s)) + '</span><span class="muted small">' + App.I18N.fmtNum(s.totals.energy) + " kcal</span></div>" +
            '<h4>' + esc(title) + "</h4>" +
            '<div class="macro-tags">' + macroTag("C", s.totals.carbs) + macroTag("P", s.totals.protein) + macroTag("F", s.totals.fat) + "</div>" +
            '<p class="muted small">' + esc(rest || "Balanced, condition-aware portion for this meal.") + "</p>" +
          "</div></article>";
      }).join("") + "</div>" +
    "</section>";
  }
  function macroTag(letter, grams) {
    return '<span class="macro-tag"><b>' + letter + "</b> " + App.I18N.fmtNum(grams) + "g</span>";
  }

  /* ---------- suggested foods ---------- */
  function suggestedFoods(rec) {
    return '<section class="panel">' +
      '<div class="panel-head"><h3>Suggested foods for you</h3><a class="btn btn-ghost btn-sm" href="#/recommendations">See all</a></div>' +
      '<div class="suggest-list">' + rec.items.map((it) => {
        const f = it.food;
        const cost = App.DATA.costTiers.find((c) => c.id === f.costTier);
        const tag = f.isPlantBased ? "Plant-based" : cost ? App.I18N.name(cost) : "";
        return '<div class="suggest-row">' +
          '<div class="food-thumb sm">' + f.emoji + "</div>" +
          '<div class="suggest-info"><a href="#/food/' + f.id + '"><strong>' + esc(App.I18N.name(f)) + "</strong></a>" +
            '<div class="muted xs">' + App.I18N.fmtNum((f.per100g.energy * f.portionGrams) / 100) + " kcal · " + esc(f.portionLabel) + "</div></div>" +
          (tag ? '<span class="badge ' + (f.isPlantBased ? "green" : "grey") + '">' + esc(tag) + "</span>" : "") +
          '<button class="btn btn-outline btn-sm" data-logfood="' + f.id + '">+ Log</button>' +
        "</div>";
      }).join("") + "</div>" +
    "</section>";
  }

  /* ---------- right rail ---------- */
  function railWeek() {
    const now = new Date();
    const offset = (now.getDay() + 6) % 7;
    const monday = new Date(now); monday.setDate(now.getDate() - offset);
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return '<div class="panel week-panel">' +
      '<div class="panel-head"><h3>' + now.toLocaleDateString(undefined, { month: "long", year: "numeric" }) + "</h3></div>" +
      '<div class="week-strip">' + labels.map((lab, i) => {
        const d = new Date(monday); d.setDate(monday.getDate() + i);
        const today = d.toDateString() === now.toDateString();
        return '<div class="day' + (today ? " today" : "") + '"><span>' + lab + "</span><strong>" + d.getDate() + "</strong></div>";
      }).join("") + "</div></div>";
  }

  function railMeals(plan) {
    return '<div class="panel">' +
      '<div class="panel-head"><h3>Today\'s meals</h3></div>' +
      '<div class="rail-meals">' + plan.slots.map((s) => {
        const items = s.items.map((it) => App.State.foodById(it.foodId)).filter(Boolean);
        const title = items.slice(0, 2).map((f) => App.I18N.name(f)).join(", ") || "No safe foods";
        return '<div class="rail-meal">' +
          '<div class="rail-meal-top"><span>' + s.icon + " " + esc(App.I18N.name(s)) + "</span><strong>" + App.I18N.fmtNum(s.totals.energy) + " kcal</strong></div>" +
          '<div class="muted xs">' + esc(title) + "</div>" +
          '<div class="macro-tags sm">' + macroTag("C", s.totals.carbs) + macroTag("P", s.totals.protein) + macroTag("F", s.totals.fat) + "</div>" +
        "</div>";
      }).join("") + "</div></div>";
  }

  function railActivity(user) {
    const logs = App.State.logs(user.id).slice(-5).reverse();
    const rows = logs.length
      ? logs.map((l) => {
          const f = App.State.foodById(l.foodId);
          if (!f) return "";
          const time = l.at ? new Date(l.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : App.UI.fmtDate(l.date);
          return '<li><span class="act-time">' + esc(time) + "</span>" +
            "<div>Logged <strong>" + esc(App.I18N.name(f)) + "</strong> · " + l.grams + " g</div></li>";
        }).join("")
      : '<li class="muted small">No activity yet today.</li>';
    return '<div class="panel">' +
      '<div class="panel-head"><h3>Recent activity</h3></div>' +
      '<ul class="activity">' + rows + "</ul>" +
    "</div>";
  }

  function lastDays(userId, n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const totals = App.Profile.sumItems(App.State.logsByDate(userId, App.State.offsetISO(-i)));
      out.push(Math.round(totals.fiber));
    }
    return out;
  }
  function sparkline(values) {
    const max = Math.max.apply(null, values.concat([1]));
    return values.map((v) => '<span style="height:' + Math.max(Math.round((v / max) * 100), 6) + '%"></span>').join("");
  }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    main.addEventListener("click", (e) => {
      const add = e.target.closest("[data-addlog]");
      if (add) { openAdd(user); return; }
      const log = e.target.closest("[data-logfood]");
      if (log) { openLog(user, log.getAttribute("data-logfood")); return; }
    });
  }

  function openAdd(user) {
    const foods = App.State.allFoods().slice().sort((a, b) => App.I18N.name(a).localeCompare(App.I18N.name(b)));
    const slots = App.DATA.mealSlots;
    App.UI.modal({
      title: "Log a food",
      bodyHtml:
        '<div class="field"><label>Food</label><select class="select" id="lg-food">' +
          foods.map((f) => '<option value="' + f.id + '">' + f.emoji + " " + esc(App.I18N.name(f)) + " (" + f.portionLabel + ")</option>").join("") + "</select></div>" +
        '<div class="field"><label>Meal</label><select class="select" id="lg-slot">' +
          slots.map((s) => '<option value="' + s.id + '">' + s.icon + " " + esc(App.I18N.name(s)) + "</option>").join("") + "</select></div>" +
        '<div class="field"><label>Portion (g)</label><input class="input" id="lg-grams" type="number" min="1" value="100" /></div>',
      footerHtml: '<button class="btn btn-outline" data-close>' + esc(t("common_cancel")) + '</button><button class="btn btn-primary" data-save>Log it</button>',
      onMount: (root, close) => {
        const sel = root.querySelector("#lg-food");
        const setPortion = () => { const f = App.State.foodById(sel.value); const g = root.querySelector("#lg-grams"); if (f && g) g.value = f.portionGrams; };
        sel.addEventListener("change", setPortion);
        setPortion();
        root.querySelector("[data-save]").addEventListener("click", () => {
          const grams = Math.max(1, parseInt(root.querySelector("#lg-grams").value || "0", 10) || 100);
          App.State.addLog(user.id, { foodId: sel.value, grams: grams, slot: root.querySelector("#lg-slot").value });
          close();
          App.Router.refresh();
          App.UI.toast("Logged");
        });
      },
    });
  }

  function openLog(user, foodId) {
    const food = App.State.foodById(foodId);
    if (!food) return;
    const slots = App.DATA.mealSlots;
    App.UI.modal({
      title: "Log " + App.I18N.name(food),
      bodyHtml:
        '<div class="field"><label>Meal</label><select class="select" id="lg-slot">' +
          slots.map((s) => '<option value="' + s.id + '">' + s.icon + " " + esc(App.I18N.name(s)) + "</option>").join("") + "</select></div>" +
        '<div class="field"><label>Portion (g)</label><input class="input" id="lg-grams" type="number" min="1" value="' + food.portionGrams + '" /></div>',
      footerHtml: '<button class="btn btn-outline" data-close>' + esc(t("common_cancel")) + '</button><button class="btn btn-primary" data-save>Log it</button>',
      onMount: (root, close) => {
        root.querySelector("[data-save]").addEventListener("click", () => {
          const grams = Math.max(1, parseInt(root.querySelector("#lg-grams").value || "0", 10) || food.portionGrams);
          App.State.addLog(user.id, { foodId: food.id, grams: grams, slot: root.querySelector("#lg-slot").value });
          close();
          App.Router.refresh();
          App.UI.toast("Logged");
        });
      },
    });
  }

  return { render, mount };
})();
