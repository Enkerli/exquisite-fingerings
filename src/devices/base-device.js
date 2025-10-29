/**
 * Base Device Abstract Class
 * Defines the interface that all MIDI grid controllers must implement
 *
 * This abstraction allows the application to support multiple devices:
 * - Exquis (hex grid, musical intervals layout)
 * - Launchpad X (8x8 square grid)
 * - Launchpad Pro Mk1 (8x8 square grid, original protocol)
 * - Future devices...
 */

export class BaseDevice {
  /**
   * Device metadata
   */
  get name() {
    throw new Error('BaseDevice.name must be implemented by subclass');
  }

  get type() {
    throw new Error('BaseDevice.type must be implemented by subclass');
  }

  get capabilities() {
    throw new Error('BaseDevice.capabilities must be implemented by subclass');
  }

  /**
   * Grid layout properties
   */
  get gridType() {
    // Returns: 'hex' | 'square'
    throw new Error('BaseDevice.gridType must be implemented by subclass');
  }

  get rowCount() {
    throw new Error('BaseDevice.rowCount must be implemented by subclass');
  }

  get totalPads() {
    throw new Error('BaseDevice.totalPads must be implemented by subclass');
  }

  /**
   * Get number of pads in a specific row
   * @param {number} row - Row index (0-based)
   * @returns {number} Number of pads in the row
   */
  getRowLength(row) {
    throw new Error('BaseDevice.getRowLength must be implemented by subclass');
  }

  /**
   * Coordinate conversion: (row, col) → pad index
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {number} Global pad index
   */
  getPadIndex(row, col) {
    throw new Error('BaseDevice.getPadIndex must be implemented by subclass');
  }

  /**
   * Coordinate conversion: pad index → (row, col)
   * @param {number} padIndex - Global pad index
   * @returns {{row: number, col: number}} Row and column coordinates
   */
  getRowCol(padIndex) {
    throw new Error('BaseDevice.getRowCol must be implemented by subclass');
  }

  /**
   * Get MIDI note number for a pad
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @param {number} baseMidi - Base MIDI note (default 48 = C3)
   * @returns {number} MIDI note number
   */
  getMidiNote(row, col, baseMidi = 48) {
    throw new Error('BaseDevice.getMidiNote must be implemented by subclass');
  }

  /**
   * Grid geometry for SVG rendering
   */

  /**
   * Get SVG center coordinates for a pad
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @param {number} padding - SVG padding (default 48)
   * @returns {{x: number, y: number}} SVG coordinates
   */
  getCellCenter(row, col, padding = 48) {
    throw new Error('BaseDevice.getCellCenter must be implemented by subclass');
  }

  /**
   * Get SVG viewBox for the grid
   * @param {string} orientation - 'portrait' or 'landscape'
   * @returns {{width: number, height: number, viewBox: string}} ViewBox dimensions
   */
  getViewBox(orientation = 'portrait') {
    throw new Error('BaseDevice.getViewBox must be implemented by subclass');
  }

  /**
   * Get SVG shape points for a pad (hex or square)
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} size - Pad size
   * @returns {string} SVG points string
   */
  getPadPoints(cx, cy, size) {
    throw new Error('BaseDevice.getPadPoints must be implemented by subclass');
  }

  /**
   * Grid navigation and analysis
   */

  /**
   * Get neighboring pads for a position
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {Array<{row: number, col: number}>} Array of valid neighbors
   */
  getNeighbors(row, col) {
    throw new Error('BaseDevice.getNeighbors must be implemented by subclass');
  }

  /**
   * Calculate grid distance between two pads
   * @param {number} row1 - First pad row
   * @param {number} col1 - First pad column
   * @param {number} row2 - Second pad row
   * @param {number} col2 - Second pad column
   * @returns {number} Grid distance
   */
  getGridDistance(row1, col1, row2, col2) {
    throw new Error('BaseDevice.getGridDistance must be implemented by subclass');
  }

  /**
   * Grid mode management (optional - for devices with multiple layouts)
   */

  /**
   * Set grid mode (e.g., 'intervals' vs 'chromatic')
   * @param {string} mode - Grid mode identifier
   */
  setGridMode(mode) {
    // Optional - only some devices support multiple modes
    // Default: no-op
  }

  /**
   * Get current grid mode
   * @returns {string} Current grid mode
   */
  getGridMode() {
    // Optional - return default mode
    return 'default';
  }

  /**
   * Device-specific features (optional)
   */

  /**
   * Enter programmer/developer mode
   * @param {MIDIOutput} midiOutput - MIDI output device
   * @returns {Promise<void>}
   */
  async enterProgrammerMode(midiOutput) {
    // Optional - not all devices support this
    // Default: no-op
  }

  /**
   * Exit programmer/developer mode
   * @param {MIDIOutput} midiOutput - MIDI output device
   * @returns {Promise<void>}
   */
  async exitProgrammerMode(midiOutput) {
    // Optional - not all devices support this
    // Default: no-op
  }

  /**
   * Highlight pads with specific colors (LED control)
   * @param {Array<{padIndex: number, color: {r: number, g: number, b: number}}>} highlights
   * @param {MIDIOutput} midiOutput - MIDI output device
   */
  highlightPads(highlights, midiOutput) {
    // Optional - not all devices support LED control
    // Default: no-op
  }

  /**
   * Send SysEx message to device
   * @param {Array<number>} sysexData - SysEx bytes
   * @param {MIDIOutput} midiOutput - MIDI output device
   * @protected
   */
  _sendSysEx(sysexData, midiOutput) {
    if (!midiOutput) {
      console.warn(`[${this.name}] No MIDI output - cannot send SysEx`);
      return;
    }
    try {
      midiOutput.send(sysexData);
    } catch (err) {
      console.error(`[${this.name}] SysEx send error:`, err);
    }
  }
}

/**
 * Device capabilities descriptor
 * Describes what features a device supports
 */
export class DeviceCapabilities {
  constructor({
    hasDevMode = false,
    hasLEDControl = false,
    supportsSysEx = false,
    gridType = 'square',
    layoutModes = ['default'],
    hasPadId = false,
    midiChannels = [0] // Default to channel 1 (0-indexed)
  } = {}) {
    this.hasDevMode = hasDevMode;
    this.hasLEDControl = hasLEDControl;
    this.supportsSysEx = supportsSysEx;
    this.gridType = gridType;
    this.layoutModes = layoutModes;
    this.hasPadId = hasPadId;
    this.midiChannels = midiChannels;
  }
}
