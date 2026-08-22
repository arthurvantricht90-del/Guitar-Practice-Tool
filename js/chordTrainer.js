// Chord Trainer module. Ported from draw_chord_diagram() / display_chords()
// in the original tkinter app. Drawing happens on a single <canvas> that
// spans the card row; each chord gets an equal-width slice.

const ChordTrainer = (() => {

<<<<<<< HEAD
  let canvas, ctx, revealBtn, newChordsBtn, hintEl;
  let countRadios = [];
=======
  let canvas, ctx, labelRow, revealBtn, newChordsBtn, hintEl;
  let countButtons = {};
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
  let qualityChecks = [];
  let gShapeCheck = null;
  let chordCount = 2;
  let currentChords = [];
  let namesRevealed = false;
  let mounted = false;

  function init(root) {
    canvas = root.querySelector("#chord-canvas");
    ctx = canvas.getContext("2d");
<<<<<<< HEAD
    revealBtn = root.querySelector("#reveal-btn");
    newChordsBtn = root.querySelector("#new-chords-btn");
    hintEl = root.querySelector("#chord-hint");
    countRadios = Array.from(root.querySelectorAll('input[name="chord-count"]'));
=======
    labelRow = root.querySelector("#chord-label-row");
    revealBtn = root.querySelector("#reveal-btn");
    newChordsBtn = root.querySelector("#new-chords-btn");
    hintEl = root.querySelector("#chord-hint");
    countButtons = {
      2: root.querySelector('[data-count="2"]'),
      3: root.querySelector('[data-count="3"]'),
      4: root.querySelector('[data-count="4"]'),
    };
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
    qualityChecks = Array.from(root.querySelectorAll(".quality-check"));
    gShapeCheck = root.querySelector("#include-g-shapes");

    revealBtn.addEventListener("click", onReveal);
    newChordsBtn.addEventListener("click", newChords);
<<<<<<< HEAD
    countRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) setCount(parseInt(radio.dataset.count, 10));
      });
=======
    Object.entries(countButtons).forEach(([n, btn]) => {
      btn.addEventListener("click", () => setCount(parseInt(n, 10)));
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
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

<<<<<<< HEAD
    window.addEventListener("resize", () => {
      if (!mounted) return;
      resizeCanvasToDisplaySize();
      redraw();
    });
=======
    window.addEventListener("resize", () => mounted && redraw());
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
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
<<<<<<< HEAD
=======
      buildLabels();
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
      resizeCanvasToDisplaySize();
      redraw();
      requestAnimationFrame(() => canvas.classList.remove("is-swapping"));
    }, 140);
  }

  function setCount(n) {
    chordCount = n;
<<<<<<< HEAD
    newChords();
  }

=======
    Object.entries(countButtons).forEach(([val, btn]) => {
      btn.classList.toggle("selected", parseInt(val, 10) === n);
    });
    newChords();
  }

  function buildLabels() {
    labelRow.innerHTML = "";
    currentChords.forEach(() => {
      const span = document.createElement("span");
      span.className = "chord-label dim";
      span.textContent = "—";
      labelRow.appendChild(span);
    });
  }

>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
  function resizeCanvasToDisplaySize() {
    const parent = canvas.parentElement;
    const cs = window.getComputedStyle(parent);
    // getBoundingClientRect() includes the parent's padding, so measuring
    // it directly makes the canvas wider than the content box it sits in
    // and pushes it off the right edge. Subtract the horizontal padding.
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const dpr = window.devicePixelRatio || 1;
<<<<<<< HEAD
    const cssW = Math.max(parent.getBoundingClientRect().width - padX, 260);
    const cssH = FretDiagram.computeLayout(cssW, currentChords.length || chordCount).canvasH;
=======
    const cssW = Math.max(parent.getBoundingClientRect().width - padX, 300);
    const cssH = 380;
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
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
<<<<<<< HEAD
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

=======
    const pad = 14;
    const gap = 10;
    const cardW = (cw - pad * 2 - gap * (n - 1)) / n;
    const cardH = ch - pad * 2;

    currentChords.forEach((c, i) => {
      const x1 = pad + i * (cardW + gap);
      FretDiagram.drawCard(ctx, t, x1, pad, x1 + cardW, pad + cardH);
      FretDiagram.drawChordDiagram(ctx, t, c.frets, x1, pad + 20, cardW, cardH);
    });

    // Labels
    const labels = labelRow.children;
    for (let i = 0; i < labels.length; i++) {
      const el = labels[i];
      if (namesRevealed) {
        el.textContent = currentChords[i].label;
        el.className = "chord-label lit";
      } else {
        el.textContent = "—";
        el.className = "chord-label dim";
      }
    }
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
  }


  return { init, onActivate, onDeactivate };
})();
