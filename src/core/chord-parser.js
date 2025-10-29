/**
 * Lightweight Chord Notation Parser
 * Parses chord notation strings like "Cmaj7", "E♭13b9#11", "F#dim" into root and quality
 */

/**
 * Note name to pitch class mapping
 */
const NOTE_TO_PC = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11
};

/**
 * Chord quality patterns (ordered by specificity - longer patterns first)
 */
const QUALITY_PATTERNS = [
  // Extended altered chords
  { regex: /^13b9#11$/, quality: 'dom13' }, // Custom handling needed for alterations
  { regex: /^13#11$/, quality: 'dom13' },
  { regex: /^13b9$/, quality: 'dom13' },

  // Altered dominants
  { regex: /^7alt$|^alt7$|^altered$/, quality: 'alt7' },
  { regex: /^7#5#9$/, quality: '7#5#9' },
  { regex: /^7#5b9$/, quality: '7#5b9' },
  { regex: /^7b5#9$/, quality: '7b5#9' },
  { regex: /^7b5b9$/, quality: '7b5b9' },
  { regex: /^7#5$/, quality: '7#5' },
  { regex: /^7b5$/, quality: '7b5' },
  { regex: /^7#9$/, quality: 'dom7#9' },
  { regex: /^7b9$/, quality: 'dom7b9' },

  // 13th chords
  { regex: /^maj7#11b13$|^M7#11b13$|^Δ7#11b13$/, quality: 'maj7#11b13' },
  { regex: /^13$|^dom13$/, quality: 'dom13' },
  { regex: /^maj13$|^M13$|^Δ13$/, quality: 'maj13' },
  { regex: /^m13$|^min13$|^-13$/, quality: 'min13' },
  { regex: /^7b13$/, quality: 'dom7b13' },

  // 11th chords
  { regex: /^maj7#11$|^M7#11$|^Δ7#11$/, quality: 'maj7#11' },
  { regex: /^7#11$/, quality: 'dom7#11' },
  { regex: /^m11b5$|^min11b5$|^-11b5$/, quality: 'min11b5' },
  { regex: /^11$|^dom11$/, quality: 'dom11' },
  { regex: /^maj11$|^M11$|^Δ11$/, quality: 'maj11' },
  { regex: /^m11$|^min11$|^-11$/, quality: 'min11' },

  // 9th chords
  { regex: /^maj7#9$|^M7#9$|^Δ7#9$/, quality: 'maj7#9' },
  { regex: /^m7b9$|^min7b9$|^-7b9$/, quality: 'min7b9' },
  { regex: /^9$|^dom9$/, quality: 'dom9' },
  { regex: /^maj9$|^M9$|^Δ9$/, quality: 'maj9' },
  { regex: /^m9$|^min9$|^-9$/, quality: 'min9' },
  { regex: /^aug9$|^\+9$/, quality: 'aug9' },
  { regex: /^dim9$|^o9$/, quality: 'dim9' },

  // 7th chords
  { regex: /^maj7$|^M7$|^Δ7$|^Δ$/, quality: 'maj7' },
  { regex: /^m7$|^min7$|^-7$/, quality: 'min7' },
  { regex: /^7$|^dom7$/, quality: 'dom7' },
  { regex: /^dim7$|^o7$|^°7$/, quality: 'dim7' },
  { regex: /^m7b5$|^ø7$|^ø$|^hdim7$/, quality: 'hdim7' },
  { regex: /^mM7$|^m\(maj7\)$|^minmaj7$|^-M7$/, quality: 'minmaj7' },
  { regex: /^aug7$|^\+7$/, quality: 'aug7' },
  { regex: /^augmaj7$|^\+M7$|^\+maj7$/, quality: 'augmaj7' },
  { regex: /^7sus4$/, quality: '7sus4' },
  { regex: /^7sus2$/, quality: '7sus2' },
  { regex: /^dimM7$|^oM7$/, quality: 'dimmaj7' },

  // 6th chords
  { regex: /^6\/9$|^6add9$/, quality: '6/9' },
  { regex: /^m6\/9$|^min6\/9$|^-6\/9$/, quality: 'min6/9' },
  { regex: /^6$/, quality: '6' },
  { regex: /^m6$|^min6$|^-6$/, quality: 'min6' },

  // Add chords
  { regex: /^add2$/, quality: 'add2' },
  { regex: /^add9$/, quality: 'add9' },
  { regex: /^add4$/, quality: 'add4' },
  { regex: /^madd9$|^minadd9$|^-add9$/, quality: 'minadd9' },

  // Suspended
  { regex: /^sus2$/, quality: 'sus2' },
  { regex: /^sus4$|^sus$/, quality: 'sus4' },

  // Triads
  { regex: /^maj$|^M$|^major$/, quality: 'major' },
  { regex: /^m$|^min$|^minor$|^-$/, quality: 'minor' },
  { regex: /^dim$|^o$|^°$/, quality: 'dim' },
  { regex: /^aug$|^\+$/, quality: 'aug' },
  { regex: /^5$/, quality: '5' },

  // Special voicings
  { regex: /^quartal$/, quality: 'quartal' },
  { regex: /^quartal4$/, quality: 'quartal4' },
  { regex: /^quintal$/, quality: 'quintal' },
  { regex: /^sowhat$/, quality: 'sowhat' },
];

/**
 * Parse chord notation string into root PC and quality
 * @param {string} notation - Chord notation (e.g., "Cmaj7", "E♭13b9#11")
 * @returns {{rootPC: number, quality: string} | null} Parsed chord or null
 */
export function parseChordNotation(notation) {
  if (!notation || typeof notation !== 'string') {
    return null;
  }

  // Trim and normalize
  notation = notation.trim();
  if (notation.length === 0) {
    return null;
  }

  // Extract root note (1-2 characters at start)
  let rootStr = '';
  let qualityStr = '';

  // Try 2-character root first (e.g., "C#", "Bb", "E♭")
  if (notation.length >= 2) {
    const twoChar = notation.substring(0, 2);
    if (NOTE_TO_PC.hasOwnProperty(twoChar)) {
      rootStr = twoChar;
      qualityStr = notation.substring(2);
    }
  }

  // If not found, try 1-character root
  if (!rootStr && notation.length >= 1) {
    const oneChar = notation.substring(0, 1);
    if (NOTE_TO_PC.hasOwnProperty(oneChar)) {
      rootStr = oneChar;
      qualityStr = notation.substring(1);
    }
  }

  // No valid root found
  if (!rootStr) {
    return null;
  }

  const rootPC = NOTE_TO_PC[rootStr];

  // If no quality string, assume major triad
  if (qualityStr.length === 0) {
    return { rootPC, quality: 'major' };
  }

  // Match quality pattern
  for (const { regex, quality } of QUALITY_PATTERNS) {
    if (regex.test(qualityStr)) {
      return { rootPC, quality };
    }
  }

  // No match found
  return null;
}

/**
 * Validate chord notation
 * @param {string} notation - Chord notation to validate
 * @returns {boolean} True if valid
 */
export function isValidChordNotation(notation) {
  return parseChordNotation(notation) !== null;
}
