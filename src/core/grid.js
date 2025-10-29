/**
 * Exquis Grid Geometry Module (Legacy Compatibility Layer)
 *
 * This module maintains backward compatibility with existing code while
 * delegating to the new ExquisDevice class.
 *
 * NEW CODE should import from devices/exquis/exquis-device.js instead.
 *
 * Layout (Portrait mode):
 * - 11 rows total (rows 0-10, bottom to top)
 * - Even rows (0,2,4,6,8,10) have 6 pads
 * - Odd rows (1,3,5,7,9) have 5 pads
 * - Rows are staggered: odd rows offset by half a pad width
 * - Intervals: Northwest diagonal = minor 3rd up, Northeast diagonal = major 3rd up
 */

import { ExquisDevice } from '../devices/exquis/exquis-device.js';
import * as Geometry from '../devices/exquis/exquis-geometry.js';

// Create singleton Exquis device instance for backward compatibility
const _exquisDevice = new ExquisDevice();

export const ROW_COUNT = Geometry.ROW_COUNT;

/**
 * Get the number of pads in a row
 * @param {number} row - Row index (0-10)
 * @returns {number} Number of pads (5 or 6)
 */
export function getRowLength(row) {
  return Geometry.getRowLength(row);
}

/**
 * Row start pad indexes for INTERVALS mode (musical thirds layout)
 */
export const ROW_START_INTERVALS = Geometry.ROW_START_INTERVALS;

/**
 * Row start pad indexes for CHROMATIC mode (sequential layout)
 */
export const ROW_START_CHROMATIC = Geometry.ROW_START_CHROMATIC;

/**
 * Set grid mode
 * @param {string} mode - 'intervals' or 'chromatic'
 */
export function setGridMode(mode) {
  _exquisDevice.setGridMode(mode);
}

/**
 * Get current grid mode
 * @returns {string} Current mode ('intervals' or 'chromatic')
 */
export function getGridMode() {
  return _exquisDevice.getGridMode();
}

/**
 * Get current ROW_START based on grid mode
 * @private
 */
function getRowStart() {
  return _exquisDevice.getGridMode() === 'chromatic' ? ROW_START_CHROMATIC : ROW_START_INTERVALS;
}

// Export ROW_START for backward compatibility (uses current mode)
export const ROW_START = new Proxy({}, {
  get(target, prop) {
    const rowStart = getRowStart();
    if (prop === 'length') return rowStart.length;
    const index = parseInt(prop);
    if (!isNaN(index)) return rowStart[index];
    return rowStart[prop];
  }
});

/**
 * Get the global pad index for a given row and column
 * @param {number} row - Row index (0-10)
 * @param {number} col - Column index (0-5)
 * @returns {number} Global pad index
 */
export function getPadIndex(row, col) {
  return _exquisDevice.getPadIndex(row, col);
}

/**
 * Get row and column from global pad index
 * @param {number} padIndex - Global pad index
 * @returns {{row: number, col: number}} Row and column
 */
export function getRowCol(padIndex) {
  return _exquisDevice.getRowCol(padIndex);
}

/**
 * Get MIDI note for a given row, column, and base MIDI
 * @param {number} row - Row index (0-10)
 * @param {number} col - Column index (0-5)
 * @param {number} baseMidi - Base MIDI note (default 48 = C3)
 * @returns {number} MIDI note number
 */
export function getMidiNote(row, col, baseMidi = 48) {
  return _exquisDevice.getMidiNote(row, col, baseMidi);
}

/**
 * Hex geometry for rendering
 */
export const HEX_GEOMETRY = Geometry.HEX_GEOMETRY;

/**
 * Calculate center position for a hex pad in portrait orientation
 * @param {number} row - Row index (0-10)
 * @param {number} col - Column index (0-5)
 * @param {number} padding - Padding around the grid (default 48)
 * @returns {{x: number, y: number}} Center coordinates
 */
export function getCellCenter(row, col, padding = 48) {
  return Geometry.getCellCenter(row, col, padding);
}

/**
 * Generate SVG points for a pointy-top hexagon
 * @param {number} cx - Center x coordinate
 * @param {number} cy - Center y coordinate
 * @param {number} size - Hexagon radius
 * @returns {string} SVG points string
 */
export function getHexPoints(cx, cy, size) {
  return Geometry.getHexPoints(cx, cy, size);
}

/**
 * Calculate viewBox dimensions for the grid
 * @param {string} orientation - 'portrait' or 'landscape'
 * @returns {{width: number, height: number, viewBox: string}} ViewBox dimensions
 */
export function getViewBox(orientation = 'portrait') {
  return Geometry.getViewBox(orientation);
}

/**
 * Get interval direction vectors on the Exquis grid
 * Returns the row/col offsets for common musical intervals
 */
export const INTERVAL_VECTORS = Geometry.INTERVAL_VECTORS;

/**
 * Get neighboring pads for a given position
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {Array<{row: number, col: number}>} Array of valid neighbors
 */
export function getNeighbors(row, col) {
  return Geometry.getNeighbors(row, col);
}

/**
 * Calculate grid distance between two pads
 * @param {number} row1 - First pad row
 * @param {number} col1 - First pad column
 * @param {number} row2 - Second pad row
 * @param {number} col2 - Second pad column
 * @returns {number} Grid distance
 */
export function getGridDistance(row1, col1, row2, col2) {
  return Geometry.getGridDistance(row1, col1, row2, col2);
}
