/**
 * Square Grid Geometry Module
 * Shared geometry for square grid devices (Launchpad X, Launchpad Pro, etc.)
 *
 * Layout:
 * - 8x8 square grid (64 pads)
 * - Row 0 at bottom, row 7 at top
 * - Col 0 at left, col 7 at right
 * - Sequential pad numbering: row * 8 + col
 */

export const ROW_COUNT = 8;
export const COL_COUNT = 8;
export const TOTAL_PADS = 64;

/**
 * Get the number of pads in a row (always 8 for square grid)
 * @param {number} row - Row index (0-7)
 * @returns {number} Number of pads (always 8)
 */
export function getRowLength(row) {
  return COL_COUNT;
}

/**
 * Square pad geometry for rendering
 */
export const SQUARE_GEOMETRY = {
  portrait: {
    size: 28,      // Square side length
    w: 32,         // Horizontal spacing (includes gap)
    h: 32          // Vertical spacing (includes gap)
  }
};

/**
 * Calculate center position for a square pad in portrait orientation
 * @param {number} row - Row index (0-7)
 * @param {number} col - Column index (0-7)
 * @param {number} padding - Padding around the grid (default 48)
 * @returns {{x: number, y: number}} Center coordinates
 */
export function getCellCenter(row, col, padding = 48) {
  const g = SQUARE_GEOMETRY.portrait;
  const x = col * g.w + padding;
  // Row 0 is at bottom, row 7 is at top
  const y = (ROW_COUNT - 1 - row) * g.h + padding;
  return { x, y };
}

/**
 * Generate SVG points for a square
 * @param {number} cx - Center x coordinate
 * @param {number} cy - Center y coordinate
 * @param {number} size - Square half-width
 * @returns {string} SVG points string
 */
export function getSquarePoints(cx, cy, size) {
  const points = [
    [cx - size, cy - size],  // Top-left
    [cx + size, cy - size],  // Top-right
    [cx + size, cy + size],  // Bottom-right
    [cx - size, cy + size]   // Bottom-left
  ];
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

/**
 * Calculate viewBox dimensions for the grid
 * @param {string} orientation - 'portrait' or 'landscape'
 * @returns {{width: number, height: number, viewBox: string}} ViewBox dimensions
 */
export function getViewBox(orientation = 'portrait') {
  const g = SQUARE_GEOMETRY.portrait;
  const vbW_p = (COL_COUNT * g.w + 96);  // 8 columns + padding
  const vbH_p = (ROW_COUNT * g.h + 96);  // 8 rows + padding

  if (orientation === 'portrait') {
    return {
      width: vbW_p,
      height: vbH_p,
      viewBox: `0 0 ${vbW_p} ${vbH_p}`
    };
  } else {
    // Landscape: swap width and height
    return {
      width: vbH_p,
      height: vbW_p,
      viewBox: `0 0 ${vbH_p} ${vbW_p}`
    };
  }
}

/**
 * Get neighboring pads for a given position (4-way connectivity)
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {Array<{row: number, col: number}>} Array of valid neighbors
 */
export function getNeighbors(row, col) {
  const neighbors = [];
  const offsets = [
    { dr: 0, dc: -1 },   // Left
    { dr: 0, dc: 1 },    // Right
    { dr: 1, dc: 0 },    // Up
    { dr: -1, dc: 0 }    // Down
  ];

  for (const { dr, dc } of offsets) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < ROW_COUNT && newCol >= 0 && newCol < COL_COUNT) {
      neighbors.push({ row: newRow, col: newCol });
    }
  }

  return neighbors;
}

/**
 * Calculate grid distance between two pads (Manhattan distance for square grid)
 * @param {number} row1 - First pad row
 * @param {number} col1 - First pad column
 * @param {number} row2 - Second pad row
 * @param {number} col2 - Second pad column
 * @returns {number} Grid distance
 */
export function getGridDistance(row1, col1, row2, col2) {
  return Math.abs(row2 - row1) + Math.abs(col2 - col1);
}
