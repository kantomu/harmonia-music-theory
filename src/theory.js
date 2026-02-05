export class MusicTheory {
    constructor() {
        this.majorKeys = {
            'C': { type: 'sharp', count: 0, accidentals: [] },
            'G': { type: 'sharp', count: 1, accidentals: ['F#'] },
            'D': { type: 'sharp', count: 2, accidentals: ['F#', 'C#'] },
            'A': { type: 'sharp', count: 3, accidentals: ['F#', 'C#', 'G#'] },
            'E': { type: 'sharp', count: 4, accidentals: ['F#', 'C#', 'G#', 'D#'] },
            'B': { type: 'sharp', count: 5, accidentals: ['F#', 'C#', 'G#', 'D#', 'A#'] },
            'F#': { type: 'sharp', count: 6, accidentals: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'] },
            'C#': { type: 'sharp', count: 7, accidentals: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'] },
            'F': { type: 'flat', count: 1, accidentals: ['Bb'] },
            'Bb': { type: 'flat', count: 2, accidentals: ['Bb', 'Eb'] },
            'Eb': { type: 'flat', count: 3, accidentals: ['Bb', 'Eb', 'Ab'] },
            'Ab': { type: 'flat', count: 4, accidentals: ['Bb', 'Eb', 'Ab', 'Db'] },
            'Db': { type: 'flat', count: 5, accidentals: ['Bb', 'Eb', 'Ab', 'Db', 'Gb'] },
            'Gb': { type: 'flat', count: 6, accidentals: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'] },
            'Cb': { type: 'flat', count: 7, accidentals: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'] }
        };

        this.minorKeysMap = {
            'A': 'C', 'E': 'G', 'B': 'D', 'F#': 'A', 'C#': 'E', 'G#': 'B', 'D#': 'F#', 'A#': 'C#',
            'D': 'F', 'G': 'Bb', 'C': 'Eb', 'F': 'Ab', 'Bb': 'Db', 'Eb': 'Gb', 'Ab': 'Cb'
        };

        this.scaleDegreeNames = ['Tonic', 'Supertonic', 'Mediant', 'Subdominant', 'Dominant', 'Submediant', 'Leading Tone'];
        this.scaleDegreeNamesMinor = ['Tonic', 'Supertonic', 'Mediant', 'Subdominant', 'Dominant', 'Submediant', 'Subtonic'];

        this.intervalNames = ['Unison', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'];
        this.intervalNamesMinor = ['Unison', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'];

        this.chordQualities = {
            'Major': ['', 'm', 'm', '', '', 'm', 'dim'],
            'Minor': ['m', 'dim', '', 'm', 'm', '', '']
        };

        this.chord7thQualities = {
            'Major': ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'],
            'Minor': ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7']
        };

        this.chordFunctions = {
            'Major': ['T', 'SD', 'T', 'SD', 'D', 'T', 'D'],
            'Minor': ['T', 'SD', 'T', 'SD', 'D', 'SD', 'D']
        };

        this.tensionRules = {
            'Major': {
                0: { 9: true, 11: false, 13: true, avoidNotes: [11] }, // I
                1: { 9: true, 11: true, 13: true, avoidNotes: [] },     // II
                2: { 9: false, 11: true, 13: false, avoidNotes: [9, 13] }, // III
                3: { 9: true, 11: true, 13: true, avoidNotes: [] },     // IV
                4: { 9: true, 11: false, 13: true, avoidNotes: [11] },  // V
                5: { 9: true, 11: true, 13: false, avoidNotes: [13] },  // VI
                6: { 9: false, 11: true, 13: false, avoidNotes: [9] }   // VII
            },
            'Minor': {
                0: { 9: true, 11: true, 13: false, avoidNotes: [13] }, // Im7
                1: { 9: false, 11: true, 13: false, avoidNotes: [9, 13] }, // IIm7b5
                2: { 9: true, 11: false, 13: true, avoidNotes: [11] }, // bIII
                3: { 9: true, 11: true, 13: true, avoidNotes: [] },    // IVm7
                4: { 9: false, 11: true, 13: false, avoidNotes: [9, 13] }, // Vm7
                5: { 9: true, 11: true, 13: true, avoidNotes: [] },    // bVI
                6: { 9: true, 11: false, 13: true, avoidNotes: [11] }  // bVII
            }
        };

        this.naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        this.chromaticScale = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    }

    getKeySignature(root, mode) {
        if (mode.includes('Minor')) {
            const relMajor = this.minorKeysMap[root];
            if (!relMajor) return this.majorKeys['C'];
            return this.majorKeys[relMajor];
        }
        return this.majorKeys[root] || this.majorKeys['C'];
    }

    sharpen(note) {
        if (note.includes('bb')) return note.replace('bb', 'b');
        if (note.includes('b')) return note.replace('b', '');
        if (note.includes('x')) return note;
        if (note.includes('#')) return note.replace('#', 'x');
        return note + '#';
    }

    flatten(note) {
        if (note.includes('x')) return note.replace('x', '#');
        if (note.includes('##')) return note.replace('##', '#');
        if (note.includes('#')) return note.replace('#', '');
        if (note.includes('bb')) return note + 'b';
        if (note.includes('b')) return note.replace('b', 'bb');
        return note + 'b';
    }

    getChordFunction(index, mode) {
        const ruleKey = mode.includes('Minor') ? 'Minor' : 'Major';
        return this.chordFunctions[ruleKey][index];
    }

    getScaleDegreeInfo(index, mode) {
        const isMinor = mode.includes('Minor');
        return {
            name: isMinor ? this.scaleDegreeNamesMinor[index] : this.scaleDegreeNames[index],
            interval: isMinor ? this.intervalNamesMinor[index] : this.intervalNames[index],
            number: index + 1
        };
    }

    getScale(root, mode, showBlueNotes = false) {
        let baseMode = mode;
        if (mode.includes('Minor')) baseMode = 'Minor';

        const keySig = this.getKeySignature(root, baseMode);
        const accidentals = keySig.accidentals;
        let startNote = root.charAt(0);
        let startIndex = this.naturalNotes.indexOf(startNote);

        const scale = [];
        for (let i = 0; i < 7; i++) {
            let n = this.naturalNotes[(startIndex + i) % 7];
            const sharp = accidentals.find(acc => acc.startsWith(n) && acc.endsWith('#'));
            if (sharp) n = sharp;
            const flat = accidentals.find(acc => acc.startsWith(n) && acc.endsWith('b'));
            if (flat) n = flat;

            const degreeInfo = this.getScaleDegreeInfo(i, mode);
            scale.push({
                note: n,
                isBlue: false,
                blueNote: null,
                degreeName: degreeInfo.name,
                interval: degreeInfo.interval,
                degreeNumber: degreeInfo.number
            });
        }

        if (mode === 'Harmonic Minor') scale[6].note = this.sharpen(scale[6].note);
        if (mode === 'Melodic Minor') {
            scale[5].note = this.sharpen(scale[5].note);
            scale[6].note = this.sharpen(scale[6].note);
        }

        if (showBlueNotes) {
            const majorScale = this.getMajorScale(root);
            const m3 = majorScale[2];
            scale[2].blueNote = this.flatten(m3);
            scale[2].isBlue = true;

            const p5 = majorScale[4];
            scale[4].blueNote = this.flatten(p5);
            scale[4].isBlue = true;

            const M7 = majorScale[6];
            scale[6].blueNote = this.flatten(M7);
            scale[6].isBlue = true;
        }

        return scale;
    }

    getMajorScale(root) {
        const keySig = this.majorKeys[root] || this.majorKeys['C'];
        const accidentals = keySig.accidentals;
        let startNote = root.charAt(0);
        let startIndex = this.naturalNotes.indexOf(startNote);

        const scale = [];
        for (let i = 0; i < 7; i++) {
            let n = this.naturalNotes[(startIndex + i) % 7];
            const sharp = accidentals.find(acc => acc.startsWith(n) && acc.endsWith('#'));
            if (sharp) n = sharp;
            const flat = accidentals.find(acc => acc.startsWith(n) && acc.endsWith('b'));
            if (flat) n = flat;
            scale.push(n);
        }
        return scale;
    }

    getSecondaryDominant(targetRoot, scaleDegreeIndex, quality) {
        if (quality && (quality.includes('dim') || quality.includes('m7b5'))) return null;

        const rootIdx = this.chromaticScale.indexOf(targetRoot);
        if (rootIdx === -1) return null;

        const dominantIdx = (rootIdx + 7) % 12;
        return this.chromaticScale[dominantIdx] + '7';
    }

    getDiatonicChords(scaleNotes, mode, tensionMask = {}) {
        const chords = [];
        const degrees = ["I", "II", "III", "IV", "V", "VI", "VII"];
        const degreesMinor = ["i", "ii", "III", "iv", "v", "VI", "VII"];

        const ruleKey = mode.includes('Minor') ? 'Minor' : 'Major';
        const isMin = mode.includes('Minor');

        for (let i = 0; i < scaleNotes.length; i++) {
            const root = scaleNotes[i].note || scaleNotes[i];
            const chordNotes = [];
            chordNotes.push(root);
            chordNotes.push(scaleNotes[(i + 2) % 7].note || scaleNotes[(i + 2) % 7]);
            chordNotes.push(scaleNotes[(i + 4) % 7].note || scaleNotes[(i + 4) % 7]);

            let qualitySuffix = '';
            if (tensionMask[7]) {
                qualitySuffix = this.chord7thQualities[ruleKey][i] || '7';
                chordNotes.push(scaleNotes[(i + 6) % 7].note || scaleNotes[(i + 6) % 7]);
            } else {
                qualitySuffix = this.chordQualities[ruleKey][i] || '';
            }

            let tensionSuffix = '';
            const rules = this.tensionRules[ruleKey][i];
            const chordFunction = this.getChordFunction(i, mode);

            let treat11asSharp = (chordFunction === 'D');

            if (tensionMask[9] && rules?.[9]) {
                chordNotes.push(scaleNotes[(i + 1) % 7].note || scaleNotes[(i + 1) % 7]);
                tensionSuffix += '(9)';
            }

            if (tensionMask[11]) {
                if (treat11asSharp) {
                    const p4 = scaleNotes[(i + 3) % 7].note || scaleNotes[(i + 3) % 7];
                    const sharp4 = this.sharpen(p4);
                    chordNotes.push(sharp4);
                    tensionSuffix += '(#11)';
                } else if (rules?.[11]) {
                    chordNotes.push(scaleNotes[(i + 3) % 7].note || scaleNotes[(i + 3) % 7]);
                    tensionSuffix += '(11)';
                }
            }

            if (tensionMask[13]) {
                if (rules?.[13]) {
                    chordNotes.push(scaleNotes[(i + 5) % 7].note || scaleNotes[(i + 5) % 7]);
                    tensionSuffix += '(13)';
                }
            }

            const fullName = root + qualitySuffix + tensionSuffix;

            let romanDisp = isMin ? degreesMinor[i] : degrees[i];
            if (qualitySuffix.includes('dim') || qualitySuffix.includes('m7b5')) {
                romanDisp += '°';
            } else if (isMin && i === 2) {
                romanDisp = 'b' + romanDisp;
            } else if (isMin && i === 5) {
                romanDisp = 'b' + romanDisp;
            } else if (isMin && i === 6) {
                romanDisp = 'b' + romanDisp;
            }

            let suggestions = { standard: [], altered: [] };

            let iiVI_role = null;
            if (ruleKey === 'Major') {
                if (i === 1) iiVI_role = 'ii';
                if (i === 4) iiVI_role = 'V';
                if (i === 0) iiVI_role = 'I';
            }

            let secondaryDominant = this.getSecondaryDominant(root, i, qualitySuffix);

            // Substitutes (Simple Trione or Relative)
            // Just placeholder for now, usually computed in ProgressionService/Main
            // BUT: Main.js uses `chord.secondaryDominant` for display.
            // Let's add a `substitutes` array if needed.

            const guideTones = {
                third: chordNotes[1],
                seventh: tensionMask[7] ? chordNotes[3] : null
            };

            chords.push({
                degree: i + 1,
                roman: romanDisp,
                name: fullName,
                root: root,
                quality: qualitySuffix,
                notes: chordNotes,
                suggestions: suggestions,
                iiVI: iiVI_role,
                avoidNotes: rules?.avoidNotes || [],
                secondaryDominant: secondaryDominant,
                guideTones: guideTones,
                function: chordFunction
            });
        }
        return chords;
    }

    // New Method for Intuitive Analysis String
    getAnalysisString(chord, funcLabel) {
        // User request: "F#7 (V7/IV)"
        return `${chord.name} (${funcLabel})`;
    }

    getEnharmonic(note) {
        const enharmonics = {
            'C#': 'Db', 'Db': 'C#',
            'D#': 'Eb', 'Eb': 'D#',
            'F#': 'Gb', 'Gb': 'F#',
            'G#': 'Ab', 'Ab': 'G#',
            'A#': 'Bb', 'Bb': 'A#',
            'B': 'Cb', 'Cb': 'B',
            'E': 'Fb', 'Fb': 'E',
            'B#': 'C', 'C': 'B#',
            'E#': 'F', 'F': 'E#'
        };
        return enharmonics[note] || note;
    }

    // Helper to get notes for arbitrary chord string (e.g. "Em7")
    // Simple parser for Swap Playback
    getChordNotes(chordName, keyCenter) {
        // tonal.js would be better, but we have Tone.js
        // For now, let's just return a placeholder or try to parse root+quality.
        // If it's a Substitute from our existing logic, we might know notes.
        // Actually, let main.js handle note generation via Tonal/Theory if possible.
        // Or just map to degrees if it's simple.

        // Return empty if complex. Audio engine might parse name?
        return [];
    }
}
