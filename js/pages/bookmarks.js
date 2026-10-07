/* Saved foods + recently viewed. */
(function () {
  const t = App.I18N.t;
  const esc = App.UI.esc;

  function render() {
    const user = App.State.currentUser();
    const profile = user.profile;
    const saved = App.State.bookmarks(user.id).map((id) => App.State.foodById(id)).filter(Boolean);
    const recent = App.State.recentlyViewed(user.id).map((id) => App.State.foodById(id)).filter(Boolean);

    return '<div class="container stack">' +
      '<div class="page-head"><div><h1>Saved foods</h1>' +
      '<div class="subtitle">Your bookmarks and recently viewed items.</div></div></div>' +

      '<section>' +
        '<div class="card-title"><h3>' + esc(t("btn_bookmarked")) + '</h3><span class="muted small">' + saved.length + " items</span></div>" +
        (saved.length
          ? '<div class="grid auto-220">' + saved.map((f) => App.FoodCard.card(f, profile, user.id)).join("") + "</div>"
          : App.UI.emptyState("No bookmarks yet", "Tap the ☆ on any food to save it here.", "★")) +
      "</section>" +

      '<section>' +
        '<div class="card-title"><h3>Recently viewed</h3></div>' +
        (recent.length
          ? '<div class="grid auto-220">' + recent.map((f) => App.FoodCard.card(f, profile, user.id)).join("") + "</div>"
          : '<p class="muted small">Foods you open will appear here.</p>') +
      "</section>" +
    "</div>";
  }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    App.UI.on(main, "click", "[data-bookmark]", function (e, el) {
      App.State.toggleBookmark(user.id, el.getAttribute("data-bookmark"));
      App.Router.refresh();
    });
  }

  App.Router.register("/bookmarks", { render: render, mount: mount, auth: true, roles: ["member"], title: "Saved foods" });
})();
