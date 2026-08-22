// Scale Trainer. Draws every note of the selected scale across the whole
// fretboard, with root notes highlighted.
//
// Note spelling: rather than defaulting to sharps everywhere, each scale
// degree takes the next letter of the alphabet and whatever accidental that
// letter needs to hit the right pitch. That's what makes G major come out as
// G A B C D E F# (not Gb) and F major as F G A Bb C D E (not A#).

const ScaleTrainer = (() => {
  const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  // Open-string pitch classes, index 0 = low E (drawn at the bottom).
  const OPEN_STRINGS = [4, 9, 2, 7, 11, 4];
  const STRING_LABELS = ["E", "A", "D", "G", "B", "E"];
<<<<<<< HEAD
  const FRET_COUNT = 22;  // standard electric guitar
=======
  const FRET_COUNT = 24;
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
  const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
  const DOUBLE_INLAYS = [12, 24];
  const NUMBERED_FRETS = [1, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

  // Conventional key spellings — flats where a key normally uses them.
  const ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

  const SCALE_TYPES = {
    major: { label: "Major", intervals: [0, 2, 4, 5, 7, 9, 11] },
    minor: { label: "Minor", intervals: [0, 2, 3, 5, 7, 8, 10] },
    // Pentatonics are subsets of their parent scale, so they inherit its
    // spelling by picking degrees rather than being spelled independently.
    "major pentatonic": { label: "Major pentatonic", parent: "major", degrees: [0, 1, 2, 4, 5] },
    "minor pentatonic": { label: "Minor pentatonic", parent: "minor", degrees: [0, 2, 3, 4, 6] },
  };

  let canvas, ctx, rootRow, typeRow, scaleNotesEl, namesToggle;
  let mounted = false;
<<<<<<< HEAD
  let stage, lsBtn, lsExitBtn, lsHint, section;
  let landscape = false;  // larger-view stage active
  let rotated = false;    // stage is quarter-turned because the phone is upright
=======
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
  let root = "G";
  let scaleType = "major";
  let showNames = true;
  let spelled = []; // [{ pc, name }]
  let pcToName = {};
  let scalePcs = new Set();
  let rootPc = 7;

  function accidentalValue(acc) {
    let v = 0;
    for (const ch of acc) {
      if (ch === "#") v += 1;
      else if (ch === "b") v -= 1;
    }
    return v;
  }

  function pitchClassOf(noteName) {
    return (LETTER_PC[noteName[0]] + accidentalValue(noteName.slice(1)) + 120) % 12;
  }

  // Spells a 7-note scale by stepping through consecutive letters.
  function spellHeptatonic(rootName, intervals) {
    const rootLetterIdx = LETTERS.indexOf(rootName[0]);
    const rPc = pitchClassOf(rootName);
    return intervals.map((semitones, i) => {
      const letter = LETTERS[(rootLetterIdx + i) % 7];
      const targetPc = (rPc + semitones) % 12;
      const naturalPc = LETTER_PC[letter];
      // Normalise the gap into -6..+5 so we get e.g. "b" rather than 11 sharps.
      let diff = ((targetPc - naturalPc + 18) % 12) - 6;
      const acc = diff > 0 ? "#".repeat(diff) : diff < 0 ? "b".repeat(-diff) : "";
      return { pc: targetPc, name: letter + acc };
    });
  }

  function buildScale() {
    const def = SCALE_TYPES[scaleType];
    if (def.parent) {
      const parentSpelling = spellHeptatonic(root, SCALE_TYPES[def.parent].intervals);
      spelled = def.degrees.map((d) => parentSpelling[d]);
    } else {
      spelled = spellHeptatonic(root, def.intervals);
    }
    pcToName = {};
    scalePcs = new Set();
    spelled.forEach((n) => {
      pcToName[n.pc] = n.name;
      scalePcs.add(n.pc);
    });
    rootPc = pitchClassOf(root);
  }

<<<<<<< HEAD
  // ---- larger view --------------------------------------------------------

  function isPortrait() {
    return window.innerHeight > window.innerWidth;
  }

  function enterLandscape() {
    landscape = true;
    rotated = isPortrait();
    section.classList.add("landscape");
    section.classList.toggle("rotated", rotated);
    if (lsHint) lsHint.style.display = rotated ? "" : "none";
    document.body.classList.add("landscape-active");

    // Where the browser allows it (Android Chrome), genuinely lock to
    // landscape. iOS doesn't support this, hence the rotation fallback.
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) {
      Promise.resolve(req.call(el)).then(() => {
        if (screen.orientation && screen.orientation.lock) {
          return screen.orientation.lock("landscape");
        }
      }).catch(() => { /* fall back to the rotated stage */ });
    }

    resizeCanvas();
    draw();
  }

  function exitLandscape() {
    landscape = false;
    rotated = false;
    section.classList.remove("landscape", "rotated");
    document.body.classList.remove("landscape-active");

    try {
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    } catch (e) { /* not supported everywhere */ }
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }

    resizeCanvas();
    draw();
  }

  // Turning the phone while the stage is open should un-rotate it.
  function syncOrientation() {
    if (!landscape) return;
    const shouldRotate = isPortrait();
    if (shouldRotate !== rotated) {
      rotated = shouldRotate;
      section.classList.toggle("rotated", rotated);
      if (lsHint) lsHint.style.display = rotated ? "" : "none";
    }
    resizeCanvas();
    draw();
  }

  function init(hostRoot) {
    canvas = hostRoot.querySelector("#scale-canvas");
    ctx = canvas.getContext("2d");
    rootRow = hostRoot.querySelector("#scale-root-panel");
    typeRow = hostRoot.querySelector("#scale-type-panel");
    scaleNotesEl = hostRoot.querySelector("#scale-notes");
    namesToggle = hostRoot.querySelector("#scale-show-names");
    stage = hostRoot.querySelector("#scale-stage");
    lsBtn = hostRoot.querySelector("#scale-landscape");
    lsExitBtn = hostRoot.querySelector("#scale-ls-exit");
    lsHint = hostRoot.querySelector("#scale-ls-hint");
    section = hostRoot;

    if (lsBtn) lsBtn.addEventListener("click", enterLandscape);
    if (lsExitBtn) lsExitBtn.addEventListener("click", exitLandscape);
    window.addEventListener("orientationchange", () => setTimeout(syncOrientation, 120));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && landscape) exitLandscape();
    });

    // Root options
    ROOTS.forEach((r) => {
      const label = document.createElement("label");
      label.className = "opt-chip";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "scale-root";
      input.dataset.root = r;
      input.checked = r === root;
      const span = document.createElement("span");
      span.textContent = r;
      label.appendChild(input);
      label.appendChild(span);
      input.addEventListener("change", () => { if (input.checked) setRoot(r); });
      rootRow.appendChild(label);
    });

    // Scale type options
    Object.entries(SCALE_TYPES).forEach(([key, def]) => {
      const label = document.createElement("label");
      label.className = "opt-row";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "scale-type";
      input.dataset.type = key;
      input.checked = key === scaleType;
      const span = document.createElement("span");
      span.textContent = def.label;
      label.appendChild(input);
      label.appendChild(span);
      input.addEventListener("change", () => { if (input.checked) setType(key); });
      typeRow.appendChild(label);
=======
  function init(hostRoot) {
    canvas = hostRoot.querySelector("#scale-canvas");
    ctx = canvas.getContext("2d");
    rootRow = hostRoot.querySelector("#scale-root-row");
    typeRow = hostRoot.querySelector("#scale-type-row");
    scaleNotesEl = hostRoot.querySelector("#scale-notes");
    namesToggle = hostRoot.querySelector("#scale-show-names");

    // Root buttons
    ROOTS.forEach((r) => {
      const btn = document.createElement("button");
      btn.className = "pill-btn count" + (r === root ? " selected" : "");
      btn.textContent = r;
      btn.dataset.root = r;
      btn.addEventListener("click", () => setRoot(r));
      rootRow.appendChild(btn);
    });

    // Scale type buttons
    Object.entries(SCALE_TYPES).forEach(([key, def]) => {
      const btn = document.createElement("button");
      btn.className = "pill-btn" + (key === scaleType ? " selected" : "");
      btn.textContent = def.label;
      btn.dataset.type = key;
      btn.addEventListener("click", () => setType(key));
      typeRow.appendChild(btn);
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
    });

    if (namesToggle) {
      namesToggle.addEventListener("change", () => {
        showNames = namesToggle.checked;
        draw();
      });
    }

    window.addEventListener("resize", () => {
      if (!mounted) return;
<<<<<<< HEAD
      if (landscape) { syncOrientation(); return; }
=======
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
      resizeCanvas();
      draw();
    });
    ThemeManager.onChange(() => mounted && draw());

    buildScale();
  }

  function onActivate() {
    mounted = true;
    resizeCanvas();
    draw();
  }

  function onDeactivate() {
    mounted = false;
<<<<<<< HEAD
    if (landscape) exitLandscape();
=======
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
  }

  function setRoot(r) {
    root = r;
<<<<<<< HEAD
=======
    rootRow.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("selected", b.dataset.root === r);
    });
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
    buildScale();
    draw();
  }

  function setType(key) {
    scaleType = key;
<<<<<<< HEAD
=======
    typeRow.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("selected", b.dataset.type === key);
    });
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
    buildScale();
    draw();
  }

<<<<<<< HEAD
  // Board geometry, shared by the sizing and drawing passes so they can't
  // disagree. Given the space available it works out fret spacing first,
  // then fits string spacing to whatever height is left, so the board always
  // fills its box rather than being a fixed size that may not suit.
  function boardGeometry(cssW, maxH) {
    const tight = cssW < 560;
    // Only drop to 12 frets when the board is genuinely too narrow for the
    // full neck — in the larger view there's always room for all 22.
    const toFret = tight ? 12 : FRET_COUNT;

    const padX = tight ? 6 : 10;
    const labelGap = tight ? 20 : 26;
    const openGap = tight ? 28 : 38;
    const numberGap = 44;
    const topOffset = tight ? 26 : 30;

    const boardW = Math.max(80, cssW - padX * 2 - labelGap - openGap - 6);
    const fretSpacing = boardW / toFret;

    let stringSpacing = Math.max(24, Math.min(fretSpacing * 1.32, 56));
    if (maxH) {
      // Never let the board overflow the height it has been given.
      const room = maxH - topOffset - numberGap - 10;
      stringSpacing = Math.max(20, Math.min(stringSpacing, room / 5));
    }
    const boardH = stringSpacing * 5;

    return {
      toFret, padX, labelGap, openGap, numberGap, topOffset, boardH,
      canvasH: topOffset + boardH + numberGap + 8,
    };
  }

  // In the larger view the board takes over the screen. If the phone is
  // still held upright we rotate the stage a quarter turn, so physically
  // turning the device presents the board upright and full width.
  function stageSize() {
    if (!landscape) {
      const wrap = canvas.closest(".canvas-wrap");
      const cs = window.getComputedStyle(wrap);
      const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      return { w: Math.max(wrap.getBoundingClientRect().width - padX, 280), h: null };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return rotated ? { w: vh - 16, h: vw - 16 } : { w: vw - 16, h: vh - 16 };
  }

  function resizeCanvas() {
    const size = stageSize();
    const g = boardGeometry(size.w, size.h);
    const dpr = window.devicePixelRatio || 1;
    const cssW = size.w;
    const cssH = size.h ? Math.min(g.canvasH, size.h) : g.canvasH;

=======
  function resizeCanvas() {
    const parent = canvas.parentElement;
    const cs = window.getComputedStyle(parent);
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
<<<<<<< HEAD

    if (stage) {
      // The rotated stage needs explicit dimensions, since a rotation
      // transform doesn't affect how much room the element reserves.
      stage.style.width = landscape ? cssW + "px" : "";
      stage.style.height = landscape ? cssH + "px" : "";
    }
  }

  // Every position on the neck that belongs to the current scale.
  function buildMarkers(t) {
    const markers = [];
    for (let s = 0; s < 6; s++) {
      for (let f = 0; f <= FRET_COUNT; f++) {
        const pc = (OPEN_STRINGS[s] + f) % 12;
        if (!scalePcs.has(pc)) continue;
        const isRoot = pc === rootPc;
        markers.push({
          string: s,
          fret: f,
          fill: isRoot ? t.accent : t.dotFill,
          border: isRoot ? t.accentSoft : null,
          text: showNames ? pcToName[pc] : "",
          textColor: isRoot ? "#14110c" : t.boardBg,
        });
      }
    }
    return markers;
=======
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38
  }

  function draw() {
    if (!ctx) return;
    const t = ThemeManager.get();
<<<<<<< HEAD
    const w = canvas.clientWidth || 900;
    const h = canvas.clientHeight || 300;
    ctx.clearRect(0, 0, w, h);

    const g = boardGeometry(w, canvas.clientHeight || null);
    BoardRenderer.drawSection(ctx, t, {
      x: g.padX,
      y: g.topOffset,
      w: w - g.padX * 2,
      h: g.boardH + g.numberGap,
      fromFret: 1,
      toFret: g.toFret,
      showOpen: true,
      markers: buildMarkers(t),
      labelGap: g.labelGap,
      openGap: g.openGap,
      numberGap: g.numberGap,
    });
=======
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 300;
    ctx.clearRect(0, 0, w, h);

    // Extra room on the left for open-string markers sitting before the nut.
    const padLeft = 78;
    const padRight = 34;
    const padTop = 34;
    const padBottom = 46;
    const boardX = padLeft;
    const boardY = padTop;
    const boardW = Math.max(120, w - padLeft - padRight);
    const boardH = Math.max(90, h - padTop - padBottom);
    const fretSpacing = boardW / FRET_COUNT;
    const stringSpacing = boardH / 5;

    ctx.fillStyle = t.boardBg;
    ctx.fillRect(boardX, boardY, boardW, boardH);

    // Inlays under the strings
    ctx.fillStyle = "rgba(90, 74, 42, 0.22)";
    const inlayR = Math.min(stringSpacing * 0.3, fretSpacing * 0.3);
    SINGLE_INLAYS.forEach((f) => {
      if (f > FRET_COUNT) return;
      ctx.beginPath();
      ctx.arc(boardX + (f - 0.5) * fretSpacing, boardY + boardH / 2, inlayR, 0, Math.PI * 2);
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

    // Frets
    for (let f = 0; f <= FRET_COUNT; f++) {
      const x = boardX + f * fretSpacing;
      ctx.beginPath();
      ctx.moveTo(x, boardY);
      ctx.lineTo(x, boardY + boardH);
      ctx.strokeStyle = f === 0 ? t.nut : t.fret;
      ctx.lineWidth = f === 0 ? 6 : 1.2;
      ctx.stroke();
    }

    // Strings
    for (let s = 0; s < 6; s++) {
      const y = boardY + (5 - s) * stringSpacing;
      ctx.beginPath();
      ctx.moveTo(boardX, y);
      ctx.lineTo(boardX + boardW, y);
      ctx.strokeStyle = t.string;
      ctx.lineWidth = Math.max(1, 1 + s * 0.45);
      ctx.stroke();
    }

    // String labels
    ctx.font = '600 13px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = t.fretNumFg;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let s = 0; s < 6; s++) {
      ctx.fillText(STRING_LABELS[s], boardX - 58, boardY + (5 - s) * stringSpacing);
    }

    // Fret numbers
    ctx.font = '600 11px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    NUMBERED_FRETS.forEach((f) => {
      if (f > FRET_COUNT) return;
      ctx.fillText(String(f), boardX + (f - 0.5) * fretSpacing, boardY + boardH + 20);
    });

    // Scale tones. Fret 0 (open strings) is drawn just left of the nut.
    const r = Math.min(stringSpacing * 0.44, fretSpacing * 0.44, 17);
    for (let s = 0; s < 6; s++) {
      const y = boardY + (5 - s) * stringSpacing;
      for (let f = 0; f <= FRET_COUNT; f++) {
        const pc = (OPEN_STRINGS[s] + f) % 12;
        if (!scalePcs.has(pc)) continue;

        const x = f === 0 ? boardX - 22 : boardX + (f - 0.5) * fretSpacing;
        const isRoot = pc === rootPc;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = isRoot ? t.accent : t.dotFill;
        ctx.fill();
        if (isRoot) {
          ctx.strokeStyle = t.accentSoft;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        if (showNames) {
          ctx.fillStyle = isRoot ? "#14110c" : t.boardBg;
          ctx.font = `${isRoot ? 700 : 600} ${Math.max(9, Math.round(r * 0.72))}px "Inter", system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(pcToName[pc], x, y + 1);
        }
      }
    }
>>>>>>> e0860475326020fc5dbaffefdb6ba8025a631c38

    updateCaption();
  }

  function updateCaption() {
    if (!scaleNotesEl) return;
    const def = SCALE_TYPES[scaleType];
    const names = spelled.map((n) => n.name).join("  ");
    scaleNotesEl.innerHTML =
      `<span class="scale-name">${root} ${def.label.toLowerCase()}</span>` +
      `<span class="scale-note-list">${names}</span>`;
  }

  return { init, onActivate, onDeactivate };
})();
