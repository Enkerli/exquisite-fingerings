/**
 * Main Application
 * Wires together all components and manages app state
 */

import { GridRenderer } from './ui/svg-grid.js';
import { midiManager } from './core/midi.js';
import { FingeringPattern, ergoAnalyzer } from './core/fingering.js';
import { getPitchClasses, parseCustomPitchClasses, PITCH_CLASS_SETS } from './core/music.js';
import { getRowCol, getPadIndex } from './core/grid.js';
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

    // Handprint capture state
    this.handprintMode = false;
    this.handprintCaptures = [];  // Current capture in progress
    this.handprintCaptureHand = 'right';  // Selected hand for capture
    this.savedHandprints = this.settings.handprints || [];  // All saved handprints

    // UI Elements
    this.gridElement = document.getElementById('grid');
    this.gridRenderer = new GridRenderer(this.gridElement);

    // Initialize
    this.initUI();
    this.loadStoredSettings();
    this.updatePatternMetadata();
    this.updateHandprintList();
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
    document.getElementById('key').addEventListener('change', () => {
      this.updatePatternMetadata();
      this.render();
      this.updateMIDIHoldIfActive();
    });
    document.getElementById('set').addEventListener('change', (e) => {
      const isCustom = e.target.value === 'custom';
      document.getElementById('customPC').disabled = !isCustom;
      this.updatePatternMetadata();
      this.render();
      this.updateMIDIHoldIfActive();
    });
    document.getElementById('customPC').addEventListener('input', () => {
      this.render();
      this.updateMIDIHoldIfActive();
    });
    document.getElementById('baseMidi').addEventListener('input', (e) => {
      this.settings.baseMidi = parseInt(e.target.value);
      this.render();
      this.updateMIDIHoldIfActive();
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

    // Suggest fingerings
    document.getElementById('suggestFingerings').addEventListener('click', () => {
      this.suggestFingerings();
    });

    // Pattern management
    document.getElementById('savePattern').addEventListener('click', () => this.saveCurrentPattern());
    document.getElementById('loadPattern').addEventListener('change', (e) => {
      if (e.target.value) {
        this.loadPatternByName(e.target.value);
      }
    });
    document.getElementById('deletePattern').addEventListener('click', () => this.deleteCurrentPattern());

    // Export/Import
    document.getElementById('exportPattern').addEventListener('click', () => this.exportPattern());
    document.getElementById('importPatternBtn').addEventListener('click', () => {
      document.getElementById('importPattern').click();
    });
    document.getElementById('importPattern').addEventListener('change', (e) => this.importPattern(e));

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
      const value = e.target.value;
      ergoAnalyzer.setHandSize(value);
      this.settings.handSize = value;
      saveSettings(this.settings);
    });

    // Hand selection for handprint capture
    document.getElementById('selectLeftHand')?.addEventListener('click', () => {
      this.selectHandForCapture('left');
    });

    document.getElementById('selectRightHand')?.addEventListener('click', () => {
      this.selectHandForCapture('right');
    });

    // Start handprint capture
    document.getElementById('startHandprintCapture')?.addEventListener('click', () => {
      this.startHandprintCapture();
    });

    // Export handprints
    document.getElementById('exportHandprints')?.addEventListener('click', () => {
      this.exportHandprints();
    });

    // Clear handprints
    document.getElementById('clearHandprints')?.addEventListener('click', () => {
      this.clearAllHandprints();
    });

    // Fingering type
    document.getElementById('fingeringType')?.addEventListener('change', (e) => {
      this.settings.fingeringType = e.target.value;
      saveSettings(this.settings);
    });

    // Grid click handler
    this.gridRenderer.setPadClickHandler((row, col, midiNote, pc) => {
      if (this.handprintMode) {
        this.handleHandprintClick(row, col);
      } else if (this.fingeringMode) {
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

    // During handprint capture, show the captured fingers on grid
    if (this.handprintMode && this.handprintCaptures.length > 0) {
      const tempPattern = new FingeringPattern('temp_handprint');
      this.handprintCaptures.forEach(cap => {
        tempPattern.setFingering(cap.row, cap.col, this.handprintCaptureHand, cap.finger);
      });
      this.gridRenderer.setFingeringPattern(tempPattern);
    } else {
      this.gridRenderer.setFingeringPattern(this.currentPattern);
    }

    this.gridRenderer.setFingeringMode(this.fingeringMode || this.handprintMode);
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
   * Suggest fingerings for highlighted notes
   */
  suggestFingerings() {
    const pcs = this.getHighlightedPCs();
    if (pcs.size === 0) {
      alert('No notes highlighted. Please select a key and scale/chord first.');
      return;
    }

    // Get all (row, col) positions for highlighted pads
    const highlightedPads = [];
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < (row % 2 === 0 ? 6 : 5); col++) {
        const padIndex = row === 0 ? col : (row % 2 === 1 ? 4 : 3) * row + col;
        const midiNote = this.settings.baseMidi + padIndex;
        const pc = midiNote % 12;
        if (pcs.has(pc)) {
          highlightedPads.push({ row, col });
        }
      }
    }

    if (highlightedPads.length === 0) {
      alert('No pads match the selected notes in the current range.');
      return;
    }

    // Get selected hand
    const hand = document.getElementById('fingeringHand').value;

    // Get suggestions from ErgoAnalyzer
    const suggestions = ergoAnalyzer.suggestFingerings(highlightedPads, hand, this.settings.baseMidi);

    // Clear existing fingerings for this hand
    const existingPads = this.currentPattern.getPadsForHand(hand);
    existingPads.forEach(pad => {
      this.currentPattern.removeFingering(pad.row, pad.col);
    });

    // Apply suggestions
    suggestions.forEach(suggestion => {
      this.currentPattern.setFingering(
        suggestion.row,
        suggestion.col,
        suggestion.hand,
        suggestion.finger
      );
    });

    this.render();
    alert(`Suggested fingerings for ${suggestions.length} pads (${hand} hand)`);
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
   * Export current pattern to JSON file
   */
  exportPattern() {
    if (this.currentPattern.fingerings.size === 0) {
      alert('No fingerings to export. Create a fingering pattern first.');
      return;
    }

    // Update metadata before export
    this.updatePatternMetadata();

    // Update pattern name from input
    const nameInput = document.getElementById('patternName');
    if (nameInput.value.trim()) {
      this.currentPattern.name = nameInput.value.trim();
    }

    // Generate default filename based on metadata if name is "Untitled"
    let filename;
    if (this.currentPattern.name === 'Untitled' || !this.currentPattern.name.trim()) {
      const key = this.currentPattern.metadata.key || 'C';
      const setType = this.currentPattern.metadata.setType || 'major';
      const hand = this.currentHand || 'right';
      // Add timestamp to distinguish multiple attempts at same scale
      const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
      filename = `${key}_${setType}_${hand}_${timestamp}`;
    } else {
      filename = this.currentPattern.name;
    }

    // Create JSON blob
    const json = JSON.stringify(this.currentPattern.toJSON(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create download link and trigger
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Exported "${this.currentPattern.name}" to JSON file`);
  }

  /**
   * Import pattern from JSON file
   */
  importPattern(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const pattern = FingeringPattern.fromJSON(json);

        // Load the imported pattern
        this.currentPattern = pattern;
        document.getElementById('patternName').value = pattern.name;

        // Render and update UI
        this.render();
        alert(`Imported "${pattern.name}" with ${pattern.fingerings.size} fingerings`);

        // Reset file input
        event.target.value = '';
      } catch (err) {
        alert(`Error importing file: ${err.message}`);
        console.error('Import error:', err);
      }
    };

    reader.readAsText(file);
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
   * Update pattern metadata with current key and set type
   */
  updatePatternMetadata() {
    const key = document.getElementById('key').value;
    const setType = document.getElementById('set').value;

    this.currentPattern.metadata.key = key;
    this.currentPattern.metadata.setType = setType;
    this.currentPattern.metadata.modifiedAt = Date.now();
  }

  /**
   * Update MIDI hold when PCS changes
   * If hold mode is active, release old notes and play new ones
   */
  updateMIDIHoldIfActive() {
    const holdToggle = document.getElementById('midiHoldToggle');
    if (holdToggle && holdToggle.checked && midiManager.getStatus().isHolding) {
      // Release old notes
      midiManager.releaseAllNotes();
      // Play new highlighted notes
      this.sendHighlightedNotes();
    }
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

  /**
   * Select hand for handprint capture
   */
  selectHandForCapture(hand) {
    this.handprintCaptureHand = hand;

    // Update button states
    const leftBtn = document.getElementById('selectLeftHand');
    const rightBtn = document.getElementById('selectRightHand');

    if (hand === 'left') {
      leftBtn?.classList.add('active');
      rightBtn?.classList.remove('active');
    } else {
      rightBtn?.classList.add('active');
      leftBtn?.classList.remove('active');
    }
  }

  /**
   * Start handprint capture
   * Auto-enables MIDI if not already enabled
   */
  async startHandprintCapture() {
    // Auto-enable MIDI if not enabled
    if (!midiManager.getStatus().isInitialized) {
      try {
        await midiManager.init();
        this.updateMIDIDeviceList();
        this.updateMIDIStatus();

        // Auto-select first output device if available
        const devices = midiManager.getOutputDevices();
        if (devices.length > 0) {
          midiManager.selectOutputDevice(devices[0].id);
          document.getElementById('midiDevice').value = devices[0].id;
          this.updateMIDIStatus();
        }
      } catch (err) {
        alert(`Cannot enable MIDI: ${err.message}\n\nFallback: You can click pads on the grid instead.`);
      }
    }

    this.handprintMode = true;
    this.handprintCaptures = [];
    this.lastHandprintNoteTime = 0;  // For debouncing

    const statusEl = document.getElementById('handprintCaptureStatus');
    if (statusEl) {
      statusEl.innerHTML = `
        <div style="background:#334; padding:12px; border-radius:4px; margin-top:8px;">
          <strong>Capture Active - ${this.handprintCaptureHand.toUpperCase()} hand</strong><br/>
          <strong style="color:#fa0;">Start at bottom-left pad (0,0)</strong><br/>
          Then press: <strong>👍 1 → 2 → 3 → 4 → 5 🤙</strong>
          <div style="margin-top:8px; font-size:1.2em; color:#6af;">
            <strong id="handprintCounter">Captured: 0/5</strong>
          </div>
        </div>
      `;
    }

    // Listen for MIDI input - only note ON events (velocity > 0)
    midiManager.setNoteHandler((midiNote, velocity) => {
      if (this.handprintMode && velocity > 0) {
        // Debounce rapid note events (prevent note on + off triggering twice)
        const now = Date.now();
        if (now - this.lastHandprintNoteTime > 100) {  // 100ms debounce
          this.lastHandprintNoteTime = now;
          this.handleHandprintMidiNote(midiNote);
        }
      }
    });

    // Change button to Cancel
    const startBtn = document.getElementById('startHandprintCapture');
    startBtn.textContent = 'Cancel Capture';
    startBtn.style.background = '#c44';
  }

  /**
   * Handle MIDI note during handprint capture
   */
  handleHandprintMidiNote(midiNote) {
    if (this.handprintCaptures.length >= 5) return;

    // Convert MIDI note to pad index
    const padIndex = midiNote - this.settings.baseMidi;

    // Convert pad index to (row, col) using proper grid logic
    try {
      const { row, col } = getRowCol(padIndex);

      this.handprintCaptures.push({
        row,
        col,
        padIndex,
        finger: this.handprintCaptures.length + 1,
        timestamp: Date.now()
      });

      // Update counter
      const counterEl = document.getElementById('handprintCounter');
      if (counterEl) {
        counterEl.textContent = `Captured: ${this.handprintCaptures.length}/5`;
      }

      // Visual feedback on grid (show numbered fingers)
      this.render();

      if (this.handprintCaptures.length === 5) {
        this.finishHandprintCapture();
      }
    } catch (err) {
      console.error('Invalid pad index from MIDI note:', midiNote, padIndex, err);
    }
  }

  /**
   * Handle pad click during handprint capture (fallback if no MIDI)
   */
  handleHandprintClick(row, col) {
    if (this.handprintCaptures.length >= 5) return;

    const padIndex = getPadIndex(row, col);

    this.handprintCaptures.push({
      row,
      col,
      padIndex,
      finger: this.handprintCaptures.length + 1,
      timestamp: Date.now()
    });

    // Update counter
    const counterEl = document.getElementById('handprintCounter');
    if (counterEl) {
      counterEl.textContent = `Captured: ${this.handprintCaptures.length}/5 (click)`;
    }

    // Visual feedback on grid (show numbered fingers)
    this.render();

    if (this.handprintCaptures.length === 5) {
      this.finishHandprintCapture();
    }
  }

  /**
   * Complete handprint capture and save with unique ID
   */
  finishHandprintCapture() {
    this.handprintMode = false;
    midiManager.setNoteHandler(null);

    // Calculate all finger-pair distances
    const measurements = {};
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        const pad1 = this.handprintCaptures[i];
        const pad2 = this.handprintCaptures[j];
        const distance = Math.sqrt(
          Math.pow(pad2.row - pad1.row, 2) + Math.pow(pad2.col - pad1.col, 2)
        );
        const key = `${i + 1}-${j + 1}`;
        measurements[key] = distance;
      }
    }

    // Create handprint with unique ID and complete metadata
    const handprintID = `${this.handprintCaptureHand}_${Date.now()}`;
    const handprint = {
      id: handprintID,
      hand: this.handprintCaptureHand,
      orientation: this.settings.orientation,
      baseMidi: this.settings.baseMidi,
      positions: this.handprintCaptures,
      measurements,
      capturedAt: Date.now()
    };

    // Save to settings
    this.savedHandprints.push(handprint);
    this.settings.handprints = this.savedHandprints;
    saveSettings(this.settings);

    // Update UI
    this.updateHandprintList();

    const statusEl = document.getElementById('handprintCaptureStatus');
    if (statusEl) {
      statusEl.innerHTML = `
        <div style="background:#243; padding:12px; border-radius:4px; margin-top:8px; color:#6f6;">
          ✓ Handprint Saved!<br/>
          <strong>ID:</strong> ${handprintID}<br/>
          <strong>Hand:</strong> ${this.handprintCaptureHand}<br/>
          <strong>Measurements:</strong> ${Object.keys(measurements).length} finger pairs
        </div>
      `;

      // Clear status after 3 seconds
      setTimeout(() => {
        statusEl.innerHTML = '';
      }, 3000);
    }

    // Reset button
    const startBtn = document.getElementById('startHandprintCapture');
    startBtn.textContent = 'Start Capture';
    startBtn.style.background = '';

    this.render();
  }

  /**
   * Update handprint list display
   */
  updateHandprintList() {
    const listEl = document.getElementById('handprintList');
    const exportBtn = document.getElementById('exportHandprints');
    const clearBtn = document.getElementById('clearHandprints');

    if (this.savedHandprints.length === 0) {
      listEl.innerHTML = '<div style="opacity:0.7;">No handprints captured yet.</div>';
      exportBtn.style.display = 'none';
      clearBtn.style.display = 'none';
      return;
    }

    listEl.innerHTML = this.savedHandprints.map(hp => {
      const date = new Date(hp.capturedAt);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const orientation = hp.orientation || 'portrait';
      const baseMidi = hp.baseMidi || 48;
      return `
        <div class="handprint-item ${hp.hand}">
          <strong>${hp.hand.toUpperCase()}</strong> hand - ${timeStr}<br/>
          <span style="font-size:0.85em; opacity:0.7;">${orientation} | MIDI ${baseMidi}</span>
        </div>
      `;
    }).join('');

    exportBtn.style.display = 'block';
    clearBtn.style.display = 'block';
  }

  /**
   * Clear all saved handprints
   */
  clearAllHandprints() {
    if (!confirm(`Clear all ${this.savedHandprints.length} saved handprints?\n\nThis cannot be undone!`)) {
      return;
    }

    this.savedHandprints = [];
    this.settings.handprints = [];
    saveSettings(this.settings);

    this.updateHandprintList();
    alert('All handprints cleared.');
  }

  /**
   * Export all handprints to JSON
   */
  exportHandprints() {
    if (this.savedHandprints.length === 0) {
      alert('No handprints to export.');
      return;
    }

    const data = {
      exportedAt: new Date().toISOString(),
      handprints: this.savedHandprints
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `handprints_${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Exported ${this.savedHandprints.length} handprints to JSON file.`);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ExquisFingerings();
});
