// Key Jam. Pick a key, hit start, and diatonic chords from that key arrive
// in tempo — one big current chord plus a preview of what's coming, so you
// can prepare the change rather than being ambushed by it.
//
// Timing is tempo-based rather than a plain seconds countdown: chord changes
// land on bar lines, which is how progressions actually work, and it lets the
// module drive a metronome click.

const KeyJam = (() => {
  const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const SIMPLE_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  const ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

  const MODES = {
    major: {
      label: "Major",
      intervals: [0, 2, 4, 5, 7, 9, 11],
      qualities: ["major", "minor", "minor", "major", "major", "minor", "dim"],
      numerals: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
    },
    minor: {
      label: "Minor",
      intervals: [0, 2, 3, 5, 7, 8, 10],
      qualities: ["minor", "dim", "major", "minor", "minor", "major", "major"],
      numerals: ["i", "ii°", "III", "iv", "v", "VI", "VII"],
    },
  };

  const BEATS_PER_BAR = 4;

  let rootPanel, modePanel, chordEl, numeralEl, nextEl, keyNameEl;
  let playBtn, beatRow, progressFill, barEl;
  let bpmSlider, bpmValue, barsPanel, dimToggle, clickToggle;

  let keyRoot = "G";
  let mode = "major";
  let bpm = 90;
  let barsPerChord = 2;
  let includeDim = false;
  let clickOn = false;

  let chords = [];       // [{ name, numeral, quality }]
  let usableIdx = [];    // degree indices currently allowed
  let currentIdx = 0;
  let nextIdx = 1;

  let mounted = false;
  let started = false;
  let running = false;
  let phaseStart = 0;
  let pausedElapsed = 0;
  let lastBeat = -1;
  let rafId = null;
  let audioCtx = null;

  // ---- theory -------------------------------------------------------------

  function accidentalValue(acc) {
    let v = 0;
    for (const ch of acc) {
      if (ch === "#") v += 1;
      else if (ch === "b") v -= 1;
    }
    return v;
  }

  function pitchClassOf(name) {
    return (LETTER_PC[name[0]] + accidentalValue(name.slice(1)) + 120) % 12;
  }

  // Spells the key's scale by stepping through consecutive letters, so G major
  // gives F# rather than Gb. Falls back to a plain sharp name if a degree
  // would need a double accidental (which reads worse than the enharmonic).
  function spellScale(rootName, intervals) {
    const li = LETTERS.indexOf(rootName[0]);
    const rPc = pitchClassOf(rootName);
    return intervals.map((semis, i) => {
      const letter = LETTERS[(li + i) % 7];
      const targetPc = (rPc + semis) % 12;
      const naturalPc = LETTER_PC[letter];
      let diff = ((targetPc - naturalPc + 18) % 12) - 6;
      if (Math.abs(diff) > 1) return SIMPLE_SHARP[targetPc];
      const acc = diff > 0 ? "#" : diff < 0 ? "b" : "";
      return letter + acc;
    });
  }

  function buildKey() {
    const def = MODES[mode];
    const notes = spellScale(keyRoot, def.intervals);
    chords = notes.map((n, i) => {
      const quality = def.qualities[i];
      const suffix = quality === "minor" ? "m" : quality === "dim" ? "°" : "";
      return { name: n + suffix, numeral: def.numerals[i], quality };
    });
    usableIdx = chords
      .map((c, i) => i)
      .filter((i) => includeDim || chords[i].quality !== "dim");

    if (keyNameEl) keyNameEl.textContent = `${keyRoot} ${def.label.toLowerCase()}`;
  }

  function pickDegree(avoid) {
    const pool = usableIdx.length > 1 ? usableIdx.filter((i) => i !== avoid) : usableIdx;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ---- timing -------------------------------------------------------------

  function beatMs() { return 60000 / bpm; }
  function chordMs() { return beatMs() * BEATS_PER_BAR * barsPerChord; }

  function elapsed() {
    const raw = running ? performance.now() - phaseStart : pausedElapsed;
    return Math.max(0, Math.min(raw, chordMs()));
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function loop() {
    stopLoop();
    rafId = requestAnimationFrame(function step() {
      if (!mounted || !running) { rafId = null; return; }

      const e = performance.now() - phaseStart;
      const beat = Math.floor(e / beatMs());
      if (beat !== lastBeat) {
        lastBeat = beat;
        if (clickOn) playClick(beat % BEATS_PER_BAR === 0);
      }

      if (e >= chordMs()) advance();

      render();
      rafId = requestAnimationFrame(step);
    });
  }

  function advance() {
    currentIdx = nextIdx;
    nextIdx = pickDegree(currentIdx);
    phaseStart = performance.now();
    pausedElapsed = 0;
    lastBeat = -1;
  }

  // ---- metronome ----------------------------------------------------------

  function playClick(accent) {
    try {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = accent ? 1400 : 900;
      gain.gain.setValueAtTime(accent ? 0.16 : 0.09, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.07);
    } catch (err) {
      // Audio is a nicety; never let it break the trainer.
    }
  }

  // ---- rendering ----------------------------------------------------------

  function render() {
    if (!chordEl) return;

    if (!started) {
      chordEl.textContent = "—";
      chordEl.classList.remove("live");
      numeralEl.textContent = "";
      nextEl.textContent = "Press Start";
      progressFill.style.width = "0%";
      barEl.textContent = "";
      renderBeats(-1);
      return;
    }

    const cur = chords[currentIdx];
    const nxt = chords[nextIdx];
    chordEl.textContent = cur.name;
    chordEl.classList.add("live");
    numeralEl.textContent = cur.numeral;
    nextEl.textContent = `next: ${nxt.name}`;

    const e = elapsed();
    progressFill.style.width = `${(e / chordMs()) * 100}%`;

    const beatIdx = Math.min(Math.floor(e / beatMs()), BEATS_PER_BAR * barsPerChord - 1);
    renderBeats(running ? beatIdx % BEATS_PER_BAR : -1);
    barEl.textContent = barsPerChord > 1
      ? `bar ${Math.floor(beatIdx / BEATS_PER_BAR) + 1} of ${barsPerChord}`
      : "";
  }

  function renderBeats(activeBeat) {
    if (!beatRow) return;
    Array.from(beatRow.children).forEach((dot, i) => {
      dot.classList.toggle("on", i === activeBeat);
    });
  }

  // ---- controls -----------------------------------------------------------

  function onPlayClick() {
    if (!started) {
      started = true;
      running = true;
      playBtn.textContent = "Pause";
      currentIdx = pickDegree(-1);
      nextIdx = pickDegree(currentIdx);
      phaseStart = performance.now();
      pausedElapsed = 0;
      lastBeat = -1;
      loop();
      render();
      return;
    }

    if (running) {
      // Read elapsed before clearing the flag — elapsed() branches on it.
      pausedElapsed = elapsed();
      running = false;
      stopLoop();
    } else {
      running = true;
      phaseStart = performance.now() - pausedElapsed;
      loop();
    }
    playBtn.textContent = running ? "Pause" : "Resume";
    render();
  }

  function init(root) {
    chordEl = root.querySelector("#kj-chord");
    numeralEl = root.querySelector("#kj-numeral");
    nextEl = root.querySelector("#kj-next");
    keyNameEl = root.querySelector("#kj-key-name");
    playBtn = root.querySelector("#kj-play");
    beatRow = root.querySelector("#kj-beats");
    progressFill = root.querySelector("#kj-progress-fill");
    barEl = root.querySelector("#kj-bar");
    rootPanel = root.querySelector("#kj-root-panel");
    modePanel = root.querySelector("#kj-mode-panel");
    barsPanel = root.querySelector("#kj-bars-panel");
    bpmSlider = root.querySelector("#kj-bpm");
    bpmValue = root.querySelector("#kj-bpm-value");
    dimToggle = root.querySelector("#kj-include-dim");
    clickToggle = root.querySelector("#kj-click");

    for (let i = 0; i < BEATS_PER_BAR; i++) {
      const dot = document.createElement("span");
      dot.className = "kj-beat";
      beatRow.appendChild(dot);
    }

    ROOTS.forEach((r) => {
      const label = document.createElement("label");
      label.className = "opt-chip";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "kj-root";
      input.dataset.root = r;
      input.checked = r === keyRoot;
      const span = document.createElement("span");
      span.textContent = r;
      label.appendChild(input);
      label.appendChild(span);
      input.addEventListener("change", () => {
        if (!input.checked) return;
        keyRoot = r;
        buildKey();
        resetProgression();
      });
      rootPanel.appendChild(label);
    });

    Object.entries(MODES).forEach(([key, def]) => {
      const label = document.createElement("label");
      label.className = "opt-row";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "kj-mode";
      input.dataset.mode = key;
      input.checked = key === mode;
      const span = document.createElement("span");
      span.textContent = def.label;
      label.appendChild(input);
      label.appendChild(span);
      input.addEventListener("change", () => {
        if (!input.checked) return;
        mode = key;
        buildKey();
        resetProgression();
      });
      modePanel.appendChild(label);
    });

    playBtn.addEventListener("click", onPlayClick);

    bpmSlider.addEventListener("input", () => {
      bpm = parseInt(bpmSlider.value, 10);
      bpmValue.textContent = `${bpm} BPM`;
      render();
    });

    Array.from(barsPanel.querySelectorAll("input")).forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked) return;
        barsPerChord = parseInt(input.dataset.bars, 10);
        render();
      });
    });

    dimToggle.addEventListener("change", () => {
      includeDim = dimToggle.checked;
      buildKey();
      if (!usableIdx.includes(currentIdx)) resetProgression();
    });

    clickToggle.addEventListener("change", () => {
      clickOn = clickToggle.checked;
    });

    bpm = parseInt(bpmSlider.value, 10);
    bpmValue.textContent = `${bpm} BPM`;

    buildKey();
    render();
  }

  // Changing key mid-jam shouldn't leave a chord from the old key on screen.
  function resetProgression() {
    if (!started) { render(); return; }
    currentIdx = pickDegree(-1);
    nextIdx = pickDegree(currentIdx);
    phaseStart = performance.now();
    pausedElapsed = 0;
    lastBeat = -1;
    render();
  }

  function onActivate() {
    mounted = true;
    if (started && running) {
      phaseStart = performance.now() - pausedElapsed;
      loop();
    }
    render();
  }

  function onDeactivate() {
    mounted = false;
    if (started && running) pausedElapsed = performance.now() - phaseStart;
    stopLoop();
  }

  return { init, onActivate, onDeactivate };
})();
