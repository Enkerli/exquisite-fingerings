/**
 * Launchpad X Programmer Mode Module
 * Handles SysEx commands for LED control and pad event monitoring
 *
 * References:
 * - Launchpad X Programmer's Reference Manual
 * - https://userguides.novationmusic.com/hc/en-gb/articles/24001502406290-Launchpad-X-SysEx-command-summary
 */

/**
 * SysEx header for all Launchpad X commands
 * F0 00 20 29 02 0C [...] F7
 */
const SYSEX_HEADER = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C];
const SYSEX_FOOTER = [0xF7];

/**
 * Launchpad X Command IDs
 */
const CMD = {
  MODE_SWITCH: 0x0E,     // Switch mode (Programmer/DAW/etc.)
  RGB_LED: 0x03,         // RGB LED control
  RGB_COLUMN: 0x04,      // RGB column control (batch)
};

/**
 * Mode values
 */
const MODE = {
  DAW: 0x00,
  PROGRAMMER: 0x01,
};

/**
 * Color palette for chord highlighting
 * Matching Exquis colors but optimized for Launchpad X RGB range (0-127)
 */
const CHORD_COLORS = {
  ROOT: { r: 127, g: 0, b: 127 },      // Bright magenta
  THIRD: { r: 0, g: 127, b: 127 },     // Cyan
  FIFTH: { r: 127, g: 127, b: 0 },     // Yellow
  SEVENTH: { r: 127, g: 64, b: 0 },    // Orange
  NINTH: { r: 0, g: 127, b: 64 },      // Green-cyan
  ELEVENTH: { r: 64, g: 0, b: 127 },   // Purple
  THIRTEENTH: { r: 127, g: 0, b: 64 }, // Pink
  DEFAULT: { r: 64, g: 64, b: 64 }     // Gray
};

/**
 * LaunchpadXDevMode class
 * Manages Programmer Mode state and MIDI communication
 */
export class LaunchpadXDevMode {
  constructor(midiOutput) {
    this.output = midiOutput;
    this.isActive = false;
    this.padStates = new Array(64).fill(false); // Track pad press states (8x8 grid)
    this.eventHandlers = {
      padPress: null,
      padRelease: null,
    };
  }

  /**
   * Enter Programmer Mode
   */
  async enter() {
    if (!this.output) {
      throw new Error('No MIDI output available');
    }

    const message = [
      ...SYSEX_HEADER,
      CMD.MODE_SWITCH,
      MODE.PROGRAMMER,
      ...SYSEX_FOOTER
    ];

    this.output.send(message);
    this.isActive = true;

    console.log('[Launchpad X DevMode] Entered Programmer Mode');
  }

  /**
   * Exit Programmer Mode
   */
  async exit() {
    if (!this.output) return;

    const message = [
      ...SYSEX_HEADER,
      CMD.MODE_SWITCH,
      MODE.DAW,
      ...SYSEX_FOOTER
    ];

    this.output.send(message);
    this.isActive = false;
    this.padStates.fill(false);

    console.log('[Launchpad X DevMode] Exited Programmer Mode');
  }

  /**
   * Set single pad color (RGB)
   * @param {number} row - Row index (0-7)
   * @param {number} col - Column index (0-7)
   * @param {number} r - Red (0-127)
   * @param {number} g - Green (0-127)
   * @param {number} b - Blue (0-127)
   */
  setPadColor(row, col, r, g, b) {
    if (!this.output) return;

    // Convert row/col to Launchpad X pad index
    // Grid layout in Programmer Mode uses rows 10-80, columns 1-8
    const ledIndex = (row + 1) * 10 + (col + 1);

    const message = [
      ...SYSEX_HEADER,
      CMD.RGB_LED,
      0x03,  // Type: Static RGB
      ledIndex,
      r & 0x7F,
      g & 0x7F,
      b & 0x7F,
      ...SYSEX_FOOTER
    ];

    this.output.send(message);
  }

  /**
   * Set multiple pad colors at once
   * @param {Array<{row, col, r, g, b}>} pads - Array of pad configurations
   */
  setPadColors(pads) {
    if (!this.output || pads.length === 0) return;

    // Send individual RGB messages
    // (Launchpad X supports batching but individual is simpler)
    for (const pad of pads) {
      this.setPadColor(pad.row, pad.col, pad.r, pad.g, pad.b);
    }
  }

  /**
   * Clear all pad colors (set to black)
   */
  clearAllPads() {
    const pads = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        pads.push({ row, col, r: 0, g: 0, b: 0 });
      }
    }
    this.setPadColors(pads);
  }

  /**
   * Highlight chord tones across the grid
   * @param {Array<number>} pitchClasses - Chord pitch classes (e.g., [0, 4, 7])
   * @param {number} rootPC - Root pitch class
   * @param {number} baseMidi - Base MIDI note (default 0)
   */
  highlightChord(pitchClasses, rootPC, baseMidi = 0) {
    const pads = [];

    // Calculate interval positions
    const intervals = this.calculateIntervals(pitchClasses, rootPC);

    // Iterate through 8x8 grid with fourths tuning
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        // Fourths tuning: each row is 5 semitones higher
        const midiNote = baseMidi + (row * 5) + col;
        const pc = midiNote % 12;

        if (pitchClasses.includes(pc)) {
          // Get color based on interval from root
          const interval = intervals.get(pc);
          const color = this.getColorForInterval(interval, pc === rootPC);

          pads.push({
            row,
            col,
            r: color.r,
            g: color.g,
            b: color.b
          });
        } else {
          // Turn off non-chord pads
          pads.push({ row, col, r: 0, g: 0, b: 0 });
        }
      }
    }

    this.setPadColors(pads);
  }

  /**
   * Calculate intervals from root for each pitch class
   * @param {Array<number>} pitchClasses - Chord pitch classes
   * @param {number} rootPC - Root pitch class
   * @returns {Map<number, string>} Map of PC to interval name
   */
  calculateIntervals(pitchClasses, rootPC) {
    const intervals = new Map();

    for (const pc of pitchClasses) {
      const semitones = (pc - rootPC + 12) % 12;
      let intervalName;

      switch (semitones) {
        case 0: intervalName = 'root'; break;
        case 2: intervalName = 'ninth'; break;
        case 3:
        case 4: intervalName = 'third'; break;
        case 5: intervalName = 'eleventh'; break;
        case 7: intervalName = 'fifth'; break;
        case 9: intervalName = 'thirteenth'; break;
        case 10:
        case 11: intervalName = 'seventh'; break;
        default: intervalName = 'default';
      }

      intervals.set(pc, intervalName);
    }

    return intervals;
  }

  /**
   * Get color for interval
   * @param {string} interval - Interval name
   * @param {boolean} isRoot - Whether this is the root note
   * @returns {{r, g, b}} RGB color
   */
  getColorForInterval(interval, isRoot) {
    if (isRoot) return CHORD_COLORS.ROOT;

    switch (interval) {
      case 'third': return CHORD_COLORS.THIRD;
      case 'fifth': return CHORD_COLORS.FIFTH;
      case 'seventh': return CHORD_COLORS.SEVENTH;
      case 'ninth': return CHORD_COLORS.NINTH;
      case 'eleventh': return CHORD_COLORS.ELEVENTH;
      case 'thirteenth': return CHORD_COLORS.THIRTEENTH;
      default: return CHORD_COLORS.DEFAULT;
    }
  }

  /**
   * Handle incoming MIDI message (call from MIDI input handler)
   * @param {Uint8Array} data - MIDI message data
   */
  handleMidiMessage(data) {
    if (data.length < 3) return;

    const [status, note, velocity] = data;
    const channel = status & 0x0F;
    const command = status & 0xF0;

    console.log('[Launchpad X DevMode] handleMidiMessage:', {
      status: status.toString(16),
      channel,
      command: command.toString(16),
      note,
      velocity
    });

    // Programmer Mode uses channel 1 (0 in 0-indexed)
    if (channel !== 0x00) {
      console.log('[Launchpad X DevMode] Ignoring - not channel 1');
      return;
    }

    // Note On (0x90) = pad press
    if (command === 0x90 && velocity > 0) {
      // Convert Launchpad MIDI note to row/col
      const { row, col } = this.midiNoteToRowCol(note);
      if (row !== null && col !== null) {
        const padIndex = row * 8 + col;
        console.log('[Launchpad X DevMode] Pad press detected - row:', row, 'col:', col, 'velocity:', velocity);
        this.padStates[padIndex] = true;
        if (this.eventHandlers.padPress) {
          console.log('[Launchpad X DevMode] Calling padPress handler');
          this.eventHandlers.padPress(padIndex, velocity);
        } else {
          console.log('[Launchpad X DevMode] No padPress handler registered!');
        }
      }
    }

    // Note Off (0x80) or Note On with velocity 0 = pad release
    if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      const { row, col } = this.midiNoteToRowCol(note);
      if (row !== null && col !== null) {
        const padIndex = row * 8 + col;
        console.log('[Launchpad X DevMode] Pad release detected - row:', row, 'col:', col);
        this.padStates[padIndex] = false;
        if (this.eventHandlers.padRelease) {
          this.eventHandlers.padRelease(padIndex);
        }
      }
    }
  }

  /**
   * Convert Launchpad MIDI note to row/col
   * Launchpad X grid uses notes 11-18, 21-28, ..., 81-88
   * @param {number} note - MIDI note number
   * @returns {{row: number|null, col: number|null}}
   */
  midiNoteToRowCol(note) {
    const row = Math.floor(note / 10) - 1;
    const col = (note % 10) - 1;

    // Validate range
    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      return { row, col };
    }

    return { row: null, col: null };
  }

  /**
   * Set event handler
   * @param {string} event - Event name ('padPress', 'padRelease')
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (this.eventHandlers.hasOwnProperty(event)) {
      this.eventHandlers[event] = handler;
    }
  }

  /**
   * Get current pad states
   * @returns {Array<boolean>} Array of pad states (true = pressed)
   */
  getPadStates() {
    return [...this.padStates];
  }

  /**
   * Check if a pad is currently pressed
   * @param {number} padIndex - Pad index (0-63)
   * @returns {boolean} True if pressed
   */
  isPadPressed(padIndex) {
    return this.padStates[padIndex] || false;
  }
}

// Export constants for external use
export { CHORD_COLORS };
