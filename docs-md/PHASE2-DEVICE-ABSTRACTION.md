# Phase 2: Device Abstraction Layer - Design Document

## Overview
This document describes the device abstraction layer architecture to support multiple MIDI grid controllers (Exquis, Launchpad X, Launchpad Pro Mk1) in the Exquisite Fingerings application.

## Current State
- Code is tightly coupled to Exquis hex grid controller
- Grid geometry, MIDI mapping, and Developer Mode are Exquis-specific
- `src/core/grid.js` contains all grid logic
- `src/core/midi.js` has Exquis-specific SysEx commands

## Goals
1. Abstract grid operations to support both hex (Exquis) and square (Launchpad) grids
2. Support multiple devices with different capabilities
3. Maintain backward compatibility with existing Exquis functionality
4. Enable easy addition of new devices in the future

## Architecture

### 1. Device Abstraction Interfaces

#### BaseDevice
Core interface that all devices must implement:

```javascript
class BaseDevice {
  // Metadata
  get name() { }          // Device name (e.g., "Exquis", "Launchpad X")
  get type() { }          // Device type identifier
  get capabilities() { }  // DeviceCapabilities object

  // Grid Layout
  get gridType() { }      // 'hex' | 'square'
  get rowCount() { }      // Number of rows
  get totalPads() { }     // Total number of pads
  getRowLength(row) { }   // Pads in a specific row

  // Coordinate Conversion
  getPadIndex(row, col) { }    // (row, col) → pad index
  getRowCol(padIndex) { }      // pad index → {row, col}

  // MIDI Mapping
  getMidiNote(row, col, baseMidi) { }  // Get MIDI note for pad

  // Grid Geometry (for rendering)
  getCellCenter(row, col, padding) { }  // Get SVG coordinates
  getViewBox(orientation) { }           // Get SVG viewBox

  // Neighbors & Distance
  getNeighbors(row, col) { }            // Get adjacent pads
  getGridDistance(row1, col1, row2, col2) { }  // Distance between pads

  // Grid Modes (optional)
  setGridMode(mode) { }    // 'intervals' | 'chromatic' (if supported)
  getGridMode() { }

  // Developer/Programmer Mode (optional)
  async enterProgrammerMode() { }
  async exitProgrammerMode() { }
  highlightPads(padIndices, color) { }  // LED control
}
```

#### DeviceCapabilities
Describes what features a device supports:

```javascript
const DeviceCapabilities = {
  hasDevMode: boolean,        // Supports developer/programmer mode
  hasLEDControl: boolean,     // Can control pad LEDs
  supportsSysEx: boolean,     // Supports SysEx messages
  gridType: 'hex' | 'square', // Grid shape
  layoutModes: string[],      // Supported layouts (e.g., ['intervals', 'chromatic'])
  hasPadId: boolean           // Pads send unique IDs (vs MIDI notes)
}
```

### 2. Device Implementations

#### ExquisDevice
- **Grid**: 11-row hex grid (alternating 6/5 pads = 61 total)
- **Layout modes**: 'intervals' (musical thirds), 'chromatic' (sequential)
- **Developer Mode**: SysEx to enable pad ID mode on channel 16
- **SysEx**: `F0 00 21 7E 7F 00 01 F7` (enter), `F0 00 21 7E 7F 00 00 F7` (exit)
- **Geometry**: Pointy-top hexagons, specific spacing

#### LaunchpadXDevice
- **Grid**: 8x8 square grid (64 pads)
- **Layout**: Chromatic only
- **Programmer Mode**: SysEx to enable direct pad control
- **SysEx**: `F0 00 20 29 02 0C 0E 01 F7` (enter programmer mode)
- **Geometry**: Square pads in grid layout

#### LaunchpadProMk1Device
- **Grid**: 8x8 square grid (64 pads)
- **Layout**: Chromatic only
- **Programmer Mode**: Original Launchpad Pro SysEx protocol
- **SysEx**: Different from Launchpad X (see Mk1 programmer reference)
- **Geometry**: Square pads in grid layout

### 3. Directory Structure

```
src/
├── core/
│   ├── grid.js                  # DEPRECATED - use device instances
│   ├── midi.js                  # MIDIManager (device-agnostic)
│   ├── exquis-devmode.js        # Move to devices/exquis/
│   └── ...
├── devices/
│   ├── base-device.js           # BaseDevice abstract class
│   ├── device-factory.js        # Device detection & instantiation
│   ├── exquis/
│   │   ├── exquis-device.js     # ExquisDevice implementation
│   │   ├── exquis-geometry.js   # Hex grid geometry
│   │   └── exquis-devmode.js    # Developer Mode (moved from core/)
│   ├── launchpad-x/
│   │   ├── launchpad-x-device.js
│   │   └── launchpad-x-geometry.js
│   └── launchpad-pro-mk1/
│       ├── launchpad-pro-mk1-device.js
│       └── launchpad-pro-mk1-geometry.js
├── app.js                       # Updated to use device abstraction
└── ...
```

### 4. Migration Strategy

#### Phase 2.1: Create Abstraction Layer (No Breaking Changes)
1. Create `src/devices/base-device.js` abstract class
2. Create `src/devices/exquis/exquis-device.js` wrapping existing grid.js
3. Keep `src/core/grid.js` as-is (calls through to ExquisDevice)
4. Add device factory pattern

#### Phase 2.2: Implement Launchpad Support
1. Implement `LaunchpadXDevice` and `LaunchpadProMk1Device`
2. Add device selector UI
3. Update app.js to use device abstraction

#### Phase 2.3: Deprecate grid.js
1. Refactor app.js to use device instances directly
2. Mark grid.js as deprecated
3. Optional: Remove grid.js in future release

### 5. App.js Integration

```javascript
import { DeviceFactory } from './devices/device-factory.js';

class ExquisFingerings {
  constructor() {
    // Detect or select device
    this.device = DeviceFactory.create('exquis'); // or 'launchpad-x', 'launchpad-pro-mk1'

    // Use device methods instead of grid.js functions
    const rowCount = this.device.rowCount;
    const padIndex = this.device.getPadIndex(row, col);
    const {row, col} = this.device.getRowCol(padIndex);

    // Renderer uses device geometry
    this.gridRenderer.setDevice(this.device);
  }
}
```

### 6. Rendering Abstraction

GridRenderer needs to support both hex and square grids:

```javascript
class GridRenderer {
  setDevice(device) {
    this.device = device;
    this.gridType = device.gridType;
  }

  render() {
    if (this.gridType === 'hex') {
      this._renderHexGrid();
    } else {
      this._renderSquareGrid();
    }
  }
}
```

## Implementation Plan

### Week 1: Abstraction Layer
- [ ] Create BaseDevice abstract class
- [ ] Extract Exquis grid logic into ExquisDevice
- [ ] Create device factory
- [ ] Update imports (backward compatible)

### Week 2: Launchpad Support
- [ ] Implement LaunchpadXDevice
- [ ] Implement LaunchpadProMk1Device
- [ ] Research and test SysEx protocols
- [ ] Add square grid rendering support

### Week 3: Integration & Testing
- [ ] Add device selector UI
- [ ] Update app.js to use device abstraction
- [ ] Test with all three devices
- [ ] Update documentation

### Week 4: Polish & Deploy
- [ ] Fix bugs from testing
- [ ] Add device auto-detection
- [ ] Build and deploy
- [ ] Update user documentation

## Success Criteria
1. ✅ Exquis functionality unchanged (no regression)
2. ✅ Can switch between devices via UI
3. ✅ Launchpad X programmer mode works
4. ✅ Launchpad Pro Mk1 programmer mode works
5. ✅ All fingering features work on all devices
6. ✅ Code is modular and extensible

## Future Extensions
- Novation Launchpad Mini Mk3
- Novation Launchpad Pro Mk3
- Ableton Push 2/3
- Custom device definitions (JSON config)
