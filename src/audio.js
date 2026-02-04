import * as Tone from 'tone';

export class AudioEngine {
    constructor() {
        this.synth = null;
        this.initialized = false;
        this.init();
    }

    async init() {
        // Jazz Piano / Rhodes simulation
        // Using FM Synth or Sampler would be better, but sticking to simple PolySynth for now
        // with slight detune and filter for "warmth"
        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 0.02,
                decay: 0.3,
                sustain: 0.3,
                release: 1.2
            }
        }).toDestination();

        // Add Reverb
        const reverb = new Tone.Reverb({
            decay: 2.5,
            preDelay: 0.1,
            wet: 0.3
        }).toDestination();

        this.synth.connect(reverb);

        // Volume
        this.synth.volume.value = -8;

        this.initialized = true;
    }

    async ensureAudio() {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
    }

    playChord(notes) {
        this.ensureAudio();
        const now = Tone.now();

        // Parse notes (e.g. "C", "D#") and add octave (4)
        // If notes have metadata (objects), extract note name.

        notes.forEach((n, i) => {
            let noteName = (typeof n === 'string') ? n : n.note;
            let time = now + (i * 0.03); // Strum effect

            // Check for Grace Note logic
            if (typeof n === 'object' && n.graceNote) {
                // Grace note logic: Play grace note VERY briefly before main note
                // Slide effect: Play grace note at time X, then main note at X + 0.1
                // Grace note duration short.

                // Add Octave
                const gracePitch = n.graceNote + '4'; // Simplify octave
                const mainPitch = noteName + '4';

                // Play Grace
                this.synth.triggerAttackRelease(gracePitch, "32n", time);

                // Play Main Note (slightly delayed)
                this.synth.triggerAttackRelease(mainPitch, "2n", time + 0.1);
            } else {
                // Normal Note
                // Add octave. Logic needed for correct octave. 
                // Simple assumption: 4th octave.
                const pitch = noteName + '4';
                this.synth.triggerAttackRelease(pitch, "2n", time);
            }
        });
    }

    playScale(scaleNotes) {
        this.ensureAudio();
        const now = Tone.now();
        scaleNotes.forEach((n, i) => {
            const time = now + i * 0.5;
            let noteName = n.note;

            if (n.graceNote) {
                const gracePitch = n.graceNote + '4';
                const mainPitch = noteName + '4';
                this.synth.triggerAttackRelease(gracePitch, "32n", time);
                this.synth.triggerAttackRelease(mainPitch, "4n", time + 0.1);
            } else {
                const pitch = noteName + '4';
                this.synth.triggerAttackRelease(pitch, "4n", time);
            }
        });
    }
}
