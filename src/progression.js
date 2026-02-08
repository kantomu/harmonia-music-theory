/**
 * Enhanced Progression Service with Reharmonization
 * Tritone substitution, secondary dominants, Coltrane changes
 */

import { SCALE_FORMULAS, noteToChromatic, buildScale } from './scales.js';

const CHROMATIC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export class ProgressionService {
    constructor(theoryEngine) {
        this.theory = theoryEngine;

        // Enhanced template library
        this.templates = [
            // Standard Pop/Rock
            {
                id: 'pop-1564',
                name: 'Pop Progression',
                category: 'Standard',
                degrees: [0, 4, 5, 3],
                roman: 'I - V - vi - IV',
                description: 'The most popular progression in modern music.'
            },
            {
                id: 'royal',
                name: 'Royal Road (王道進行)',
                category: 'Standard',
                degrees: [3, 4, 2, 5],
                roman: 'IV - V - iii - vi',
                description: 'The golden ratio of J-POP. Emotional and powerful.'
            },
            {
                id: 'canon',
                name: 'Pachelbel Canon',
                category: 'Standard',
                degrees: [0, 4, 5, 2, 3, 0, 3, 4],
                roman: 'I - V - vi - iii - IV - I - IV - V',
                description: 'Timeless baroque progression.'
            },

            // Jazz Standards
            {
                id: 'jazz-251',
                name: 'Major ii-V-I',
                category: 'Jazz',
                degrees: [1, 4, 0],
                roman: 'ii⁷ - V⁷ - Imaj⁷',
                description: 'The cornerstone of Jazz harmony.'
            },
            {
                id: 'minor-251',
                name: 'Minor ii-V-i',
                category: 'Jazz',
                degrees: [1, 4, 0],
                roman: 'iiø⁷ - V⁷alt - i⁻⁷',
                isMinor: true,
                description: 'Dark and sophisticated resolution.'
            },
            {
                id: 'turnaround',
                name: 'Rhythm Changes Turnaround',
                category: 'Jazz',
                degrees: [0, 5, 1, 4],
                roman: 'I - vi - ii - V',
                description: 'Classic loop for many jazz standards.'
            },
            {
                id: 'backdoor',
                name: 'Backdoor ii-V',
                category: 'Jazz',
                degrees: [3, 6, 0],  // IVm7 - bVII7 - I
                roman: 'iv⁷ - ♭VII⁷ - Imaj⁷',
                isModalInterchange: true,
                description: 'Surprising resolution from the "back door".'
            },

            // Advanced Jazz
            {
                id: 'coltrane',
                name: 'Coltrane Changes (Giant Steps)',
                category: 'Advanced',
                degrees: 'custom',
                roman: 'Bmaj⁷ - D⁷ - Gmaj⁷ - B♭⁷ - E♭maj⁷ - ...',
                description: 'Major 3rd cycle, the ultimate harmonic challenge.'
            },
            {
                id: 'tritone-sub',
                name: 'Tritone Substitution ii-V-I',
                category: 'Advanced',
                degrees: [1, 'tritone', 0],
                roman: 'ii⁷ - ♭II⁷ - Imaj⁷',
                description: 'Chromatic bass line via tritone sub.'
            },

            // Emotional/Cinematic
            {
                id: 'sd-minor',
                name: 'Subdominant Minor',
                category: 'Emotional',
                degrees: [3, '3m', 0],
                roman: 'IVmaj⁷ - iv⁷ - Imaj⁷',
                isModalInterchange: true,
                description: 'Bittersweet Hollywood ending.'
            },
            {
                id: 'deceptive',
                name: 'Deceptive Cadence',
                category: 'Emotional',
                degrees: [0, 4, 5],
                roman: 'I - V - vi',
                description: 'Unexpected turn, prolongs tension.'
            }
        ];
    }

    /**
     * Get tritone substitute for a chord
     * V7 → bII7 (shares same 3rd and 7th)
     */
    getTritoneSubstitute(chordRoot) {
        const rootIdx = noteToChromatic(chordRoot);
        const tritoneIdx = (rootIdx + 6) % 12;
        return CHROMATIC[tritoneIdx] + '7';
    }

    /**
     * Get secondary dominant (V7/X)
     */
    getSecondaryDominant(targetRoot) {
        const targetIdx = noteToChromatic(targetRoot);
        const dominantIdx = (targetIdx + 7) % 12;  // Perfect 5th above
        return CHROMATIC[dominantIdx] + '7';
    }

    /**
     * Get related ii chord for a V7
     */
    getRelatedII(dominantRoot) {
        const domIdx = noteToChromatic(dominantRoot);
        const iiIdx = (domIdx + 5) % 12;  // Perfect 4th above = same as P5 below
        return CHROMATIC[iiIdx] + 'm7';
    }

    /**
     * Generate Coltrane Changes from any starting key
     * Based on major 3rd cycle (divides octave into 3)
     */
    generateColtraneChanges(startKey) {
        const startIdx = noteToChromatic(startKey);
        const chords = [];

        for (let i = 0; i < 3; i++) {
            const keyIdx = (startIdx + i * 4) % 12;  // Major 3rd = 4 semitones
            const root = CHROMATIC[keyIdx];

            // Imaj7: root, 3rd, 5th, 7th
            const maj7Notes = this.getChordNotes(root, 'maj7');
            chords.push({
                name: root + 'maj7',
                chord: root + 'maj7',
                roman: 'I',
                root: root,
                quality: 'maj7',
                notes: maj7Notes,
                function: 'T',
                key: root
            });

            // V7 leading to next key
            const nextKeyIdx = (keyIdx + 4) % 12;
            const v7RootIdx = (nextKeyIdx + 7) % 12;
            const v7Root = CHROMATIC[v7RootIdx];
            const dom7Notes = this.getChordNotes(v7Root, '7');
            chords.push({
                name: v7Root + '7',
                chord: v7Root + '7',
                roman: 'V7/' + CHROMATIC[nextKeyIdx],
                root: v7Root,
                quality: '7',
                notes: dom7Notes,
                function: 'D',
                key: root
            });
        }

        return chords;
    }

    /**
     * Get chord notes from root and quality
     */
    getChordNotes(root, quality) {
        const rootIdx = noteToChromatic(root);
        const intervals = {
            'maj7': [0, 4, 7, 11],
            '7': [0, 4, 7, 10],
            'm7': [0, 3, 7, 10],
            'm7b5': [0, 3, 6, 10],
            'dim7': [0, 3, 6, 9],
            'mMaj7': [0, 3, 7, 11],
            '6': [0, 4, 7, 9],
            'aug': [0, 4, 8]
        };

        const formula = intervals[quality] || intervals['maj7'];
        return formula.map(interval => {
            const noteIdx = (rootIdx + interval) % 12;
            return CHROMATIC[noteIdx];
        });
    }

    /**
     * Apply modal interchange (borrow from parallel minor)
     */
    getModalInterchangeChords(majorKey) {
        const keyIdx = noteToChromatic(majorKey);

        return {
            'iv7': CHROMATIC[(keyIdx + 5) % 12] + 'm7',      // Minor iv
            'bVI': CHROMATIC[(keyIdx + 8) % 12] + 'maj7',    // bVI
            'bVII7': CHROMATIC[(keyIdx + 10) % 12] + '7',    // bVII dominant
            'bIII': CHROMATIC[(keyIdx + 3) % 12] + 'maj7',   // bIII
            'bII': CHROMATIC[(keyIdx + 1) % 12] + 'maj7'     // Neapolitan
        };
    }

    /**
     * Suggest diatonic substitutes for a chord
     */
    getDiatonicSubstitutes(chordDegree, mode = 'Major') {
        // Chords that share 2+ common tones
        const substitutes = {
            'Major': {
                1: [3, 6],   // I can be replaced by iii or vi
                2: [4],      // ii → IV
                3: [1, 5],   // iii → I or V
                4: [2, 6],   // IV → ii or vi
                5: [7],      // V → vii°
                6: [1, 4],   // vi → I or IV
                7: [5]       // vii° → V
            },
            'Minor': {
                1: [3, 6],
                2: [4],
                3: [1, 5],
                4: [2, 6],
                5: [7],
                6: [1, 4],
                7: [5]
            }
        };

        return substitutes[mode]?.[chordDegree] || [];
    }

    /**
     * Analyze a chord progression for ii-V patterns
     */
    analyzeProgression(chords) {
        const analysis = [];

        for (let i = 0; i < chords.length; i++) {
            const chord = chords[i];
            const next = chords[i + 1];
            const afterNext = chords[i + 2];

            let role = null;

            // Check for ii-V-I
            if (next && afterNext) {
                if (this.isMinor7(chord) && this.isDominant7(next) && this.isMajor7(afterNext)) {
                    // Check if intervals match ii-V-I
                    const chordRoot = this.getRoot(chord);
                    const nextRoot = this.getRoot(next);
                    const targetRoot = this.getRoot(afterNext);

                    if (noteToChromatic(nextRoot) === (noteToChromatic(chordRoot) + 5) % 12 &&
                        noteToChromatic(targetRoot) === (noteToChromatic(nextRoot) + 5) % 12) {
                        role = 'ii of ' + targetRoot;
                    }
                }
            }

            // Check for V-I
            if (next && !role) {
                if (this.isDominant7(chord) && (this.isMajor7(next) || this.isMinor7(next))) {
                    const chordRoot = this.getRoot(chord);
                    const nextRoot = this.getRoot(next);
                    if (noteToChromatic(nextRoot) === (noteToChromatic(chordRoot) + 5) % 12) {
                        role = 'V of ' + nextRoot;
                    }
                }
            }

            analysis.push({
                chord: chord,
                role: role,
                index: i
            });
        }

        return analysis;
    }

    // Helper methods
    isMinor7(chord) {
        return chord.includes('m7') && !chord.includes('maj');
    }

    isDominant7(chord) {
        return chord.includes('7') && !chord.includes('m') && !chord.includes('maj');
    }

    isMajor7(chord) {
        return chord.includes('maj7') || chord.includes('M7') || chord.includes('△');
    }

    getRoot(chord) {
        return chord.match(/^[A-G][#b]?/)?.[0] || 'C';
    }

    /**
     * Generate chords for a template in a specific key
     */
    getGenericChords(root, scaleType, template) {
        if (!this.theory) {
            console.warn('Theory engine not initialized');
            return [];
        }

        let effectiveMode = scaleType;
        if (template.isMinor && !scaleType.includes('Minor')) {
            effectiveMode = 'Minor';
        }

        const scaleData = this.theory.getScale(root, effectiveMode);
        const tensionMask = { 7: true, 9: false, 11: false, 13: false };
        const diatonicChords = this.theory.getDiatonicChords(scaleData, effectiveMode, tensionMask);

        // Handle special templates
        if (template.id === 'coltrane') {
            return this.generateColtraneChanges(root);
        }

        const progressionChords = template.degrees.map((deg, idx) => {
            // Handle special degree markers
            if (deg === 'tritone' && idx > 0) {
                const prevChord = diatonicChords[template.degrees[idx - 1]];
                if (prevChord) {
                    const tritoneRoot = this.getTritoneSubstitute(prevChord.root).replace('7', '');
                    const tritoneNotes = this.getChordNotes(tritoneRoot, '7');
                    return {
                        ...prevChord,
                        name: tritoneRoot + '7',
                        root: tritoneRoot,
                        quality: '7',
                        notes: tritoneNotes,
                        roman: '♭II⁷',
                        function: 'D',
                        isTritoneSubstitute: true
                    };
                }
            }

            if (typeof deg === 'string' && deg.endsWith('m')) {
                // Modal interchange (e.g., '3m' for minor version of degree 3)
                const baseDeg = parseInt(deg);
                const chord = diatonicChords[baseDeg];
                if (chord) {
                    const minorNotes = this.getChordNotes(chord.root, 'm7');
                    return {
                        ...chord,
                        name: chord.root + 'm7',
                        quality: 'm7',
                        notes: minorNotes,
                        roman: chord.roman.toLowerCase(),
                        isModalInterchange: true
                    };
                }
            }

            const chord = diatonicChords[deg];
            if (!chord) return null;

            return JSON.parse(JSON.stringify(chord));
        });

        return progressionChords.filter(c => c !== null);
    }
}
