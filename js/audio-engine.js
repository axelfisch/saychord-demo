// FM Synthesis Audio Engine for Electric Piano Sound
class FMSynthesizer {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.initAudio();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }

    // Note to frequency conversion
    noteToFrequency(note) {
        const notes = {
            'C': 261.63, 'C#': 277.18, 'Db': 277.18,
            'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
            'E': 329.63,
            'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
            'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
            'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
            'B': 493.88
        };
        
        // Parse note and octave
        const noteRegex = /^([A-G][#b]?)(\d)?$/;
        const match = note.match(noteRegex);
        
        if (!match) return 440; // Default to A4
        
        const noteName = match[1];
        const octave = parseInt(match[2] || '4');
        
        const baseFreq = notes[noteName] || 440;
        return baseFreq * Math.pow(2, octave - 4);
    }

    // Create FM operator
    createOperator(frequency, modulationIndex = 0) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        oscillator.connect(gainNode);
        
        return { oscillator, gainNode };
    }

    // Play a single note with FM synthesis
    playNote(note, duration = 0.5) {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const frequency = this.noteToFrequency(note);
        
        // Carrier oscillator
        const carrier = this.createOperator(frequency);
        
        // Modulator oscillator (for FM synthesis)
        const modulator = this.createOperator(frequency * 2);
        const modulationGain = this.audioContext.createGain();
        
        // FM synthesis connections
        modulator.oscillator.connect(modulationGain);
        modulationGain.connect(carrier.oscillator.frequency);
        
        // Set modulation depth
        modulationGain.gain.value = frequency * 0.5;
        
        // ADSR envelope for carrier
        carrier.gainNode.gain.setValueAtTime(0, now);
        carrier.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
        carrier.gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.1); // Decay
        carrier.gainNode.gain.setValueAtTime(0.2, now + duration - 0.1); // Sustain
        carrier.gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Release
        
        // Connect to output
        carrier.gainNode.connect(this.masterGain);
        
        // Start oscillators
        carrier.oscillator.start(now);
        modulator.oscillator.start(now);
        
        // Stop oscillators
        carrier.oscillator.stop(now + duration);
        modulator.oscillator.stop(now + duration);
    }

    // Play a chord
    playChord(notes, duration = 1) {
        if (!this.audioContext) return;

        notes.forEach((note, index) => {
            // Slight delay for strumming effect
            setTimeout(() => {
                this.playNote(note, duration);
            }, index * 30);
        });
    }

    // Resume audio context if suspended
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            return this.audioContext.resume();
        }
        return Promise.resolve();
    }
}

// Export audio engine instance
window.audioEngine = new FMSynthesizer();