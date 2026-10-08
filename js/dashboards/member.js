/* Member dashboard — matches the approved reference layout:
   greeting hero → 5 stat tiles (Calories, Nutrition, Activity, Weight,
   Calendar) → 4 panels (Today's Goal, Energy Balance, Health Overview,
   Today's Meals) → a detail grid (Weight Progress, Today's Activity,
   Market Price, AI Recommendation, Diet Summary, Food recommendations,
   Next Appointment). */
window.App = window.App || {};
App.Dash = App.Dash || {};

App.Dash.Member = (function () {
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
  let range = "3M";

  function first(name) { return (name || "").split(" ")[0]; }
  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }
  function signed(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n); }
  function shortDate(iso) { return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  function thin(series, max) {
    if (series.length <= max) return series;
    const step = (series.length - 1) / (max - 1);
    const out = [];
    for (let i = 0; i < max; i++) out.push(series[Math.round(i * step)]);
    return out;
  }

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
    App.State.ensureSeedHealthData(user.id);

    const targets = App.Profile.computeTargets(profile);
    const todays = App.State.logsByDate(user.id, App.State.todayISO());
    const totals = App.Profile.sumItems(todays);
    const plan = App.State.getPlan(user.id) || App.Engine.generatePlan(profile, {});

    return '<div class="container">' +
      '<div class="dash-v2">' +
        hero(user) +
        tileRow(user, profile, targets, totals) +
        panelRow(user, profile, targets, totals, plan) +
        detailGrid(user, profile, targets, totals, plan) +
        '<div class="dash-note">' + App.UI.disclaimer("disc_recommendation") + "</div>" +
      "</div>" +
    "</div>";
  }

  /* ---------- hero ---------- */
  function hero(user) {
    return '<section class="dash-hero">' +
      '<div><h1>' + esc(greeting() + ", " + first(user.name)) + " 👋</h1>" +
        "<p>" + esc(t("greet_sub")) + "</p></div>" +
      '<div class="hero-art">Healthy Food<br>Happy You</div>' +
    "</section>";
  }

  /* ---------- 5 stat tiles ---------- */
  function tileRow(user, profile, targets, totals) {
    const activity = App.State.activityByDate(user.id, App.State.todayISO());
    const weight = App.State.latestWeight(user.id) || profile.weightKg;
    const steps = activity.reduce((a, e) => a + (e.steps || 0), 0);
    const minutes = activity.reduce((a, e) => a + (e.minutes || 0), 0);
    const burned = activity.reduce((a, e) => a + App.Profile.activityKcal(e, weight), 0);
    const km = App.Profile.stepsToKm(steps);
    const goal = App.State.getGoal(user.id);
    const target = goal ? goal.targetWeightKg : profile.weightKg;
    const week = App.State.weightInRange(user.id, 7);
    const change = week.length >= 2 ? Math.round((week[week.length - 1].kg - week[0].kg) * 10) / 10 : 0;
    const energyPct = targets.energy ? Math.round((totals.energy / targets.energy) * 100) : 0;
    const balance = App.Profile.balanceScore(totals, targets);
    const split = App.Profile.macroSplit(totals);

    return '<section class="tile-row">' +
      /* Calories */
      '<div class="tile"><div class="tile-head"><span class="tile-ic red">' + icon("flame", 17) + '</span><span class="tile-label">Calories</span></div>' +
        '<div class="tile-value">' + fmt(totals.energy) + " <small>/ " + fmt(targets.energy) + " kcal</small></div>" +
        '<div class="tile-bar" style="margin-top:12px"><span style="width:' + Math.min(energyPct, 100) + '%"></span></div>' +
        '<div class="tile-foot">' + energyPct + "% of daily target</div></div>" +

      /* Nutrition */
      '<div class="tile"><div class="tile-head"><span class="tile-ic green">' + icon("leaf", 17) + '</span><span class="tile-label">Nutrition</span></div>' +
        '<div class="nutri-wrap">' +
          '<div class="nutri-donut" style="background:conic-gradient(var(--nut-carbs) 0 ' + split.carbs + '%, var(--nut-protein) ' + split.carbs + '% ' + (split.carbs + split.protein) + '%, var(--nut-fat) ' + (split.carbs + split.protein) + '% 100%)"><span>' + balance + '%</span></div>' +
          '<div class="nutri-legend">' +
            '<div><i class="dot" style="background:var(--nut-carbs)"></i>Carbs ' + split.carbs + '%</div>' +
            '<div><i class="dot" style="background:var(--nut-protein)"></i>Protein ' + split.protein + '%</div>' +
            '<div><i class="dot" style="background:var(--nut-fat)"></i>Fat ' + split.fat + '%</div>' +
          "</div>" +
        "</div>" +
        '<div class="tile-foot">' + balance + "% balanced</div></div>" +

      /* Activity */
      '<div class="tile"><div class="tile-head"><span class="tile-ic blue">' + icon("activity", 17) + '</span><span class="tile-label">Activity</span></div>' +
        '<div class="tile-value">' + fmt(steps) + " <small>steps</small></div>" +
        '<div class="tile-sub">' + km + " km · " + fmt(minutes) + " min</div>" +
        '<div class="tile-foot">' + fmt(burned) + " kcal burned</div></div>" +

      /* Weight */
      '<div class="tile"><div class="tile-head"><span class="tile-ic teal">' + icon("scale", 17) + '</span><span class="tile-label">Weight</span></div>' +
        '<div class="tile-value">' + weight + " <small>kg</small></div>" +
        '<div class="tile-sub">' + (change === 0 ? "No change" : (change < 0 ? "↓ " : "↑ ") + Math.abs(change) + " kg this week") + "</div>" +
        '<div class="tile-foot">Target: ' + target + " kg</div></div>" +

      /* Calendar */
      '<div class="tile"><div class="tile-head"><span class="tile-ic purple">' + icon("calendar", 17) + '</span><span class="tile-label">Calendar</span></div>' +
        miniCalendar() + "</div>" +
    "</section>";
  }

  function miniCalendar() {
    const now = new Date();
    const offset = (now.getDay() + 6) % 7;
    const monday = new Date(now); monday.setDate(now.getDate() - offset);
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const days = labels.map((lab, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      const today = d.toDateString() === now.toDateString();
      return '<div class="day' + (today ? " today" : "") + '"><span>' + lab + "</span><strong>" + d.getDate() + "</strong></div>";
    }).join("");
    return '<div class="mini-cal-title">' + esc(now.toLocaleDateString(undefined, { month: "long", year: "numeric" })) + "</div>" +
      '<div class="week-strip">' + days + "</div>";
  }

  /* ---------- 4 panels ---------- */
  function panelRow(user, profile, targets, totals, plan) {
    return '<section class="panel-row">' +
      goalCard(user, profile) +
      energyCard(user, targets, totals) +
      overviewCard(user, profile, targets, totals) +
      mealsCard(plan) +
    "</section>";
  }

  function goalCard(user, profile) {
    const goal = App.State.getGoal(user.id);
    const weight = App.State.latestWeight(user.id) || profile.weightKg;
    const target = goal ? goal.targetWeightKg : weight;
    const start = goal ? goal.startWeightKg : weight;
    const denom = start - target;
    const pct = denom !== 0 ? Math.max(0, Math.min(100, Math.round(((start - weight) / denom) * 100))) : (Math.abs(weight - target) < 0.5 ? 100 : 0);
    const remaining = Math.round(Math.abs(weight - target) * 10) / 10;
    return '<div class="panel"><div class="panel-head"><h3>Today\'s Goal</h3>' +
        '<a class="link" href="#/goals">' + esc(t("common_edit")) + "</a></div>" +
      '<div class="goal-line"><span>' + weight + " kg</span><span class=\"arrow\">→</span><span>" + target + " kg</span></div>" +
      '<div class="goal-bar"><span style="width:' + pct + '%"></span></div>' +
      '<div class="goal-sub">' + remaining + " kg remaining · " + pct + "%</div>" +
      '<div class="goal-quote">“Every healthy choice brings you closer to your goal.”</div>' +
    "</div>";
  }

  function energyCard(user, targets, totals) {
    const weight = App.State.latestWeight(user.id) || 70;
    const activity = App.State.activityByDate(user.id, App.State.todayISO());
    const burned = activity.reduce((a, e) => a + App.Profile.activityKcal(e, weight), 0);
    const net = totals.energy - burned;
    return '<div class="panel"><div class="panel-head"><h3>Energy Balance</h3></div>' +
      '<div class="energy-list">' +
        '<div class="energy-row"><span class="k">' + icon("flame", 15) + "Calorie intake</span><strong>" + fmt(totals.energy) + " kcal</strong></div>" +
        '<div class="energy-row"><span class="k">' + icon("activity", 15) + "Calories burned</span><strong>" + fmt(burned) + " kcal</strong></div>" +
        '<div class="energy-row net"><span class="k">Net energy</span><strong>' + fmt(net) + " kcal</strong></div>" +
        '<div class="energy-row"><span class="k">' + icon("target", 15) + "Daily target</span><strong>" + fmt(targets.energy) + " kcal</strong></div>" +
      "</div></div>";
  }

  function overviewCard(user, profile, targets, totals) {
    const bmi = App.Profile.bmi(profile);
    const cat = App.Profile.bmiCategory(bmi);
    const week = App.State.weightInRange(user.id, 7);
    const change = week.length >= 2 ? Math.round((week[week.length - 1].kg - week[0].kg) * 10) / 10 : 0;
    const proteinPct = targets.protein ? Math.round((totals.protein / targets.protein) * 100) : 0;
    const fiberPct = targets.fiber ? Math.round((totals.fiber / targets.fiber) * 100) : 0;
    const calOk = totals.energy <= targets.energy * 1.05;
    const lvl = (App.DATA.activityLevels.find((a) => a.id === profile.activity) || {});
    const row = (k, v, tone) => '<div class="overview-row"><span class="k">' + esc(k) + '</span><span class="badge ' + tone + '">' + esc(v) + "</span></div>";
    return '<div class="panel"><div class="panel-head"><h3>Health Overview</h3></div>' +
      '<div class="overview-list">' +
        row("BMI", (bmi ? bmi.toFixed(1) : "—") + " · " + cat.label, cat.tone === "muted" ? "grey" : cat.tone) +
        row("Weight trend", change === 0 ? "Stable" : (change < 0 ? "↓ " : "↑ ") + Math.abs(change) + " kg", change <= 0 ? "green" : "orange") +
        row("Activity level", lvl.nameEn ? lvl.nameEn.split(" (")[0] : "—", "green") +
        row("Calories", calOk ? "Within target" : "Over target", calOk ? "green" : "orange") +
        row("Protein", proteinPct + "% target", proteinPct >= 80 ? "green" : "orange") +
        row("Fibre", fiberPct + "% target", fiberPct >= 80 ? "green" : "orange") +
      "</div>" +
      '<div class="overview-note">' + esc("You're on track! Your weight and activity are moving towards your goal.") + "</div>" +
    "</div>";
  }

  function mealsCard(plan) {
    const rows = plan.slots.map((s) => {
      const names = s.items.map((it) => App.State.foodById(it.foodId)).filter(Boolean).map((f) => App.I18N.name(f)).slice(0, 3).join(", ");
      return '<div class="meal-row"><span class="m-ic">' + s.icon + '</span>' +
        '<div class="m-body"><strong>' + esc(App.I18N.name(s)) + "</strong><div>" + esc(names || "—") + "</div></div>" +
        '<span class="m-kcal">' + fmt(s.totals.energy) + " kcal</span></div>";
    }).join("");
    return '<div class="panel"><div class="panel-head"><h3>Today\'s Meals</h3>' +
        '<a class="link" href="#/diet">' + esc(t("nav_diet")) + "</a></div>" +
      '<div class="meal-rows">' + rows + "</div></div>";
  }

  /* ---------- detail grid ---------- */
  function detailGrid(user, profile, targets, totals, plan) {
    return '<section class="dash-grid3">' +
      weightProgressCard(user, profile) +
      activityCard(user, profile) +
      aiCard(targets, totals) +
      dietSummaryCard(plan) +
      marketCard() +
      nextApptCard(user) +
      foodRecCard(targets, totals) +
    "</section>";
  }

  function weightProgressCard(user, profile) {
    const goal = App.State.getGoal(user.id);
    const weights = App.State.weightLogs(user.id);
    const current = weights.length ? weights[weights.length - 1].kg : profile.weightKg;
    const start = goal ? goal.startWeightKg : (weights.length ? weights[0].kg : current);
    const target = goal ? goal.targetWeightKg : current;
    const r = RANGES.find((x) => x.id === range) || RANGES[2];
    const points = App.State.weightInRange(user.id, r.days);
    const series = thin(points.map((w) => ({ value: w.kg, label: shortDate(w.date) })), 12);
    const values = series.map((s) => s.value);
    const minV = values.length ? Math.floor(Math.min.apply(null, values.concat([target])) - 1) : 0;
    const maxV = values.length ? Math.ceil(Math.max.apply(null, values.concat([target])) + 1) : 100;
    const denom = start - target;
    const pct = denom !== 0 ? Math.max(0, Math.min(100, Math.round(((start - current) / denom) * 100))) : 0;
    const tabs = RANGES.map((x) => '<button data-range="' + x.id + '"' + (x.id === range ? ' class="active"' : "") + ">" + x.id + "</button>").join("");
    const chart = series.length >= 2
      ? App.Charts.lineChart(series, { color: "var(--green-600)", max: maxV, min: minV, height: 190, aria: "Weight progress" })
      : '<p class="muted small">Not enough weight logs yet — log your weight to see your trend.</p>';
    return '<div class="panel span-2"><div class="panel-head"><h3>Weight Progress</h3><div class="range-tabs">' + tabs + "</div></div>" +
      '<div class="chart-box">' + chart + "</div>" +
      '<div class="weight-stats">' +
        '<div><strong>' + start + ' kg</strong><span>Starting</span></div>' +
        '<div><strong>' + current + ' kg</strong><span>Current</span></div>' +
        '<div><strong>' + target + ' kg</strong><span>Target</span></div>' +
        '<div><strong>' + pct + '%</strong><span>Progress</span></div>' +
      "</div></div>";
  }

  function activityCard(user, profile) {
    const weight = App.State.latestWeight(user.id) || profile.weightKg;
    const today = App.State.activityByDate(user.id, App.State.todayISO());
    const done = {};
    today.forEach((e) => { done[e.type] = (done[e.type] || 0) + (e.minutes || 0); });
    const types = ["walking", "running", "cycling", "exercise"];
    const rows = types.map((id) => {
      const at = (App.DATA.activityTypes || []).find((a) => a.id === id) || { nameEn: id, icon: "activity" };
      const entries = today.filter((e) => e.type === id);
      const min = entries.reduce((a, e) => a + (e.minutes || 0), 0);
      const steps = entries.reduce((a, e) => a + (e.steps || 0), 0);
      const kcal = entries.reduce((a, e) => a + App.Profile.activityKcal(e, weight), 0);
      const detail = min
        ? (steps ? fmt(steps) + " steps · " : "") + App.Profile.stepsToKm(steps) + (steps ? " km · " : "") + fmt(min) + " min · " + fmt(kcal) + " kcal"
        : "Not logged yet";
      return '<div class="act-card"><span class="a-ic">' + icon(at.icon, 17) + "</span>" +
        '<div class="a-body"><strong>' + esc(at.nameEn) + "</strong><div>" + esc(detail) + "</div></div>" +
        (min ? "" : '<button class="btn btn-outline btn-sm" data-addact="' + id + '">Add</button>') +
      "</div>";
    }).join("");
    return '<div class="panel"><div class="panel-head"><h3>Today\'s Activity</h3>' +
        '<a class="link" href="#/activity">View all</a></div>' +
      '<div class="act-cards">' + rows + "</div></div>";
  }

  function aiCard(targets, totals) {
    const kcalLow = totals.energy < targets.energy * 0.9;
    const proteinLow = targets.protein && totals.protein < targets.protein * 0.8;
    let msg;
    if (kcalLow) msg = "You are slightly below your calorie target today. Consider adding a protein-rich evening snack.";
    else if (proteinLow) msg = "Your protein intake is a little low today. Add a lean protein source to your next meal.";
    else msg = "Great balance today — your intake is tracking well against your targets. Keep it up!";
    return '<div class="panel ai-rec"><div class="panel-head"><h3>AI Recommendation</h3></div>' +
      '<div class="robot">' + icon("robot", 22) + "</div>" +
      "<p>" + esc(msg) + "</p>" +
      '<div class="mt-3"><a class="btn btn-primary btn-sm" href="#/diet">' + esc("View Today's Diet Plan →") + "</a></div></div>";
  }

  function dietSummaryCard(plan) {
    const rows = plan.slots.map((s) => '<div class="diet-row"><span class="k">' + esc(App.I18N.name(s)) + "</span>" +
      "<span><strong>" + fmt(s.totals.energy) + " kcal</strong> · " + fmt(s.totals.protein) + "g protein</span></div>").join("");
    const tot = plan.totals;
    const cell = (v, l) => "<div><strong>" + v + "</strong><span>" + l + "</span></div>";
    return '<div class="panel span-2"><div class="panel-head"><h3>Today\'s Diet Summary</h3>' +
        '<a class="link" href="#/diet">View full chart</a></div>' +
      '<div class="diet-rows">' + rows + "</div>" +
      '<div class="diet-totals">' +
        cell(fmt(tot.energy), "kcal") + cell(fmt(tot.protein) + "g", "protein") +
        cell(fmt(tot.carbs) + "g", "carbs") + cell(fmt(tot.fat) + "g", "fat") + cell(fmt(tot.fiber) + "g", "fibre") +
      "</div></div>";
  }

  function marketCard() {
    const food = App.State.featuredPriceFood();
    const price = food ? App.State.latestPrice(food.id) : null;
    if (!food || !price) {
      return '<div class="panel"><div class="panel-head"><h3>Today\'s Market Price</h3></div>' +
        '<p class="muted small">No price data available.</p></div>';
    }
    return '<div class="panel"><div class="panel-head"><h3>Today\'s Market Price</h3>' +
        '<a class="link" href="#/explore">View all</a></div>' +
      '<div class="market-food"><span class="market-emoji">' + food.emoji + "</span>" +
        "<div><strong>" + esc(App.I18N.name(food)) + "</strong>" +
          '<div class="market-price">৳ ' + fmt(price.priceMin) + " – " + fmt(price.priceMax) + " <small>/ " + esc(price.unit) + "</small></div></div>" +
      "</div>" +
      '<div class="market-meta">' + esc(price.location) + " • Updated " + esc(App.UI.fmtDate(price.date)) + "</div>" +
      '<div class="mt-3"><a class="btn btn-outline btn-sm" href="#/food/' + food.id + '">Current price</a></div></div>';
  }

  function nextApptCard(user) {
    const appt = App.State.upcomingAppointment(user.id);
    if (!appt) {
      return '<div class="panel"><div class="panel-head"><h3>Next Appointment</h3></div>' +
        '<p class="muted small">No upcoming appointment.</p>' +
        '<div class="mt-3"><a class="btn btn-primary btn-sm" href="#/appointments">Book Now</a></div></div>';
    }
    const nut = (App.DATA.nutritionists || []).find((n) => n.id === appt.nutritionistId);
    return '<div class="panel"><div class="panel-head"><h3>Next Appointment</h3>' +
        '<a class="link" href="#/appointments">View</a></div>' +
      '<div class="appt-card"><span class="appt-avatar">' + (nut ? nut.emoji : "🩺") + "</span>" +
        "<div><div class=\"appt-when\">" + esc(nut ? App.I18N.name(nut) : "Nutritionist") + "</div>" +
          '<div class="appt-meta">' + esc("Nutrition Consultation") + "</div>" +
          '<div class="appt-meta">' + esc(App.UI.fmtDate(appt.date)) + " • " + esc(appt.time) + "</div></div>" +
      "</div>" +
      '<div class="mt-3"><a class="btn btn-primary btn-sm" href="#/appointments">Book Now</a></div></div>';
  }

  function foodRecCard(targets, totals) {
    const proteinLow = targets.protein && totals.protein < targets.protein * 0.8;
    const msg = proteinLow
      ? "Add more protein-rich foods to your dinner to support muscle health and keep you full longer."
      : "Include more colourful vegetables and fibre-rich foods to round out your day.";
    return '<div class="panel"><div class="panel-head"><h3>Food Recommendations</h3></div>' +
      "<p class=\"small\">" + esc(msg) + "</p>" +
      '<div class="mt-3"><a class="btn btn-outline btn-sm" href="#/explore">View Food Explorer →</a></div></div>';
  }

  /* ---------- interactions ---------- */
  function mount(params, query, main) {
    const user = App.State.currentUser();
    main.addEventListener("click", (e) => {
      const r = e.target.closest("[data-range]");
      if (r) { range = r.getAttribute("data-range"); App.Router.refresh(); return; }
      const act = e.target.closest("[data-addact]");
      if (act) { openAddActivity(user, act.getAttribute("data-addact")); return; }
      const add = e.target.closest("[data-addlog]");
      if (add) { openAdd(user); return; }
      const log = e.target.closest("[data-logfood]");
      if (log) { openLog(user, log.getAttribute("data-logfood")); return; }
    });
  }

  function openAddActivity(user, typeId) {
    const weight = App.State.latestWeight(user.id) || (user.profile && user.profile.weightKg) || 70;
    const types = App.DATA.activityTypes || [];
    const opts = types.map((a) => '<option value="' + a.id + '"' + (a.id === typeId ? " selected" : "") + ">" + esc(a.nameEn) + "</option>").join("");
    App.UI.modal({
      title: "Add activity",
      bodyHtml:
        '<div class="field"><label>Activity</label><select class="select" id="ac-type">' + opts + "</select></div>" +
        '<div class="field"><label>Duration (minutes)</label><input class="input" id="ac-min" type="number" min="1" value="30" /></div>' +
        '<div class="field"><label>Steps (optional, for walking)</label><input class="input" id="ac-steps" type="number" min="0" value="0" /></div>',
      footerHtml: '<button class="btn btn-outline" data-close>' + esc(t("common_cancel")) + '</button><button class="btn btn-primary" data-save>Add</button>',
      onMount: (root, close) => {
        root.querySelector("[data-save]").addEventListener("click", () => {
          const minutes = Math.max(1, parseInt(root.querySelector("#ac-min").value || "0", 10) || 0);
          const steps = Math.max(0, parseInt(root.querySelector("#ac-steps").value || "0", 10) || 0);
          App.State.addActivity(user.id, { type: root.querySelector("#ac-type").value, minutes: minutes, steps: steps });
          close();
          App.Router.refresh();
          App.UI.toast("Activity added");
        });
      },
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
