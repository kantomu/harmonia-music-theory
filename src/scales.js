/**
 * Jazz Scale Library - ANS (Available Note Scale) System
 * Based on Berklee Method and Chord-Scale Theory
 */

// Scale formulas relative to chromatic scale (semitones from root)
export const SCALE_FORMULAS = {
    // Major Modes
    'Ionian': [0, 2, 4, 5, 7, 9, 11],
    'Dorian': [0, 2, 3, 5, 7, 9, 10],
    'Phrygian': [0, 1, 3, 5, 7, 8, 10],
    'Lydian': [0, 2, 4, 6, 7, 9, 11],
    'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'Aeolian': [0, 2, 3, 5, 7, 8, 10],
    'Locrian': [0, 1, 3, 5, 6, 8, 10],

    // Minor Scales
    'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
    'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
    'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],

    // Melodic Minor Modes (Jazz Minor)
    'Dorian b2': [0, 1, 3, 5, 7, 9, 10],           // II of Melodic Minor
    'Lydian Augmented': [0, 2, 4, 6, 8, 9, 11],     // III
    'Lydian Dominant': [0, 2, 4, 6, 7, 9, 10],      // IV
    'Mixolydian b6': [0, 2, 4, 5, 7, 8, 10],        // V
    'Locrian #2': [0, 2, 3, 5, 6, 8, 10],           // VI (Half-Diminished)
    'Altered': [0, 1, 3, 4, 6, 8, 10],              // VII (Super Locrian)

    // Symmetric Scales
    'Whole Tone': [0, 2, 4, 6, 8, 10],
    'Diminished WH': [0, 2, 3, 5, 6, 8, 9, 11],     // Whole-Half (Diminished)
    'Diminished HW': [0, 1, 3, 4, 6, 7, 9, 10],     // Half-Whole (Dominant Dim)

    // Bebop Scales
    'Major Bebop': [0, 2, 4, 5, 7, 8, 9, 11],       // Added #5
    'Dominant Bebop': [0, 2, 4, 5, 7, 9, 10, 11],   // Added natural 7
    'Minor Bebop': [0, 2, 3, 5, 7, 9, 10, 11],      // Dorian + natural 7

    // Blues & Pentatonic
    'Major Pentatonic': [0, 2, 4, 7, 9],
    'Minor Pentatonic': [0, 3, 5, 7, 10],
    'Blues': [0, 3, 5, 6, 7, 10],
    'Mixolydian Blues': [0, 2, 3, 4, 5, 6, 7, 9, 10] // 9-note hybrid
};

// Scale characteristics and applications
export const SCALE_INFO = {
    'Ionian': {
        parent: 'Major',
        degree: 1,
        chords: ['maj7', 'maj9', 'maj13'],
        avoid: [4],  // 11th (F in C)
        color: 'Bright, stable, resolved'
    },
    'Dorian': {
        parent: 'Major',
        degree: 2,
        chords: ['m7', 'm9', 'm11', 'm13'],
        avoid: [],
        color: 'Sophisticated minor, jazzy'
    },
    'Phrygian': {
        parent: 'Major',
        degree: 3,
        chords: ['m7', 'm7b9'],
        avoid: [2, 6],  // b9, b13
        color: 'Dark, Spanish, exotic'
    },
    'Lydian': {
        parent: 'Major',
        degree: 4,
        chords: ['maj7#11', 'maj9#11'],
        avoid: [],
        color: 'Dreamy, floating, ethereal'
    },
    'Mixolydian': {
        parent: 'Major',
        degree: 5,
        chords: ['7', '9', '13'],
        avoid: [4],  // 11th
        color: 'Bluesy dominant, relaxed'
    },
    'Aeolian': {
        parent: 'Major',
        degree: 6,
        chords: ['m7', 'm9', 'm11'],
        avoid: [6],  // b13
        color: 'Natural minor, melancholic'
    },
    'Locrian': {
        parent: 'Major',
        degree: 7,
        chords: ['m7b5', 'ø7'],
        avoid: [2],  // b9
        color: 'Unstable, diminished base'
    },
    'Melodic Minor': {
        parent: 'Melodic Minor',
        degree: 1,
        chords: ['mMaj7', 'mMaj9'],
        avoid: [],
        color: 'Jazz minor, ascending tension'
    },
    'Lydian Dominant': {
        parent: 'Melodic Minor',
        degree: 4,
        chords: ['7#11', '9#11', '13#11'],
        avoid: [],
        color: 'Bright dominant tension'
    },
    'Altered': {
        parent: 'Melodic Minor',
        degree: 7,
        chords: ['7alt', '7b9#9', '7b5#5'],
        avoid: [],
        color: 'Maximum tension, outside'
    },
    'Locrian #2': {
        parent: 'Melodic Minor',
        degree: 6,
        chords: ['m7b5', 'ø9'],
        avoid: [],
        color: 'Half-dim with usable 9th'
    },
    'Diminished HW': {
        parent: 'Symmetric',
        degree: null,
        chords: ['7b9', '7#9', '7#11', '13b9'],
        avoid: [],
        color: 'Dominant with all alterations'
    },
    'Whole Tone': {
        parent: 'Symmetric',
        degree: null,
        chords: ['7#5', '7b5', 'aug'],
        avoid: [],
        color: 'Floating, impressionistic'
    }
};

/**
 * Avoid Note Configuration (Berklee Method)
 * Types: 'avoid' = clashes with chord tone (b9 interval)
 *        'color' = usable tension, adds character
 *        'passing' = use only as passing tone
 */
export const AVOID_NOTE_CONFIG = {
    'Ionian': {
        4: {
            type: 'avoid',
            reason: 'b9 against major 3rd',
            alternative: null
        }
    },
    'Dorian': {
        6: {
            type: 'color',  // Default: color tone (B. Evans school)
            reason: 'Tritone between 3rd and 6th on m7',
            alternative: 'avoid'  // Alternative view (older theory)
        }
    },
    'Phrygian': {
        2: { type: 'avoid', reason: 'b9 = root conflict' },
        6: { type: 'avoid', reason: 'b13 clashes with 5th' }
    },
    'Mixolydian': {
        4: { type: 'avoid', reason: 'b9 against major 3rd' }
    },
    'Aeolian': {
        6: { type: 'avoid', reason: 'b13 clashes with 5th' }
    },
    'Locrian': {
        2: { type: 'avoid', reason: 'b9 against root' }
    }
};

/**
 * Mode Aliases - Alternative names for same scale
 */
export const MODE_ALIASES = {
    'Dorian b2': ['Phrygian ♮6', 'Phrygian #6', 'Javanese'],
    'Lydian Augmented': ['Lydian #5'],
    'Lydian Dominant': ['Overtone Scale', 'Lydian ♭7', 'Acoustic Scale', 'Bartók Scale'],
    'Mixolydian b6': ['Hindu Scale', 'Aeolian Dominant'],
    'Locrian #2': ['Half-Diminished Scale', 'Aeolian b5'],
    'Altered': ['Super Locrian', 'Diminished Whole Tone', 'Ravel Scale'],
    'Diminished HW': ['Octatonic', 'Dominant Diminished'],
    'Diminished WH': ['Octatonic', 'Auxiliary Diminished'],
    'Melodic Minor': ['Jazz Minor', 'Ascending Melodic Minor']
};

// Chord to Scale Mapping (ANS Chart)
export const CHORD_SCALE_MAP = {
    // Major chords
    'maj7': ['Ionian', 'Lydian'],
    'maj9': ['Ionian', 'Lydian'],
    'maj7#11': ['Lydian'],
    '6': ['Ionian', 'Lydian'],
    '6/9': ['Ionian', 'Lydian', 'Major Pentatonic'],

    // Minor chords
    'm7': ['Dorian', 'Aeolian', 'Phrygian'],
    'm9': ['Dorian', 'Aeolian'],
    'm11': ['Dorian'],
    'm13': ['Dorian'],
    'm6': ['Dorian', 'Melodic Minor'],
    'mMaj7': ['Melodic Minor'],

    // Dominant chords
    '7': ['Mixolydian', 'Dominant Bebop', 'Mixolydian Blues'],
    '9': ['Mixolydian'],
    '13': ['Mixolydian', 'Lydian Dominant'],
    '7#11': ['Lydian Dominant'],
    '7alt': ['Altered'],
    '7b9': ['Diminished HW', 'Altered'],
    '7#9': ['Diminished HW', 'Altered'],
    '7b5': ['Whole Tone', 'Altered'],
    '7#5': ['Whole Tone', 'Altered'],
    '7sus4': ['Mixolydian'],

    // Half-diminished
    'm7b5': ['Locrian', 'Locrian #2'],
    'ø7': ['Locrian #2'],

    // Diminished
    'dim7': ['Diminished WH'],
    '°7': ['Diminished WH']
};

// Note names with enharmonic variants
const NOTE_NAMES = {
    sharp: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    flat: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
};

const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/**
 * Get the chromatic index (0-11) for a note name
 */
export function noteToChromatic(noteName) {
    const base = noteName.charAt(0).toUpperCase();
    const mod = noteName.slice(1);

    const baseMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
    let value = baseMap[base] || 0;

    if (mod.includes('#')) value += mod.split('#').length - 1;
    if (mod.includes('x')) value += 2;  // double sharp
    if (mod.includes('b')) value -= mod.split('b').length - 1;

    return ((value % 12) + 12) % 12;
}

/**
 * Build scale notes from root and formula
 */
export function buildScale(root, scaleName) {
    const formula = SCALE_FORMULAS[scaleName];
    if (!formula) return [];

    const rootChromatic = noteToChromatic(root);
    const useFlats = root.includes('b') || ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(root);
    const noteNames = useFlats ? NOTE_NAMES.flat : NOTE_NAMES.sharp;

    return formula.map(interval => {
        const chromatic = (rootChromatic + interval) % 12;
        return noteNames[chromatic];
    });
}

/**
 * Get available scales for a given chord symbol
 */
export function getAvailableScales(chordSymbol) {
    // Parse chord symbol
    const quality = parseChordQuality(chordSymbol);
    return CHORD_SCALE_MAP[quality] || ['Ionian'];
}

/**
 * Parse chord quality from symbol
 */
function parseChordQuality(symbol) {
    // Remove root note
    const root = symbol.match(/^[A-G][#b]?/)?.[0] || 'C';
    const quality = symbol.replace(root, '');

    // Normalize quality
    if (!quality || quality === 'M' || quality === 'maj') return 'maj7';
    if (quality === 'm' || quality === 'min' || quality === '-') return 'm7';
    if (quality.includes('alt')) return '7alt';
    if (quality.includes('dim') || quality === '°') return 'dim7';
    if (quality.includes('ø') || quality.includes('m7b5')) return 'm7b5';

    return quality.replace(/\(.*\)/, ''); // Remove parenthetical tensions
}

/**
 * Get tension notes for a chord degree
 */
export function getTensionInfo(scaleDegree, mode = 'Major') {
    const tensions = {
        'Major': {
            1: { available: [9, 13], avoid: [11] },
            2: { available: [9, 11, 13], avoid: [] },
            3: { available: [11], avoid: [9, 13] },
            4: { available: [9, 11, 13], avoid: [] },
            5: { available: [9, 13], avoid: [11] },
            6: { available: [9, 11], avoid: [13] },
            7: { available: [11], avoid: [9] }
        },
        'Minor': {
            1: { available: [9, 11], avoid: [13] },
            2: { available: [11], avoid: [9, 13] },
            3: { available: [9, 13], avoid: [11] },
            4: { available: [9, 11, 13], avoid: [] },
            5: { available: [11], avoid: [9, 13] },
            6: { available: [9, 11, 13], avoid: [] },
            7: { available: [9, 13], avoid: [11] }
        }
    };

    return tensions[mode]?.[scaleDegree] || { available: [], avoid: [] };
}

/**
 * Calculate characteristic note for a mode
 */
export function getCharacteristicNote(modeName) {
    const chars = {
        'Ionian': null,
        'Dorian': 6,   // Natural 6 in minor
        'Phrygian': 1, // b2
        'Lydian': 4,   // #4
        'Mixolydian': 7, // b7
        'Aeolian': 6,  // b6
        'Locrian': 2,  // b2 and b5
        'Altered': 'all', // All altered
        'Lydian Dominant': 4  // #4
    };
    return chars[modeName];
}
