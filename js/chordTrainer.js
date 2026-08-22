// Chord Trainer module. Ported from draw_chord_diagram() / display_chords()
// in the original tkinter app. Drawing happens on a single <canvas> that
// spans the card row; each chord gets an equal-width slice.

const ChordTrainer = (() => {

  let canvas, ctx, revealBtn, newChordsBtn, hintEl;
  let countRadios = [];
  let qualityChecks = [];
  let gShapeCheck = null;
  let chordCount = 2;
  let currentChords = [];
  let namesRevealed = false;
  let mounted = false;

  function init(root) {
    canvas = root.querySelector("#chord-canvas");
    ctx = canvas.getContext("2d");
    revealBtn = root.querySelector("#reveal-btn");
    newChordsBtn = root.querySelector("#new-chords-btn");
    hintEl = root.querySelector("#chord-hint");
    countRadios = Array.from(root.querySelectorAll('input[name="chord-count"]'));
    qualityChecks = Array.from(root.querySelectorAll(".quality-check"));
    gShapeCheck = root.querySelector("#include-g-shapes");

    revealBtn.addEventListener("click", onReveal);
    newChordsBtn.addEventListener("click", newChords);
    countRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) setCount(parseInt(radio.dataset.count, 10));
      });
    });

    qualityChecks.forEach((box) => {
      box.addEventListener("change", () => {
        // Keep at least one quality active — otherwise there'd be nothing
        // to generate. Re-check the box the user just cleared.
        if (!getSelectedQualities().length) {
          box.checked = true;
          return;
        }
        newChords();
      });
    });

    if (gShapeCheck) {
      gShapeCheck.addEventListener("change", newChords);
    }

    window.addEventListener("resize", () => {
      if (!mounted) return;
      resizeCanvasToDisplaySize();
      redraw();
    });
    ThemeManager.onChange(() => mounted && redraw());

    newChords();
  }

  function onActivate() {
    mounted = true;
    resizeCanvasToDisplaySize();
    redraw();
  }
  function onDeactivate() {
    mounted = false;
  }

  function onReveal() {
    if (!namesRevealed) {
      namesRevealed = true;
      revealBtn.textContent = "Next  →";
      redraw();
    } else {
      newChords();
    }
  }

  function getSelectedQualities() {
    return qualityChecks.filter((b) => b.checked).map((b) => b.value);
  }

  function getExcludedShapes() {
    return gShapeCheck && !gShapeCheck.checked ? ["G shape"] : [];
  }

  function newChords() {
    namesRevealed = false;
    canvas.classList.add("is-swapping");
    window.setTimeout(() => {
      currentChords = pickRandomChords(chordCount, getSelectedQualities(), getExcludedShapes());
      revealBtn.textContent = "Reveal names";
      resizeCanvasToDisplaySize();
      redraw();
      requestAnimationFrame(() => canvas.classList.remove("is-swapping"));
    }, 140);
  }

  function setCount(n) {
    chordCount = n;
    newChords();
  }

  function resizeCanvasToDisplaySize() {
    const parent = canvas.parentElement;
    const cs = window.getComputedStyle(parent);
    // getBoundingClientRect() includes the parent's padding, so measuring
    // it directly makes the canvas wider than the content box it sits in
    // and pushes it off the right edge. Subtract the horizontal padding.
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(parent.getBoundingClientRect().width - padX, 260);
    const cssH = FretDiagram.computeLayout(cssW, currentChords.length || chordCount).canvasH;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function redraw() {
    const t = ThemeManager.get();
    const cw = canvas.clientWidth || 760;
    const ch = canvas.clientHeight || 320;
    ctx.clearRect(0, 0, cw, ch);

    const n = currentChords.length;
    if (!n) return;
    const L = FretDiagram.computeLayout(cw, n);

    currentChords.forEach((c, i) => {
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
