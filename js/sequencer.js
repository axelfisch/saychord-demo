// Sequencer Module
class Sequencer {
    constructor() {
        this.sequence = [];
        this.isPlaying = false;
        this.isLooping = false;
        this.tempo = 120;
        this.currentIndex = 0;
        this.playInterval = null;
        this.onSequenceChange = null;
        this.onPlaybackChange = null;
    }

    // Add chord to sequence
    addChord(chord) {
        if (!chord || !chord.symbol) return;
        
        this.sequence.push({
            symbol: chord.symbol,
            notes: chord.notes,
            id: Date.now() + Math.random()
        });
        
        if (this.onSequenceChange) {
            this.onSequenceChange(this.sequence);
        }
    }

    // Remove chord from sequence
    removeChord(id) {
        this.sequence = this.sequence.filter(chord => chord.id !== id);
        
        if (this.onSequenceChange) {
            this.onSequenceChange(this.sequence);
        }
    }

    // Clear sequence
    clear() {
        this.stop();
        this.sequence = [];
        
        if (this.onSequenceChange) {
            this.onSequenceChange(this.sequence);
        }
    }

    // Play sequence
    play() {
        if (this.sequence.length === 0) return;
        
        if (this.isPlaying) {
            this.stop();
        }
        
        this.isPlaying = true;
        this.currentIndex = 0;
        
        // Calculate interval based on tempo (quarter note duration)
        const interval = (60 / this.tempo) * 1000;
        
        const playNext = () => {
            if (!this.isPlaying) return;
            
            const chord = this.sequence[this.currentIndex];
            
            // Play chord
            if (window.audioEngine && chord.notes) {
                window.audioEngine.playChord(chord.notes, interval / 1000);
            }
            
            // Highlight current chord
            if (this.onPlaybackChange) {
                this.onPlaybackChange(this.currentIndex);
            }
            
            // Move to next chord
            this.currentIndex++;
            
            if (this.currentIndex >= this.sequence.length) {
                if (this.isLooping) {
                    this.currentIndex = 0;
                } else {
                    this.stop();
                    return;
                }
            }
            
            // Schedule next chord
            this.playInterval = setTimeout(playNext, interval);
        };
        
        // Start playback
        playNext();
    }

    // Stop playback
    stop() {
        this.isPlaying = false;
        this.currentIndex = 0;
        
        if (this.playInterval) {
            clearTimeout(this.playInterval);
            this.playInterval = null;
        }
        
        if (this.onPlaybackChange) {
            this.onPlaybackChange(-1);
        }
    }

    // Toggle loop
    toggleLoop() {
        this.isLooping = !this.isLooping;
        return this.isLooping;
    }

    // Set tempo
    setTempo(bpm) {
        this.tempo = Math.max(60, Math.min(200, bpm));
    }

    // Get sequence as text
    getSequenceAsText() {
        return this.sequence.map(chord => chord.symbol).join(' - ');
    }

    // Get sequence for MIDI export
    getSequenceData() {
        return this.sequence.map((chord, index) => ({
            time: index * (60 / this.tempo),
            chord: chord.symbol,
            notes: chord.notes,
            duration: 60 / this.tempo
        }));
    }
}

// Export sequencer instance
window.sequencer = new Sequencer();