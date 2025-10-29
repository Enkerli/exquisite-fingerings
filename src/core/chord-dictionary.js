/**
 * Chord Dictionary Module
 * Comprehensive chord quality definitions organized by category
 *
 * Intervals are semitones from root (mod 12 for pitch classes)
 * Extended intervals use >12 to preserve voicing info (e.g., 9th = 14, not 2)
 */

/**
 * Chord quality definitions
 * Each quality maps to semitone intervals from the root
 */
export const CHORD_QUALITIES = {
  // ===== TRIADS (3-note chords) =====
  'major': [0, 4, 7],
  'minor': [0, 3, 7],
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  '5': [0, 7],              // Power chord (no 3rd)

  // ===== 7TH CHORDS (4-note with 7th) =====
  'maj7': [0, 4, 7, 11],
  'min7': [0, 3, 7, 10],
  'dom7': [0, 4, 7, 10],    // Dominant 7th
  'dim7': [0, 3, 6, 9],     // Fully diminished
  'hdim7': [0, 3, 6, 10],   // Half-diminished (m7b5)
  'minmaj7': [0, 3, 7, 11], // Minor-major 7th
  'aug7': [0, 4, 8, 10],    // Augmented 7th
  'augmaj7': [0, 4, 8, 11], // Augmented major 7th
  '7sus4': [0, 5, 7, 10],   // Dominant 7sus4
  '7sus2': [0, 2, 7, 10],   // Dominant 7sus2

  // ===== 6TH CHORDS =====
  '6': [0, 4, 7, 9],        // Major 6th
  'min6': [0, 3, 7, 9],     // Minor 6th
  '6/9': [0, 4, 7, 9, 14],  // 6/9 chord (major)
  'min6/9': [0, 3, 7, 9, 14], // Minor 6/9

  // ===== ADD CHORDS (triads with added note) =====
  'add2': [0, 2, 4, 7],     // Major add2
  'add9': [0, 4, 7, 14],    // Major add9
  'add4': [0, 4, 5, 7],     // Major add4
  'minadd9': [0, 3, 7, 14], // Minor add9

  // ===== 9TH CHORDS =====
  'maj9': [0, 4, 7, 11, 14],     // Major 9th
  'min9': [0, 3, 7, 10, 14],     // Minor 9th
  'dom9': [0, 4, 7, 10, 14],     // Dominant 9th
  'dom7b9': [0, 4, 7, 10, 13],   // Dominant 7b9
  'dom7#9': [0, 4, 7, 10, 15],   // Dominant 7#9 (Hendrix chord)
  'maj7#9': [0, 4, 7, 11, 15],   // Major 7#9
  'min7b9': [0, 3, 7, 10, 13],   // Minor 7b9
  'minadd9': [0, 3, 7, 14],      // Minor add9

  // ===== 11TH CHORDS =====
  'maj11': [0, 4, 7, 11, 14, 17],   // Major 11th
  'min11': [0, 3, 7, 10, 14, 17],   // Minor 11th
  'dom11': [0, 4, 7, 10, 14, 17],   // Dominant 11th
  'maj7#11': [0, 4, 7, 11, 18],     // Major 7#11 (Lydian)
  'dom7#11': [0, 4, 7, 10, 18],     // Dominant 7#11
  'min11b5': [0, 3, 6, 10, 14, 17], // Minor 11b5

  // ===== 13TH CHORDS =====
  'maj13': [0, 4, 7, 11, 14, 21],   // Major 13th
  'min13': [0, 3, 7, 10, 14, 21],   // Minor 13th
  'dom13': [0, 4, 7, 10, 14, 21],   // Dominant 13th
  'dom7b13': [0, 4, 7, 10, 20],     // Dominant 7b13
  'maj7#11b13': [0, 4, 7, 11, 18, 20], // Major 7#11b13

  // ===== ALTERED CHORDS (with b5, #5, b9, #9) =====
  '7b5': [0, 4, 6, 10],      // Dominant 7b5
  '7#5': [0, 4, 8, 10],      // Dominant 7#5 (same as aug7)
  '7b5b9': [0, 4, 6, 10, 13], // Dominant 7b5b9
  '7b5#9': [0, 4, 6, 10, 15], // Dominant 7b5#9
  '7#5b9': [0, 4, 8, 10, 13], // Dominant 7#5b9
  '7#5#9': [0, 4, 8, 10, 15], // Dominant 7#5#9
  'alt7': [0, 4, 6, 10, 13, 15, 20], // Altered dominant (superlocrian)

  // ===== DIMINISHED VARIATIONS =====
  'dimmaj7': [0, 3, 6, 11],   // Diminished major 7th
  'dim9': [0, 3, 6, 9, 14],   // Diminished 9th

  // ===== AUGMENTED VARIATIONS =====
  'aug9': [0, 4, 8, 10, 14],  // Augmented 9th

  // ===== QUARTAL/QUINTAL CHORDS =====
  'quartal': [0, 5, 10],       // Stacked 4ths
  'quartal4': [0, 5, 10, 15],  // Four stacked 4ths
  'quintal': [0, 7, 14],       // Stacked 5ths

  // ===== JAZZ/ROOTLESS VOICINGS =====
  // Shell voicings (3rd + 7th)
  'shell_maj7': [4, 11],       // Major 7 shell
  'shell_min7': [3, 10],       // Minor 7 shell
  'shell_dom7': [4, 10],       // Dom 7 shell

  // Rootless voicings (3rd, 5th/6th, 7th, 9th)
  'rootless_A_maj7': [4, 7, 11, 14],    // A-voicing maj7
  'rootless_A_dom7': [4, 7, 10, 14],    // A-voicing dom7
  'rootless_B_maj7': [7, 11, 14, 16],   // B-voicing maj7 (with 13th)
  'rootless_B_dom7': [7, 10, 13, 16],   // B-voicing dom7 (b9, 13)

  // Upper structure triads
  'upper_maj': [7, 11, 14],    // Major triad upper structure (5, maj7, 9)
  'upper_min': [7, 10, 14],    // Minor triad upper structure (5, min7, 9)

  // ===== SO WHAT CHORD =====
  'sowhat': [0, 5, 10, 14, 19], // So What chord (stacked 4ths)

  // ===== POLYCHORDS =====
  'poly_D_C': [0, 2, 4, 5, 9],  // D/C (D major over C bass)
  'poly_E_C': [0, 4, 7, 11],     // E/C (E major over C bass - Cmaj7)

  // ===== CLUSTERS =====
  'cluster_maj2': [0, 2, 4],     // Major 2nd cluster
  'cluster_min2': [0, 1, 2],     // Minor 2nd cluster (chromatic)
  'cluster_4': [0, 1, 2, 3],     // 4-note chromatic cluster
};

/**
 * Chord categories for UI organization
 */
export const CHORD_CATEGORIES = {
  'triads': {
    name: 'Triads',
    description: 'Basic 3-note chords',
    chords: ['major', 'minor', 'dim', 'aug', 'sus2', 'sus4', '5']
  },
  'sevenths': {
    name: '7th Chords',
    description: '4-note chords with 7th',
    chords: ['maj7', 'min7', 'dom7', 'dim7', 'hdim7', 'minmaj7', 'aug7', 'augmaj7', '7sus4', '7sus2']
  },
  'sixths': {
    name: '6th Chords',
    description: 'Chords with added 6th',
    chords: ['6', 'min6', '6/9', 'min6/9']
  },
  'add': {
    name: 'Add Chords',
    description: 'Triads with added notes',
    chords: ['add2', 'add9', 'add4', 'minadd9']
  },
  'ninths': {
    name: '9th Chords',
    description: 'Extended chords with 9th',
    chords: ['maj9', 'min9', 'dom9', 'dom7b9', 'dom7#9', 'maj7#9', 'min7b9']
  },
  'elevenths': {
    name: '11th Chords',
    description: 'Extended chords with 11th',
    chords: ['maj11', 'min11', 'dom11', 'maj7#11', 'dom7#11', 'min11b5']
  },
  'thirteenths': {
    name: '13th Chords',
    description: 'Extended chords with 13th',
    chords: ['maj13', 'min13', 'dom13', 'dom7b13', 'maj7#11b13']
  },
  'altered': {
    name: 'Altered Chords',
    description: 'Chords with altered 5ths and 9ths',
    chords: ['7b5', '7#5', '7b5b9', '7b5#9', '7#5b9', '7#5#9', 'alt7']
  },
  'diminished': {
    name: 'Diminished Variations',
    description: 'Diminished chord variations',
    chords: ['dim', 'dim7', 'hdim7', 'dimmaj7', 'dim9']
  },
  'augmented': {
    name: 'Augmented Variations',
    description: 'Augmented chord variations',
    chords: ['aug', 'aug7', 'augmaj7', 'aug9']
  },
  'quartal': {
    name: 'Quartal/Quintal',
    description: 'Chords built from 4ths and 5ths',
    chords: ['quartal', 'quartal4', 'quintal', 'sowhat']
  },
  'jazz': {
    name: 'Jazz Voicings',
    description: 'Shell, rootless, and upper structure voicings',
    chords: [
      'shell_maj7', 'shell_min7', 'shell_dom7',
      'rootless_A_maj7', 'rootless_A_dom7', 'rootless_B_maj7', 'rootless_B_dom7',
      'upper_maj', 'upper_min'
    ]
  },
  'poly': {
    name: 'Polychords & Clusters',
    description: 'Multiple triads and dense clusters',
    chords: ['poly_D_C', 'poly_E_C', 'cluster_maj2', 'cluster_min2', 'cluster_4']
  }
};

/**
 * Chord quality display names
 */
export const CHORD_NAMES = {
  // Triads
  'major': 'Major',
  'minor': 'Minor',
  'dim': 'Diminished',
  'aug': 'Augmented',
  'sus2': 'Sus2',
  'sus4': 'Sus4',
  '5': 'Power Chord (5)',

  // 7th Chords
  'maj7': 'Major 7th',
  'min7': 'Minor 7th',
  'dom7': 'Dominant 7th',
  'dim7': 'Diminished 7th',
  'hdim7': 'Half-Diminished 7th',
  'minmaj7': 'Minor-Major 7th',
  'aug7': 'Augmented 7th',
  'augmaj7': 'Augmented Major 7th',
  '7sus4': '7sus4',
  '7sus2': '7sus2',

  // 6th Chords
  '6': 'Major 6th',
  'min6': 'Minor 6th',
  '6/9': '6/9',
  'min6/9': 'Minor 6/9',

  // Add Chords
  'add2': 'Add2',
  'add9': 'Add9',
  'add4': 'Add4',
  'minadd9': 'Minor Add9',

  // 9th Chords
  'maj9': 'Major 9th',
  'min9': 'Minor 9th',
  'dom9': 'Dominant 9th',
  'dom7b9': '7b9',
  'dom7#9': '7#9',
  'maj7#9': 'Major 7#9',
  'min7b9': 'Minor 7b9',

  // 11th Chords
  'maj11': 'Major 11th',
  'min11': 'Minor 11th',
  'dom11': 'Dominant 11th',
  'maj7#11': 'Major 7#11',
  'dom7#11': '7#11',
  'min11b5': 'Minor 11b5',

  // 13th Chords
  'maj13': 'Major 13th',
  'min13': 'Minor 13th',
  'dom13': 'Dominant 13th',
  'dom7b13': '7b13',
  'maj7#11b13': 'Major 7#11b13',

  // Altered
  '7b5': '7b5',
  '7#5': '7#5',
  '7b5b9': '7b5b9',
  '7b5#9': '7b5#9',
  '7#5b9': '7#5b9',
  '7#5#9': '7#5#9',
  'alt7': 'Altered Dominant',

  // Diminished
  'dimmaj7': 'Diminished Major 7th',
  'dim9': 'Diminished 9th',

  // Augmented
  'aug9': 'Augmented 9th',

  // Quartal/Quintal
  'quartal': 'Quartal (3-note)',
  'quartal4': 'Quartal (4-note)',
  'quintal': 'Quintal',

  // Jazz
  'shell_maj7': 'Shell Voicing - Maj7',
  'shell_min7': 'Shell Voicing - Min7',
  'shell_dom7': 'Shell Voicing - Dom7',
  'rootless_A_maj7': 'Rootless A - Maj7',
  'rootless_A_dom7': 'Rootless A - Dom7',
  'rootless_B_maj7': 'Rootless B - Maj7',
  'rootless_B_dom7': 'Rootless B - Dom7',
  'upper_maj': 'Upper Structure - Major',
  'upper_min': 'Upper Structure - Minor',

  // Special
  'sowhat': 'So What Chord',
  'poly_D_C': 'D/C Polychord',
  'poly_E_C': 'E/C Polychord',
  'cluster_maj2': 'Major 2nd Cluster',
  'cluster_min2': 'Minor 2nd Cluster',
  'cluster_4': '4-Note Cluster'
};

/**
 * Note names
 */
export const NOTE_NAMES = [
  'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F',
  'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'
];

/**
 * Get pitch classes for a chord
 * @param {number} rootPC - Root pitch class (0-11)
 * @param {string} quality - Chord quality (e.g., 'dom7')
 * @returns {Array<number>} Array of pitch classes (mod 12)
 */
export function getChordPitchClasses(rootPC, quality) {
  const intervals = CHORD_QUALITIES[quality];
  if (!intervals) {
    throw new Error(`Unknown chord quality: ${quality}`);
  }

  return intervals.map(interval => (rootPC + interval) % 12);
}

/**
 * Get chord display name
 * @param {number} rootPC - Root pitch class (0-11)
 * @param {string} quality - Chord quality
 * @returns {string} Display name (e.g., "C Dominant 7th")
 */
export function getChordName(rootPC, quality) {
  const rootName = NOTE_NAMES[rootPC];
  const qualityName = CHORD_NAMES[quality] || quality;
  return `${rootName} ${qualityName}`;
}

/**
 * Get all chord qualities in a category
 * @param {string} categoryId - Category ID
 * @returns {Array<string>} Array of chord quality IDs
 */
export function getChordsInCategory(categoryId) {
  const category = CHORD_CATEGORIES[categoryId];
  return category ? category.chords : [];
}

/**
 * Get category for a chord quality
 * @param {string} quality - Chord quality ID
 * @returns {string|null} Category ID or null
 */
export function getChordCategory(quality) {
  for (const [catId, category] of Object.entries(CHORD_CATEGORIES)) {
    if (category.chords.includes(quality)) {
      return catId;
    }
  }
  return null;
}

/**
 * Search chords by name or symbol
 * @param {string} query - Search query
 * @returns {Array<{quality: string, name: string, category: string}>} Matching chords
 */
export function searchChords(query) {
  const lowerQuery = query.toLowerCase();
  const results = [];

  for (const quality in CHORD_NAMES) {
    const name = CHORD_NAMES[quality].toLowerCase();
    const qualityLower = quality.toLowerCase();

    if (name.includes(lowerQuery) || qualityLower.includes(lowerQuery)) {
      results.push({
        quality,
        name: CHORD_NAMES[quality],
        category: getChordCategory(quality)
      });
    }
  }

  return results;
}

/**
 * Analyze voicing type
 * @param {Array<number>} midiNotes - MIDI notes in the fingering (sorted)
 * @param {number} rootPC - Root pitch class
 * @returns {{type: string, description: string}}
 */
export function analyzeVoicing(midiNotes, rootPC) {
  if (midiNotes.length < 3) {
    return { type: 'incomplete', description: 'Incomplete voicing' };
  }

  // Sort notes
  const sorted = [...midiNotes].sort((a, b) => a - b);
  const lowestNote = sorted[0];
  const lowestPC = lowestNote % 12;

  // Check if root position (lowest note is root)
  const isRootPosition = lowestPC === rootPC;

  // Calculate spacing
  const intervals = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i] - sorted[i - 1]);
  }

  // Check if close voicing (all intervals <= octave)
  const maxInterval = Math.max(...intervals);
  const isClose = maxInterval <= 12;

  // Determine voicing type
  let type, description;

  if (isRootPosition) {
    if (isClose) {
      type = 'root_close';
      description = 'Root Position (Close)';
    } else {
      type = 'root_open';
      description = 'Root Position (Open)';
    }
  } else {
    // Determine which inversion
    const bassInterval = (lowestPC - rootPC + 12) % 12;
    let inversion;

    if (bassInterval === 3 || bassInterval === 4) {
      inversion = 'first';
    } else if (bassInterval === 7) {
      inversion = 'second';
    } else if (bassInterval === 10 || bassInterval === 11) {
      inversion = 'third';
    } else {
      inversion = 'other';
    }

    type = `${inversion}_inversion`;
    description = `${inversion.charAt(0).toUpperCase() + inversion.slice(1)} Inversion`;

    if (!isClose) {
      description += ' (Open)';
    }
  }

  return {
    type,
    description,
    isRootPosition,
    isClose,
    lowestNote: lowestPC,
    span: sorted[sorted.length - 1] - sorted[0]
  };
}
