/**
 * Device Factory
 * Creates device instances based on type or auto-detection
 */

import { ExquisDevice } from './exquis/exquis-device.js';
import { LaunchpadXDevice } from './launchpad-x/launchpad-x-device.js';
import { LaunchpadProMk1Device } from './launchpad-pro-mk1/launchpad-pro-mk1-device.js';

/**
 * Device type registry
 * Maps device type identifiers to device classes
 */
const DEVICE_REGISTRY = {
  'exquis': ExquisDevice,
  'launchpad-x': LaunchpadXDevice,
  'launchpad-pro-mk1': LaunchpadProMk1Device,
  // Aliases for convenience
  'launchpad-pro': LaunchpadProMk1Device,
  'lp-x': LaunchpadXDevice,
  'lp-pro': LaunchpadProMk1Device
};

/**
 * Device display names for UI
 */
export const DEVICE_NAMES = {
  'exquis': 'Exquis',
  'launchpad-x': 'Launchpad X',
  'launchpad-pro-mk1': 'Launchpad Pro (Mk1)',
  'launchpad-pro': 'Launchpad Pro (Mk1)'
};

/**
 * Device Factory class
 * Handles device creation and auto-detection
 */
export class DeviceFactory {
  /**
   * Create a device instance by type
   * @param {string} deviceType - Device type identifier
   * @returns {BaseDevice} Device instance
   * @throws {Error} If device type is not recognized
   */
  static create(deviceType) {
    const DeviceClass = DEVICE_REGISTRY[deviceType];

    if (!DeviceClass) {
      throw new Error(`Unknown device type: ${deviceType}`);
    }

    return new DeviceClass();
  }

  /**
   * Get list of supported device types
   * @returns {Array<{type: string, name: string}>} Array of device info
   */
  static getSupportedDevices() {
    return [
      { type: 'exquis', name: DEVICE_NAMES['exquis'] },
      { type: 'launchpad-x', name: DEVICE_NAMES['launchpad-x'] },
      { type: 'launchpad-pro-mk1', name: DEVICE_NAMES['launchpad-pro-mk1'] }
    ];
  }

  /**
   * Auto-detect device type from MIDI device name
   * @param {string} midiDeviceName - MIDI device name from WebMIDI
   * @returns {string|null} Device type identifier or null if not recognized
   */
  static detectDevice(midiDeviceName) {
    if (!midiDeviceName) return null;

    const nameLower = midiDeviceName.toLowerCase();

    // Match Exquis
    if (nameLower.includes('exquis')) {
      return 'exquis';
    }

    // Match Launchpad X
    if (nameLower.includes('launchpad') && nameLower.includes('x')) {
      return 'launchpad-x';
    }

    // Match Launchpad Pro (original/Mk1)
    // Note: Mk1 may appear as just "Launchpad Pro"
    if (nameLower.includes('launchpad') && nameLower.includes('pro')) {
      // Check if it's NOT Mk3
      if (!nameLower.includes('mk3') && !nameLower.includes('mk 3')) {
        return 'launchpad-pro-mk1';
      }
    }

    // Default to Exquis if no match (for backward compatibility)
    return null;
  }

  /**
   * Create device instance with auto-detection from MIDI device list
   * @param {Array<{id: string, name: string}>} midiDevices - Available MIDI devices
   * @param {string} preferredType - Preferred device type (optional)
   * @returns {BaseDevice} Device instance
   */
  static createFromMidi(midiDevices, preferredType = null) {
    // If preferred type specified, use it
    if (preferredType) {
      return this.create(preferredType);
    }

    // Try auto-detection from MIDI device names
    for (const device of midiDevices) {
      const detectedType = this.detectDevice(device.name);
      if (detectedType) {
        console.log(`[DeviceFactory] Auto-detected ${detectedType} from MIDI device "${device.name}"`);
        return this.create(detectedType);
      }
    }

    // Default to Exquis for backward compatibility
    console.log('[DeviceFactory] No device detected, defaulting to Exquis');
    return this.create('exquis');
  }

  /**
   * Validate device type
   * @param {string} deviceType - Device type to validate
   * @returns {boolean} True if valid
   */
  static isValidType(deviceType) {
    return deviceType in DEVICE_REGISTRY;
  }

  /**
   * Get device display name
   * @param {string} deviceType - Device type
   * @returns {string} Display name
   */
  static getDisplayName(deviceType) {
    return DEVICE_NAMES[deviceType] || deviceType;
  }
}

/**
 * Export convenience function for creating devices
 * @param {string} deviceType - Device type identifier
 * @returns {BaseDevice} Device instance
 */
export function createDevice(deviceType) {
  return DeviceFactory.create(deviceType);
}
