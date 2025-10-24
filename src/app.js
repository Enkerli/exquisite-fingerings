/**
 * Main Application
 * Wires together all components and manages app state
 */

import { GridRenderer } from './ui/svg-grid.js';
import { midiManager } from './core/midi.js';
import { FingeringPattern, ergoAnalyzer } from './core/fingering.js';
import { getPitchClasses, parseCustomPitchClasses, PITCH_CLASS_SETS } from './core/music.js';
import { savePattern, loadPattern, deletePattern, getPatternNames, saveSettings, loadSettings } from './utils/storage.js';

/**
 * Main App class
 */
class ExquisFingerings {
  constructor() {
    // State
    this.settings = loadSettings();
    this.currentPattern = new FingeringPattern();
    this.currentFinger = 1;
    this.currentHand = 'right';
    this.fingeringMode = false;

    // UI Elements
    this.gridElement = document.getElementById('grid');
    this.gridRenderer = new GridRenderer(this.gridElement);

    // Initialize
    this.initUI();
    this.loadStoredSettings();
    this.render();
  }

  /**
   * Initialize UI event handlers
   */
  initUI() {
    // Orientation
    document.querySelectorAll('input[name="ori"]').forEach(el => {
      el.addEventListener('change', () => {
        this.settings.orientation = el.value;
        this.render();
        saveSettings(this.settings);
      });
    });

    // Labels
    document.querySelectorAll('input[name="lab"]').forEach(el => {
      el.addEventListener('change', () => {
        this.settings.labelMode = el.value;
        this.render();
        saveSettings(this.settings);
      });
    });

    // Key and Set
    document.getElementById('key').addEventListener('change', () => this.render());
    document.getElementById('set').addEventListener('change', (e) => {
      const isCustom = e.target.value === 'custom';
      document.getElementById('customPC').disabled = !isCustom;
      this.render();
    });
    document.getElementById('customPC').addEventListener('input', () => this.render());
    document.getElementById('baseMidi').addEventListener('input', (e) => {
      this.settings.baseMidi = parseInt(e.target.value);
      this.render();
      saveSettings(this.settings);
    });

    // Fingering Mode
    document.getElementById('fingeringMode').addEventListener('change', (e) => {
      this.fingeringMode = e.target.checked;
      document.getElementById('fingeringModeInfo').style.display = this.fingeringMode ? 'block' : 'none';
      document.querySelectorAll('.finger-btn').forEach(btn => {
        btn.disabled = !this.fingeringMode;
      });
      this.render();
    });

    // Hand selection
    document.getElementById('fingeringHand').addEventListener('change', (e) => {
      this.currentHand = e.target.value;
    });

    // Finger buttons
    for (let i = 1; i <= 5; i++) {
      const btn = document.getElementById(`fingBtn${i}`);
      btn.addEventListener('click', () => {
        this.currentFinger = i;
        this.updateFingerButtonState();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.fingeringMode && e.key >= '1' && e.key <= '5') {
        this.currentFinger = parseInt(e.key);
        this.updateFingerButtonState();
      }
    });

    // Clear fingerings
    document.getElementById('clearFingerings').addEventListener('click', () => {
      this.currentPattern.clearAll();
      this.render();
    });

    // Pattern management
    document.getElementById('savePattern').addEventListener('click', () => this.saveCurrentPattern());
    document.getElementById('loadPattern').addEventListener('change', (e) => {
      if (e.target.value) {
        this.loadPatternByName(e.target.value);
      }
    });
    document.getElementById('deletePattern').addEventListener('click', () => this.deleteCurrentPattern());

    // MIDI
    document.getElementById('enableMidi').addEventListener('click', () => this.initMIDI());
    document.getElementById('midiDevice').addEventListener('change', (e) => {
      if (e.target.value) {
        midiManager.selectOutputDevice(e.target.value);
        this.updateMIDIStatus();
      }
    });

    // MIDI Hold Duration
    const holdDurationSlider = document.getElementById('midiHoldDuration');
    const holdDurationValue = document.getElementById('holdDurationValue');
    holdDurationSlider?.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      holdDurationValue.textContent = `${(value / 1000).toFixed(1)}s`;
      midiManager.setHoldDuration(value);
      this.settings.midiHoldDuration = value;
      saveSettings(this.settings);
    });

    // MIDI Octave Range
    const octaveRangeSlider = document.getElementById('midiOctaveRange');
    const octaveRangeValue = document.getElementById('octaveRangeValue');
    octaveRangeSlider?.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      octaveRangeValue.textContent = value === 0 ? '0 (none)' : `±${value}`;
      midiManager.setOctaveRange(value);
      this.settings.midiOctaveRange = value;
      saveSettings(this.settings);
    });

    // MIDI Hold Toggle
    const holdToggle = document.getElementById('midiHoldToggle');
    holdToggle?.addEventListener('change', (e) => {
      if (e.target.checked) {
        midiManager.enableHold();
        this.sendHighlightedNotes();
      } else {
        midiManager.disableHold();
      }
    });

    // MIDI Send Highlighted
    document.getElementById('midiSendHighlighted')?.addEventListener('click', () => {
      this.sendHighlightedNotes();
    });

    // Ergonomics analysis
    document.getElementById('analyzeErgo')?.addEventListener('click', () => {
      this.analyzeErgonomics();
    });

    // Hand size
    document.getElementById('handSize')?.addEventListener('change', (e) => {
      ergoAnalyzer.setHandSize(e.target.value);
      this.settings.handSize = e.target.value;
      saveSettings(this.settings);
    });

    // Grid click handler
    this.gridRenderer.setPadClickHandler((row, col, midiNote, pc) => {
      if (this.fingeringMode) {
        this.handleFingeringClick(row, col);
      } else {
        // Play MIDI note
        midiManager.playNote(midiNote);
      }
    });
  }

  /**
   * Load stored settings
   */
  loadStoredSettings() {
    // Orientation
    document.querySelector(`input[name="ori"][value="${this.settings.orientation}"]`).checked = true;

    // Label mode
    document.querySelector(`input[name="lab"][value="${this.settings.labelMode}"]`).checked = true;

    // Base MIDI
    document.getElementById('baseMidi').value = this.settings.baseMidi;

    // MIDI settings
    const holdDurationSlider = document.getElementById('midiHoldDuration');
    if (holdDurationSlider) {
      holdDurationSlider.value = this.settings.midiHoldDuration;
      document.getElementById('holdDurationValue').textContent = `${(this.settings.midiHoldDuration / 1000).toFixed(1)}s`;
      midiManager.setHoldDuration(this.settings.midiHoldDuration);
    }

    const octaveRangeSlider = document.getElementById('midiOctaveRange');
    if (octaveRangeSlider) {
      octaveRangeSlider.value = this.settings.midiOctaveRange;
      const value = this.settings.midiOctaveRange;
      document.getElementById('octaveRangeValue').textContent = value === 0 ? '0 (none)' : `±${value}`;
      midiManager.setOctaveRange(value);
    }

    // Hand size
    const handSizeSelect = document.getElementById('handSize');
    if (handSizeSelect) {
      handSizeSelect.value = this.settings.handSize;
      ergoAnalyzer.setHandSize(this.settings.handSize);
    }

    // Update pattern list
    this.updatePatternList();
  }

  /**
   * Render the grid
   */
  render() {
    this.gridRenderer.setOrientation(this.settings.orientation);
    this.gridRenderer.setLabelMode(this.settings.labelMode);
    this.gridRenderer.setBaseMidi(this.settings.baseMidi);
    this.gridRenderer.setHighlightedPCs(this.getHighlightedPCs());
    this.gridRenderer.setFingeringPattern(this.currentPattern);
    this.gridRenderer.setFingeringMode(this.fingeringMode);
    this.gridRenderer.render();
  }

  /**
   * Get currently highlighted pitch classes
   */
  getHighlightedPCs() {
    const setType = document.getElementById('set').value;
    if (setType === 'custom') {
      const customPC = document.getElementById('customPC').value;
      return parseCustomPitchClasses(customPC);
    } else {
      const key = document.getElementById('key').value;
      return getPitchClasses(key, setType);
    }
  }

  /**
   * Handle fingering click
   */
  handleFingeringClick(row, col) {
    const existing = this.currentPattern.getFingering(row, col);
    if (existing && existing.hand === this.currentHand && existing.finger === this.currentFinger) {
      // Remove if clicking same fingering
      this.currentPattern.removeFingering(row, col);
    } else {
      // Set new fingering
      this.currentPattern.setFingering(row, col, this.currentHand, this.currentFinger);
    }
    this.render();
  }

  /**
   * Update finger button visual state
   */
  updateFingerButtonState() {
    for (let i = 1; i <= 5; i++) {
      const btn = document.getElementById(`fingBtn${i}`);
      btn.style.opacity = i === this.currentFinger ? '1' : '0.5';
    }
  }

  /**
   * Save current pattern
   */
  saveCurrentPattern() {
    const name = document.getElementById('patternName').value.trim();
    if (!name) {
      alert('Please enter a pattern name');
      return;
    }

    const patternData = {
      ...this.currentPattern.toJSON(),
      key: document.getElementById('key').value,
      set: document.getElementById('set').value,
      baseMidi: this.settings.baseMidi
    };

    savePattern(name, patternData);
    this.updatePatternList();
    document.getElementById('patternName').value = '';
    alert(`Pattern "${name}" saved!`);
  }

  /**
   * Load pattern by name
   */
  loadPatternByName(name) {
    const patternData = loadPattern(name);
    if (!patternData) {
      alert(`Pattern "${name}" not found`);
      return;
    }

    this.currentPattern = FingeringPattern.fromJSON(patternData);
    document.getElementById('key').value = patternData.key;
    document.getElementById('set').value = patternData.set;
    this.settings.baseMidi = patternData.baseMidi;
    document.getElementById('baseMidi').value = patternData.baseMidi;

    this.render();
  }

  /**
   * Delete current pattern
   */
  deleteCurrentPattern() {
    const name = document.getElementById('loadPattern').value;
    if (!name) {
      alert('Please select a pattern to delete');
      return;
    }

    if (!confirm(`Delete pattern "${name}"?`)) return;

    deletePattern(name);
    this.updatePatternList();
    document.getElementById('loadPattern').value = '';
  }

  /**
   * Update pattern list dropdown
   */
  updatePatternList() {
    const select = document.getElementById('loadPattern');
    const names = getPatternNames();

    select.innerHTML = '<option value="">-- Select Pattern --</option>';
    names.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  }

  /**
   * Initialize MIDI
   */
  async initMIDI() {
    try {
      await midiManager.init();
      this.updateMIDIDeviceList();
      this.updateMIDIStatus();
    } catch (err) {
      this.updateMIDIStatus(err.message);
    }
  }

  /**
   * Update MIDI device list
   */
  updateMIDIDeviceList() {
    const select = document.getElementById('midiDevice');
    const devices = midiManager.getOutputDevices();

    select.innerHTML = '<option value="">-- Select device --</option>';
    devices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.id;
      option.textContent = device.name;
      select.appendChild(option);
    });

    select.disabled = devices.length === 0;
  }

  /**
   * Update MIDI status display
   */
  updateMIDIStatus(error = null) {
    const status = midiManager.getStatus();
    const statusEl = document.getElementById('midiStatus');

    if (error) {
      statusEl.textContent = `Error: ${error}`;
      statusEl.className = 'error-box';
    } else if (!status.isSupported) {
      statusEl.textContent = 'WebMIDI not supported (use Chrome/Brave/Edge)';
      statusEl.className = 'warning-box';
    } else if (!status.isInitialized) {
      statusEl.textContent = 'MIDI not initialized';
      statusEl.className = 'warning-box';
    } else if (!status.hasDevice) {
      statusEl.textContent = 'MIDI ready - select a device';
      statusEl.className = 'info-box';
    } else {
      statusEl.textContent = `Connected: ${status.deviceName}`;
      statusEl.className = 'success-box';
    }
  }

  /**
   * Send all highlighted notes via MIDI
   */
  sendHighlightedNotes() {
    const pcs = this.getHighlightedPCs();
    const notes = [];

    // Collect all MIDI notes that match the highlighted PCs
    for (let padIndex = 0; padIndex < 39; padIndex++) {
      const midiNote = this.settings.baseMidi + padIndex;
      const pc = midiNote % 12;
      if (pcs.has(pc)) {
        notes.push(midiNote);
      }
    }

    // Send as chord with stagger
    midiManager.playChord(notes, 100, null, 20);
  }

  /**
   * Analyze ergonomics
   */
  analyzeErgonomics() {
    const result = ergoAnalyzer.analyzePattern(this.currentPattern);

    // Display results
    const resultEl = document.getElementById('ergoResult');
    if (resultEl) {
      resultEl.innerHTML = `
        <div class="score-display">
          <div class="score-label">Ergonomic Score</div>
          <div class="score-value">${result.score}</div>
          <div class="score-recommendation">${result.recommendation}</div>
        </div>
        ${result.issues.length > 0 ? `
          <h4>Issues Found:</h4>
          <ul class="issue-list">
            ${result.issues.map(issue => `<li class="issue-item">${this.formatIssue(issue)}</li>`).join('')}
          </ul>
        ` : '<div class="success-box">No ergonomic issues found!</div>'}
      `;
    }
  }

  /**
   * Format ergonomic issue for display
   */
  formatIssue(issue) {
    switch (issue.type) {
      case 'excessive_stretch':
        return `Excessive stretch between fingers ${issue.fingers.join(' and ')} (${issue.hand} hand)`;
      case 'uncomfortable_stretch':
        return `Uncomfortable stretch between fingers ${issue.fingers.join(' and ')} (${issue.hand} hand)`;
      case 'finger_crossing':
        return `Possible finger crossing: fingers ${issue.fingers.join(' and ')} (${issue.hand} hand)`;
      default:
        return JSON.stringify(issue);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ExquisFingerings();
});
