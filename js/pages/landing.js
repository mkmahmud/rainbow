/* Public landing page. */
(function () {
  const t = App.I18N.t;

  function render() {
    const authed = App.State.isAuthed();
    const personas = App.DATA.demoUsers.filter((u) => u.role !== "admin");
    return '<div class="container">' +
      '<section class="hero">' +
        "<h1>" + App.UI.esc(t("appName")) + " — " + App.UI.esc("know your food, eat for your health") + "</h1>" +
        "<p>Nutrition data for local foods, personalized diet suggestions, condition-aware safety (diabetes, heart, kidney), plant-based swaps and budget-friendly picks — all in one place.</p>" +
        '<div class="row">' +
          '<a class="btn btn-accent btn-lg" href="' + (authed ? "#/home" : "#/register") + '">' + App.UI.esc(authed ? "Open dashboard" : "Create free account") + "</a>" +
          '<a class="btn btn-outline btn-lg" href="#/explore">Browse foods</a>' +
        "</div>" +
      "</section>" +

      '<section class="grid cols-3 mt-5">' +
        feature("🔍", "Full nutrition data", "Energy, macros, vitamins and minerals per local portion — not just per 100 g.") +
        feature("🩺", "Condition-aware", "Suggestions respect diabetes, heart disease and kidney disease limits, stage by stage.") +
        feature("🌱", "Alternatives & budget", "Plant-based swaps and the cheapest nutrient-dense options that fit your budget.") +
      "</section>" +

      '<section class="card mt-5">' +
        '<div class="card-title"><h3>How it works</h3></div>' +
        '<div class="grid cols-4">' +
          step("1", "Create your profile", "Age, weight, activity, goals, conditions, allergies and budget.") +
          step("2", "Get suggestions", "Foods ranked for your goals with a plain-language reason for each.") +
          step("3", "Follow your chart", "A daily/weekly diet chart with portions and safe swaps.") +
          step("4", "Track & improve", "Log intake and watch progress against your targets.") +
        "</div>" +
      "</section>" +

      '<section class="mt-5">' +
        '<div class="card-title"><h3>Try a demo role</h3><span class="muted small">No sign-up needed — jump straight in as any persona.</span></div>' +
        '<div class="grid auto-220">' +
          personas.map((u) =>
            '<button class="card card-hover center" data-demo="' + u.id + '" style="cursor:pointer;text-align:left">' +
              '<div class="stat-icon" style="margin:0 auto var(--s-2)">' + personaIcon(u.persona) + "</div>" +
              "<strong>" + App.UI.esc(u.persona) + "</strong>" +
              '<div class="muted small">' + App.UI.esc(u.name) + "</div>" +
            "</button>"
          ).join("") +
        "</div>" +
      "</section>" +

      '<section class="mt-5">' +
        '<div class="disclaimer"><span class="di">⚠️</span><span>' + App.UI.esc(App.DATA.content.disclaimers.general) + "</span></div>" +
      "</section>" +
    "</div>";
  }

  function feature(icon, title, body) {
    return '<div class="card"><div class="stat-icon">' + icon + "</div><h3>" + title + '</h3><p class="muted mt-2">' + body + "</p></div>";
  }
  function step(n, title, body) {
    return '<div><div class="badge green">Step ' + n + "</div><h4 class=\"mt-2\">" + title + '</h4><p class="muted small">' + body + "</p></div>";
  }
  function personaIcon(persona) {
    if (/kidney/i.test(persona)) return "🫘";
    if (/diabet/i.test(persona)) return "🩸";
    if (/vegetar/i.test(persona)) return "🌱";
    if (/budget/i.test(persona)) return "💰";
    if (/premium/i.test(persona)) return "⭐";
    if (/admin/i.test(persona)) return "🛠️";
    return "🧑";
  }

  function mount(params, query, main) {
    App.UI.on(main, "click", "[data-demo]", function (e, el) {
      App.Auth.loginAs(el.getAttribute("data-demo"));
      App.UI.toast("Signed in as demo role");
      App.Router.go("#/home");
    });
  }

  App.Router.register("/", { render: render, mount: mount, title: "Welcome" });
})();
