/**
 * Interactive SVG Piano Keyboard Component
 */

export class PianoKeyboard {
    constructor(containerId, options = {}) {
        this.container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        this.options = {
            octaves: options.octaves || 2,
            startOctave: options.startOctave || 4,
            width: options.width || 600,
            height: options.height || 150,
            showLabels: options.showLabels !== false,
            onKeyClick: options.onKeyClick || null
        };

        this.highlightedNotes = new Set();
        this.svgNS = "http://www.w3.org/2000/svg";
        this.render();
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const svg = document.createElementNS(this.svgNS, "svg");
        svg.setAttribute("viewBox", `0 0 ${this.options.width} ${this.options.height}`);
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.overflow = "visible";

        // Calculate dimensions
        const numWhiteKeys = this.options.octaves * 7;
        const whiteKeyWidth = this.options.width / numWhiteKeys;
        const whiteKeyHeight = this.options.height;
        const blackKeyWidth = whiteKeyWidth * 0.6;
        const blackKeyHeight = whiteKeyHeight * 0.6;

        const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const blackNoteOffsets = [0.7, 1.7, null, 3.7, 4.7, 5.7, null]; // Position relative to white keys
        const blackNotes = ['C#', 'D#', null, 'F#', 'G#', 'A#', null];

        // Draw white keys first
        for (let oct = 0; oct < this.options.octaves; oct++) {
            for (let i = 0; i < 7; i++) {
                const x = (oct * 7 + i) * whiteKeyWidth;
                const noteName = whiteNotes[i];
                const fullNote = noteName + (this.options.startOctave + oct);

                const key = document.createElementNS(this.svgNS, "rect");
                key.setAttribute("x", x);
                key.setAttribute("y", 0);
                key.setAttribute("width", whiteKeyWidth - 2);
                key.setAttribute("height", whiteKeyHeight);
                key.setAttribute("rx", 4);
                key.setAttribute("class", "piano-white-key");
                key.setAttribute("data-note", fullNote);

                if (this.highlightedNotes.has(noteName) || this.highlightedNotes.has(fullNote)) {
                    key.classList.add("highlighted");
                }

                key.addEventListener("click", () => this.handleKeyClick(fullNote));
                key.addEventListener("mouseenter", () => key.classList.add("hover"));
                key.addEventListener("mouseleave", () => key.classList.remove("hover"));

                svg.appendChild(key);

                // Note label
                if (this.options.showLabels) {
                    const label = document.createElementNS(this.svgNS, "text");
                    label.textContent = noteName;
                    label.setAttribute("x", x + whiteKeyWidth / 2 - 1);
                    label.setAttribute("y", whiteKeyHeight - 12);
                    label.setAttribute("class", "piano-label");
                    label.setAttribute("text-anchor", "middle");
                    svg.appendChild(label);
                }
            }
        }

        // Draw black keys
        for (let oct = 0; oct < this.options.octaves; oct++) {
            for (let i = 0; i < 7; i++) {
                if (blackNotes[i] === null) continue;

                const xOffset = blackNoteOffsets[i] * whiteKeyWidth;
                const x = (oct * 7 * whiteKeyWidth) + xOffset - (blackKeyWidth / 2);
                const noteName = blackNotes[i];
                const fullNote = noteName + (this.options.startOctave + oct);

                const key = document.createElementNS(this.svgNS, "rect");
                key.setAttribute("x", x);
                key.setAttribute("y", 0);
                key.setAttribute("width", blackKeyWidth);
                key.setAttribute("height", blackKeyHeight);
                key.setAttribute("rx", 3);
                key.setAttribute("class", "piano-black-key");
                key.setAttribute("data-note", fullNote);

                if (this.highlightedNotes.has(noteName) ||
                    this.highlightedNotes.has(noteName.replace('#', 'b')) ||
                    this.highlightedNotes.has(fullNote)) {
                    key.classList.add("highlighted");
                }

                key.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.handleKeyClick(fullNote);
                });
                key.addEventListener("mouseenter", () => key.classList.add("hover"));
                key.addEventListener("mouseleave", () => key.classList.remove("hover"));

                svg.appendChild(key);
            }
        }

        this.container.appendChild(svg);
        this.svg = svg;
    }

    handleKeyClick(note) {
        if (this.options.onKeyClick) {
            this.options.onKeyClick(note);
        }
    }

    /**
     * Highlight notes from a scale or chord
     * @param {string[]} notes - Array of note names (e.g., ['C', 'E', 'G'])
     */
    highlightNotes(notes, options = {}) {
        this.highlightedNotes.clear();

        notes.forEach(note => {
            // Check if input is object or string
            if (typeof note === 'object' && note.note) {
                // If object has octave, use full note name (e.g. C4), else just note name
                const val = (note.octave !== undefined) ? note.note + note.octave : note.note;
                this.highlightedNotes.add(val);
            } else if (typeof note === 'string') {
                // If string, preserve it as is (C4 stays C4, C stays C)
                // This allows specific octave highlighting
                this.highlightedNotes.add(note);
            }
        });

        this.render();

        // Apply color classes
        if (options.color) {
            this.svg.querySelectorAll('.highlighted').forEach(key => {
                key.style.fill = options.color;
            });
        }
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        this.highlightedNotes.clear();
        this.render();
    }

    /**
     * Highlight with different colors for chord tones vs tensions
     */
    highlightChord(chordTones, tensions = [], rootNote = null) {
        this.highlightedNotes.clear();
        this.render();

        // Highlight chord tones
        this.svg.querySelectorAll('.piano-white-key, .piano-black-key').forEach(key => {
            const noteData = key.getAttribute('data-note');
            const noteName = noteData.replace(/\d+$/, '');

            if (chordTones.includes(noteName)) {
                key.classList.add('highlighted', 'chord-tone');
                if (noteName === rootNote) {
                    key.classList.add('root');
                }
            } else if (tensions.includes(noteName)) {
                key.classList.add('highlighted', 'tension');
            }
        });
    }
}

/**
 * CSS styles for piano keyboard (inject or include in stylesheet)
 */
export const PIANO_STYLES = `
.piano-white-key {
    fill: #FEFEFE;
    stroke: #CCC;
    stroke-width: 1;
    cursor: pointer;
    transition: fill 0.15s ease;
}
.piano-white-key.hover {
    fill: #F0F0F0;
}
.piano-white-key.highlighted {
    fill: var(--color-gold, #C5A059);
}
.piano-white-key.highlighted.root {
    fill: var(--color-accent, #8E443D);
}
.piano-white-key.highlighted.tension {
    fill: #7FB3D5;
}

.piano-black-key {
    fill: #222;
    stroke: #000;
    stroke-width: 1;
    cursor: pointer;
    transition: fill 0.15s ease;
}
.piano-black-key.hover {
    fill: #333;
}
.piano-black-key.highlighted {
    fill: var(--color-gold, #C5A059);
}
.piano-black-key.highlighted.root {
    fill: var(--color-accent, #8E443D);
}
.piano-black-key.highlighted.tension {
    fill: #5DADE2;
}

.piano-label {
    font-size: 10px;
    fill: #666;
    font-family: var(--font-ui, sans-serif);
    pointer-events: none;
}

/* Dark mode overrides */
body.dark-mode .piano-white-key {
    fill: #E8E8E8;
    stroke: #AAA;
}
body.dark-mode .piano-black-key {
    fill: #1A1A1A;
}
body.dark-mode .piano-label {
    fill: #888;
}
`;
