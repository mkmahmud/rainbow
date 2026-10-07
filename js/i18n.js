/* Minimal localization helper. Language lives in App.State; falls back to English. */
window.App = window.App || {};

App.I18N = (function () {
  let lang = "en";

  function setLang(next) {
    lang = next === "bn" ? "bn" : "en";
    document.documentElement.lang = lang;
  }
  function getLang() { return lang; }

  function t(key) {
    const table = (App.DATA.content.strings[lang] || {});
    const fallback = (App.DATA.content.strings.en || {});
    return table[key] || fallback[key] || key;
  }

  /* Pick the localized field from an object that has both EN/BN variants. */
  function L(obj, base) {
    if (!obj) return "";
    const suffix = lang === "bn" ? "Bn" : "En";
    return obj[base + suffix] || obj[base + "En"] || obj[base] || "";
  }

  /* Localized "name" convenience. */
  function name(obj) { return L(obj, "name"); }

  function fmtNum(n, digits) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    const d = digits === undefined ? (Math.abs(n) < 10 && n % 1 !== 0 ? 1 : 0) : digits;
    return Number(n).toFixed(d).replace(/\.0$/, "");
  }

  return { setLang, getLang, t, L, name, fmtNum };
})();
