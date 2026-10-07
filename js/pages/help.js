/* Help / FAQ, condition guidance and feedback submission. */
(function () {
  const esc = App.UI.esc;
  const t = App.I18N.t;

  function render() {
    const c = App.DATA.content;
    const user = App.State.currentUser();
    return '<div class="container stack" style="max-width:900px">' +
      '<div class="page-head"><div><h1>' + esc(t("nav_help")) + " & feedback" + "</h1>" +
      '<div class="subtitle">Answers, condition guidance and a way to report problems.</div></div></div>' +

      '<div class="card"><div class="card-title"><h3>Condition guidance</h3></div>' +
        guide("guide_diabetes", "🩸 " + esc("Diabetes"), c.guidance.diabetes) +
        guide("guide_heart", "❤️ " + esc("Heart disease / hypertension"), c.guidance.heart) +
        guide("guide_ckd", "🫘 " + esc("Chronic kidney disease"), c.guidance.ckd) +
      "</div>" +

      '<div class="card"><div class="card-title"><h3>Frequently asked questions</h3></div>' +
        '<div class="accordion">' + c.faq.map((f) =>
          "<details><summary>" + esc(f.q) + '</summary><div class="acc-body">' + esc(f.a) + "</div></details>"
        ).join("") + "</div>" +
      "</div>" +

      (user ? '<div class="card"><div class="card-title"><h3>Send feedback or report a problem</h3></div>' +
        '<form id="fb-form">' +
          '<div class="field"><label>Type</label><select class="select" id="fb-type"><option value="feedback">Feedback / suggestion</option><option value="problem">Report a problem</option></select></div>' +
          '<div class="field"><label>Subject</label><input class="input" id="fb-subject" placeholder="Short summary" /></div>' +
          '<div class="field"><label>Message</label><textarea class="textarea" id="fb-message" placeholder="Tell us what happened or what you\'d like to see…"></textarea></div>' +
          '<button class="btn btn-primary" type="submit">Send</button>' +
        "</form></div>"
        : '<div class="card center"><p class="muted">Sign in to send feedback or report a problem.</p><a class="btn btn-primary mt-3" href="#/login">Sign in</a></div>') +

      '<div class="disclaimer"><span class="di">⚠️</span><span>' + esc(App.State.contentEdit("disc_general", c.disclaimers.general)) + "</span></div>" +
    "</div>";
  }

  function guide(key, title, fallback) {
    return '<div class="field"><h4>' + title + "</h4><p class=\"muted small\">" + esc(App.State.contentEdit(key, fallback)) + "</p></div>";
  }

  function mount(params, query, main) {
    const form = main.querySelector("#fb-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = App.State.currentUser();
      const subject = main.querySelector("#fb-subject").value.trim();
      const message = main.querySelector("#fb-message").value.trim();
      if (!subject || !message) { App.UI.toast("Please add a subject and message", "error"); return; }
      App.State.addFeedback({
        type: main.querySelector("#fb-type").value,
        subject: subject, message: message,
        userId: user.id, userName: user.name,
      });
      App.UI.toast("Thank you — your feedback was sent");
      App.Router.refresh();
    });
  }

  App.Router.register("/help", { render: render, mount: mount, title: "Help" });
})();
