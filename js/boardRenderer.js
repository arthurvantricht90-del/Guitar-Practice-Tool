// Shared horizontal fretboard renderer, used by the Fretboard Trainer and
// the Scale Trainer.
//
// The key capability here is drawing an arbitrary fret *range* rather than
// always the whole neck. On a phone a 24-fret board can't be legible at
// screen width, so instead of scrolling sideways the callers draw two
// stacked sections (1-12 and 13-24) and the whole neck is visible at once.

const BoardRenderer = (() => {
  const STRING_LABELS = ["E", "A", "D", "G", "B", "E"];
  const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
  const DOUBLE_INLAYS = [12, 24];
  const NUMBERED_FRETS = [1, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

  // opts: { x, y, w, h, fromFret, toFret, showOpen, markers }
  // markers: [{ string, fret, fill, border, text, textColor, scale }]
  //   fret 0 means an open-string marker, drawn before the nut.
  function drawSection(ctx, t, opts) {
    const { x, y, w, h, fromFret, toFret } = opts;
    const showOpen = !!opts.showOpen;
    const markers = opts.markers || [];

    const labelGap = opts.labelGap != null ? opts.labelGap : 22;
    const openGap = showOpen ? (opts.openGap != null ? opts.openGap : 34) : 6;
    const numberGap = opts.numberGap != null ? opts.numberGap : 38;

    const boardX = x + labelGap + openGap;
    const boardY = y;
    const boardW = Math.max(80, w - labelGap - openGap - 6);
    const boardH = Math.max(70, h - numberGap);

    const cols = toFret - fromFret + 1;
    const fretSpacing = boardW / cols;
    const stringSpacing = boardH / 5;
    const hasNut = fromFret <= 1;

    const fretX = (f) => boardX + (f - fromFret + 1) * fretSpacing;
    const slotX = (f) => boardX + (f - fromFret + 0.5) * fretSpacing;
    const stringY = (s) => boardY + (5 - s) * stringSpacing;

    // Board face
    ctx.fillStyle = t.boardBg;
    ctx.fillRect(boardX, boardY, boardW, boardH);

    // Inlays, under the strings
    ctx.fillStyle = "rgba(90, 74, 42, 0.22)";
    const inlayR = Math.min(stringSpacing * 0.3, fretSpacing * 0.3);
    SINGLE_INLAYS.forEach((f) => {
      if (f < fromFret || f > toFret) return;
      ctx.beginPath();
      ctx.arc(slotX(f), boardY + boardH / 2, inlayR, 0, Math.PI * 2);
      ctx.fill();
    });
    DOUBLE_INLAYS.forEach((f) => {
      if (f < fromFret || f > toFret) return;
      [boardY + boardH * 0.3, boardY + boardH * 0.7].forEach((cy) => {
        ctx.beginPath();
        ctx.arc(slotX(f), cy, inlayR, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Fret wires. The left edge is the nut only when the section starts at
    // the top of the neck; otherwise it's an ordinary fret.
    ctx.beginPath();
    ctx.moveTo(boardX, boardY);
    ctx.lineTo(boardX, boardY + boardH);
    ctx.strokeStyle = hasNut ? t.nut : t.fret;
    ctx.lineWidth = hasNut ? 6 : 1.2;
    ctx.stroke();

    for (let f = fromFret; f <= toFret; f++) {
      ctx.beginPath();
      ctx.moveTo(fretX(f), boardY);
      ctx.lineTo(fretX(f), boardY + boardH);
      ctx.strokeStyle = t.fret;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Strings, thickest at the bottom (low E)
    for (let s = 0; s < 6; s++) {
      const yy = stringY(s);
      ctx.beginPath();
      ctx.moveTo(boardX, yy);
      ctx.lineTo(boardX + boardW, yy);
      ctx.strokeStyle = t.string;
      ctx.lineWidth = Math.max(1, 1 + s * 0.45);
      ctx.stroke();
    }

    // String names
    ctx.font = '600 11px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = t.fretNumFg;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let s = 0; s < 6; s++) {
      ctx.fillText(STRING_LABELS[s], x + labelGap - 6, stringY(s));
    }

    // Fret numbers
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const numbers = NUMBERED_FRETS.filter((f) => f >= fromFret && f <= toFret);
    if (fromFret > 1 && !numbers.includes(fromFret)) numbers.unshift(fromFret);
    if (!numbers.includes(toFret)) numbers.push(toFret);
    numbers.forEach((f) => {
      ctx.fillText(String(f), slotX(f), boardY + boardH + Math.max(20, numberGap - 15));
    });

    // Markers
    const baseR = Math.min(stringSpacing * 0.44, fretSpacing * 0.43, 17);
    markers.forEach((m) => {
      if (m.fret !== 0 && (m.fret < fromFret || m.fret > toFret)) return;
      if (m.fret === 0 && !showOpen) return;

      const mx = m.fret === 0 ? boardX - openGap * 0.55 : slotX(m.fret);
      const my = stringY(m.string);
      const r = baseR * (m.scale || 1);

      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fillStyle = m.fill || t.dotFill;
      ctx.fill();
      if (m.border) {
        ctx.strokeStyle = m.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      if (m.text) {
        ctx.fillStyle = m.textColor || t.boardBg;
        ctx.font = `700 ${Math.max(9, Math.round(r * 0.74))}px "Inter", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(m.text, mx, my + 1);
      }
    });
  }

  // Works out whether to draw one full-width board or two stacked halves,
  // and how tall the canvas needs to be either way.
  function computeBoardLayout(cssW, opts) {
    const split = cssW < (opts && opts.splitBelow ? opts.splitBelow : 760);
    const sectionH = split ? 168 : 300;
    const gap = split ? 18 : 0;
    const sections = split ? 2 : 1;
    return {
      split,
      sectionH,
      gap,
      canvasH: sectionH * sections + gap * (sections - 1),
    };
  }

  return { drawSection, computeBoardLayout };
})();
