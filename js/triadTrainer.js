// Triad Trainer. Mirrors the Chord Trainer's flow — show shapes, reveal the
// names — but draws three-note triads and filters by inversion instead of by
// seventh-chord quality.

const TriadTrainer = (() => {
  let canvas, ctx, labelRow, revealBtn, newBtn, countButtons = {};
  let qualityChecks = [];
  let inversionChecks = [];
  let stringSetChecks = [];
  let triadCount = 2;
  let current = [];
  let namesRevealed = false;
  let mounted = false;

  function init(root) {
    canvas = root.querySelector("#triad-canvas");
    ctx = canvas.getContext("2d");
    labelRow = root.querySelector("#triad-label-row");
    revealBtn = root.querySelector("#triad-reveal-btn");
    newBtn = root.querySelector("#triad-new-btn");
    countButtons = {
      2: root.querySelector('#module-triads [data-triad-count="2"]') || root.querySelector('[data-triad-count="2"]'),
      3: root.querySelector('[data-triad-count="3"]'),
      4: root.querySelector('[data-triad-count="4"]'),
    };
    qualityChecks = Array.from(root.querySelectorAll(".triad-quality-check"));
    inversionChecks = Array.from(root.querySelectorAll(".triad-inversion-check"));
    stringSetChecks = Array.from(root.querySelectorAll(".triad-set-check"));

    revealBtn.addEventListener("click", onReveal);
    newBtn.addEventListener("click", newTriads);

    Object.entries(countButtons).forEach(([n, btn]) => {
      if (btn) btn.addEventListener("click", () => setCount(parseInt(n, 10)));
    });

    // Both filter groups need at least one box ticked, otherwise there'd be
    // nothing left to generate.
    qualityChecks.forEach((box) => {
      box.addEventListener("change", () => {
        if (!getQualities().length) { box.checked = true; return; }
        newTriads();
      });
    });
    inversionChecks.forEach((box) => {
      box.addEventListener("change", () => {
        if (!getInversions().length) { box.checked = true; return; }
        newTriads();
      });
    });
    stringSetChecks.forEach((box) => {
      box.addEventListener("change", () => {
        if (!getStringSets().length) { box.checked = true; return; }
        newTriads();
      });
    });

    window.addEventListener("resize", () => mounted && redraw());
    ThemeManager.onChange(() => mounted && redraw());

    newTriads();
  }

  function onActivate() {
    mounted = true;
    resizeCanvas();
    redraw();
  }

  function onDeactivate() {
    mounted = false;
  }

  function getQualities() {
    return qualityChecks.filter((b) => b.checked).map((b) => b.value);
  }

  function getInversions() {
    return inversionChecks.filter((b) => b.checked).map((b) => b.value);
  }

  function getStringSets() {
    return stringSetChecks.filter((b) => b.checked).map((b) => b.value);
  }

  function onReveal() {
    if (!namesRevealed) {
      namesRevealed = true;
      revealBtn.textContent = "Next  →";
      redraw();
    } else {
      newTriads();
    }
  }

  function newTriads() {
    namesRevealed = false;
    canvas.classList.add("is-swapping");
    window.setTimeout(() => {
      current = pickRandomTriads(triadCount, getQualities(), getInversions(), getStringSets());
      revealBtn.textContent = "Reveal names";
      buildLabels();
      resizeCanvas();
      redraw();
      requestAnimationFrame(() => canvas.classList.remove("is-swapping"));
    }, 140);
  }

  function setCount(n) {
    triadCount = n;
    Object.entries(countButtons).forEach(([val, btn]) => {
      if (btn) btn.classList.toggle("selected", parseInt(val, 10) === n);
    });
    newTriads();
  }

  function buildLabels() {
    labelRow.innerHTML = "";
    current.forEach(() => {
      const span = document.createElement("span");
      span.className = "chord-label dim";
      span.textContent = "—";
      labelRow.appendChild(span);
    });
  }

  function resizeCanvas() {
    const parent = canvas.parentElement;
    const cs = window.getComputedStyle(parent);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(parent.getBoundingClientRect().width - padX, 300);
    const cssH = 380;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function redraw() {
    if (!ctx) return;
    const t = ThemeManager.get();
    const cw = canvas.clientWidth || 760;
    const ch = canvas.clientHeight || 380;
    ctx.clearRect(0, 0, cw, ch);

    const n = current.length;
    if (!n) return;
    const pad = 14;
    const gap = 10;
    const cardW = (cw - pad * 2 - gap * (n - 1)) / n;
    const cardH = ch - pad * 2;

    current.forEach((c, i) => {
      const x1 = pad + i * (cardW + gap);
      FretDiagram.drawCard(ctx, t, x1, pad, x1 + cardW, pad + cardH);
      FretDiagram.drawChordDiagram(ctx, t, c.frets, x1, pad + 20, cardW, cardH);
    });

    const labels = labelRow.children;
    for (let i = 0; i < labels.length; i++) {
      const el = labels[i];
      if (namesRevealed) {
        el.textContent = current[i].label;
        el.className = "chord-label lit";
      } else {
        el.textContent = "—";
        el.className = "chord-label dim";
      }
    }
  }

  return { init, onActivate, onDeactivate };
})();
