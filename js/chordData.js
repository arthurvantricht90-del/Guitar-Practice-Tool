// Ported from chord_library.py + the transposition/random-pick logic
// that used to live at the top of the tkinter script.

const CHORDS = {
  A: {
    "A shape": {
      major: ["x, 0, 2, 2, 2, 0"],
      minor: ["x, 0, 2, 2, 1, 0"],
      "major seven": ["x, 0, 2, 1, 2, 0"],
      "minor seven": ["x, 0, 2, 0, 1, 0"],
    },
  },
  C: {
    "C shape": {
      major: ["x, 3, 2, 0, 1, 0"],
      minor: ["x, 3, 1, 0, 1, x"],
      "major seven": ["x, 3, 2, 0, 0, 0"],
      "minor seven": ["x, 3, 1, 3, 1, x"],
    },
  },
  E: {
    "E shape": {
      major: ["0, 2, 2, 1, 0, 0"],
      minor: ["0, 2, 2, 0, 0, 0"],
      "major seven": ["0, x, 1, 1, 0, x"],
      "minor seven": ["0, 2, 0, 0, 0, 0"],
    },
  },
  D: {
    "D shape": {
      major: ["x, x, 0, 2, 3, 2"],
      minor: ["x, x, 0, 2, 3, 1"],
      "major seven": ["x, x, 0, 2, 2, 2"],
      "minor seven": ["x, x, 0, 2, 1, 1"],
    },
  },
  G: {
    "G shape": {
      major: ["3, 2, 0, 0, 0, 3"],
      minor: ["3, 1, 0, 0, x, 3"],
      "major seven": ["3, 2, 0, 0, 0, 2"],
      "minor seven": ["3, 1, 0, 0, x, 1"],
    },
  },
};

function addTransposedChords(chords, rootChord, shape, newRootsWithTranspose) {
  if (!chords[rootChord] || !chords[rootChord][shape]) {
    throw new Error(`Root chord '${rootChord}' or shape '${shape}' not found.`);
  }
  const qualities = chords[rootChord][shape];
  for (const quality of Object.keys(qualities)) {
    const originalList = qualities[quality][0].split(", ");
    for (const [newRoot, transposeBy] of newRootsWithTranspose) {
      const transposed = originalList.map((f) =>
        f === "x" ? "x" : String(parseInt(f, 10) + transposeBy)
      );
      const s = transposed.join(", ");
      chords[newRoot] = chords[newRoot] || {};
      chords[newRoot][shape] = chords[newRoot][shape] || {};
      chords[newRoot][shape][quality] = chords[newRoot][shape][quality] || [];
      chords[newRoot][shape][quality].push(s);
    }
  }
}

addTransposedChords(CHORDS, "A", "A shape", [["B", 2], ["C", 3], ["D", 5], ["E", 7], ["F", 8], ["G", 10], ["A", 12]]);
addTransposedChords(CHORDS, "C", "C shape", [["D", 2], ["E", 4], ["F", 5], ["G", 7], ["A", 9], ["B", 11], ["C", 12]]);
addTransposedChords(CHORDS, "E", "E shape", [["F", 1], ["G", 3], ["A", 5], ["B", 7], ["C", 8], ["D", 10], ["E", 12]]);
addTransposedChords(CHORDS, "D", "D shape", [["E", 2], ["F", 3], ["G", 5], ["A", 7], ["B", 9], ["C", 10], ["D", 12]]);
addTransposedChords(CHORDS, "G", "G shape", [["A", 2], ["B", 4], ["C", 5], ["D", 7], ["E", 9], ["F", 10], ["G", 12]]);

// The four chord qualities present in the data, in display order.
const CHORD_QUALITIES = ["major", "minor", "major seven", "minor seven"];

// Builds the full list of playable chords, optionally restricted to a set
// of qualities. Shapes that are entirely muted ("x, x, x, x, x, x") are
// skipped here rather than being filtered by a retry loop at pick time —
// several qualities (e.g. minor) have no playable shape for some roots, so
// a retry loop could spin forever once filtering is applied.
function buildChordPool(allowedQualities, excludedShapes) {
  const allowed = allowedQualities && allowedQualities.length ? allowedQualities : CHORD_QUALITIES;
  const excluded = excludedShapes || [];
  const pool = [];
  for (const name of Object.keys(CHORDS)) {
    const shapes = CHORDS[name];
    for (const shape of Object.keys(shapes)) {
      if (excluded.includes(shape)) continue;
      const variants = shapes[shape];
      for (const quality of Object.keys(variants)) {
        if (!allowed.includes(quality)) continue;
        const chord = variants[quality][0];
        if (!chord || chord === "x, x, x, x, x, x") continue;
        pool.push({ label: `${name} ${quality} (${shape})`, frets: chord });
      }
    }
  }
  return pool;
}

function pickRandomChords(n, allowedQualities, excludedShapes) {
  const pool = buildChordPool(allowedQualities, excludedShapes);
  if (!pool.length) return [];
  return Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]);
}
