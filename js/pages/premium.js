/* Premium tier, mock subscription, nutritionist review flow. */
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;

  const FEATURES = [
    ["Food & nutrition lookup", true, true],
    ["Personalized recommendations", true, true],
    ["Condition-aware safety limits", true, true],
    ["Alternatives, plant-based & budget swaps", true, true],
    ["Progress dashboard", true, true],
    ["Daily diet chart", true, true],
    ["Full 7-day weekly chart", false, true],
    ["Nutritionist review of your chart", false, true],
    ["Priority support", false, true],
  ];

  function render() {
    const user = App.State.currentUser();
    const premium = App.State.isPremium(user.id);

    return '<div class="container stack">' +
      '<div class="page-head"><div><h1>' + esc(t("nav_premium")) + "</h1>" +
      '<div class="subtitle">' + esc(premium ? "You're on Premium. Thank you!" : "Compare plans and unlock AI charts + professional review.") + "</div></div>" +
      (premium ? '<span class="badge green" style="font-size:13px;padding:8px 14px">⭐ Premium active</span>' : "") +
      "</div>" +

      (premium ? premiumView(user) : freeView()) +

      App.UI.disclaimer("disc_general") +
    "</div>";
  }

  function compareTable() {
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Feature</th><th class="num">Free</th><th class="num">Premium</th></tr></thead><tbody>' +
      FEATURES.map((f) => "<tr><td>" + esc(f[0]) + '</td><td class="num">' + (f[1] ? "✓" : "—") + '</td><td class="num">' + (f[2] ? "✓" : "—") + "</td></tr>").join("") +
      "</tbody></table></div>";
  }

  function freeView() {
    return '<div class="grid cols-2" style="align-items:start">' +
      '<div class="card"><div class="card-title"><h3>Free vs Premium</h3></div>' + compareTable() + "</div>" +
      '<div class="card" style="background:var(--brand-gradient);color:#fff;border:none">' +
        '<h2 style="color:#fff">Upgrade to Premium</h2>' +
        '<p class="mt-3" style="opacity:.95">Unlock a full 7-day plan and an asynchronous nutritionist review of your chart.</p>' +
        '<div style="font-size:34px;font-weight:700;margin:var(--s-4) 0">৳299<span style="font-size:15px;font-weight:400"> / month (demo)</span></div>' +
        '<ul style="line-height:2;opacity:.95"><li>✓ 7-day weekly chart</li><li>✓ Nutritionist review</li><li>✓ Priority support</li></ul>' +
        '<button class="btn btn-accent btn-lg btn-block mt-4" id="pm-upgrade">' + esc(t("btn_switchPremium")) + "</button>" +
        '<p class="small mt-3" style="opacity:.85">Demo only — no payment is taken.</p>' +
      "</div>" +
    "</div>";
  }

  function premiumView(user) {
    const review = App.State.getReview(user.id);
    return '<div class="grid cols-2" style="align-items:start">' +
      '<div class="card"><div class="card-title"><h3>Your plan</h3><span class="badge green">Premium</span></div>' + compareTable() +
        '<div class="mt-4"><button class="btn btn-outline" id="pm-downgrade">Cancel premium (demo)</button></div></div>' +
      '<div class="card"><div class="card-title"><h3>Nutritionist review</h3></div>' +
        (review ? reviewStatus(review) : reviewForm()) +
      "</div>" +
    "</div>";
  }

  function reviewForm() {
    return '<p class="muted small">Send your latest chart to a nutritionist for an asynchronous review. You\'ll be notified when it\'s ready.</p>' +
      '<div class="field mt-3"><label>Notes for the nutritionist (optional)</label>' +
      '<textarea class="textarea" id="pm-note" placeholder="e.g. I feel hungry in the afternoons…"></textarea></div>' +
      '<button class="btn btn-primary" id="pm-request">Request review</button>';
  }

  function reviewStatus(review) {
    const steps = [["requested", "Requested"], ["review", "In review"], ["reviewed", "Reviewed"]];
    const idx = steps.findIndex((s) => s[0] === review.status);
    return '<div class="stepper">' + steps.map((s, i) =>
      '<div class="step ' + (i === idx ? "active" : i < idx ? "done" : "") + '"><span class="dot">' + (i < idx ? "✓" : i + 1) + "</span>" + s[1] + "</div>"
    ).join("") + "</div>" +
      (review.note ? '<div class="notice mt-3 small"><strong>Your note:</strong> ' + esc(review.note) + "</div>" : "") +
      (review.reply ? '<div class="card pad-sm mt-3"><div class="card-title"><h4>Nutritionist reply</h4></div><p class="small">' + esc(review.reply) + "</p></div>" : "") +
      (review.status !== "reviewed"
        ? '<button class="btn btn-outline mt-3" id="pm-advance">Simulate progress →</button>'
        : '<div class="notice mt-3">Review complete. Your chart was updated with the nutritionist\'s notes.</div>');
  }

  function mount(params, query, main) {
    const user = App.State.currentUser();
    main.addEventListener("click", (e) => {
      if (e.target.id === "pm-upgrade") {
        App.State.setPremium(user.id, true);
        App.UI.toast("Premium unlocked (demo)");
        App.Router.refresh();
      }
      if (e.target.id === "pm-downgrade") {
        App.State.setPremium(user.id, false);
        App.UI.toast("Premium cancelled (demo)");
        App.Router.refresh();
      }
      if (e.target.id === "pm-request") {
        const note = (main.querySelector("#pm-note") || {}).value || "";
        App.State.setReview(user.id, { status: "requested", note: note, requestedAt: new Date().toISOString(), reply: null });
        App.UI.toast("Review requested");
        App.Router.refresh();
      }
      if (e.target.id === "pm-advance") {
        const r = App.State.getReview(user.id);
        if (r.status === "requested") r.status = "review";
        else if (r.status === "review") {
          r.status = "reviewed";
          r.reply = App.DATA.nutritionistReplies[Math.floor(Math.random() * App.DATA.nutritionistReplies.length)];
          r.reviewedAt = new Date().toISOString();
        }
        App.State.setReview(user.id, r);
        App.Router.refresh();
      }
    });
  }

  App.Router.register("/premium", { render: render, mount: mount, auth: true, roles: ["member"], title: "Premium" });
})();
