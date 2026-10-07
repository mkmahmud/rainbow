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
      feedback: JSON.parse(JSON.stringify(App.DATA.feedback)),
      foodOverlay: { added: [], edited: {}, retired: [] },
      plans: {},
      reviews: JSON.parse(JSON.stringify(App.DATA.seedReviews || {})),
      contentEdits: {},
      subscription: {},       // userId -> { plan, since }
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
        parsed.reviews = parsed.reviews || JSON.parse(JSON.stringify(App.DATA.seedReviews || {}));
        parsed.subscription = parsed.subscription || {};
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
    feedback, addFeedback, setFeedbackStatus,
    getPlan, setPlan, getReview, setReview, allReviews,
    isPremium, setPremium, subscription,
    contentEdit, setContentEdit,
    language, setLanguage,
    todayISO, offsetISO,
  };
})();
