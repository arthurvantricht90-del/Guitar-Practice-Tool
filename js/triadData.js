// Triad voicings, generated rather than hand-listed.
//
// A triad is three notes (root, third, fifth), so on guitar it's played on a
// set of three adjacent strings. For each root / quality / inversion /
// string-set combination we find the most compact playable shape where the
// three voices ascend in pitch and the required chord tone sits in the bass.
//
// Inversion is defined by which chord tone is lowest:
//   root position  -> root in the bass
//   1st inversion  -> third in the bass
//   2nd inversion  -> fifth in the bass

const TRIAD_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// MIDI numbers for the open strings, index 0 = low E.
const TRIAD_OPEN_MIDI = [40, 45, 50, 55, 59, 64];

// String sets, named high-string-first the way they're usually referred to.
const TRIAD_STRING_SETS = [
  { strings: [3, 4, 5], name: "E-B-G" },  // highest three
  { strings: [2, 3, 4], name: "B-G-D" },
  { strings: [1, 2, 3], name: "G-D-A" },
  { strings: [0, 1, 2], name: "D-A-E" },  // lowest three
];

const TRIAD_QUALITIES = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
};

// Order of chord tones from lowest voice to highest, as indices into the
// quality's interval list.
const TRIAD_INVERSIONS = {
  "root position": [0, 1, 2],
  "1st inversion": [1, 2, 0],
  "2nd inversion": [2, 0, 1],
};

const TRIAD_QUALITY_LIST = Object.keys(TRIAD_QUALITIES);
const TRIAD_INVERSION_LIST = Object.keys(TRIAD_INVERSIONS);
const TRIAD_STRING_SET_LIST = TRIAD_STRING_SETS.map((s) => s.name);

const TRIAD_MAX_SPAN = 4;  // widest comfortable fret stretch
const TRIAD_MAX_FRET = 14;

function buildAllTriads() {
  const all = [];
  const seen = new Set();

  for (let rootPc = 0; rootPc < 12; rootPc++) {
    for (const quality of TRIAD_QUALITY_LIST) {
      const intervals = TRIAD_QUALITIES[quality];
      const tonePcs = intervals.map((i) => (rootPc + i) % 12);

      for (const inversion of TRIAD_INVERSION_LIST) {
        const voicePcs = TRIAD_INVERSIONS[inversion].map((i) => tonePcs[i]);

        for (const set of TRIAD_STRING_SETS) {
          const [sA, sB, sC] = set.strings;

          for (let f0 = 0; f0 <= TRIAD_MAX_FRET; f0++) {
            const m0 = TRIAD_OPEN_MIDI[sA] + f0;
            if (m0 % 12 !== voicePcs[0]) continue;

            // Each higher voice takes the lowest fret that both matches its
            // pitch class and stays above the voice below it.
            let f1 = -1, m1 = -1;
            for (let f = 0; f <= TRIAD_MAX_FRET; f++) {
              const m = TRIAD_OPEN_MIDI[sB] + f;
              if (m % 12 === voicePcs[1] && m > m0) { f1 = f; m1 = m; break; }
            }
            if (f1 < 0) continue;

            let f2 = -1;
            for (let f = 0; f <= TRIAD_MAX_FRET; f++) {
              const m = TRIAD_OPEN_MIDI[sC] + f;
              if (m % 12 === voicePcs[2] && m > m1) { f2 = f; break; }
            }
            if (f2 < 0) continue;

            const used = [f0, f1, f2];
            if (Math.max(...used) - Math.min(...used) > TRIAD_MAX_SPAN) continue;
            if (Math.max(...used) > TRIAD_MAX_FRET) continue;

            const frets = ["x", "x", "x", "x", "x", "x"];
            set.strings.forEach((s, i) => { frets[s] = String(used[i]); });
            const fretStr = frets.join(", ");

            const key = `${fretStr}|${rootPc}|${quality}|${inversion}`;
            if (seen.has(key)) continue;
            seen.add(key);

            const root = TRIAD_NOTE_NAMES[rootPc];
            all.push({
              root,
              quality,
              inversion,
              stringSet: set.name,
              frets: fretStr,
              label: `${root} ${quality} — ${inversion}`,
            });
          }
        }
      }
    }
  }
  return all;
}

const ALL_TRIADS = buildAllTriads();

function buildTriadPool(allowedQualities, allowedInversions, allowedStringSets) {
  const quals = allowedQualities && allowedQualities.length ? allowedQualities : TRIAD_QUALITY_LIST;
  const invs = allowedInversions && allowedInversions.length ? allowedInversions : TRIAD_INVERSION_LIST;
  const sets = allowedStringSets && allowedStringSets.length ? allowedStringSets : TRIAD_STRING_SET_LIST;
  return ALL_TRIADS.filter(
    (t) => quals.includes(t.quality) && invs.includes(t.inversion) && sets.includes(t.stringSet)
  );
}

function pickRandomTriads(n, allowedQualities, allowedInversions, allowedStringSets) {
  const pool = buildTriadPool(allowedQualities, allowedInversions, allowedStringSets);
  if (!pool.length) return [];
  return Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]);
}
