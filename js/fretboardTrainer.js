// Fretboard Trainer. Shows a marker at a random string/fret, counts down
// for a user-set interval, then reveals the note name for a fixed 2s before
// moving on to the next position.
//
// Timing model: `phaseStart` is a timestamp the elapsed time is measured
// against while running. When paused we stash the elapsed value in
// `pausedElapsed` and stop measuring against the clock entirely — otherwise
// real time keeps accruing behind the scenes and the progress bar drifts.

const FretboardTrainer = (() => {
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  // Open-string pitch classes, index 0 = low E (drawn at the bottom).
  const OPEN_STRINGS = [4, 9, 2, 7, 11, 4];
  const STRING_LABELS = ["E", "A", "D", "G", "B", "E"];
  const FRET_COUNT = 24;
  const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
  const DOUBLE_INLAYS = [12, 24];
  const NUMBERED_FRETS = [1, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
  const REVEAL_MS = 2000;

  let canvas, ctx, timerSlider, timerValueEl, playBtn, statusEl, progressFill;
  let mounted = false;
  let started = false;   // has the user pressed Start yet?
  let running = false;   // is the countdown actively advancing?
  let phase = "question"; // "question" | "reveal"
  let phaseStart = 0;
  let pausedElapsed = 0;
  let phaseDuration = 5000;
  let timerSeconds = 5;
  let target = null; // { string, fret, note }
  let rafId = null;

  function init(root) {
    canvas = root.querySelector("#fretboard-canvas");
    ctx = canvas.getContext("2d");
    timerSlider = root.querySelector("#fb-timer");
    timerValueEl = root.querySelector("#fb-timer-value");
    playBtn = root.querySelector("#fb-play");
    statusEl = root.querySelector("#fb-status");
    progressFill = root.querySelector("#fb-progress-fill");

    timerSeconds = parseInt(timerSlider.value, 10) || 5;
    timerValueEl.textContent = `${timerSeconds}s`;

    timerSlider.addEventListener("input", () => {
      timerSeconds = parseInt(timerSlider.value, 10);
      timerValueEl.textContent = `${timerSeconds}s`;
      // Restart the current countdown so a new length takes effect right
      // away rather than after an already-running timer expires.
      if (started && phase === "question") startQuestion();
      draw();
    });

    playBtn.addEventListener("click", onPlayClick);

    window.addEventListener("resize", () => {
      if (!mounted) return;
      resizeCanvas();
      draw();
    });
    ThemeManager.onChange(() => mounted && draw());

    reset();
  }

  function reset() {
    started = false;
    running = false;
    target = null;
    phase = "question";
    pausedElapsed = 0;
    phaseDuration = timerSeconds * 1000;
    if (playBtn) playBtn.textContent = "Start";
  }

  function onActivate() {
    mounted = true;
    resizeCanvas();
    // Resume from exactly where we left off rather than counting the time
    // spent on another screen.
    if (started && running) {
      phaseStart = performance.now() - pausedElapsed;
      loop();
    }
    draw();
  }

  function onDeactivate() {
    mounted = false;
    // Freeze the clock so leaving and returning doesn't skip ahead.
    if (started && running) {
      pausedElapsed = performance.now() - phaseStart;
    }
    stopLoop();
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function onPlayClick() {
    if (!started) {
      started = true;
      running = true;
      playBtn.textContent = "Pause";
      nextTarget();
      startQuestion();
      loop();
      draw();
      return;
    }

    if (running) {
      // Capture the elapsed portion BEFORE clearing the running flag —
      // elapsed() branches on it, so flipping first would read a stale
      // pausedElapsed and snap the progress bar back to zero.
      pausedElapsed = elapsed();
      running = false;
      stopLoop();
    } else {
      // Rebase the start timestamp so the elapsed portion is preserved.
      running = true;
      phaseStart = performance.now() - pausedElapsed;
      loop();
    }

    playBtn.textContent = running ? "Pause" : "Resume";
    draw();
  }

  // Elapsed time within the current phase, clamped to its duration.
  function elapsed() {
    const raw = running ? performance.now() - phaseStart : pausedElapsed;
    return Math.max(0, Math.min(raw, phaseDuration));
  }

  function nextTarget() {
    const string = Math.floor(Math.random() * 6);
    const fret = 1 + Math.floor(Math.random() * FRET_COUNT);
    const note = NOTE_NAMES[(OPEN_STRINGS[string] + fret) % 12];
    target = { string, fret, note };
  }

  function startQuestion() {
    phase = "question";
    phaseDuration = timerSeconds * 1000;
    phaseStart = performance.now();
    pausedElapsed = 0;
  }

  function startReveal() {
    phase = "reveal";
    phaseDuration = REVEAL_MS;
    phaseStart = performance.now();
    pausedElapsed = 0;
  }

  function loop() {
    stopLoop();
    rafId = requestAnimationFrame(function step() {
      if (!mounted || !running) { rafId = null; return; }

      if (performance.now() - phaseStart >= phaseDuration) {
        if (phase === "question") {
          startReveal();
        } else {
          nextTarget();
          startQuestion();
        }
      }

      draw();
      rafId = requestAnimationFrame(step);
    });
  }

  function resizeCanvas() {
    const parent = canvas.parentElement;
    const cs = window.getComputedStyle(parent);
<<<<<<< HEAD
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const dpr = window.devicePixelRatio || 1;
    // Splits into two stacked halves when too narrow for 24 frets in a row,
    // so the whole neck is visible without sideways scrolling.
    const cssW = Math.max(parent.getBoundingClientRect().width - padX, 280);
    const cssH = BoardRenderer.computeBoardLayout(cssW, { splitBelow: 720 }).canvasH;
=======
    // getBoundingClientRect() includes the parent's padding, so measuring
    // it directly makes the canvas wider than the content box it sits in
    // and pushes it off the right edge. Subtract the horizontal padding.
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(parent.getBoundingClientRect().width - padX, 320);
    const cssH = 300;
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    if (!ctx) return;
    const t = ThemeManager.get();
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 300;
    ctx.clearRect(0, 0, w, h);

<<<<<<< HEAD
    const layout = BoardRenderer.computeBoardLayout(w, { splitBelow: 720 });
    const revealed = phase === "reveal";
    const markers = [];
    if (target && started) {
      markers.push({
        string: target.string,
        fret: target.fret,
        fill: revealed ? t.accent : t.dotFill,
        border: revealed ? t.accentSoft : t.accent,
        text: revealed ? target.note : "?",
        textColor: revealed ? "#14110c" : t.accent,
        scale: 1.15,
      });
    }
    const padX = 8;

    if (layout.split) {
      BoardRenderer.drawSection(ctx, t, {
        x: padX, y: 8, w: w - padX * 2, h: layout.sectionH - 8,
        fromFret: 1, toFret: 12, showOpen: false, markers,
      });
      BoardRenderer.drawSection(ctx, t, {
        x: padX, y: layout.sectionH + layout.gap, w: w - padX * 2, h: layout.sectionH - 8,
        fromFret: 13, toFret: 24, showOpen: false, markers,
      });
    } else {
      BoardRenderer.drawSection(ctx, t, {
        x: padX, y: 14, w: w - padX * 2, h: layout.sectionH - 22,
        fromFret: 1, toFret: 24, showOpen: false, markers,
      });
=======
    const padLeft = 42;
    const padRight = 34;
    const padTop = 30;
    const padBottom = 40;
    const boardX = padLeft;
    const boardY = padTop;
    const boardW = Math.max(120, w - padLeft - padRight);
    const boardH = Math.max(90, h - padTop - padBottom);
    const fretSpacing = boardW / FRET_COUNT;
    const stringSpacing = boardH / 5;

    // Board face
    ctx.fillStyle = t.boardBg;
    ctx.fillRect(boardX, boardY, boardW, boardH);

    // Inlay markers, drawn under the strings
    ctx.fillStyle = "rgba(90, 74, 42, 0.22)";
    const inlayR = Math.min(stringSpacing * 0.3, fretSpacing * 0.3);
    SINGLE_INLAYS.forEach((f) => {
      if (f > FRET_COUNT) return;
      const cx = boardX + (f - 0.5) * fretSpacing;
      ctx.beginPath();
      ctx.arc(cx, boardY + boardH / 2, inlayR, 0, Math.PI * 2);
      ctx.fill();
    });
    DOUBLE_INLAYS.forEach((f) => {
      if (f > FRET_COUNT) return;
      const cx = boardX + (f - 0.5) * fretSpacing;
      [boardY + boardH * 0.3, boardY + boardH * 0.7].forEach((cy) => {
        ctx.beginPath();
        ctx.arc(cx, cy, inlayR, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Frets (vertical lines); index 0 is the nut
    for (let f = 0; f <= FRET_COUNT; f++) {
      const x = boardX + f * fretSpacing;
      ctx.beginPath();
      ctx.moveTo(x, boardY);
      ctx.lineTo(x, boardY + boardH);
      ctx.strokeStyle = f === 0 ? t.nut : t.fret;
      ctx.lineWidth = f === 0 ? 6 : 1.2;
      ctx.stroke();
    }

    // Strings (horizontal lines), thickest at the bottom (low E)
    for (let s = 0; s < 6; s++) {
      const y = boardY + (5 - s) * stringSpacing;
      ctx.beginPath();
      ctx.moveTo(boardX, y);
      ctx.lineTo(boardX + boardW, y);
      ctx.strokeStyle = t.string;
      ctx.lineWidth = Math.max(1, 1 + s * 0.45);
      ctx.stroke();
    }

    // String name labels down the left edge
    ctx.font = '600 13px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = t.fretNumFg;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let s = 0; s < 6; s++) {
      const y = boardY + (5 - s) * stringSpacing;
      ctx.fillText(STRING_LABELS[s], boardX - 12, y);
    }

    // Fret numbers below the board. With 24 frets there isn't room for
    // every number, so only the conventional position markers are labelled.
    ctx.font = '600 11px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    NUMBERED_FRETS.forEach((f) => {
      if (f > FRET_COUNT) return;
      const x = boardX + (f - 0.5) * fretSpacing;
      ctx.fillText(String(f), x, boardY + boardH + 11);
    });

    // The target marker
    if (target) {
      const mx = boardX + (target.fret - 0.5) * fretSpacing;
      const my = boardY + (5 - target.string) * stringSpacing;
      const r = Math.min(stringSpacing * 0.46, Math.max(fretSpacing * 0.62, 11), 24);
      const revealed = phase === "reveal";

      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fillStyle = revealed ? t.accent : t.dotFill;
      ctx.fill();
      ctx.strokeStyle = revealed ? t.accentSoft : t.accent;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (revealed) {
        ctx.fillStyle = "#14110c";
        ctx.font = `700 ${Math.max(11, Math.round(r * 0.8))}px "Inter", system-ui, sans-serif`;
        ctx.fillText(target.note, mx, my + 1);
      } else {
        ctx.fillStyle = t.accent;
        ctx.font = `700 ${Math.max(11, Math.round(r * 0.9))}px "Inter", system-ui, sans-serif`;
        ctx.fillText("?", mx, my + 1);
      }
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
    }

    updateChrome();
  }

  function updateChrome() {
    if (!statusEl || !progressFill) return;

    if (!started) {
      statusEl.textContent = "Press Start to begin";
      statusEl.className = "fb-status paused";
      progressFill.style.width = "0%";
      progressFill.classList.remove("revealing");
      return;
    }

    const e = elapsed();
    const pct = phaseDuration ? (e / phaseDuration) * 100 : 0;

    if (!running) {
      statusEl.textContent = "Paused";
      statusEl.className = "fb-status paused";
    } else if (phase === "reveal") {
      statusEl.textContent = `It's ${target ? target.note : ""}`;
      statusEl.className = "fb-status revealed";
    } else {
      const remaining = Math.max(0, Math.ceil((phaseDuration - e) / 1000));
      statusEl.textContent = `Name the note — ${remaining}s`;
      statusEl.className = "fb-status";
    }

    progressFill.style.width = `${pct}%`;
    progressFill.classList.toggle("revealing", phase === "reveal");
  }

  return { init, onActivate, onDeactivate };
})();
