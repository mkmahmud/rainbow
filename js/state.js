/* Central state store with localStorage persistence, seeded from /data. */
window.App = window.App || {};

App.State = (function () {
  const KEY = "rfl_state_v1";
  const SESSION_KEY = "rfl_session_v1";
  const listeners = [];

  let data = null;

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 9);
  }

  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function offsetISO(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function seed() {
    const users = App.DATA.demoUsers.map((u) => JSON.parse(JSON.stringify(u)));
    const logs = {};
    users.forEach((u) => { logs[u.id] = []; });
    return {
      version: 1,
      users: users,
      bookmarks: {},
      recent: {},
      logs: logs,
      weightLogs: {},
      activityLogs: {},
      goals: {},
      appointments: {},
      notifications: {},
      seededHealth: {},
      feedback: JSON.parse(JSON.stringify(App.DATA.feedback)),
      foodOverlay: { added: [], edited: {}, retired: [] },
      plans: {},
      reviews: JSON.parse(JSON.stringify(App.DATA.seedReviews || {})),
      contentEdits: {},
      subscription: {},       // userId -> { plan, since }
      userPrefs: {},          // userId -> { appointmentReminders, weeklySummary, emailUpdates, shareWithNutritionist }
      settings: { language: "en" },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge any newly added demo users from data into existing state.
        App.DATA.demoUsers.forEach((du) => {
          if (!parsed.users.some((u) => u.id === du.id)) {
            parsed.users.push(JSON.parse(JSON.stringify(du)));
            parsed.logs[du.id] = parsed.logs[du.id] || [];
          }
        });
        // Backfill any collection added in a later version.
        parsed.recent = parsed.recent || {};
        parsed.bookmarks = parsed.bookmarks || {};
        parsed.plans = parsed.plans || {};
        parsed.weightLogs = parsed.weightLogs || {};
        parsed.activityLogs = parsed.activityLogs || {};
        parsed.goals = parsed.goals || {};
        parsed.appointments = parsed.appointments || {};
        parsed.notifications = parsed.notifications || {};
        parsed.seededHealth = parsed.seededHealth || {};
        parsed.reviews = parsed.reviews || JSON.parse(JSON.stringify(App.DATA.seedReviews || {}));
        parsed.subscription = parsed.subscription || {};
        parsed.userPrefs = parsed.userPrefs || {};
        parsed.settings = parsed.settings || { language: "en" };
        parsed.contentEdits = parsed.contentEdits || {};
        // Migrate legacy roles ("user" -> "member") in place.
        parsed.users.forEach((u) => {
          if (!u.role || u.role === "user") u.role = "member";
        });
        data = parsed;
        return;
      }
    } catch (e) { /* fall through to fresh seed */ }
    data = seed();
    persist();
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* quota */ }
  }

  function emit() { persist(); listeners.forEach((fn) => fn()); }
  function subscribe(fn) { listeners.push(fn); }

  function reset() {
    data = seed();
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    persist();
    emit();
  }

  /* ---------- Session ---------- */
  function currentUserId() {
    try { return sessionStorage.getItem(SESSION_KEY); } catch (e) { return null; }
  }
  function setSession(userId) {
    try { userId ? sessionStorage.setItem(SESSION_KEY, userId) : sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }
  function currentUser() {
    const id = currentUserId();
    return id ? data.users.find((u) => u.id === id) || null : null;
  }
  function isAuthed() { return !!currentUser(); }

  /* ---------- Users ---------- */
  function register({ name, email, password, role }) {
    if (data.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const user = {
      id: uid("u"), name, email, password, role: role || "member", premium: false,
      profile: null,
    };
    data.users.push(user);
    data.logs[user.id] = [];
    emit();
    return { ok: true, user };
  }
  function authenticate(email, password) {
    const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) return { ok: false, error: "Invalid email or password." };
    return { ok: true, user };
  }
  function userById(id) { return data.users.find((u) => u.id === id) || null; }
  function allUsers() { return data.users.slice(); }
  function updateUser(id, patch) {
    const u = data.users.find((x) => x.id === id);
    if (u) { Object.assign(u, patch); emit(); }
  }

  /* ---------- Profile ---------- */
  function getProfile(userId) {
    const u = data.users.find((x) => x.id === userId);
    return (u && u.profile) || null;
  }
  function saveProfile(userId, profile) {
    const u = data.users.find((x) => x.id === userId);
    if (!u) return;
    u.profile = Object.assign({}, u.profile, profile);
    if (profile && profile.language) data.settings.language = profile.language;
    emit();
  }

  /* ---------- Foods (merged with overlay) ---------- */
  function allFoods() {
    const ov = data.foodOverlay;
    const base = App.DATA.foods
      .filter((f) => !ov.retired.includes(f.id))
      .map((f) => (ov.edited[f.id] ? Object.assign({}, f, ov.edited[f.id]) : f));
    const added = ov.added.filter((f) => f.status === "published");
    return base.concat(added);
  }
  function foodById(id) { return allFoods().find((f) => f.id === id) || null; }
  function foodRaw(id) { return App.DATA.foods.find((f) => f.id === id) || null; }

  function addFood(food) {
    food.id = food.id || uid("food");
    food.status = food.status || "draft";
    data.foodOverlay.added.push(food);
    emit();
    return food;
  }
  function editFood(id, patch) {
    const seed = App.DATA.foods.find((f) => f.id === id);
    if (seed) {
      data.foodOverlay.edited[id] = Object.assign({}, data.foodOverlay.edited[id], patch);
    } else {
      const a = data.foodOverlay.added.find((f) => f.id === id);
      if (a) Object.assign(a, patch);
    }
    emit();
  }
  function retireFood(id) {
    if (!data.foodOverlay.retired.includes(id)) data.foodOverlay.retired.push(id);
    emit();
  }
  function restoreFood(id) {
    data.foodOverlay.retired = data.foodOverlay.retired.filter((x) => x !== id);
    emit();
  }
  function retiredFoods() {
    return data.foodOverlay.retired
      .map((id) => App.DATA.foods.find((f) => f.id === id))
      .filter(Boolean);
  }
  function pendingFoods() {
    return data.foodOverlay.added.filter((f) => f.status === "draft" || f.status === "review");
  }
  function setFoodStatus(id, status) {
    const a = data.foodOverlay.added.find((f) => f.id === id);
    if (a) { a.status = status; emit(); }
  }

  /* ---------- Bookmarks ---------- */
  function bookmarks(userId) { return data.bookmarks[userId] || []; }
  function toggleBookmark(userId, foodId) {
    const list = bookmarks(userId);
    const i = list.indexOf(foodId);
    if (i >= 0) list.splice(i, 1); else list.push(foodId);
    data.bookmarks[userId] = list;
    emit();
    return i < 0; // true if now bookmarked
  }
  function isBookmarked(userId, foodId) { return bookmarks(userId).includes(foodId); }

  /* ---------- Recently viewed ---------- */
  function recentlyViewed(userId) { return data.recent[userId] || []; }
  function addRecent(userId, foodId) {
    const list = (data.recent[userId] = data.recent[userId] || []);
    const i = list.indexOf(foodId);
    if (i >= 0) list.splice(i, 1);
    list.unshift(foodId);
    data.recent[userId] = list.slice(0, 12);
    persist();
  }

  /* ---------- Intake logs ---------- */
  function logs(userId) { return data.logs[userId] || (data.logs[userId] = []); }
  function addLog(userId, entry) {
    logs(userId).push(Object.assign({ id: uid("log"), date: todayISO(), at: new Date().toISOString() }, entry));
    emit();
  }
  function removeLog(userId, logId) {
    data.logs[userId] = logs(userId).filter((l) => l.id !== logId);
    emit();
  }
  function logsByDate(userId, date) {
    return logs(userId).filter((l) => l.date === date);
  }

  /* Seed ~7 days of intake for a user so the dashboard has trends to show. */
  function ensureSeedLogs(userId) {
    if (logs(userId).length) return;
    const plan = App.DATA.samplePlans[0];
    const slots = ["breakfast", "lunch", "snack", "dinner"];
    const out = [];
    for (let d = 6; d >= 0; d--) {
      const date = offsetISO(-d);
      plan.items.forEach((item, idx) => {
        // Slight day-to-day variation, skip a couple of items on some days.
        if (d === 3 && idx % 3 === 0) return;
        out.push({ id: uid("log"), foodId: item.foodId, grams: item.grams, slot: item.slot, date: date, at: date + "T" + String(7 + (idx % 4)).padStart(2, "0") + ":30:00" });
      });
    }
    data.logs[userId] = out;
    emit();
  }

  /* ---------- Weight logs ---------- */
  function weightLogs(userId) { return data.weightLogs[userId] || (data.weightLogs[userId] = []); }
  function addWeightLog(userId, entry) {
    const kg = Number(entry && entry.kg);
    if (!kg) return;
    const date = (entry && entry.date) || todayISO();
    const list = weightLogs(userId);
    const existing = list.find((w) => w.date === date);
    if (existing) existing.kg = kg;
    else list.push({ id: uid("wt"), date: date, kg: kg });
    list.sort((a, b) => a.date.localeCompare(b.date));
    emit();
  }
  function removeWeightLog(userId, id) {
    data.weightLogs[userId] = weightLogs(userId).filter((w) => w.id !== id);
    emit();
  }
  function latestWeight(userId) {
    const list = weightLogs(userId);
    return list.length ? list[list.length - 1].kg : null;
  }
  /* Weight entries within the last `days` days (inclusive), oldest first. */
  function weightInRange(userId, days) {
    const from = offsetISO(-(days - 1));
    return weightLogs(userId).filter((w) => w.date >= from).sort((a, b) => a.date.localeCompare(b.date));
  }

  /* ---------- Activity logs ---------- */
  function activityLogs(userId) { return data.activityLogs[userId] || (data.activityLogs[userId] = []); }
  function addActivity(userId, entry) {
    activityLogs(userId).push(Object.assign({ id: uid("act"), date: todayISO(), at: new Date().toISOString() }, entry));
    emit();
  }
  function removeActivity(userId, id) {
    data.activityLogs[userId] = activityLogs(userId).filter((a) => a.id !== id);
    emit();
  }
  function activityByDate(userId, date) {
    return activityLogs(userId).filter((a) => a.date === date);
  }

  /* ---------- Goals ---------- */
  function getGoal(userId) { return data.goals[userId] || null; }
  function setGoal(userId, goal) {
    data.goals[userId] = Object.assign({}, data.goals[userId], goal, { updatedAt: new Date().toISOString() });
    emit();
  }

  /* ---------- Appointments ---------- */
  function appointments(userId) { return data.appointments[userId] || (data.appointments[userId] = []); }
  function bookAppointment(userId, entry) {
    const appt = Object.assign({ id: uid("appt"), status: "upcoming", createdAt: new Date().toISOString() }, entry);
    appointments(userId).push(appt);
    const nut = (App.DATA.nutritionists || []).find((n) => n.id === entry.nutritionistId);
    addNotification(userId, {
      type: "appointment",
      title: "Appointment confirmed",
      body: (nut ? App.I18N.name(nut) : "Nutritionist") + " · " + entry.date + " " + entry.time,
    });
    return appt;
  }
  function cancelAppointment(userId, id) {
    const a = appointments(userId).find((x) => x.id === id);
    if (a) { a.status = "cancelled"; emit(); }
  }
  function upcomingAppointment(userId) {
    return appointments(userId)
      .filter((a) => a.status === "upcoming")
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0] || null;
  }

  /* ---------- Notifications ---------- */
  function notifications(userId) { return data.notifications[userId] || (data.notifications[userId] = []); }
  function addNotification(userId, n) {
    notifications(userId).unshift(Object.assign({ id: uid("ntf"), at: new Date().toISOString(), read: false }, n));
    emit();
  }
  function markNotificationsRead(userId) {
    notifications(userId).forEach((n) => { n.read = true; });
    emit();
  }
  function unreadCount(userId) { return notifications(userId).filter((n) => !n.read).length; }

  /* ---------- Market prices ---------- */
  function foodPrices(foodId) { return (App.DATA.foodPrices && App.DATA.foodPrices[foodId]) || []; }
  function latestPrice(foodId) {
    const list = foodPrices(foodId);
    return list.length ? list.slice().sort((a, b) => b.date.localeCompare(a.date))[0] : null;
  }
  /* A food with a recorded price, optionally preferring one whose market is in season. */
  function featuredPriceFood() {
    const ids = Object.keys(App.DATA.foodPrices || {});
    const withFood = ids.map((id) => foodById(id)).filter(Boolean);
    const inSeason = withFood.find((f) => f.category === "fruit");
    return inSeason || withFood[0] || null;
  }

  /* Seed weight/activity/goal/appointment data once per user so the dashboard
     and trend pages have real history to show. */
  function seedWeight(profile) {
    const current = profile.weightKg;
    const drop = profile.goal === "weight-loss" ? 3.4 : profile.goal === "weight-gain" ? -2.5 : 0.6;
    const start = Math.round((current + drop) * 10) / 10;
    const n = 60;
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const t = (n - 1 - i) / (n - 1);
      const jitter = (i % 3 === 0 ? 0.15 : -0.1);
      const kg = i === 0 ? current : Math.round((start + (current - start) * t + jitter) * 10) / 10;
      out.push({ id: uid("wt"), date: offsetISO(-i * 3), kg: kg });
    }
    return out;
  }
  function seedActivity() {
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const date = offsetISO(-i);
      const steps = 4200 + ((i * 137) % 9) * 380;
      out.push({ id: uid("act"), date: date, at: date + "T07:30:00", type: "walking", steps: steps, minutes: Math.round(steps / 165) });
      if (i % 3 === 0) out.push({ id: uid("act"), date: date, at: date + "T18:00:00", type: "cycling", minutes: 25 });
      if (i % 4 === 0) out.push({ id: uid("act"), date: date, at: date + "T19:00:00", type: "exercise", minutes: 20 });
    }
    return out;
  }
  function seedGoal(profile) {
    const cur = profile.weightKg;
    let target = cur;
    if (profile.goal === "weight-loss") target = Math.max(Math.round(cur - 5), 45);
    else if (profile.goal === "weight-gain") target = cur + 4;
    const start = profile.goal === "weight-loss" ? Math.round((cur + 3.4) * 10) / 10 : cur;
    return { type: profile.goal, startWeightKg: start, targetWeightKg: target, targetDate: offsetISO(90), status: "active" };
  }
  function ensureSeedHealthData(userId) {
    data.seededHealth = data.seededHealth || {};
    if (data.seededHealth[userId]) return;
    const u = data.users.find((x) => x.id === userId);
    if (!u || !u.profile || !u.profile.weightKg) return;
    data.seededHealth[userId] = true;
    if (!(data.weightLogs[userId] && data.weightLogs[userId].length)) data.weightLogs[userId] = seedWeight(u.profile);
    if (!(data.activityLogs[userId] && data.activityLogs[userId].length)) data.activityLogs[userId] = seedActivity();
    if (!data.goals[userId]) data.goals[userId] = seedGoal(u.profile);
    if (!(data.appointments[userId] && data.appointments[userId].length)) {
      const nut = (App.DATA.nutritionists || [])[0];
      if (nut) {
        const appt = {
          id: uid("appt"), nutritionistId: nut.id, date: offsetISO(2),
          time: nut.availability.slots[0], type: "video", status: "upcoming",
          createdAt: new Date().toISOString(),
        };
        data.appointments[userId] = [appt];
        addNotification(userId, { type: "appointment", title: "Appointment booked", body: App.I18N.name(nut) + " · " + appt.date + " " + appt.time });
      }
    }
    if (!(data.notifications[userId] && data.notifications[userId].length)) {
      addNotification(userId, { type: "system", title: "Welcome to Rainbow Food List", body: "Your dashboard is ready — log meals and activity to track progress." });
    }
    emit();
  }

  /* ---------- Feedback ---------- */
  function feedback() { return data.feedback; }
  function addFeedback(entry) {
    data.feedback.unshift(Object.assign({ id: uid("fb"), status: "open", createdAt: new Date().toISOString() }, entry));
    emit();
  }
  function setFeedbackStatus(id, status) {
    const f = data.feedback.find((x) => x.id === id);
    if (f) { f.status = status; emit(); }
  }

  /* ---------- Plans & reviews ---------- */
  function getPlan(userId) { return data.plans[userId] || null; }
  function setPlan(userId, plan) { data.plans[userId] = plan; emit(); }
  function getReview(userId) { return data.reviews[userId] || null; }
  function setReview(userId, review) { data.reviews[userId] = review; emit(); }
  /* All submitted chart reviews, newest first — used by the nutritionist queue. */
  function allReviews() {
    return Object.keys(data.reviews || {})
      .map((userId) => ({ userId: userId, user: userById(userId), review: data.reviews[userId] }))
      .filter((r) => r.user)
      .sort((a, b) => String((b.review.requestedAt) || "").localeCompare(String((a.review.requestedAt) || "")));
  }

  /* ---------- Subscription ---------- */
  function isPremium(userId) {
    const u = data.users.find((x) => x.id === userId);
    return !!(u && u.premium);
  }
  function setPremium(userId, on) {
    const u = data.users.find((x) => x.id === userId);
    if (u) {
      u.premium = !!on;
      if (on) data.subscription[userId] = { plan: "premium", since: todayISO() };
      else delete data.subscription[userId];
      emit();
    }
  }
  function subscription(userId) { return data.subscription[userId] || null; }

  /* ---------- Weight helpers ---------- */
  /* Net weight change (kg) over the last `days` days; 0 if not enough data. */
  function weightChange(userId, days) {
    const list = weightInRange(userId, days);
    if (list.length < 2) return 0;
    return Math.round((list[list.length - 1].kg - list[0].kg) * 10) / 10;
  }

  /* Log every item of a generated plan into today's intake. */
  function logMealPlan(userId, plan) {
    if (!plan) return 0;
    let count = 0;
    plan.slots.forEach((s) => {
      s.items.forEach((it) => { addLog(userId, { foodId: it.foodId, grams: it.grams, slot: s.id }); count++; });
    });
    return count;
  }

  /* Rough per-100g price (৳) from recorded market data, else from the cost tier. */
  function pricePer100g(food) {
    if (!food) return 0;
    const price = latestPrice(food.id);
    if (price) {
      const unit = price.unit;
      const gramsPerUnit = unit === "kg" ? 1000 : unit === "litre" ? 1000 : unit === "dozen" ? 600 : 1000;
      return (price.priceMin / gramsPerUnit) * 100;
    }
    const tier = food.costTier === "low" ? 7 : food.costTier === "high" ? 32 : 15;
    return tier;
  }
  /* Estimated shopping cost for a plan, with a per-item breakdown. */
  function estimatedPlanCost(plan) {
    if (!plan) return { total: 0, items: [] };
    const byFood = {};
    plan.slots.forEach((s) => s.items.forEach((it) => {
      const agg = byFood[it.foodId] || (byFood[it.foodId] = { foodId: it.foodId, grams: 0, cost: 0 });
      agg.grams += it.grams;
      agg.cost += (it.grams / 100) * pricePer100g(App.State.foodById(it.foodId));
    }));
    const items = Object.keys(byFood).map((id) => byFood[id]).sort((a, b) => b.cost - a.cost);
    const total = Math.round(items.reduce((a, b) => a + b.cost, 0));
    items.forEach((i) => { i.cost = Math.round(i.cost); });
    return { total: total, items: items };
  }

  /* ---------- User preferences ---------- */
  function userPrefs(userId) {
    return data.userPrefs[userId] || (data.userPrefs[userId] = {
      appointmentReminders: true, weeklySummary: true, emailUpdates: false, shareWithNutritionist: true,
    });
  }
  function setUserPrefs(userId, patch) {
    data.userPrefs[userId] = Object.assign({}, userPrefs(userId), patch);
    emit();
  }

  /* ---------- Editable content (admin) ---------- */
  function contentEdit(key, fallback) {
    return (data.contentEdits && data.contentEdits[key]) || fallback;
  }
  function setContentEdit(key, value) {
    data.contentEdits = data.contentEdits || {};
    data.contentEdits[key] = value;
    emit();
  }

  /* ---------- Settings ---------- */
  function language() { return (data.settings && data.settings.language) || "en"; }
  function setLanguage(lang) {
    data.settings.language = lang;
    App.I18N.setLang(lang);
    const u = currentUser();
    if (u && u.profile) u.profile.language = lang;
    emit();
  }

  return {
    load, persist, reset, subscribe, emit, uid,
    currentUserId, setSession, currentUser, isAuthed,
    register, authenticate, updateUser, userById, allUsers,
    getProfile, saveProfile,
    allFoods, foodById, foodRaw, addFood, editFood, retireFood, restoreFood, retiredFoods,
    pendingFoods, setFoodStatus,
    bookmarks, toggleBookmark, isBookmarked, recentlyViewed, addRecent,
    logs, addLog, removeLog, logsByDate, ensureSeedLogs,
    weightLogs, addWeightLog, removeWeightLog, latestWeight, weightInRange, weightChange,
    activityLogs, addActivity, removeActivity, activityByDate,
    getGoal, setGoal,
    appointments, bookAppointment, cancelAppointment, upcomingAppointment,
    notifications, addNotification, markNotificationsRead, unreadCount,
    foodPrices, latestPrice, featuredPriceFood,
    ensureSeedHealthData,
    feedback, addFeedback, setFeedbackStatus,
    getPlan, setPlan, getReview, setReview, allReviews,
    isPremium, setPremium, subscription,
    logMealPlan, pricePer100g, estimatedPlanCost,
    userPrefs, setUserPrefs,
    contentEdit, setContentEdit,
    language, setLanguage,
    todayISO, offsetISO,
  };
})();
