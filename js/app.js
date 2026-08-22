// App shell: sidebar nav between practice modules + theme toggle.
// Extending later: build a new module object (see ChordTrainer.js) exposing
// init(root)/onActivate()/onDeactivate(), add its markup as a <section
// class="module" id="module-XYZ">, add a nav button with data-module="XYZ",
// a card on the home page if desired, and register it in the MODULES map
// below (only modules with lifecycle hooks need an entry there).

document.addEventListener("DOMContentLoaded", () => {
  ThemeManager.init();

  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    const next = ThemeManager.getName() === "dark" ? "light" : "dark";
    ThemeManager.apply(next);
  });
  ThemeManager.onChange((t, name) => {
    themeToggle.textContent = name === "dark" ? "☾  Dark" : "☀  Light";
  });

  const MODULES = {
    chords: ChordTrainer,
    fretboard: FretboardTrainer,
    scales: ScaleTrainer,
    triads: TriadTrainer,
    keyjam: KeyJam,
  };

  const chordsRoot = document.getElementById("module-chords");
  ChordTrainer.init(chordsRoot);

  const fretboardRoot = document.getElementById("module-fretboard");
  FretboardTrainer.init(fretboardRoot);

  const scalesRoot = document.getElementById("module-scales");
  ScaleTrainer.init(scalesRoot);

  const triadsRoot = document.getElementById("module-triads");
  TriadTrainer.init(triadsRoot);

  const keyjamRoot = document.getElementById("module-keyjam");
  KeyJam.init(keyjamRoot);

  // Modules build some option lists during init, so wire up the drawers
  // afterwards to pick those up.
  Drawer.init();

  const navIndicator = document.getElementById("nav-indicator");
  function moveNavIndicator(btn) {
    if (!navIndicator || !btn) return;
    // Hidden on narrow screens, where the nav is a horizontal bar and the
    // active item carries its own background instead.
    if (window.getComputedStyle(navIndicator).display === "none") {
      navIndicator.style.opacity = "0";
      return;
    }
    const list = btn.closest(".nav-list");
    const listRect = list.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    navIndicator.style.opacity = "1";
    navIndicator.style.height = btnRect.height + "px";
    navIndicator.style.transform = `translateY(${btnRect.top - listRect.top}px)`;
  }

  let activeModule = "home";

  function activateModule(key) {
    if (!key || key === activeModule) return;
    const section = document.getElementById(`module-${key}`);
    if (!section) return;

    document.querySelectorAll(".nav-item").forEach((b) => {
      const isActive = b.dataset.module === key;
      b.classList.toggle("active", isActive);
      if (isActive) moveNavIndicator(b);
    });
    document.querySelectorAll(".module").forEach((s) => s.classList.remove("active"));
    section.classList.add("active");
    Drawer.closeAll();

    if (MODULES[activeModule] && MODULES[activeModule].onDeactivate) {
      MODULES[activeModule].onDeactivate();
    }
    activeModule = key;
    if (MODULES[activeModule] && MODULES[activeModule].onActivate) {
      MODULES[activeModule].onActivate();
    }
  }

  // Place the indicator once fonts/layout have settled.
  requestAnimationFrame(() => {
    moveNavIndicator(document.querySelector(".nav-item.active"));
  });
  window.addEventListener("resize", () => {
    moveNavIndicator(document.querySelector(".nav-item.active"));
  });

  // Subtle cursor-follow glow on the home module cards.
  document.querySelectorAll(".module-card:not(.disabled)").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  // Collapsible module menu, used on short landscape screens where a full
  // sidebar would eat too much width.
  const sidebar = document.querySelector(".sidebar");
  const navToggle = document.getElementById("nav-toggle");
  const navScrim = document.getElementById("nav-scrim");

  function setNavOpen(open) {
    sidebar.classList.toggle("nav-open", open);
    document.body.classList.toggle("nav-open", open);
    if (navToggle) navToggle.setAttribute("aria-expanded", String(open));
  }

  if (navToggle) {
    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setNavOpen(!sidebar.classList.contains("nav-open"));
    });
  }
  if (navScrim) navScrim.addEventListener("click", () => setNavOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setNavOpen(false);
  });

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      setNavOpen(false);
      activateModule(btn.dataset.module);
    });
  });

  document.querySelectorAll(".module-card[data-module]").forEach((card) => {
    card.addEventListener("click", () => activateModule(card.dataset.module));
  });

  document.querySelectorAll(".back-link").forEach((link) => {
    link.addEventListener("click", () => activateModule("home"));
  });

  const brandHome = document.getElementById("brand-home");
  if (brandHome) brandHome.addEventListener("click", () => {
    setNavOpen(false);
    activateModule("home");
  });

  // Space / Enter reveals or advances, but only while the chord module is
  // active and focus isn't on a button (avoid double-triggering clicks).
  document.addEventListener("keydown", (e) => {
    if (activeModule !== "chords") return;
    if (e.code !== "Space" && e.code !== "Enter") return;
    if (document.activeElement && document.activeElement.tagName === "BUTTON") return;
    e.preventDefault();
    document.getElementById("reveal-btn").click();
  });
});

