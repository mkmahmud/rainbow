/* Settings — language, demo data reset, account. */
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;

  function togglePref(key, checked, label, hint) {
    return '<label class="check' + (checked ? " checked" : "") + '" style="margin-bottom:8px">' +
      '<input type="checkbox" data-pref="' + key + '" ' + (checked ? "checked" : "") + " />" +
      "<span><strong>" + esc(label) + '</strong><br><span class="muted xs">' + esc(hint) + "</span></span></label>";
  }

  function render() {
    const user = App.State.currentUser();
    const lang = App.I18N.getLang();
    const prefs = App.State.userPrefs(user.id);
    return '<div class="container stack" style="max-width:760px">' +
      '<div class="page-head"><div><h1>' + esc(t("nav_settings")) + "</h1>" +
      '<div class="subtitle">Preferences and demo controls.</div></div></div>' +

      '<div class="card"><div class="card-title"><h3>Preferences</h3></div>' +
        '<div class="field"><label>Language</label>' +
          '<div class="segmented" id="st-lang">' +
            '<button data-lang="en" class="' + (lang === "en" ? "active" : "") + '">English</button>' +
            '<button data-lang="bn" class="' + (lang === "bn" ? "active" : "") + '">বাংলা</button>' +
          "</div></div>" +
      "</div>" +

      '<div class="card"><div class="card-title"><h3>Notifications</h3></div>' +
        togglePref("appointmentReminders", prefs.appointmentReminders, "Appointment reminders", "Notify me before an upcoming consultation.") +
        togglePref("weeklySummary", prefs.weeklySummary, "Weekly summary", "A weekly recap of intake, activity and progress.") +
        togglePref("emailUpdates", prefs.emailUpdates, "Email updates", "Send nutrition tips and product updates by email.") +
      "</div>" +

      '<div class="card"><div class="card-title"><h3>Privacy</h3></div>' +
        togglePref("shareWithNutritionist", prefs.shareWithNutritionist, "Share my chart with a nutritionist", "Allow nutritionists to view your diet chart when you request a review.") +
        '<p class="muted xs mt-2">In this prototype all data stays in your browser\'s local storage.</p>' +
      "</div>" +

      '<div class="card"><div class="card-title"><h3>Account</h3></div>' +
        '<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="muted">Name</span><strong>' + esc(user.name) + "</strong></div>" +
        '<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="muted">Email</span><strong>' + esc(user.email) + "</strong></div>" +
        '<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="muted">Role</span><strong>' + esc(App.RBAC.label(user.role)) + "</strong></div>" +
        '<div class="row between" style="padding:6px 0"><span class="muted">Tier</span><strong>' + (user.premium ? "⭐ Premium" : "Free") + "</strong></div>" +
        (App.RBAC.hasRole(user, "member")
          ? '<div class="row mt-4"><a class="btn btn-outline" href="#/profile">Edit profile</a><a class="btn btn-outline" href="#/premium">' + esc(t("nav_premium")) + "</a></div>"
          : "") +
      "</div>" +

      '<div class="card"><div class="card-title"><h3>Demo data</h3></div>' +
        '<p class="muted small">This prototype stores everything in your browser. Reset to restore the seeded demo foods, users, plans and logs.</p>' +
        '<div class="row mt-3"><button class="btn btn-danger" id="st-reset">Reset demo data</button>' +
        '<button class="btn btn-outline" id="st-logout">' + esc(t("nav_logout")) + "</button></div>" +
      "</div>" +

      '<div class="disclaimer"><span class="di">⚠️</span><span>' + esc("Prototype build — all data is locally stored and static.") + "</span></div>" +
    "</div>";
  }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    main.addEventListener("change", (e) => {
      const pref = e.target.closest("[data-pref]");
      if (!pref) return;
      const lbl = pref.closest(".check");
      if (lbl) lbl.classList.toggle("checked", pref.checked);
      const patch = {};
      patch[pref.getAttribute("data-pref")] = pref.checked;
      App.State.setUserPrefs(user.id, patch);
      App.UI.toast("Preference saved");
    });
    main.addEventListener("click", (e) => {
      const lang = e.target.closest("[data-lang]");
      if (lang) { App.State.setLanguage(lang.getAttribute("data-lang")); App.Router.refresh(); return; }
      if (e.target.id === "st-reset") {
        App.UI.confirm("Reset all demo data? This clears your logs, plans and edits.", { danger: true, okText: "Reset" }).then((ok) => {
          if (ok) { App.State.reset(); App.I18N.setLang("en"); App.UI.toast("Demo data reset"); App.Router.go("#/"); }
        });
        return;
      }
      if (e.target.id === "st-logout") { App.Auth.logout(); App.Router.go("#/"); }
    });
  }

  App.Router.register("/settings", { render: render, mount: mount, auth: true, title: "Settings" });
})();
