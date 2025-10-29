/**
 * Launchpad Pro Mk1 Device Implementation
 * 8x8 square grid MIDI controller with original Programmer Mode
 *
 * References:
 * - Original Launchpad Pro Programmer's Reference Guide (v0.7)
 * - URL: https://d2xhy469pqj8rc.cloudfront.net/sites/default/files/novation/downloads/10598/launchpad-pro-programmers-reference-guide_0.pdf
 */

import { BaseDevice, DeviceCapabilities } from '../base-device.js';
import * as Geometry from '../square-grid-geometry.js';

export class LaunchpadProMk1Device extends BaseDevice {
  constructor() {
    super();
  }

  /**
   * Device metadata
   */
  get name() {
    return 'Launchpad Pro Mk1';
  }

  get type() {
    return 'launchpad-pro-mk1';
  }

  get capabilities() {
    return new DeviceCapabilities({
      hasDevMode: true,   // Programmer Mode
      hasLEDControl: true,
      supportsSysEx: true,
      gridType: 'square',
      layoutModes: ['chromatic'],
      hasPadId: true,
      midiChannels: [0, 1, 2, 3]  // Supports multiple modes with different channels
    });
  }

  /**
   * Grid layout properties
   */
  get gridType() {
    return 'square';
  }

  get rowCount() {
    return Geometry.ROW_COUNT;  // 8
  }

  get totalPads() {
    return Geometry.TOTAL_PADS;  // 64
  }

  getRowLength(row) {
    return Geometry.getRowLength(row);  // Always 8
  }

  /**
   * Coordinate conversion
   */
  getPadIndex(row, col) {
    return row * Geometry.COL_COUNT + col;
  }

  getRowCol(padIndex) {
    const row = Math.floor(padIndex / Geometry.COL_COUNT);
    const col = padIndex % Geometry.COL_COUNT;

    if (row < 0 || row >= Geometry.ROW_COUNT || col < 0 || col >= Geometry.COL_COUNT) {
      throw new Error(`Invalid pad index: ${padIndex}`);
    }

    return { row, col };
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
    return Geometry.getSquarePoints(cx, cy, size);
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
   * Programmer Mode (Launchpad Pro Mk1 specific)
   * Note: User must manually enter Programmer Mode via Setup page
   * or we can send SysEx to switch modes
   */
  async enterProgrammerMode(midiOutput) {
    if (!midiOutput) {
      throw new Error('No MIDI output available for Launchpad Pro Programmer Mode');
    }

    // Select Live Mode layout (default programmer layout)
    // SysEx: F0 00 20 29 02 10 22 <layout> F7
    // Layout 00 = Session, 01 = Note, etc.
    // For programmer mode, we use layout that gives us direct pad access
    // Actually, Launchpad Pro Mk1 enters programmer mode differently
    // User typically presses Setup button - we'll document this

    // Send "Select Live Mode" command
    // F0 00 20 29 02 10 21 <mode> F7
    // Mode: 00 = Ableton Live mode (default)
    const sysex = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x10, 0x21, 0x00, 0xF7];
    this._sendSysEx(sysex, midiOutput);

    console.log('[Launchpad Pro Mk1] Entered Live Mode (for programming)');
    console.log('[Launchpad Pro Mk1] Note: For full Programmer Mode, press Setup + orange button on device');
  }

  async exitProgrammerMode(midiOutput) {
    if (!midiOutput) return;

    // Return to Live mode
    const sysex = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x10, 0x21, 0x00, 0xF7];
    this._sendSysEx(sysex, midiOutput);

    console.log('[Launchpad Pro Mk1] Returned to Live Mode');
  }

  /**
   * LED Control (Launchpad Pro Mk1)
   * Uses RGB SysEx messages for full color control
   */
  highlightPads(highlights, midiOutput) {
    if (!midiOutput) return;

    // Launchpad Pro Mk1 RGB SysEx format:
    // F0 00 20 29 02 10 0B <LED> <R> <G> <B> F7
    // Where LED is the pad number (0-63 for grid)

    const SYSEX_HEADER = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x10];
    const CMD_RGB = 0x0B;

    for (const { padIndex, color } of highlights) {
      const ledIndex = this.getLaunchpadLedIndex(padIndex);
      const sysex = [
        ...SYSEX_HEADER,
        CMD_RGB,
        ledIndex,
        (color.r || 0) & 0x7F,
        (color.g || 0) & 0x7F,
        (color.b || 0) & 0x7F,
        0xF7
      ];
      this._sendSysEx(sysex, midiOutput);
    }
  }

  /**
   * Get Launchpad Pro Mk1 LED index for a pad
   * Launchpad Pro Mk1 uses a different numbering scheme
   * @param {number} padIndex - Our pad index (0-63, row-major)
   * @returns {number} Launchpad Pro LED index
   */
  getLaunchpadLedIndex(padIndex) {
    // Launchpad Pro Mk1 grid starts at LED 11
    // Each row is 10 LEDs apart (to accommodate side buttons)
    const row = Math.floor(padIndex / 8);
    const col = padIndex % 8;
    return 11 + (row * 10) + col;
  }

  /**
   * Get Launchpad Pro Mk1 MIDI note for a pad
   * @param {number} row - Row index (0-7)
   * @param {number} col - Column index (0-7)
   * @returns {number} MIDI note in Live mode
   */
  getLaunchpadMidiNote(row, col) {
    // In Live mode, pads send notes starting at 0
    // Arranged in row-major order
    return (7 - row) * 8 + col;  // Inverted row for Launchpad layout
  }
}
