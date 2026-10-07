/* Sign-in and sign-up (mock). */
(function () {
  const t = App.I18N.t;
  const esc = App.UI.esc;

  function authCard(inner) {
    return '<div class="container" style="max-width:960px">' +
      '<div class="grid cols-2" style="align-items:stretch">' +
        '<div class="card">' + inner + "</div>" +
        '<div class="card" style="background:var(--brand-gradient);color:#fff;border:none">' +
          '<h2 style="color:#fff">' + esc(t("appName")) + "</h2>" +
          '<p class="mt-3" style="opacity:.95">' + esc("Personalized, condition-aware nutrition guidance built for local foods — free to start.") + "</p>" +
          "<ul class='mt-4' style='opacity:.95;line-height:2'>" +
            "<li>🔍 Full food composition data</li>" +
            "<li>🍽️ Suggestions with reasons</li>" +
            "<li>🩺 Diabetes, heart & kidney aware</li>" +
            "<li>💰 Budget & plant-based swaps</li>" +
          "</ul>" +
        "</div>" +
      "</div>" +
    "</div>";
  }

  function loginRender() {
    return authCard(
      "<h2>" + esc(t("nav_login")) + "</h2>" +
      '<p class="muted small mt-2">Welcome back. Enter your details.</p>' +
      '<form id="login-form" class="mt-4" novalidate>' +
        field("email", "Email", "email", "you@example.com") +
        field("password", "Password", "password", "••••••••") +
        '<div class="error" id="login-error" style="display:none"></div>' +
        '<button class="btn btn-primary btn-block btn-lg mt-2" type="submit">' + esc(t("nav_login")) + "</button>" +
      "</form>" +
      '<p class="small muted mt-4">No account? <a href="#/register">' + esc(t("nav_register")) + "</a></p>" +
      '<div class="notice mt-4 small">Demo login — <strong>rahim@demo.bd</strong> / <strong>demo1234</strong>, or use the 🎭 Demo roles menu above.</div>'
    );
  }

  function registerRender() {
    return authCard(
      "<h2>" + esc(t("nav_register")) + "</h2>" +
      '<p class="muted small mt-2">Create your free account. Takes a moment.</p>' +
      '<form id="register-form" class="mt-4" novalidate>' +
        field("name", "Full name", "text", "Your name") +
        field("email", "Email", "email", "you@example.com") +
        field("password", "Password", "password", "At least 6 characters") +
        field("confirm", "Confirm password", "password", "Repeat password") +
        '<div class="error" id="register-error" style="display:none"></div>' +
        '<button class="btn btn-primary btn-block btn-lg mt-2" type="submit">Create account</button>' +
      "</form>" +
      '<p class="small muted mt-4">Already registered? <a href="#/login">' + esc(t("nav_login")) + "</a></p>"
    );
  }

  function field(name, label, type, placeholder) {
    return '<div class="field"><label for="f-' + name + '">' + esc(label) + "</label>" +
      '<input class="input" id="f-' + name + '" name="' + name + '" type="' + type + '" placeholder="' + esc(placeholder) + '" autocomplete="off" /></div>';
  }

  function mountLogin(params, query, main) {
    const form = main.querySelector("#login-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value;
      const err = main.querySelector("#login-error");
      if (!email || !password) { showErr(err, "Please enter your email and password."); return; }
      const res = App.Auth.login(email, password);
      if (!res.ok) { showErr(err, res.error); return; }
      App.UI.toast("Welcome back!");
      const u = res.user;
      App.Router.go(App.Profile.isComplete(u.profile) ? "#/home" : "#/onboarding");
    });
  }

  function mountRegister(params, query, main) {
    const form = main.querySelector("#register-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const err = main.querySelector("#register-error");
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value;
      const confirm = form.confirm.value;
      if (!name || !email || !password) { showErr(err, "Please fill in all fields."); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showErr(err, "Please enter a valid email address."); return; }
      if (password.length < 6) { showErr(err, "Password must be at least 6 characters."); return; }
      if (password !== confirm) { showErr(err, "Passwords do not match."); return; }
      const res = App.State.register({ name: name, email: email, password: password, role: "user" });
      if (!res.ok) { showErr(err, res.error); return; }
      App.Auth.login(email, password);
      App.UI.toast("Account created — let's set up your profile");
      App.Router.go("#/onboarding");
    });
  }

  function showErr(el, msg) { el.textContent = msg; el.style.display = "block"; }

  App.Router.register("/login", { render: loginRender, mount: mountLogin, guestOnly: true, title: "Sign in" });
  App.Router.register("/register", { render: registerRender, mount: mountRegister, guestOnly: true, title: "Sign up" });
})();
