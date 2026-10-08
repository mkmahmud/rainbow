/* Inline stroke icon set (no dependency). Icons inherit currentColor. */
window.App = window.App || {};

App.Icons = (function () {
  const PATHS = {
    dashboard: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4.2-4.2"/>',
    recommend: '<path d="M12 3.2l1.9 4.6 4.6 1.9-4.6 1.9L12 16.2 10.1 11.6 5.5 9.7l4.6-1.9L12 3.2z"/><path d="M18.6 15.4l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z"/>',
    diet: '<path d="M9 4.5h6v2.6H9z"/><path d="M9 5.8H7.2A1.7 1.7 0 005.5 7.5v11A1.7 1.7 0 007.2 20.2h9.6a1.7 1.7 0 001.7-1.7v-11a1.7 1.7 0 00-1.7-1.7H15"/><path d="M9 12.2h6M9 16h4"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.4 19.2a5.6 5.6 0 0111.2 0"/><path d="M15.8 5.4a3.2 3.2 0 010 5.4"/><path d="M17 13.6a5.4 5.4 0 013.6 5.6"/>',
    content: '<path d="M4.5 5.6A2.1 2.1 0 016.6 3.5h7l5.9 5.9v9.1a2.1 2.1 0 01-2.1 2.1H6.6a2.1 2.1 0 01-2.1-2.1V5.6z"/><path d="M13.4 3.6v6h6"/>',
    profile: '<circle cx="12" cy="8.2" r="3.6"/><path d="M5 20a7 7 0 0114 0"/>',
    settings: '<path d="M4 20v-6M4 10V4M12 20v-9M12 7V4M20 20v-4M20 12V4"/><path d="M1.8 14h4.4M9.8 7h4.4M17.8 16h4.4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 114.1 1.9c-.9.7-1.7 1.1-1.7 2.2"/><circle cx="12" cy="16.8" r=".5"/>',
    logout: '<path d="M15 4.2h2.8A2 2 0 0119.8 6.2v11.6a2 2 0 01-2 2H15"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    spark: '<path d="M12 4l1.6 4L17.6 9.6 13.6 11.2 12 15.2 10.4 11.2 6.4 9.6 10.4 8 12 4z"/>',
    bell: '<path d="M18 8.6a6 6 0 10-12 0c0 6-2.4 7.4-2.4 7.4h16.8S18 14.6 18 8.6z"/><path d="M10.3 19.6a2 2 0 003.4 0"/>',
    chevron: '<path d="M6 9.5l6 6 6-6"/>',
    flame: '<path d="M12 3s5 4.2 5 9a5 5 0 01-10 0c0-1.6.7-3 1.6-4.2C9.5 9.6 12 8 12 3z"/>',
    drop: '<path d="M12 3.5S6.5 9.6 6.5 14a5.5 5.5 0 0011 0C17.5 9.6 12 3.5 12 3.5z"/>',
    leaf: '<path d="M5 19c8 1 14-4 14-14-9 0-14 5-14 12v2z"/><path d="M5 19c2-3 5-5 9-7"/>',
    heart: '<path d="M12 20s-7-4.4-7-9.4A4 4 0 0112 8a4 4 0 017 2.6c0 5-7 9.4-7 9.4z"/>',
    activity: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
    scale: '<rect x="4" y="6" width="16" height="14" rx="3"/><path d="M12 6V9"/><path d="M9 11a3 3 0 016 0"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    chart: '<path d="M4 4v16h16"/><path d="M7.5 15l3.5-4 3 2.5L20 7"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/>',
    tag: '<path d="M4 4h7l9 9-7 7-9-9V4z"/><circle cx="8" cy="8" r="1.3"/>',
    robot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9.2 13h.01M14.8 13h.01M9.5 16h5"/><circle cx="12" cy="3.2" r="1"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7"/><path d="M6 7l1 12.2A2 2 0 009 21h6a2 2 0 002-1.8L18 7"/><path d="M10 11v6M14 11v6"/>',
    cart: '<circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17.5" cy="19.5" r="1.4"/><path d="M3 4h2.2l2.3 11.2A1.6 1.6 0 009.1 16.5h8.5a1.6 1.6 0 001.55-1.2L21 8H6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="14" r="1.2"/>',
    filter: '<path d="M4 5h16l-6.2 7.6V19l-3.6 1.6v-7.9z"/>',
    pin: '<path d="M12 21s-6.5-5.4-6.5-10.5A6.5 6.5 0 0112 4a6.5 6.5 0 016.5 6.5C18.5 15.6 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.4"/>',
    video: '<rect x="3" y="6.5" width="12.5" height="11" rx="2.5"/><path d="M15.5 10.5l4.7-2.6a.6.6 0 01.9.5v7.2a.6.6 0 01-.9.5l-4.7-2.6z"/>',
    edit: '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    ruler: '<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  };

  function get(name, size) {
    const body = PATHS[name] || PATHS.dashboard;
    const s = size || 20;
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + body + "</svg>";
  }

  return { get: get, PATHS: PATHS };
})();
