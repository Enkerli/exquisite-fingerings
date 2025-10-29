/**
 * SVG Grid Renderer
 * Handles rendering of MIDI grid controllers (Exquis hex, Launchpad square, etc.)
 * Uses device abstraction to support multiple grid types
 */

import { midiToPitchClass } from '../core/music.js';
import { debugLog } from '../utils/debug.js';

/**
 * Grid Renderer class
 * Manages SVG rendering using device abstraction
 */
export class GridRenderer {
  constructor(svgElement, device = null) {
    this.svg = svgElement;
    this.device = device;  // Device instance (BaseDevice subclass)
    this.orientation = 'portrait';
    this.labelMode = 'pc';
    this.baseMidi = 48;
    this.highlightedPCs = new Set();
    this.chordHighlight = null; // { pitchClasses: Array<number>, rootPC: number } or null
    this.fingeringPattern = null;
    this.fingeringMode = false;
    this.onPadClick = null; // Callback for pad clicks
  }

  /**
   * Set device instance
   * @param {BaseDevice} device - Device instance
   */
  setDevice(device) {
    this.device = device;
  }

  /**
   * Set orientation
   * @param {string} orientation - 'portrait' or 'landscape'
   */
  setOrientation(orientation) {
    this.orientation = orientation;
  }

  /**
   * Set label mode
   * @param {string} mode - 'pc', 'note', or 'midi'
   */
  setLabelMode(mode) {
    this.labelMode = mode;
  }

  /**
   * Set base MIDI note
   * @param {number} baseMidi - Base MIDI note number
   */
  setBaseMidi(baseMidi) {
    this.baseMidi = baseMidi;
  }

  /**
   * Set highlighted pitch classes (scale/melodic context)
   * @param {Set<number>} pcs - Set of pitch classes to highlight
   */
  setHighlightedPCs(pcs) {
    this.highlightedPCs = pcs;
  }

  /**
   * Set chord highlight (chord tone colors on top of scale highlights)
   * @param {Array<number>} pitchClasses - Chord pitch classes (e.g., [0, 4, 7])
   * @param {number} rootPC - Root pitch class
   */
  setChordHighlight(pitchClasses, rootPC) {
    if (pitchClasses && pitchClasses.length > 0) {
      this.chordHighlight = { pitchClasses, rootPC };
    } else {
      this.chordHighlight = null;
    }
  }

  /**
   * Clear chord highlight
   */
  clearChordHighlight() {
    this.chordHighlight = null;
  }

  /**
   * Set fingering pattern
   * @param {FingeringPattern} pattern - Fingering pattern to display
   */
  setFingeringPattern(pattern) {
    this.fingeringPattern = pattern;
  }

  /**
   * Set fingering mode
   * @param {boolean} enabled - Enable/disable fingering mode
   */
  setFingeringMode(enabled) {
    this.fingeringMode = enabled;
  }

  /**
   * Set pad click callback
   * @param {Function} callback - Callback function(row, col, midiNote)
   */
  setPadClickHandler(callback) {
    this.onPadClick = callback;
  }

  /**
   * Render the complete grid
   */
  render() {
    if (!this.device) {
      console.error('[GridRenderer] No device set - cannot render');
      return;
    }

    debugLog('grid', '[GridRenderer] render() called', {
      svg: this.svg,
      device: this.device.name,
      gridType: this.device.gridType,
      orientation: this.orientation,
      labelMode: this.labelMode
    });

    const vb = this.device.getViewBox(this.orientation);
    this.svg.setAttribute('viewBox', vb.viewBox);

    // Clear existing content
    this.svg.innerHTML = '';

    // Create main group
    const gNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Apply rotation for landscape
    if (this.orientation === 'landscape') {
      gNode.setAttribute('transform', `translate(${vb.width},0) rotate(90)`);
    }

    // Render all pads
    let padCount = 0;
    for (let row = 0; row < this.device.rowCount; row++) {
      const cols = this.device.getRowLength(row);
      for (let col = 0; col < cols; col++) {
        this._renderPad(gNode, row, col);
        padCount++;
      }
    }

    debugLog('grid', `[GridRenderer] Rendered ${padCount} pads for ${this.device.name}`);
    this.svg.appendChild(gNode);
    debugLog('grid', '[GridRenderer] Grid appended to SVG');
  }

  /**
   * Render a single pad
   * @private
   */
  _renderPad(parent, row, col) {
    const { x: cx, y: cy } = this.device.getCellCenter(row, col);
    const midiNote = this.device.getMidiNote(row, col, this.baseMidi);
    const pc = midiToPitchClass(midiNote);

    // Get pad size based on grid type
    const padSize = this.device.gridType === 'hex' ? 22 : 14;  // hex radius vs square half-width

    // Create polygon (hex or square)
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', this.device.getPadPoints(cx, cy, padSize));
    poly.setAttribute('class', 'pad');
    poly.setAttribute('stroke', '#666');
    poly.setAttribute('fill', '#6aa5ff');
    poly.setAttribute('fill-opacity', '0.12');

    // Add highlighted class if this PC is highlighted (scale/melodic layer)
    if (this.highlightedPCs.has(pc)) {
      poly.classList.add('on');
    }

    // Add chord tone class if in chord highlight mode (chord layer - on top)
    const chordClass = this._getChordToneClass(pc);
    if (chordClass) {
      poly.classList.add(chordClass);
    }

    // Add fingering-mode class if enabled
    if (this.fingeringMode) {
      poly.classList.add('fingering-mode');
    }

    // Click handler
    poly.addEventListener('click', () => {
      if (this.onPadClick) {
        this.onPadClick(row, col, midiNote, pc);
      }
    });

    parent.appendChild(poly);

    // Render label
    this._renderLabel(parent, cx, cy, midiNote, pc);

    // Render fingering if exists
    if (this.fingeringPattern) {
      const fingering = this.fingeringPattern.getFingering(row, col);
      if (fingering) {
        this._renderFingering(parent, cx, cy, fingering);
      }
    }
  }

  /**
   * Render pad label
   * @private
   */
  _renderLabel(parent, cx, cy, midiNote, pc) {
    const labelText = this._getLabelText(midiNote, pc);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', cx);
    text.setAttribute('y', cy + 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'label');

    // Keep labels horizontal in landscape mode
    if (this.orientation === 'landscape') {
      text.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    }

    text.textContent = labelText;
    parent.appendChild(text);
  }

  /**
   * Render fingering number
   * @private
   */
  _renderFingering(parent, cx, cy, fingering) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', cx);
    text.setAttribute('y', cy - 8);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', `fing ${fingering.hand}`);

    // Keep fingerings horizontal in landscape mode
    if (this.orientation === 'landscape') {
      text.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    }

    text.textContent = fingering.finger;
    parent.appendChild(text);
  }

  /**
   * Get label text based on label mode
   * @private
   */
  _getLabelText(midiNote, pc) {
    switch (this.labelMode) {
      case 'pc':
        return pc;
      case 'note':
        return this._midiToNoteName(midiNote);
      case 'midi':
        return midiNote;
      default:
        return pc;
    }
  }

  /**
   * Calculate interval name from root for a pitch class
   * Matches hardware logic in exquis-devmode.js
   * @private
   */
  _calculateInterval(pc, rootPC) {
    const semitones = (pc - rootPC + 12) % 12;

    switch (semitones) {
      case 0: return 'root';
      case 2: return 'ninth';
      case 3:
      case 4: return 'third';
      case 5: return 'eleventh';
      case 7: return 'fifth';
      case 9: return 'thirteenth';
      case 10:
      case 11: return 'seventh';
      default: return 'default';
    }
  }

  /**
   * Get chord tone CSS class for a pitch class
   * @private
   */
  _getChordToneClass(pc) {
    if (!this.chordHighlight) return null;

    const { pitchClasses, rootPC } = this.chordHighlight;
    if (!pitchClasses.includes(pc)) return null;

    const interval = this._calculateInterval(pc, rootPC);
    return `chord-${interval}`;
  }

  /**
   * Convert MIDI to note name (simple version)
   * @private
   */
  _midiToNoteName(midiNote) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const pc = midiToPitchClass(midiNote);
    return noteNames[pc];
  }
}
