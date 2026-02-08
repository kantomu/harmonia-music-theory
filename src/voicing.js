/**
 * Piano Voicing Engine
 * Shell, Rootless, Drop 2, Quartal, Upper Structure Voicings
 */

import { noteToChromatic } from './scales.js';

// Chord quality to interval mapping (semitones from root)
const CHORD_INTERVALS = {
    'maj7': [0, 4, 7, 11],
    'maj9': [0, 4, 7, 11, 14],
    'maj13': [0, 4, 7, 11, 14, 21],
    '6': [0, 4, 7, 9],
    '6/9': [0, 4, 7, 9, 14],

    'm7': [0, 3, 7, 10],
    'm9': [0, 3, 7, 10, 14],
    'm11': [0, 3, 7, 10, 14, 17],
    'm6': [0, 3, 7, 9],
    'mMaj7': [0, 3, 7, 11],

    '7': [0, 4, 7, 10],
    '9': [0, 4, 7, 10, 14],
    '13': [0, 4, 7, 10, 14, 21],
    '7#11': [0, 4, 7, 10, 18],
    '7b9': [0, 4, 7, 10, 13],
    '7#9': [0, 4, 7, 10, 15],
    '7alt': [0, 4, 6, 10, 13, 15],  // b5, b9, #9

    'm7b5': [0, 3, 6, 10],
    'dim7': [0, 3, 6, 9],
    'aug': [0, 4, 8],
    '7#5': [0, 4, 8, 10]
};

// Note names for MIDI-like numbering
const CHROMATIC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Low Interval Limit (LIL) - Berklee Method
 * Intervals below these MIDI note numbers will sound "muddy"
 * Based on common piano register guidelines
 */
export const LOW_INTERVAL_LIMITS = {
    1: 28,   // Minor 2nd: E1
    2: 40,   // Major 2nd: E2
    3: 40,   // Minor 3rd: E2
    4: 39,   // Major 3rd: Eb2
    5: 34,   // Perfect 4th: Bb1
    6: 34,   // Tritone: Bb1
    7: 22,   // Perfect 5th: Bb0
    8: 27,   // Minor 6th: Eb1
    9: 27,   // Major 6th: Eb1
    10: 27,  // Minor 7th: Eb1
    11: 27   // Major 7th: Eb1
};

/**
 * Check and adjust voicing for Low Interval Limits
 * Transposes up an octave if interval is too low
 */
export function enforceIntervalLimits(voicing, baseOctave = 3) {
    if (voicing.length < 2) return voicing;

    const result = [...voicing];

    for (let i = 1; i < result.length; i++) {
        const prevNote = result[i - 1];
        const currNote = result[i];

        const prevMidi = noteToChromatic(prevNote.note) + (prevNote.octave * 12);
        const currMidi = noteToChromatic(currNote.note) + (currNote.octave * 12);

        const interval = Math.abs(currMidi - prevMidi) % 12;
        const lowerMidi = Math.min(prevMidi, currMidi);

        const limit = LOW_INTERVAL_LIMITS[interval];
        if (limit && lowerMidi < limit) {
            // Transpose the lower note up an octave
            if (prevMidi < currMidi) {
                result[i - 1] = { ...result[i - 1], octave: result[i - 1].octave + 1 };
            } else {
                result[i] = { ...result[i], octave: result[i].octave + 1 };
            }
        }
    }

    return result;
}

/**
 * Close Voicing: Standard stacked thirds from root
 * All notes within one octave, ascending order
 */
export function closeVoicing(root, quality, octave = 4) {
    const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS['maj7'];
    const rootIndex = CHROMATIC.indexOf(root);
    if (rootIndex === -1) return [];

    return intervals.map(interval => ({
        note: CHROMATIC[(rootIndex + interval) % 12],
        octave: octave + Math.floor((rootIndex + interval) / 12)
    }));
}

/**
 * Get chord tones in semitones from root
 */
function getChordTones(quality) {
    return CHORD_INTERVALS[quality] || CHORD_INTERVALS['maj7'];
}

/**
 * Shell Voicing: Root, 3rd, 7th only
 * Ideal for left-hand comping
 */
export function shellVoicing(root, quality, octave = 3) {
    const tones = getChordTones(quality);
    const rootChromatic = noteToChromatic(root);

    // Extract 1, 3, 7 (indices 0, 1, 3)
    const shell = [
        tones[0],  // Root
        tones[1],  // 3rd
        tones[3] || tones[2]  // 7th or 5th if no 7th
    ];

    return shell.map(interval => {
        const chromatic = (rootChromatic + interval) % 12;
        const noteOctave = octave + Math.floor((rootChromatic + interval) / 12);
        return { note: CHROMATIC[chromatic], octave: noteOctave, midiOffset: interval };
    });
}

/**
 * Rootless Voicing Type A: 3-5-7-9
 * Bill Evans style, 3rd on bottom
 */
export function rootlessTypeA(root, quality, octave = 4) {
    const tones = getChordTones(quality);
    const rootChromatic = noteToChromatic(root);

    // 3-5-7-9 pattern
    const voicing = [
        tones[1],      // 3rd
        tones[2] || 7, // 5th
        tones[3] || 10, // 7th
        (tones[4] || tones[1] + 10) % 24  // 9th (or estimate)
    ];

    return voicing.map((interval, i) => {
        const chromatic = (rootChromatic + interval) % 12;
        const noteOctave = octave + Math.floor((rootChromatic + interval) / 12);
        return { note: CHROMATIC[chromatic], octave: noteOctave, midiOffset: interval };
    });
}

/**
 * Rootless Voicing Type B: 7-9-3-5
 * 7th on bottom
 */
export function rootlessTypeB(root, quality, octave = 4) {
    const tones = getChordTones(quality);
    const rootChromatic = noteToChromatic(root);

    // 7-9-3-5 pattern
    const seventh = tones[3] || 10;
    const ninth = (tones[4] || tones[1] + 10) % 24;
    const third = tones[1] + 12;  // Up an octave
    const fifth = (tones[2] || 7) + 12;

    const voicing = [seventh, ninth, third, fifth];

    return voicing.map(interval => {
        const chromatic = (rootChromatic + interval) % 12;
        const adjustedOctave = octave + Math.floor((rootChromatic + interval) / 12);
        return { note: CHROMATIC[chromatic], octave: adjustedOctave, midiOffset: interval };
    });
}

/**
 * Drop 2 Voicing: Take closed voicing, drop 2nd from top down an octave
 * Great for spread voicings and guitar-friendly
 */
export function drop2Voicing(root, quality, octave = 4) {
    const tones = getChordTones(quality);
    const rootChromatic = noteToChromatic(root);

    // Start with closed position (ascending)
    let closed = tones.slice(0, 4);  // Max 4 notes
    if (closed.length < 4) {
        closed = [...closed, closed[0] + 12];  // Add octave if needed
    }

    // Drop 2nd from top (index 2 in 0-3) down an octave
    const dropped = [
        closed[2] - 12,  // Dropped note
        closed[0],
        closed[1],
        closed[3]
    ].sort((a, b) => a - b);

    return dropped.map(interval => {
        const actualInterval = interval < 0 ? interval + 12 : interval;
        const chromatic = ((rootChromatic + actualInterval) % 12 + 12) % 12;
        const noteOctave = octave + Math.floor((rootChromatic + interval) / 12);
        return { note: CHROMATIC[chromatic], octave: noteOctave, midiOffset: actualInterval };
    });
}

/**
 * Quartal Voicing: Stack 4ths
 * Modern jazz sound (McCoy Tyner style)
 */
export function quartalVoicing(root, octave = 4, numNotes = 4) {
    const rootChromatic = noteToChromatic(root);
    const voicing = [];

    for (let i = 0; i < numNotes; i++) {
        const interval = i * 5;  // Perfect 4th = 5 semitones
        const chromatic = (rootChromatic + interval) % 12;
        const noteOctave = octave + Math.floor((rootChromatic + interval) / 12);
        voicing.push({ note: CHROMATIC[chromatic], octave: noteOctave, midiOffset: interval });
    }

    return voicing;
}

/**
 * Upper Structure Triad: Major/minor triad on top of dominant 7th
 * Creates rich altered dominant sounds
 */
export function upperStructure(root, triadRoot, triadQuality = 'major', octave = 4) {
    const rootChromatic = noteToChromatic(root);
    const triadChromatic = noteToChromatic(triadRoot);

    // Base: 3rd and 7th of dominant
    const base = [
        { note: CHROMATIC[(rootChromatic + 4) % 12], octave: octave, midiOffset: 4 },  // 3rd
        { note: CHROMATIC[(rootChromatic + 10) % 12], octave: octave, midiOffset: 10 } // b7
    ];

    // Upper triad
    const triadIntervals = triadQuality === 'major' ? [0, 4, 7] : [0, 3, 7];
    const upper = triadIntervals.map(interval => {
        const chromatic = (triadChromatic + interval) % 12;
        return {
            note: CHROMATIC[chromatic],
            octave: octave + 1,
            midiOffset: ((triadChromatic - rootChromatic + 12) % 12) + interval + 12
        };
    });

    return [...base, ...upper];
}

/**
 * Get all voicing options for a chord
 */
export function getAllVoicings(root, quality) {
    return {
        shell: shellVoicing(root, quality),
        rootlessA: rootlessTypeA(root, quality),
        rootlessB: rootlessTypeB(root, quality),
        drop2: drop2Voicing(root, quality),
        quartal: quartalVoicing(root)
    };
}

/**
 * Voice leading optimizer: Find closest voicing to previous chord
 */
export function optimizeVoiceLeading(prevVoicing, targetRoot, targetQuality) {
    if (!prevVoicing || prevVoicing.length === 0) {
        return rootlessTypeA(targetRoot, targetQuality);
    }

    const options = [
        rootlessTypeA(targetRoot, targetQuality),
        rootlessTypeB(targetRoot, targetQuality),
        drop2Voicing(targetRoot, targetQuality)
    ];

    // Calculate total movement for each option
    const movements = options.map(opt => {
        let total = 0;
        for (let i = 0; i < Math.min(prevVoicing.length, opt.length); i++) {
            const prevMidi = noteToChromatic(prevVoicing[i].note) + (prevVoicing[i].octave * 12);
            const nextMidi = noteToChromatic(opt[i].note) + (opt[i].octave * 12);
            total += Math.abs(nextMidi - prevMidi);
        }
        return total;
    });

    // Return voicing with minimum movement
    const minIdx = movements.indexOf(Math.min(...movements));
    return options[minIdx];
}

/**
 * Convert voicing to note names with octaves (for Tone.js)
 */
export function voicingToNoteNames(voicing) {
    return voicing.map(v => v.note + v.octave);
}

/**
 * Left Hand + Right Hand split for two-handed voicing
 */
export function twoHandVoicing(root, quality, octave = 4) {
    const shell = shellVoicing(root, quality, octave - 1);  // LH: octave lower
    const tensions = rootlessTypeA(root, quality, octave);   // RH: normal

    return {
        leftHand: shell,
        rightHand: tensions.slice(1)  // Skip duplicate 3rd
    };
}
