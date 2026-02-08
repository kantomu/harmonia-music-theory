import { MusicTheory } from './theory.js';
import { StaffRenderer } from './staff.js';
import { AudioEngine } from './audio.js';
import { ProgressionService } from './progression.js';
import { PianoKeyboard, PIANO_STYLES } from './piano.js';
import { CircleOfFifths, COF_STYLES } from './circle-of-fifths.js';
import { SCALE_FORMULAS, SCALE_INFO, CHORD_SCALE_MAP, buildScale, getAvailableScales } from './scales.js';
import { shellVoicing, rootlessTypeA, rootlessTypeB, drop2Voicing, quartalVoicing, closeVoicing, voicingToNoteNames } from './voicing.js';

// Inject component styles
const styleSheet = document.createElement('style');
styleSheet.textContent = PIANO_STYLES + '\n' + COF_STYLES;
document.head.appendChild(styleSheet);

// Core instances
const theory = new MusicTheory();
const staff = new StaffRenderer('staff-container');
const audio = new AudioEngine();
const progressionService = new ProgressionService(theory);

// State
let currentRoot = 'C';
let currentScaleType = 'Major';
let currentVoicingType = 'close';
let isJazzMode = false;
let currentTemplate = null;
let currentTensionMask = { 7: false, 9: false, 11: false, 13: false };
let selectedChords = [];
let currentChordsDisplay = [];
let isDarkMode = false;

// Component instances
let pianoKeyboard = null;
let circleOfFifths = null;

// DOM Elements
const rootSelect = document.getElementById('root-select');
const scaleSelect = document.getElementById('scale-type');
const voicingSelect = document.getElementById('voicing-type');
const chordRow = document.getElementById('chord-row');
const scaleDegreesRow = document.getElementById('scale-degrees');
const progressionList = document.getElementById('progression-list');
const jazzToggle = document.getElementById('jazz-mode');
const body = document.body;

// Tension Buttons
const btn7 = document.getElementById('btn-7');
const btn9 = document.getElementById('btn-9');
const btn11 = document.getElementById('btn-11');
const btn13 = document.getElementById('btn-13');
const btnBlue = document.getElementById('btn-blue');
const btnDark = document.getElementById('btn-dark');
const btnPlayScale = document.getElementById('btn-play-scale');

function init() {
  // Initialize components
  initPiano();
  initCircleOfFifths();
  initEventListeners();
  update();
}

function initPiano() {
  const pianoContainer = document.getElementById('piano-container');
  if (!pianoContainer) return;

  pianoKeyboard = new PianoKeyboard(pianoContainer, {
    octaves: 2,
    startOctave: 4,
    width: 560,
    height: 120,
    showLabels: true,
    onKeyClick: (note) => {
      audio.playChord([note]);
    }
  });
}

function initCircleOfFifths() {
  const cofContainer = document.getElementById('cof-container');
  if (!cofContainer) return;

  circleOfFifths = new CircleOfFifths(cofContainer, {
    size: 260,
    showRelativeMinors: true,
    onKeySelect: (key, isMinor) => {
      // Enharmonic conversion for keys not in dropdown
      const enharmonicMap = {
        'G#': 'Ab',
        'D#': 'Eb',
        'A#': 'Bb'
      };
      const mappedKey = enharmonicMap[key] || key;

      // Update key
      currentRoot = mappedKey;
      rootSelect.value = mappedKey;

      // Only switch to Aeolian if currently on Major (Ionian) and clicked minor circle
      if (isMinor && currentScaleType === 'Major') {
        currentScaleType = 'Aeolian';
        scaleSelect.value = 'Aeolian';
      }

      resetState();
      update();
    }
  });
}

function initEventListeners() {
  // Root and Scale change
  rootSelect?.addEventListener('change', () => {
    currentRoot = rootSelect.value;
    resetState();
    update();
  });

  scaleSelect?.addEventListener('change', () => {
    currentScaleType = scaleSelect.value;
    resetState();
    update();
  });

  voicingSelect?.addEventListener('change', () => {
    currentVoicingType = voicingSelect.value;
    update();
  });

  // Jazz Mode Toggle
  jazzToggle?.addEventListener('change', (e) => {
    isJazzMode = e.target.checked;
    update();
  });

  // Tension Buttons
  [btn7, btn9, btn11, btn13].forEach(btn => {
    btn?.addEventListener('click', () => {
      btn.classList.toggle('active');
      update();
    });
  });

  // Blue Notes Toggle
  btnBlue?.addEventListener('click', () => {
    btnBlue.classList.toggle('active');
    update();
  });

  // Dark Mode Toggle
  btnDark?.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    body.classList.toggle('dark-mode', isDarkMode);
    btnDark.classList.toggle('active', isDarkMode);
  });

  // Play Scale
  // Play Scale
  btnPlayScale?.addEventListener('click', () => {
    const showBlue = btnBlue?.classList.contains('active');
    // Use processed data (Octave + Blue Note substitution)
    const scaleData = getProcessedScaleData(currentRoot, currentScaleType, showBlue);
    audio.playScale(scaleData);
  });

  // Collapse info panel
  document.getElementById('collapse-info')?.addEventListener('click', () => {
    const panel = document.getElementById('info-content');
    if (panel) {
      panel.classList.toggle('collapsed');
    }
  });
}

function resetState() {
  currentTemplate = null;
  selectedChords = [];
}

function update() {
  updateUITheme();
  updateScale();
  updateChords();
  updatePiano();
  updateCircleOfFifths();
  updateANSChart();
  updateProgressionLibrary();
  updateInfoPanel();
}

function updateUITheme() {
  if (isJazzMode) {
    body.classList.add('jazz-theme');
  } else {
    body.classList.remove('jazz-theme');
  }
}

function getProcessedScaleData(root, type, showBlue) {
  const rawData = theory.getScale(root, type, showBlue);
  const noteMap = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
  let currentOctave = 4;
  let lastVal = -1;

  return rawData.map((d, i) => {
    // Apply Blue Note: if active, use blueNote as the main note for playback/display calculation
    const displayNote = (showBlue && d.isBlue && d.blueNote) ? d.blueNote : d.note;

    // Octave Logic
    const clean = displayNote.replace(/[^A-G]/g, '');
    const val = noteMap[clean] !== undefined ? noteMap[clean] : 0;

    if (i === 0) {
      lastVal = val;
    } else {
      if (val < lastVal) {
        currentOctave++;
      }
      lastVal = val;
    }

    return {
      ...d,
      note: displayNote, // Override 'note' with blue note if active
      octave: currentOctave,
      originalNote: d.note
    };
  });
}

function updateScale() {
  const showBlue = btnBlue?.classList.contains('active');
  const scaleData = getProcessedScaleData(currentRoot, currentScaleType, showBlue);

  // Render staff
  const keySig = theory.getKeySignature(currentRoot, currentScaleType);

  const renderNotes = scaleData.map(d => ({
    note: d.note,
    isBlue: d.isBlue,
    blueNote: d.blueNote,
    octave: d.octave
  }));

  staff.render(renderNotes, 'scale', keySig, showBlue, []);

  // Render scale degrees with octave awareness
  renderScaleDegrees(scaleData);
}

function updateChords() {
  const showBlue = btnBlue?.classList.contains('active');
  const scaleData = theory.getScale(currentRoot, currentScaleType, showBlue);

  currentTensionMask = {
    7: btn7?.classList.contains('active'),
    9: btn9?.classList.contains('active'),
    11: btn11?.classList.contains('active'),
    13: btn13?.classList.contains('active')
  };

  let chords = [];
  if (currentTemplate) {
    chords = progressionService.getGenericChords(currentRoot, currentScaleType, currentTemplate);
  } else {
    chords = theory.getDiatonicChords(scaleData, currentScaleType, currentTensionMask);
  }

  currentChordsDisplay = chords;
  renderChordRow(currentChordsDisplay);
}

function updatePiano() {
  if (!pianoKeyboard) return;

  const showBlue = btnBlue?.classList.contains('active');
  const scaleData = theory.getScale(currentRoot, currentScaleType, showBlue);
  const notes = scaleData.map(d => d.note);

  pianoKeyboard.highlightNotes(notes);
}

function updateCircleOfFifths() {
  if (!circleOfFifths) return;
  circleOfFifths.setKey(currentRoot);
}

function updateANSChart() {
  const ansContainer = document.getElementById('ans-chart');
  if (!ansContainer) return;

  // Get scale info
  const scaleInfo = SCALE_INFO[currentScaleType];
  const formula = SCALE_FORMULAS[currentScaleType];

  if (!scaleInfo || !formula) {
    ansContainer.innerHTML = '<div class="ans-empty">Select a jazz scale for ANS chart</div>';
    return;
  }

  const html = `
        <div class="ans-info">
            <div class="ans-row">
                <span class="ans-label">Parent Scale:</span>
                <span class="ans-value">${scaleInfo.parent}</span>
            </div>
            <div class="ans-row">
                <span class="ans-label">Available Chords:</span>
                <span class="ans-value">${scaleInfo.chords.join(', ')}</span>
            </div>
            <div class="ans-row">
                <span class="ans-label">Avoid Notes:</span>
                <span class="ans-value avoid">${scaleInfo.avoid.length > 0 ? scaleInfo.avoid.map(i => ordinal(i)).join(', ') : 'None'}</span>
            </div>
            <div class="ans-row">
                <span class="ans-label">Character:</span>
                <span class="ans-value">${scaleInfo.color}</span>
            </div>
            <div class="ans-formula">
                <span class="ans-label">Formula:</span>
                <span class="ans-degrees">${formula.map((s, i) => `<span class="degree">${s}</span>`).join('')}</span>
            </div>
        </div>
    `;

  ansContainer.innerHTML = html;
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function updateProgressionLibrary() {
  if (!progressionList) return;

  progressionList.innerHTML = '';

  progressionService.templates.forEach(template => {
    const pCard = document.createElement('div');
    pCard.className = 'progression-card';
    if (currentTemplate && currentTemplate.id === template.id) {
      pCard.classList.add('active');
    }

    const chordObjs = progressionService.getGenericChords(currentRoot, currentScaleType, template);
    const chordNames = chordObjs.map(c => c.name || c.chord).join(' → ');

    pCard.innerHTML = `
            <div class="p-header">
                <span class="p-category cat-${template.category.toLowerCase()}">${template.category}</span>
                <span class="p-title">${template.name}</span>
            </div>
            <div class="p-roman">${template.roman}</div>
            <div class="p-chords">${chordNames}</div>
            <div class="p-desc">${template.description}</div>
        `;

    pCard.addEventListener('click', () => {
      currentTemplate = template;
      selectedChords = [];
      update();
      chordRow?.scrollIntoView({ behavior: 'smooth' });
    });

    progressionList.appendChild(pCard);
  });
}

function updateInfoPanel() {
  // Scale formula
  const formulaEl = document.getElementById('scale-formula');
  if (formulaEl) {
    const formula = SCALE_FORMULAS[currentScaleType];
    if (formula) {
      formulaEl.innerHTML = `<code>${currentScaleType}: ${formula.join(' - ')}</code>`;
    }
  }

  // Chord-scale info
  const csInfo = document.getElementById('chord-scale-info');
  if (csInfo) {
    const availableScales = CHORD_SCALE_MAP['m7'] || [];
    csInfo.innerHTML = `<p>m7 chords: ${availableScales.join(', ')}</p>`;
  }
}

function renderScaleDegrees(scaleData) {
  if (!scaleDegreesRow) return;

  scaleDegreesRow.innerHTML = '';
  scaleData.forEach((noteData) => {
    const cell = document.createElement('div');
    cell.className = 'degree-cell';
    cell.innerHTML = `
            <span class="degree-number">${noteData.degreeNumber}</span>
            <span class="degree-note">${noteData.note}</span>
            <span class="degree-name">${noteData.degreeName}</span>
            <span class="degree-interval">${noteData.interval}</span>
        `;
    cell.addEventListener('click', () => {
      // Play specific note with correct octave
      audio.playChord([{ note: noteData.note, octave: noteData.octave }]);
    });
    scaleDegreesRow.appendChild(cell);
  });
}

// Mini keyboard for chord visualization (starts from lowest note)
function createMiniKeyboard(container, notes) {
  if (!container || !notes || notes.length === 0) return;

  const width = 84;
  const whiteKeyW = 7;
  const blackKeyW = 5;
  const whiteKeyH = 24;
  const blackKeyH = 14;

  // Note to semitone mapping
  const noteToSemi = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };

  // Get all semitones and find the lowest
  const semitones = [];
  notes.forEach(n => {
    const noteName = typeof n === 'string' ? n : n.note || n;
    const clean = noteName.replace(/[0-9]/g, '');
    if (noteToSemi[clean] !== undefined) {
      semitones.push(noteToSemi[clean]);
    }
  });

  if (semitones.length === 0) return;

  // Always start from C (0) to match standard piano layout and main keyboard behavior
  const baseSemi = 0;

  // Calculate highlighted positions relative to base
  const highlighted = new Set();
  semitones.forEach(semi => {
    const relative = (semi - baseSemi + 12) % 12;
    highlighted.add(relative);
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${whiteKeyH}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', whiteKeyH);
  svg.style.display = 'block';
  svg.style.margin = '4px auto 0';

  // White keys (semitone offsets from base: 0, 2, 4, 5, 7, 9, 11)
  const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
  whiteKeys.forEach((semi, i) => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', i * whiteKeyW);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', whiteKeyW - 1);
    rect.setAttribute('height', whiteKeyH);
    rect.setAttribute('fill', highlighted.has(semi) ? '#B8860B' : '#FFF');
    rect.setAttribute('stroke', '#999');
    rect.setAttribute('stroke-width', '0.5');
    svg.appendChild(rect);
  });

  // Black keys (semitone offsets: 1, 3, 6, 8, 10)
  const blackKeys = [
    { semi: 1, pos: 0.65 },
    { semi: 3, pos: 1.65 },
    { semi: 6, pos: 3.65 },
    { semi: 8, pos: 4.65 },
    { semi: 10, pos: 5.65 }
  ];
  blackKeys.forEach(bk => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', bk.pos * whiteKeyW);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', blackKeyW);
    rect.setAttribute('height', blackKeyH);
    rect.setAttribute('fill', highlighted.has(bk.semi) ? '#DAA520' : '#333');
    rect.setAttribute('rx', '1');
    svg.appendChild(rect);
  });

  container.appendChild(svg);
}

function renderChordRow(chords) {
  if (!chordRow) return;
  chordRow.innerHTML = '';

  chords.forEach((chord, index) => {
    if (!chord) return;

    const node = document.createElement('div');
    node.className = 'chord-node';
    if (isJazzMode && chord.iiVI) node.classList.add('iiVI-' + chord.iiVI);
    if (selectedChords.includes(index)) node.classList.add('selected');

    // Function badge
    const functionHTML = chord.function
      ? `<span class="chord-function func-${chord.function}">${chord.function}</span>`
      : '';

    // Avoid notes warning
    let avoidHTML = '';
    if (isJazzMode && chord.avoidNotes?.length > 0) {
      const avoidList = chord.avoidNotes.map(n => `${n}th`).join(', ');
      avoidHTML = `<div class="avoid-warning" title="Avoid: ${avoidList}">⚠️ ${avoidList}</div>`;
    }

    // Secondary dominant
    let secDomHTML = '';
    if (isJazzMode && chord.secondaryDominant) {
      secDomHTML = `<div class="sec-dom">V7/${chord.roman}: ${chord.secondaryDominant}</div>`;
    }

    // Tritone sub indicator
    let subHTML = '';
    if (chord.isTritoneSubstitute) {
      subHTML = '<div class="tritone-badge">TT Sub</div>';
    }

    node.innerHTML = `
            <span class="chord-roman">${chord.roman || ''}</span>
            <span class="chord-name">${chord.name || chord.chord || ''}</span>
            ${functionHTML}
            ${avoidHTML}
            ${secDomHTML}
            ${subHTML}
            <div class="chord-visual"></div>
            <div class="chord-keyboard"></div>
        `;

    // Click handler
    node.addEventListener('click', () => {
      // Get voicing based on selection
      let notes = chord.notes || [];

      if (currentVoicingType !== 'close' && chord.root && chord.quality) {
        switch (currentVoicingType) {
          case 'shell':
            notes = voicingToNoteNames(shellVoicing(chord.root, chord.quality || 'maj7'));
            break;
          case 'rootlessA':
            notes = voicingToNoteNames(rootlessTypeA(chord.root, chord.quality || 'maj7'));
            break;
          case 'rootlessB':
            notes = voicingToNoteNames(rootlessTypeB(chord.root, chord.quality || 'maj7'));
            break;
          case 'drop2':
            notes = voicingToNoteNames(drop2Voicing(chord.root, chord.quality || 'maj7'));
            break;
          case 'quartal':
            notes = voicingToNoteNames(quartalVoicing(chord.root));
            break;
        }
      }

      audio.playChord(notes);

      // Toggle selection
      if (selectedChords.includes(index)) {
        selectedChords = selectedChords.filter(i => i !== index);
      } else {
        if (selectedChords.length >= 2) selectedChords.shift();
        selectedChords.push(index);
      }
      renderChordRow(currentChordsDisplay);

      // Highlight on piano - Use voicing notes ("correctly" means specific voicing keys)
      if (pianoKeyboard && notes) {
        pianoKeyboard.highlightNotes(notes);
      }
    });

    // Mini staff visualization - use selected voicing
    const visual = node.querySelector('.chord-visual');
    if (visual && chord.root) {
      let displayNotes = [];

      // Get voicing result based on selected type
      try {
        let voicingResult = [];
        const quality = chord.quality || 'maj7';

        switch (currentVoicingType) {
          case 'close':
            // Use chord.notes directly to preserve correct spelling (e.g. E# vs F)
            // Calculate octaves to ensure ascending pitch
            const noteVals = {
              'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
              'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
              'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11, 'Fb': 4, 'E#': 5, 'B#': 0
            };

            let currentOct = 4;
            let lastVal = -1;

            voicingResult = (chord.notes || []).map(noteName => {
              const clean = noteName.replace(/[0-9]/g, '');
              let val = noteVals[clean];
              if (val === undefined) val = 0; // fallback

              // If note went down (e.g. B -> C), bump octave
              // Also handle edge cases like C -> C (unison)
              if (val < lastVal) {
                currentOct++;
              }
              lastVal = val;

              return { note: clean, octave: currentOct };
            });
            break;
          case 'shell':
            voicingResult = shellVoicing(chord.root, quality);
            break;
          case 'rootlessA':
            voicingResult = rootlessTypeA(chord.root, quality);
            break;
          case 'rootlessB':
            voicingResult = rootlessTypeB(chord.root, quality);
            break;
          case 'drop2':
            voicingResult = drop2Voicing(chord.root, quality);
            break;
          case 'quartal':
            voicingResult = quartalVoicing(chord.root);
            break;
          default:
            voicingResult = closeVoicing(chord.root, quality);
        }

        // Extract note names with octave info for proper rendering
        if (voicingResult.length > 0) {
          displayNotes = voicingResult.map(v => ({ note: v.note, octave: v.octave }));
        }
      } catch (e) {
        console.warn('Voicing error:', e);
        // Fallback to chord.notes
        displayNotes = chord.notes || [];
      }

      const miniStaff = new StaffRenderer(visual);
      miniStaff.render(displayNotes, 'chord', [], false, chord.avoidNotes || []);

      // Mini keyboard visualization - Show selected voicing (user request: "Voicingによって鍵盤も変わるように")
      const keyboardContainer = node.querySelector('.chord-keyboard');
      createMiniKeyboard(keyboardContainer, displayNotes);
    }

    chordRow.appendChild(node);
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
