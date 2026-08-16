// Shared theme tokens. One object drives both the CSS custom properties
// (for regular DOM styling) and the canvas drawing code (which can't read
// CSS vars directly). Keep this the single source of truth for color.

const THEMES = {
  dark: {
    bg: "#14110c",
    topbarBg: "#191510",
    topbarBorder: "#2b2318",
    cardBg: "#1e1912",
    cardBorder: "#332a1c",
    boardBg: "#f2ead8",
    nut: "#5a4a2a",
    fret: "#b0a07a",
    string: "#8a7a5a",
    dotFill: "#1e1e1c",
    openStroke: "#1e1e1c",
    muted: "#8a8375",
    fretNumFg: "#948a72",
    labelDim: "#4a4130",
    labelLit: "#f5efe2",
    pillBg: "#211b13",
    pillFg: "#c9c0ac",
    pillBorder: "#362c1c",
    pillHoverBg: "#2b2317",
    pillHoverBorder: "#4a3c24",
    pillSelBg: "#332918",
    pillSelFg: "#f0e6cf",
    pillSelBorder: "#6b5730",
    priBg: "#c9a227",
    priFg: "#14110c",
    priBorder: "#e8c766",
    priHoverBg: "#ddb643",
    hintFg: "#544a35",
    titleFg: "#f5efe2",
    subtitleFg: "#867c66",
    sep: "#2b2318",
    accent: "#c9a227",
    accentSoft: "#e8c766",
  },
  light: {
    bg: "#f7f2e8",
    topbarBg: "#fffcf5",
    topbarBorder: "#e6dcc4",
    cardBg: "#fffdf8",
    cardBorder: "#e6dcc4",
    boardBg: "#f2ead8",
    nut: "#5a4a2a",
    fret: "#b0a07a",
    string: "#8a7a5a",
    dotFill: "#1e1e1c",
    openStroke: "#1e1e1c",
    muted: "#a89f8a",
    fretNumFg: "#a89f8a",
    labelDim: "#c4b99e",
    labelLit: "#241d10",
    pillBg: "#f0e9d8",
    pillFg: "#5c5340",
    pillBorder: "#ded2b0",
    pillHoverBg: "#e6dcc0",
    pillHoverBorder: "#cbbd93",
    pillSelBg: "#ded2b0",
    pillSelFg: "#241d10",
    pillSelBorder: "#b3a172",
    priBg: "#a9821c",
    priFg: "#fffdf8",
    priBorder: "#8a6a15",
    priHoverBg: "#bd9424",
    hintFg: "#c4b99e",
    titleFg: "#241d10",
    subtitleFg: "#8f8368",
    sep: "#e6dcc4",
    accent: "#a9821c",
    accentSoft: "#c99f2e",
  },
};

const ThemeManager = (() => {
  let current = "dark";
  const listeners = [];

  function apply(name) {
    current = THEMES[name] ? name : "dark";
    const t = THEMES[current];
    const root = document.documentElement.style;
    root.setProperty("--bg", t.bg);
    root.setProperty("--topbar-bg", t.topbarBg);
    root.setProperty("--topbar-border", t.topbarBorder);
    root.setProperty("--card-bg", t.cardBg);
    root.setProperty("--card-border", t.cardBorder);
    root.setProperty("--pill-bg", t.pillBg);
    root.setProperty("--pill-fg", t.pillFg);
    root.setProperty("--pill-border", t.pillBorder);
    root.setProperty("--pill-hover-bg", t.pillHoverBg);
    root.setProperty("--pill-hover-border", t.pillHoverBorder);
    root.setProperty("--pill-sel-bg", t.pillSelBg);
    root.setProperty("--pill-sel-fg", t.pillSelFg);
    root.setProperty("--pill-sel-border", t.pillSelBorder);
    root.setProperty("--pri-bg", t.priBg);
    root.setProperty("--pri-fg", t.priFg);
    root.setProperty("--pri-border", t.priBorder);
    root.setProperty("--pri-hover-bg", t.priHoverBg);
    root.setProperty("--hint-fg", t.hintFg);
    root.setProperty("--title-fg", t.titleFg);
    root.setProperty("--subtitle-fg", t.subtitleFg);
    root.setProperty("--sep", t.sep);
    root.setProperty("--label-dim", t.labelDim);
    root.setProperty("--label-lit", t.labelLit);
    root.setProperty("--accent", t.accent);
    root.setProperty("--accent-soft", t.accentSoft);
    document.body.dataset.theme = current;
    try { localStorage.setItem("fretcraft-theme", current); } catch (e) {}
    listeners.forEach((fn) => fn(t, current));
  }

  function init() {
    let saved = "dark";
    try { saved = localStorage.getItem("fretcraft-theme") || "dark"; } catch (e) {}
    apply(saved);
  }

  function get() { return THEMES[current]; }
  function getName() { return current; }
  function onChange(fn) { listeners.push(fn); }

  return { init, apply, get, getName, onChange };
})();
