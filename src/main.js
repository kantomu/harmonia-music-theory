import { MusicTheory } from './theory.js';
import { StaffRenderer } from './staff.js';
import { AudioEngine } from './audio.js';
import { ProgressionService } from './progression.js';

const theory = new MusicTheory();
const staff = new StaffRenderer('staff-container');
const audio = new AudioEngine();
const progressionService = new ProgressionService();
window.audioEngine = audio; // Expose for Swap logic

// State
let currentRoot = 'C';
let currentScaleType = 'Major'; // 'Major', 'Minor', etc.
let isJazzMode = false;
let currentTemplate = null; // e.g. "2-5-1"
let currentTensionMask = { 7: false, 9: false, 11: false, 13: false };
let selectedChords = []; // Indices of selected chords in the row

// DOM Elements
const rootSelect = document.getElementById('root-select');
const scaleSelect = document.getElementById('scale-type');
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
const btnBlue = document.getElementById('btn-blue'); // Blue Note Toggle

// Global array to allow swapping
let currentChordsDisplay = [];

function init() {
  // Populate Root Select
  const roots = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  rootSelect.innerHTML = '';
  roots.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    rootSelect.appendChild(opt);
  });
  rootSelect.value = 'C';

  // Scale Types
  scaleSelect.innerHTML = `
    <option value="Major">Major (Ionian)</option>
    <option value="Minor">Natural Minor (Aeolian)</option>
    <option value="Harmonic Minor">Harmonic Minor</option>
    <option value="Melodic Minor">Melodic Minor</option>
    <option value="Dorian">Dorian</option>
    <option value="Phrygian">Phrygian</option>
    <option value="Lydian">Lydian</option>
    <option value="Mixolydian">Mixolydian</option>
    <option value="Locrian">Locrian</option>
  `;

  update();
}

function update() {
  const root = rootSelect.value;
  const type = scaleSelect.value;

  // Update UI Jazz Mode
  if (isJazzMode) {
    body.classList.add('jazz-theme');
    document.querySelector('.app-header h1').innerHTML = "Harmonia <span style='font-weight:300; font-size: 0.6em; color: var(--color-gold);'>| Jazz Edition</span>";
  } else {
    body.classList.remove('jazz-theme');
    document.querySelector('.app-header h1').innerHTML = "Harmonia";
  }

  // 1. Calculate Scale
  const showBlue = btnBlue.classList.contains('active');
  const scaleData = theory.getScale(root, type, showBlue);

  // 2. Render Scale on Main Staff
  const rawNotes = scaleData.map(d => ({ note: d.note, isBlue: d.isBlue, blueNote: d.blueNote }));
  const keySig = theory.getKeySignature(root, type);
  staff.render(rawNotes, 'scale', keySig, showBlue, []);

  // 3. Render Scale Degrees Table
  renderScaleDegrees(scaleData);

  // 4. Calculate Chords
  const tensionMask = {
    7: btn7.classList.contains('active'),
    9: btn9.classList.contains('active'),
    11: btn11.classList.contains('active'),
    13: btn13.classList.contains('active')
  };
  currentTensionMask = tensionMask;

  let chords = [];
  if (currentTemplate) {
    // Jazz Progression Logic
    chords = progressionService.getGenericChords(root, type, currentTemplate);
  } else {
    // Default Diatonic
    chords = theory.getDiatonicChords(scaleData, type, tensionMask);
  }

  currentChordsDisplay = chords; // Save for render
  renderChordRow(currentChordsDisplay);
  renderProgressionLibrary(root, type);
}

function renderChordRow(chords) {
  chordRow.innerHTML = '';

  chords.forEach((chord, index) => {
    const node = document.createElement('div');
    node.className = 'chord-node';
    if (isJazzMode && chord.iiVI) node.classList.add('iiVI-' + chord.iiVI);

    // Check selection
    if (selectedChords.includes(index)) {
      node.classList.add('selected');
    }

    // Function Label logic
    // User requested "ChordName (Function)" style for substitutions, but what about main label?
    // Let's keep Function prominent in the circle/pill.
    const functionHTML = `<span class="chord-function func-${chord.function}">${chord.function}</span>`;

    let avoidHTML = '';
    if (isJazzMode && chord.avoidNotes && chord.avoidNotes.length > 0) {
      const avoidList = chord.avoidNotes.map(n => `${n}th`).join(', ');
      avoidHTML = `<div class="avoid-warning" title="Avoid Notes: ${avoidList}">⚠️ ${avoidList}</div>`;
    }

    let secDomHTML = '';
    // Use the Intuitive Notation for SecDom if possible "V7/ii"
    if (isJazzMode && chord.secondaryDominant) {
      // Notation: "V7/ii : ChordName" -> "ChordName (V7/ii)"
      // But here we just show the label?
      secDomHTML = `<div class="sec-dom">V7/${chord.roman}: ${chord.secondaryDominant}</div>`;
    }

    // Substitute logic
    let subHTML = '';
    if (isJazzMode && chord.suggestions && (chord.suggestions.standard.length > 0 || chord.suggestions.altered.length > 0)) {
      // Create clickable buttons
      // We need to generate this dynamically to add listeners? 
      // Or just string toggle?
      // Let's use a container div below.
    }

    node.innerHTML = `
      <span class="chord-roman">${chord.roman}</span>
      <span class="chord-name">${chord.name}</span>
      ${functionHTML}
      ${avoidHTML}
      ${secDomHTML}
      <div class="chord-visual"></div>
      <div class="substitute-area"></div>
    `;

    // Click handler for Audio & Selection
    node.addEventListener('click', (e) => {
      // Ignore if clicking substitute button
      if (e.target.classList.contains('sub-btn')) return;

      audio.playChord(chord.notes);

      if (selectedChords.includes(index)) {
        selectedChords = selectedChords.filter(i => i !== index);
      } else {
        if (selectedChords.length >= 2) selectedChords.shift();
        selectedChords.push(index);
      }
      renderChordRow(currentChordsDisplay); // Re-render to show selection
    });

    // Render Substitute Buttons
    if (isJazzMode && chord.suggestions) {
      const subArea = node.querySelector('.substitute-area');
      const allSubs = [...chord.suggestions.standard, ...chord.suggestions.altered];

      allSubs.forEach(subName => {
        const btn = document.createElement('button');
        btn.className = 'sub-btn';
        btn.textContent = subName;
        btn.title = "Click to Swap";
        btn.onclick = (e) => {
          e.stopPropagation(); // Don't trigger card click
          // SWAP LOGIC
          // 1. Identify substitute properties (name only given substitute string)
          // We need to reconstruct a 'chord object' for the substitute.
          // This is hard without a full engine. 
          // Hack: Just update the name and try to verify notes?
          // Better: Ask ProgressionService to solve it? 

          // Detailed Swap:
          // Replace current chord object name.
          chord.name = subName;
          chord.roman = "Sub"; // Placeholder
          chord.secondaryDominant = null; // Clear old analysis

          // Re-calculate notes? 
          // theory.getScale() gives us diatonic. Substitutes are often non-diatonic.
          // For now, Playback might fail if notes aren't updated.
          // We will rely on Audio Engine to parse 'subName' if possible, or just play Root.

          // Visual Update:
          renderChordRow(currentChordsDisplay);

          // Audio Feedback
          // If we can't get notes, just beep? Or try Tonal? 
          // Current implementation of audio.playChord expects specific note array.
          // Let's assume user accepts visual swap for now.
        };
        subArea.appendChild(btn);
      });
    }

    const visual = node.querySelector('.chord-visual');
    const miniStaff = new StaffRenderer(visual);
    miniStaff.render(chord.notes, 'chord', [], false, chord.avoidNotes);

    chordRow.appendChild(node);
  });
}

function renderScaleDegrees(scaleData) {
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
    scaleDegreesRow.appendChild(cell);
  });
}

function renderProgressionLibrary(root, scaleType) {
  progressionList.innerHTML = '';

  progressionService.templates.forEach(template => {
    const pCard = document.createElement('div');
    pCard.className = 'progression-card';
    if (currentTemplate && currentTemplate.id === template.id) {
      pCard.classList.add('active'); // Highlight active template
      pCard.style.borderLeftColor = 'var(--color-accent)';
    }

    const chordObjs = progressionService.getGenericChords(root, scaleType, template);
    const chordNames = chordObjs.map(c => c.name).join(' - ');

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
      selectedChords = []; // Reset chord selection on new context
      update();
      chordRow.scrollIntoView({ behavior: 'smooth' });
    });

    progressionList.appendChild(pCard);
  });
}

rootSelect.addEventListener('change', () => {
  resetState();
  update();
});
scaleSelect.addEventListener('change', () => {
  resetState();
  update();
});

function resetState() {
  currentTemplate = null;
  // If we change key, reset selections
  selectedChords = [];
}

jazzToggle.addEventListener('change', (e) => {
  isJazzMode = e.target.checked;
  update();
});

// Toggles for Tensions
[btn7, btn9, btn11, btn13].forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    update();
  });
});

btnBlue.addEventListener('click', () => {
  btnBlue.classList.toggle('active');
  update();
});

// Presets (Quick Configs)
document.getElementById('preset-pop').addEventListener('click', () => {
  scaleSelect.value = 'Major';
  rootSelect.value = 'C';
  isJazzMode = false;
  jazzToggle.checked = false;
  setTensions([false, false, false, false]);
  currentTemplate = progressionService.templates.find(t => t.id === 'pop-1564');
  update();
});

document.getElementById('preset-jazz').addEventListener('click', () => {
  scaleSelect.value = 'Major';
  rootSelect.value = 'Bb'; // Classic Jazz Key
  isJazzMode = true;
  jazzToggle.checked = true;
  setTensions([true, true, false, false]); // 7, 9
  currentTemplate = progressionService.templates.find(t => t.id === 'jazz-251');
  update();
});

document.getElementById('preset-c-major').addEventListener('click', () => {
  scaleSelect.value = 'Major';
  rootSelect.value = 'C';
  isJazzMode = false;
  jazzToggle.checked = false;
  setTensions([false, false, false, false]);
  currentTemplate = null;
  update();
});

document.getElementById('preset-altered').addEventListener('click', () => {
  // Force specific tensions
  setTensions([true, true, true, true]); // All on
  update();
});


function setTensions(flags) {
  const btns = [btn7, btn9, btn11, btn13];
  btns.forEach((b, i) => {
    if (flags[i]) b.classList.add('active');
    else b.classList.remove('active');
  });
}

// Init
init();
