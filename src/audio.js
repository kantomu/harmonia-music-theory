import * as Tone from 'tone';

export class AudioEngine {
    constructor() {
        this.synth = null;
        this.initialized = false;
        this.init();
    }

    async init() {
        // High-Quality Piano Sampler (Salamander Grand Piano)
        // Load samples from Tone.js official examples
        this.synth = new Tone.Sampler({
            urls: {
                "A0": "A0.mp3",
                "C1": "C1.mp3",
                "D#1": "Ds1.mp3",
                "F#1": "Fs1.mp3",
                "A1": "A1.mp3",
                "C2": "C2.mp3",
                "D#2": "Ds2.mp3",
                "F#2": "Fs2.mp3",
                "A2": "A2.mp3",
                "C3": "C3.mp3",
                "D#3": "Ds3.mp3",
                "F#3": "Fs3.mp3",
                "A3": "A3.mp3",
                "C4": "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                "A5": "A5.mp3",
                "C6": "C6.mp3",
                "D#6": "Ds6.mp3",
                "F#6": "Fs6.mp3",
                "A6": "A6.mp3",
                "C7": "C7.mp3",
                "D#7": "Ds7.mp3",
                "F#7": "Fs7.mp3",
                "A7": "A7.mp3",
                "C8": "C8.mp3"
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/"
        }).toDestination();

        // Add lighter Reverb for concert hall feel
        const reverb = new Tone.Reverb({
            decay: 2.0,
            preDelay: 0.1,
            wet: 0.2
        }).toDestination();

        this.synth.connect(reverb);

        // Volume adjustment (Sampler can be loud)
        this.synth.volume.value = -5;

        this.initialized = true;
    }

    async ensureAudio() {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        await Tone.loaded(); // Ensure samples are loaded
    }

    playChord(notes) {
        this.ensureAudio().then(() => {
            const now = Tone.now();

            // Notes can be strings ("C4") or objects ({ note: "C", octave: 4 })
            notes.forEach((n, i) => {
                let noteName = (typeof n === 'string') ? n : n.note;

                // Construct pitch with octave
                let pitch;
                if (typeof n === 'object' && n.octave !== undefined) {
                    pitch = n.note + n.octave;
                } else {
                    // Check if string already has octave
                    const hasOctave = /\d+$/.test(noteName);
                    pitch = hasOctave ? noteName : noteName + '4';
                }

                let time = now + (i * 0.03); // Strum effect

                // Check for Grace Note logic
                if (typeof n === 'object' && n.graceNote) {
                    const gracePitch = n.graceNote + (n.octave || '4');

                    // Play Grace
                    this.synth.triggerAttackRelease(gracePitch, "32n", time, 0.6); // velocity 0.6
                    // Play Main Note
                    this.synth.triggerAttackRelease(pitch, "1n", time + 0.1, 0.8);
                } else {
                    // Normal Note - longer duration for piano sustain
                    this.synth.triggerAttackRelease(pitch, "1n", time);
                }
            });
        });
    }

    playScale(scaleNotes) {
        this.ensureAudio().then(() => {
            const now = Tone.now();

            let currentOctave = 4;
            let lastVal = -1;
            const noteMap = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };

            scaleNotes.forEach((n, i) => {
                const time = now + i * 0.5;
                let noteName = n.note;

                // Octave Logic for ascending scale
                let pitch;
                if (n.octave !== undefined) {
                    pitch = n.note + n.octave;
                } else {
                    // Fallback Octave Logic for ascending scale
                    const clean = noteName.replace(/[#bxy]+$/, '');
                    const val = noteMap[clean];

                    if (i === 0) {
                        lastVal = val;
                    } else {
                        if (val < lastVal) {
                            currentOctave++;
                        }
                        lastVal = val;
                    }
                    pitch = noteName + currentOctave;
                }

                if (n.graceNote) {
                    const gracePitch = n.graceNote + currentOctave;
                    const mainPitch = pitch;
                    this.synth.triggerAttackRelease(gracePitch, "32n", time, 0.6);
                    this.synth.triggerAttackRelease(mainPitch, "4n", time + 0.1, 0.8);
                } else {
                    this.synth.triggerAttackRelease(pitch, "4n", time, 0.8);
                }
            });
        });
    }
}
