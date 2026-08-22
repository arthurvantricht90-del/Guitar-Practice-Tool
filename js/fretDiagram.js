// Shared chord/triad diagram renderer, used by both the Chord Trainer and
// the Triad Trainer. Draws a single rotated fretboard diagram inside a card.
//
// Fret strings are the same 6-value format used throughout the app, e.g.
// "x, 3, 2, 0, 1, 0" — low E first, "x" for a muted string. Diagrams are
// drawn 90 degrees counterclockwise (nut on the left, strings horizontal),
// with all text counter-rotated so it stays upright.

const FretDiagram = (() => {
  // Fraction of the card the diagram grid occupies. Raised from the
  // original 0.52 now that options live in a drawer and cards have room.
  const DIAGRAM_FILL = 0.66;

  // Height reserved at the bottom of each card for its name.
  const LABEL_AREA = 46;

  // Works out how to lay out `n` diagram cards in a canvas `cw` wide.
  // On a narrow screen four cards side by side would each be a few dozen
  // pixels across, so instead we cap how thin a card may get and wrap the
  // rest onto additional rows. The canvas height follows from the result.
  function computeLayout(cw, n) {
    const pad = 14;
    const gap = 10;
    // Keep this low enough that a phone still fits two cards per row —
    // going wider forces a single column and a lot of scrolling. The size
    // increase comes from DIAGRAM_FILL and the taller card instead.
    const minCardW = 152;
    const avail = Math.max(cw - pad * 2, 100);

    let cols = Math.floor((avail + gap) / (minCardW + gap));
    cols = Math.max(1, Math.min(n || 1, cols));
    const rows = Math.ceil((n || 1) / cols);

    const cardW = (avail - gap * (cols - 1)) / cols;
    const diagramH = Math.max(175, Math.min(cardW * 0.86, 430));
    const cardH = diagramH + LABEL_AREA;
    const canvasH = pad * 2 + rows * cardH + gap * (rows - 1);

    return { pad, gap, cols, rows, cardW, cardH, diagramH, labelArea: LABEL_AREA, canvasH };
  }

  // Draws a card's name in the space reserved at its bottom, wrapping onto
  // a second line when the name is too long for the card width.
  function drawCardLabel(ctx, t, text, x, y, w, revealed) {
    ctx.save();
    ctx.font = `${revealed ? 700 : 400} 13px "Fraunces", Georgia, serif`;
    ctx.fillStyle = revealed ? t.labelLit : t.labelDim;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxW = w - 16;
    const words = String(text).split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const attempt = line ? `${line} ${word}` : word;
      if (ctx.measureText(attempt).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = attempt;
      }
    });
    if (line) lines.push(line);

    const shown = lines.slice(0, 2);
    const lineH = 16;
    const startY = y - ((shown.length - 1) * lineH) / 2;
    shown.forEach((ln, i) => {
      ctx.fillText(ln, x + w / 2, startY + i * lineH);
    });
    ctx.restore();
  }
function drawCard(ctx, t, x1, y1, x2, y2, r = 12) {
  roundedRectPath(ctx, x1, y1, x2 - x1, y2 - y1, r);
  ctx.fillStyle = t.cardBg;
  ctx.fill();
  ctx.strokeStyle = t.cardBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawChordDiagramCore(ctx, t, chordStr, xOffset, yOffset, cardW, cardH) {
  const frets = chordStr.split(", ");
  const numeric = frets.filter((f) => f !== "x").map((f) => parseInt(f, 10));
  if (numeric.length === 0) return;
  const lowest = Math.min(...numeric);

  const usableW = cardW * DIAGRAM_FILL;
  const usableH = cardH * DIAGRAM_FILL;

  // Real fretboards are taller than they are wide. Size the diagram from
  // the card's height first (so wide, low-count cards don't stretch the
  // diagram out horizontally) and only fall back to width-driven sizing
  // if the card is too narrow to fit that at all.
  const STRING_TO_FRET_RATIO = 0.62;
  let fretSpacing = usableH / 4;
  let stringSpacing = fretSpacing * STRING_TO_FRET_RATIO;
  if (stringSpacing * 5 > usableW) {
    stringSpacing = usableW / 5;
    fretSpacing = stringSpacing / STRING_TO_FRET_RATIO;
  }
  const gridW = stringSpacing * 5;
  const gridH = fretSpacing * 4;

  const dotR = Math.max(4, stringSpacing * 0.3);
  const openR = Math.max(3, stringSpacing * 0.24);
  const nutWidth = Math.max(2, fretSpacing * 0.07);
  const fretNumSz = Math.max(11, Math.floor(fretSpacing * 0.26));
  const markerSz = Math.max(13, Math.floor(stringSpacing * 0.55));
  const fretNumMargin = fretNumSz * 2.2;
  const markerGap = Math.max(openR * 2 + 6, markerSz * 0.95);

  // Reserve space above the grid for the mute-x / open-string markers,
  // and now also center that whole block within the local box (this axis
  // becomes the FINAL horizontal axis once rotated, so centering here is
  // what centers the diagram left-to-right in the finished image).
  const topPad = markerGap + 4;
  const contentH = topPad + gridH;
  const bx = xOffset + (cardW - fretNumMargin - gridW) / 2 + fretNumMargin;
  const by = yOffset + (cardH - contentH) / 2 + topPad;

  // Draws text upright regardless of the -90° rotation the whole diagram
  // is being drawn under, by applying a local +90° counter-rotation
  // around the given anchor point before drawing.
  function fillUprightText(text, localX, localY, font, fillStyle, textAlign, textBaseline) {
    ctx.save();
    ctx.translate(localX, localY);
    ctx.rotate(Math.PI / 2);
    ctx.font = font;
    ctx.fillStyle = fillStyle;
    ctx.textAlign = textAlign || "center";
    ctx.textBaseline = textBaseline || "middle";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  ctx.fillStyle = t.boardBg;
  ctx.fillRect(bx, by, gridW, gridH);

  // Frets (horizontal lines)
  for (let i = 0; i < 5; i++) {
    const y = by + i * fretSpacing;
    ctx.beginPath();
    ctx.moveTo(bx, y);
    ctx.lineTo(bx + gridW, y);
    ctx.strokeStyle = i === 0 ? t.nut : t.fret;
    ctx.lineWidth = i === 0 ? nutWidth : Math.max(1, nutWidth * 0.4);
    ctx.stroke();
  }

  // Strings (vertical lines)
  for (let i = 0; i < 6; i++) {
    const x = bx + i * stringSpacing;
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.lineTo(x, by + gridH);
    ctx.strokeStyle = t.string;
    ctx.lineWidth = Math.max(1, Math.round(1 + (5 - i) * 0.2));
    ctx.stroke();
  }

  // String names along the outer left edge of the finished (rotated)
  // image. Fret-data index 0 lands at the bottom after rotation and
  // index 5 at the top, and the standard tuning low-to-high (E A D G B E)
  // reads bottom to top here, so the label list maps straight to index i.
  const STRING_NAMES = ["E", "A", "D", "G", "B", "E"];
  const labelFont = `600 ${fretNumSz}px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace`;
  const labelLocalY = by - markerGap - fretNumSz * 1.4;
  for (let i = 0; i < 6; i++) {
    const x = bx + i * stringSpacing;
    fillUprightText(STRING_NAMES[i], x, labelLocalY, labelFont, t.fretNumFg, "center", "middle");
  }

  if (lowest > 0) {
    fillUprightText(
      String(lowest),
      bx - fretNumSz * 1.9,
      by + fretSpacing * 0.5,
      labelFont,
      t.fretNumFg,
      "center",
      "middle"
    );
  }

  frets.forEach((fret, si) => {
    const x = bx + si * stringSpacing;
    if (fret === "x") {
      const muteFont = `bold ${markerSz}px Helvetica, Arial, sans-serif`;
      fillUprightText("✕", x, by - markerGap / 2, muteFont, t.muted, "center", "middle");
    } else {
      const fn = parseInt(fret, 10);
      if (fn === 0) {
        const cy = by - markerGap + 1 + openR;
        ctx.beginPath();
        ctx.arc(x, cy, openR, 0, Math.PI * 2);
        ctx.fillStyle = t.boardBg;
        ctx.fill();
        ctx.strokeStyle = t.openStroke;
        ctx.lineWidth = Math.max(1, openR * 0.25);
        ctx.stroke();
      } else {
        const row = fn - lowest;
        const y = by + row * fretSpacing + fretSpacing / 2;
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = t.dotFill;
        ctx.fill();
      }
    }
  });
}

// Public entry point: spins the diagram 90° counterclockwise ("to the
// left") around the card's center. The core routine is asked to lay
// itself out in a box with width/height swapped, so that once physically
// rotated its footprint lands back on the original card at the same
// relative proportions instead of being stretched or clipped.
function drawChordDiagram(ctx, t, chordStr, xOffset, yOffset, cardW, cardH) {
  ctx.save();
  ctx.translate(xOffset + cardW / 2, yOffset + cardH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.translate(-cardH / 2, -cardW / 2);
  drawChordDiagramCore(ctx, t, chordStr, 0, 0, cardH, cardW);
  ctx.restore();
}


  return { drawCard, drawChordDiagram, computeLayout, drawCardLabel };
})();
