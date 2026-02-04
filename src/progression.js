export class ProgressionService {
    constructor(theoryEngine) {
        this.theory = theoryEngine;

        // Define Templates (indices are 0-based: I=0, II=1, etc.)
        this.templates = [
            {
                id: 'royal',
                name: 'Royal Road (王道進行)',
                category: 'Standard',
                degrees: [3, 4, 2, 5], // IV-V-IIIm-VIm
                roman: 'IV - V - IIIm - VIm',
                description: 'The golden ratio of J-POP. Emotional and powerful.'
            },
            {
                id: 'canon',
                name: 'Canon (カノン進行)',
                category: 'Standard',
                degrees: [0, 4, 5, 2, 3, 0, 3, 4], // I-V-VIm-IIIm-IV-I-IV-V
                roman: 'I - V - VIm - IIIm...',
                description: 'Timeless, elegant, and nostalgic.'
            },
            {
                id: 'pop-punk',
                name: 'Pop Punk',
                category: 'Standard',
                degrees: [0, 4, 5, 3], // I-V-VIm-IV
                roman: 'I - V - VIm - IV',
                description: 'Energetic and catchy. 2000s vibes.'
            },
            {
                id: 'jazz-251',
                name: 'Standard 2-5-1',
                category: 'Jazz',
                degrees: [1, 4, 0], // IIm7-V7-I
                roman: 'IIm7 - V7 - I\u03947',
                description: 'The cornerstone of Jazz harmony.'
            },
            {
                id: 'minor-251',
                name: 'Minor 2-5-1',
                category: 'Jazz',
                degrees: [1, 4, 0], // IIm7b5-V7alt-Im
                roman: 'IIm7(\u266d5) - V7alt - Im', // Using basic map, will need scale adjustment
                description: 'Dark and sophisticated resolution.'
            },
            {
                id: 'turnaround',
                name: 'Standard Turnaround',
                category: 'Jazz',
                degrees: [0, 5, 1, 4], // I-VI-II-V
                roman: 'I - VI7 - IIm7 - V7',
                description: 'Cyclic progression for looping sections.'
            },
            {
                id: 'sd-minor',
                name: 'Subdominant Minor',
                category: 'Emotional',
                degrees: [3, 3, 0], // IV - IVm - I (Special handling needed for IVm)
                roman: 'IV\u03947 - IVm6 - I\u03947',
                description: 'Bittersweet resolution.'
            },
            {
                id: 'komuro',
                name: 'Komuro (小室進行)',
                category: 'Standard',
                degrees: [5, 3, 4, 0], // VIm - IV - V - I
                roman: 'VIm - IV - V - I',
                description: 'Melancholic yet uplifting.'
            }
        ];
    }

    getModeForProgression(templateId) {
        // Return preferred scale mode for specific progressions
        if (templateId === 'minor-251') return 'Minor';
        return 'Major'; // Default
    }

    getGenericChords(root, scaleType, template) {
        // Basic implementation using current key context
        // Note: Some progressions like SD Minor require borrowing chords (Modal Interchange).
        // For this version in `theory.js`, we only get diatonic chords. 
        // We will need to manually construct "borrowed" chords for SD Minor if we want to support it fully.
        // For now, we will map to the closest diatonic or use a strict mode if simple.

        let effectiveMode = scaleType;
        if (template.id === 'minor-251' && !scaleType.includes('Minor')) {
            // If user is in Major but clicks Minor 2-5-1, we should probably calculate in Parallel Minor?
            // Or just show diatonic to current key? 
            // User request: "Auto-sort or prioritize"
            // For simply generating the chord NAMES, we use the current scale.
        }

        const scaleData = this.theory.getScale(root, effectiveMode);
        // We need a basic tension mask for names (7th by default for Jazz)
        const tensionMask = { 7: true, 9: false, 11: false, 13: false };
        const diatonicChords = this.theory.getDiatonicChords(scaleData, effectiveMode, tensionMask);

        // Map template degrees to actual chords
        const progressionChords = template.degrees.map(degIndex => {
            // Handle special cases for borrowing if possible, otherwise use diatonic
            // For "Subdominant Minor" (IV - IVm - I) -> index 3, 3(minor), 0
            // logic is complex for static lookup. 
            // We will stick to Diatonic mapping for v1 of this library.
            // Exception: If we can modify the chord object name for display

            const chord = diatonicChords[degIndex];
            if (!chord) return null;

            // Clone to avoid reference issues
            let clone = JSON.parse(JSON.stringify(chord));

            // CUSTOM TWEAKS for specific progressions
            if (template.id === 'sd-minor' && // Second chord is IVm
                degIndex === 3 &&
                template.degrees.indexOf(degIndex) === 1 // It's the 2nd one in [3,3,0]
            ) {
                clone.name += "m"; // Hacky visual indication
                clone.roman += "m";
            }

            return clone;
        });

        return progressionChords.filter(c => c !== null);
    }
}
