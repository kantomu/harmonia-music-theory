import './style.css'
import { MusicTheory } from './theory.js'
import { StaffRenderer } from './staff.js'
import { AudioEngine } from './audio.js'
import { ProgressionService } from './progression.js'

document.querySelector('#app').innerHTML = `
  <div class="top-deck">
    <header>
      <h1>Harmonia</h1>
      <span class="subtitle">Jazz Intelligence Engine</span>
    </header>

    <div class="controls-inline">
      <div class="control-group">
        <label>Key Center</label>
        <div class="key-row">
          <select id="root-select"></select>
          <button class="mini-btn" id="btn-enharmonic" title="Enharmonic Toggle">⇄</button>
        </div>
      </div>
      <div class="control-group">
        <label>Scale Type</label>
        <select id="scale-type">
          <option value="Major">Major</option>
          <option value="Minor">Natural Minor</option>
        </select>
      </div>
      
      <!-- New Tension Presets -->
      <div class="control-group">
        <label>Tension Packs</label>
        <div class="preset-row">
           <button class="preset-btn" id="preset-basic">Basic</button>
           <button class="preset-btn" id="preset-jazz">Jazz</button>
           <button class="preset-btn" id="preset-altered">All Tensions</button>
        </div>
      </div>

      <div class="control-group">
        <label>Tensions</label>
        <div class="tension-toggles">
            <button class="circle-btn" data-tension="7">7</button>
            <button class="circle-btn" data-tension="9">9</button>
            <button class="circle-btn" data-tension="11">11</button>
            <button class="circle-btn" data-tension="13">13</button>
        </div>
      </div>
      <div class="control-group">
        <label>Blue Notes (Grace)</label>
        <button class="circle-btn" id="btn-blue">♭</button>
      </div>
    </div>
  </div>

  <div class="staff-container">
    <div id="staff"></div>
  </div>

  <div class="scale-degrees-row" id="scale-degrees"></div>

  <div class="harmony-deck">
    <div class="deck-header">
        <div class="header-left">
            <span class="deck-title">Chord Progression Analysis</span>
            <span class="deck-subtitle">Click Chords to Play & Select</span>
        </div>
        <div class="switch-group" title="Enable Advanced Jazz Intelligence">
             <span class="switch-label">JAZZ MODE</span>
             <label class="toggle-switch">
                <input type="checkbox" id="jazz-mode">
                <span class="slider"></span>
             </label>
        </div>
    </div>
    <div id="chord-row" class="chord-row"></div>
  </div>

  <!-- Progression Library -->
  <div class="progression-deck">
    <div class="deck-header">
        <span class="deck-title">Progression Library</span>
        <span class="deck-subtitle">Curated Recipes for Inspiration</span>
    </div>
    <div id="progression-list" class="progression-list"></div>
  </div>
`

const theory = new MusicTheory();
const mainStaff = new StaffRenderer('staff');
const audio = new AudioEngine();
const progressionService = new ProgressionService(theory);

const rootSelect = document.getElementById('root-select');
const scaleTypeSelect = document.getElementById('scale-type');
const chordRow = document.getElementById('chord-row');
const scaleDegreesRow = document.getElementById('scale-degrees');
const progressionList = document.getElementById('progression-list');
const tensionBtns = document.querySelectorAll('.circle-btn[data-tension]');
const jazzModeToggle = document.getElementById('jazz-mode');
const blueNoteBtn = document.getElementById('btn-blue');
const enharmonicBtn = document.getElementById('btn-enharmonic');

// Presets
const presetBasic = document.getElementById('preset-basic');
const presetJazz = document.getElementById('preset-jazz');
const presetAltered = document.getElementById('preset-altered');

const tensionMask = { 7: false, 9: false, 11: false, 13: false };
let isJazzMode = false;
let showBlueNotes = false;
let selectedChords = []; // Store up to 2 selected chords
let currentTemplate = null; // Store active progression template

const enharmonicPairs = {
  'C#': 'Db', 'Db': 'C#',
  'F#': 'Gb', 'Gb': 'F#',
  'Cb': 'B', 'B': 'Cb'
};

const keys = Object.keys(theory.majorKeys).sort();
keys.forEach(note => {
  const opt = document.createElement('option');
  opt.value = note;
  opt.textContent = note;
  if (note === 'C') opt.selected = true;
  rootSelect.appendChild(opt);
});

// Tension Toggles
tensionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.tension;
    tensionMask[val] = !tensionMask[val];
    updateTensionUI();
    update();
  });
});

function updateTensionUI() {
  tensionBtns.forEach(btn => {
    const val = btn.dataset.tension;
    btn.classList.toggle('active', tensionMask[val]);
  });
}

// Preset Logic
presetBasic.addEventListener('click', () => {
  tensionMask[7] = true; tensionMask[9] = false; tensionMask[11] = false; tensionMask[13] = false;
  updateTensionUI(); update();
});
presetJazz.addEventListener('click', () => {
  tensionMask[7] = true; tensionMask[9] = true; tensionMask[11] = false; tensionMask[13] = true;
  updateTensionUI(); update();
});
presetAltered.addEventListener('click', () => {
  // "All Tensions"
  tensionMask[7] = true; tensionMask[9] = true; tensionMask[11] = true; tensionMask[13] = true;
  updateTensionUI(); update();
});

jazzModeToggle.addEventListener('change', (e) => {
  isJazzMode = e.target.checked;
  update();
});

blueNoteBtn.addEventListener('click', () => {
  showBlueNotes = !showBlueNotes;
  blueNoteBtn.classList.toggle('active', showBlueNotes);
  update();
});

enharmonicBtn.addEventListener('click', () => {
  const current = rootSelect.value;
  if (enharmonicPairs[current]) {
    rootSelect.value = enharmonicPairs[current];
    update();
  }
});

function resetState() {
  selectedChords = [];
  currentTemplate = null;
}

function update() {
  const root = rootSelect.value;
  const type = scaleTypeSelect.value;

  const scaleData = theory.getScale(root, type, showBlueNotes);
  const keySig = theory.getKeySignature(root, type);

  mainStaff.render(scaleData, 'scale', keySig, showBlueNotes);
  renderScaleDegrees(scaleData);

  // Determine what chords to show
  let chords = [];
  if (currentTemplate) {
    // If a template is active, generate chords for it
    chords = progressionService.getGenericChords(root, type, currentTemplate);
  } else {
    // Default Diatonic
    chords = theory.getDiatonicChords(scaleData, type, tensionMask);
  }

  renderChordRow(chords);
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

    const functionHTML = `<span class="chord-function func-${chord.function}">${chord.function}</span>`;

    let avoidHTML = '';
    if (isJazzMode && chord.avoidNotes && chord.avoidNotes.length > 0) {
      const avoidList = chord.avoidNotes.map(n => `${n}th`).join(', ');
      avoidHTML = `<div class="avoid-warning" title="Avoid Notes: ${avoidList}">⚠️ ${avoidList}</div>`;
    }

    let secDomHTML = '';
    if (isJazzMode && chord.secondaryDominant) {
      secDomHTML = `<div class="sec-dom">V7/${chord.roman}: ${chord.secondaryDominant}</div>`;
    }

    node.innerHTML = `
      <span class="chord-roman">${chord.roman}</span>
      <span class="chord-name">${chord.name}</span>
      ${functionHTML}
      ${avoidHTML}
      ${secDomHTML}
      <div class="chord-visual"></div>
    `;

    // Click handler for Audio & Selection
    node.addEventListener('click', () => {
      // Audio
      audio.playChord(chord.notes);

      // Selection for Guide Tones
      // If we want to strictly keep 2 selected:
      if (selectedChords.includes(index)) {
        selectedChords = selectedChords.filter(i => i !== index);
      } else {
        if (selectedChords.length >= 2) selectedChords.shift();
        selectedChords.push(index);
      }
      renderChordRow(chords);
    });

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
    const chordNames = chordObjs.map(c => c.name).join(' - '); // Fixed double suffix

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
scaleTypeSelect.addEventListener('change', () => {
  resetState();
  update();
});

update();
