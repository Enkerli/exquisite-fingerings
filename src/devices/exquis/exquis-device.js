/**
 * Exquis Device Implementation
 * Hex grid MIDI controller with musical intervals layout
 */

import { BaseDevice, DeviceCapabilities } from '../base-device.js';
import * as Geometry from './exquis-geometry.js';
import { ExquisDevMode } from './exquis-devmode.js';

export class ExquisDevice extends BaseDevice {
  constructor() {
    super();
    // Default to intervals mode (musical thirds layout)
    this.currentGridMode = 'intervals';
    this.devMode = null;  // ExquisDevMode instance
  }

  /**
   * Device metadata
   */
  get name() {
    return 'Exquis';
  }

  get type() {
    return 'exquis';
  }

  get capabilities() {
    return new DeviceCapabilities({
      hasDevMode: true,
      hasLEDControl: true,
      supportsSysEx: true,
      gridType: 'hex',
      layoutModes: ['intervals', 'chromatic'],
      hasPadId: true,  // Developer mode provides pad IDs
      midiChannels: [15]  // Developer mode uses channel 16 (0x0F)
    });
  }

  /**
   * Grid layout properties
   */
  get gridType() {
    return 'hex';
  }

  get rowCount() {
    return Geometry.ROW_COUNT;  // 11
  }

  get totalPads() {
    return 61;  // Sum of 6+5+6+5+6+5+6+5+6+5+6 = 61
  }

  getRowLength(row) {
    return Geometry.getRowLength(row);
  }

  /**
   * Coordinate conversion
   */
  getPadIndex(row, col) {
    const ROW_START = this._getRowStart();
    return ROW_START[row] + col;
  }

  getRowCol(padIndex) {
    const ROW_START = this._getRowStart();

    // Search from bottom row (0) upward to handle overlapping indices in intervals mode
    for (let row = 0; row < this.rowCount; row++) {
      if (padIndex >= ROW_START[row]) {
        const col = padIndex - ROW_START[row];
        if (col >= 0 && col < this.getRowLength(row)) {
          return { row, col };
        }
      }
    }
    throw new Error(`Invalid pad index: ${padIndex}`);
  }

  /**
   * MIDI mapping
   */
  getMidiNote(row, col, baseMidi = 48) {
    return baseMidi + this.getPadIndex(row, col);
  }

  /**
   * Grid geometry for rendering
   */
  getCellCenter(row, col, padding = 48) {
    return Geometry.getCellCenter(row, col, padding);
  }

  getViewBox(orientation = 'portrait') {
    return Geometry.getViewBox(orientation);
  }

  getPadPoints(cx, cy, size) {
    return Geometry.getHexPoints(cx, cy, size);
  }

  /**
   * Grid navigation
   */
  getNeighbors(row, col) {
    return Geometry.getNeighbors(row, col);
  }

  getGridDistance(row1, col1, row2, col2) {
    return Geometry.getGridDistance(row1, col1, row2, col2);
  }

  /**
   * Grid mode management (intervals vs chromatic)
   */
  setGridMode(mode) {
    if (mode !== 'intervals' && mode !== 'chromatic') {
      throw new Error(`Invalid grid mode: ${mode}. Must be 'intervals' or 'chromatic'.`);
    }
    this.currentGridMode = mode;
  }

  getGridMode() {
    return this.currentGridMode;
  }

  /**
   * Get or create Developer Mode instance
   * @param {MIDIOutput} midiOutput - MIDI output device
   * @returns {ExquisDevMode} Dev mode instance
   */
  getDevMode(midiOutput) {
    if (!this.devMode) {
      this.devMode = new ExquisDevMode(midiOutput);
    } else if (midiOutput) {
      // Update output if provided
      this.devMode.output = midiOutput;
    }
    return this.devMode;
  }

  /**
   * Developer Mode (SysEx)
   */
  async enterProgrammerMode(midiOutput) {
    if (!midiOutput) {
      throw new Error('No MIDI output available for Exquis Developer Mode');
    }

    // Enter Exquis Developer Mode (pads only)
    // F0 00 21 7E 7F 00 01 F7
    const sysex = [0xF0, 0x00, 0x21, 0x7E, 0x7F, 0x00, 0x01, 0xF7];
    this._sendSysEx(sysex, midiOutput);

    console.log('[Exquis] Entered Developer Mode');
  }

  async exitProgrammerMode(midiOutput) {
    if (!midiOutput) return;

    // Exit Exquis Developer Mode
    // F0 00 21 7E 7F 00 00 F7
    const sysex = [0xF0, 0x00, 0x21, 0x7E, 0x7F, 0x00, 0x00, 0xF7];
    this._sendSysEx(sysex, midiOutput);

    console.log('[Exquis] Exited Developer Mode');
  }

  /**
   * LED highlighting (Developer Mode required)
   * Note: This is a simplified version. Full LED control is in exquis-devmode.js
   */
  highlightPads(highlights, midiOutput) {
    if (!midiOutput) return;

    // SysEx command: F0 00 21 7E 7F 04 [padId] [r] [g] [b] [fx] F7
    const SYSEX_HEADER = [0xF0, 0x00, 0x21, 0x7E, 0x7F];
    const CMD_SET_LED_RGB = 0x04;

    for (const { padIndex, color } of highlights) {
      const sysex = [
        ...SYSEX_HEADER,
        CMD_SET_LED_RGB,
        padIndex & 0x7F,
        (color.r || 0) & 0x7F,
        (color.g || 0) & 0x7F,
        (color.b || 0) & 0x7F,
        0x00,  // No effect
        0xF7
      ];
      this._sendSysEx(sysex, midiOutput);
    }
  }

  /**
   * Get row start array based on current grid mode
   * @private
   */
  _getRowStart() {
    return this.currentGridMode === 'chromatic'
      ? Geometry.ROW_START_CHROMATIC
      : Geometry.ROW_START_INTERVALS;
  }

  /**
   * Get interval vectors for music theory analysis
   */
  getIntervalVectors() {
    return Geometry.INTERVAL_VECTORS;
  }

  /**
   * Get hex geometry constants
   */
  getHexGeometry() {
    return Geometry.HEX_GEOMETRY;
  }

  /**
   * Get chromatic row starts (for developer mode pad ID mapping)
   */
  getChromaticRowStarts() {
    return Geometry.ROW_START_CHROMATIC;
  }

  /**
   * Get intervals row starts (for musical layout)
   */
  getIntervalsRowStarts() {
    return Geometry.ROW_START_INTERVALS;
  }
}
