// Triad Trainer. Mirrors the Chord Trainer's flow — show shapes, reveal the
// names — but draws three-note triads and filters by inversion instead of by
// seventh-chord quality.

const TriadTrainer = (() => {
  let canvas, ctx, revealBtn, newBtn;
  let countRadios = [];
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
    revealBtn = root.querySelector("#triad-reveal-btn");
    newBtn = root.querySelector("#triad-new-btn");
    countRadios = Array.from(root.querySelectorAll('input[name="triad-count"]'));
    qualityChecks = Array.from(root.querySelectorAll(".triad-quality-check"));
    inversionChecks = Array.from(root.querySelectorAll(".triad-inversion-check"));
    stringSetChecks = Array.from(root.querySelectorAll(".triad-set-check"));

    revealBtn.addEventListener("click", onReveal);
    newBtn.addEventListener("click", newTriads);

    countRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) setCount(parseInt(radio.dataset.triadCount, 10));
      });
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

    window.addEventListener("resize", () => {
      if (!mounted) return;
      resizeCanvas();
      redraw();
    });
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
      resizeCanvas();
      redraw();
      requestAnimationFrame(() => canvas.classList.remove("is-swapping"));
    }, 140);
  }

  function setCount(n) {
    triadCount = n;
    newTriads();
  }

  function resizeCanvas() {
    const parent = canvas.parentElement;
    const cs = window.getComputedStyle(parent);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(parent.getBoundingClientRect().width - padX, 260);
    const cssH = FretDiagram.computeLayout(cssW, current.length || triadCount).canvasH;
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
    const L = FretDiagram.computeLayout(cw, n);

    current.forEach((c, i) => {
      const col = i % L.cols;
      const row = Math.floor(i / L.cols);
      const x1 = L.pad + col * (L.cardW + L.gap);
      const y1 = L.pad + row * (L.cardH + L.gap);
      FretDiagram.drawCard(ctx, t, x1, y1, x1 + L.cardW, y1 + L.cardH);
      FretDiagram.drawChordDiagram(ctx, t, c.frets, x1, y1, L.cardW, L.diagramH);
      FretDiagram.drawCardLabel(
        ctx, t,
        namesRevealed ? c.label : "—",
        x1, y1 + L.diagramH + L.labelArea / 2 - 4, L.cardW,
        namesRevealed
      );
    });

  }

  return { init, onActivate, onDeactivate };
})();
