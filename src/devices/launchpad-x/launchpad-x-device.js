/**
 * Launchpad X Device Implementation
 * 8x8 square grid MIDI controller with Programmer Mode
 *
 * References:
 * - Launchpad X Programmer's Reference Manual
 * - SysEx command summary: https://userguides.novationmusic.com/.../Launchpad-X-SysEx-command-summary
 */

import { BaseDevice, DeviceCapabilities } from '../base-device.js';
import * as Geometry from '../square-grid-geometry.js';

export class LaunchpadXDevice extends BaseDevice {
  constructor() {
    super();
  }

  /**
   * Device metadata
   */
  get name() {
    return 'Launchpad X';
  }

  get type() {
    return 'launchpad-x';
  }

  get capabilities() {
    return new DeviceCapabilities({
      hasDevMode: true,   // Programmer Mode
      hasLEDControl: true,
      supportsSysEx: true,
      gridType: 'square',
      layoutModes: ['chromatic'],  // Only chromatic layout
      hasPadId: true,  // Programmer mode provides pad indices
      midiChannels: [0]  // Default channel 1
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
   * Coordinate conversion - simple sequential layout for square grid
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
   * MIDI mapping - chromatic rows in fourths
   * Each row starts a perfect fourth (5 semitones) above the previous row
   * Row 0: baseMidi + 0, 1, 2, 3, 4, 5, 6, 7
   * Row 1: baseMidi + 5, 6, 7, 8, 9, 10, 11, 12
   * Row 2: baseMidi + 10, 11, 12, 13, 14, 15, 16, 17
   * etc.
   */
  getMidiNote(row, col, baseMidi = 0) {
    // Fourths tuning: each row is 5 semitones (perfect fourth) higher
    return baseMidi + (row * 5) + col;
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
   * Programmer Mode (Launchpad X specific)
   */
  async enterProgrammerMode(midiOutput) {
    if (!midiOutput) {
      throw new Error('No MIDI output available for Launchpad X Programmer Mode');
    }

    // Enter Programmer Mode
    // SysEx: F0 00 20 29 02 0C 0E 01 F7
    // Header: F0 00 20 29 (Novation)
    // Device ID: 02 0C (Launchpad X)
    // Command: 0E (Switch mode)
    // Mode: 01 (Programmer mode)
    const sysex = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C, 0x0E, 0x01, 0xF7];
    this._sendSysEx(sysex, midiOutput);

    console.log('[Launchpad X] Entered Programmer Mode');
  }

  async exitProgrammerMode(midiOutput) {
    if (!midiOutput) return;

    // Exit Programmer Mode (switch to Live mode)
    // SysEx: F0 00 20 29 02 0C 0E 00 F7
    const sysex = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C, 0x0E, 0x00, 0xF7];
    this._sendSysEx(sysex, midiOutput);

    console.log('[Launchpad X] Exited Programmer Mode');
  }

  /**
   * LED Control (Programmer Mode required)
   * Note: Launchpad X uses velocity for color in Programmer Mode
   * Full RGB control requires palette setup
   */
  highlightPads(highlights, midiOutput) {
    if (!midiOutput) return;

    // In Programmer Mode, use Note On messages with velocity for color
    // For simplicity, use MIDI notes directly
    // Full implementation would use SysEx for RGB palette setup
    for (const { padIndex, color } of highlights) {
      const midiNote = 11 + (Math.floor(padIndex / 8) * 10) + (padIndex % 8);
      // Convert RGB to velocity (simplified - would need palette for full color)
      const velocity = Math.max(1, Math.min(127, color.r || 64));

      try {
        // Note On with velocity
        midiOutput.send([0x90, midiNote, velocity]);
      } catch (err) {
        console.error('[Launchpad X] LED control error:', err);
      }
    }
  }

  /**
   * Get Launchpad X specific MIDI note mapping
   * Launchpad X uses a 10-row based note numbering in programmer mode
   * @param {number} row - Row index (0-7)
   * @param {number} col - Column index (0-7)
   * @returns {number} Launchpad X MIDI note
   */
  getLaunchpadMidiNote(row, col) {
    // Launchpad X grid starts at MIDI note 11
    // Each row is 10 notes apart (to accommodate side buttons)
    return 11 + (row * 10) + col;
  }
}
