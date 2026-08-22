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
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const dpr = window.devicePixelRatio || 1;
    // Splits into two stacked halves when too narrow for 24 frets in a row,
    // so the whole neck is visible without sideways scrolling.
    const cssW = Math.max(parent.getBoundingClientRect().width - padX, 280);
    const cssH = BoardRenderer.computeBoardLayout(cssW, { splitBelow: 720 }).canvasH;
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
