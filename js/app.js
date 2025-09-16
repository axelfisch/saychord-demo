// Main Application Logic
class SayChordApp {
    constructor() {
        this.currentChord = null;
        this.initializeApp();
    }

    initializeApp() {
        // DOM Elements
        this.elements = {
            voiceBtn: document.getElementById('voiceBtn'),
            voiceStatus: document.getElementById('voiceStatus'),
            recognizedText: document.getElementById('recognizedText'),
            currentChord: document.querySelector('.chord-name'),
            playChordBtn: document.getElementById('playChordBtn'),
            addToSequenceBtn: document.getElementById('addToSequenceBtn'),
            playSequenceBtn: document.getElementById('playSequenceBtn'),
            stopSequenceBtn: document.getElementById('stopSequenceBtn'),
            loopBtn: document.getElementById('loopBtn'),
            clearSequenceBtn: document.getElementById('clearSequenceBtn'),
            sequenceDisplay: document.getElementById('sequenceDisplay'),
            tempoSlider: document.getElementById('tempoSlider'),
            tempoValue: document.getElementById('tempoValue'),
            exportMidiBtn: document.getElementById('exportMidiBtn'),
            exportTextBtn: document.getElementById('exportTextBtn')
        };

        this.setupEventListeners();
        this.setupVoiceRecognition();
        this.setupSequencer();
    }

    setupEventListeners() {
        // Voice button
        this.elements.voiceBtn.addEventListener('click', () => {
            window.audioEngine.resume().then(() => {
                window.voiceRecognition.start();
                this.updateVoiceButton();
            });
        });

        // Play chord button
        this.elements.playChordBtn.addEventListener('click', () => {
            if (this.currentChord && this.currentChord.notes) {
                window.audioEngine.playChord(this.currentChord.notes);
            }
        });

        // Add to sequence button
        this.elements.addToSequenceBtn.addEventListener('click', () => {
            if (this.currentChord) {
                window.sequencer.addChord(this.currentChord);
            }
        });

        // Sequencer controls
        this.elements.playSequenceBtn.addEventListener('click', () => {
            window.sequencer.play();
            this.updateSequencerControls();
        });

        this.elements.stopSequenceBtn.addEventListener('click', () => {
            window.sequencer.stop();
            this.updateSequencerControls();
        });

        this.elements.loopBtn.addEventListener('click', () => {
            const isLooping = window.sequencer.toggleLoop();
            this.elements.loopBtn.classList.toggle('active', isLooping);
        });

        this.elements.clearSequenceBtn.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment effacer la séquence ?')) {
                window.sequencer.clear();
            }
        });

        // Tempo control
        this.elements.tempoSlider.addEventListener('input', (e) => {
            const tempo = parseInt(e.target.value);
            window.sequencer.setTempo(tempo);
            this.elements.tempoValue.textContent = tempo;
        });

        // Export buttons
        this.elements.exportTextBtn.addEventListener('click', () => {
            window.exportManager.exportAsText(
                window.sequencer.sequence,
                window.sequencer.tempo
            );
        });

        this.elements.exportMidiBtn.addEventListener('click', () => {
            window.exportManager.exportAsMidi(
                window.sequencer.getSequenceData(),
                window.sequencer.tempo
            );
        });
    }

    setupVoiceRecognition() {
        // Voice recognition callbacks
        window.voiceRecognition.onResult = (transcript) => {
            this.elements.recognizedText.textContent = transcript;
            this.elements.voiceStatus.textContent = '';
            
            // Parse chord
            const chord = window.chordParser.parseVoiceInput(transcript);
            if (chord) {
                this.setCurrentChord(chord);
                // Auto-play the recognized chord
                window.audioEngine.playChord(chord.notes);
            } else {
                this.elements.voiceStatus.textContent = 'Accord non reconnu';
            }
        };

        window.voiceRecognition.onStatusChange = (status) => {
            this.elements.voiceStatus.textContent = status;
        };

        window.voiceRecognition.onError = (error) => {
            console.error('Voice recognition error:', error);
            this.updateVoiceButton();
        };
    }

    setupSequencer() {
        // Sequencer callbacks
        window.sequencer.onSequenceChange = (sequence) => {
            this.renderSequence(sequence);
            this.updateExportButtons();
        };

        window.sequencer.onPlaybackChange = (index) => {
            this.highlightPlayingChord(index);
        };
    }

    setCurrentChord(chord) {
        this.currentChord = chord;
        this.elements.currentChord.textContent = chord.symbol;
        this.elements.playChordBtn.disabled = false;
        this.elements.addToSequenceBtn.disabled = false;
    }

    renderSequence(sequence) {
        this.elements.sequenceDisplay.innerHTML = '';
        
        if (sequence.length === 0) {
            this.elements.sequenceDisplay.innerHTML = '<div class="empty-message">Aucun accord dans la séquence</div>';
            this.updateSequencerControls();
            return;
        }

        sequence.forEach((chord, index) => {
            const chordItem = document.createElement('div');
            chordItem.className = 'chord-item';
            chordItem.dataset.id = chord.id;
            chordItem.innerHTML = `
                ${chord.symbol}
                <button class="remove-btn" onclick="window.sequencer.removeChord('${chord.id}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            this.elements.sequenceDisplay.appendChild(chordItem);
        });

        this.updateSequencerControls();
    }

    highlightPlayingChord(index) {
        const chordItems = this.elements.sequenceDisplay.querySelectorAll('.chord-item');
        chordItems.forEach((item, i) => {
            item.classList.toggle('playing', i === index);
        });
    }

    updateVoiceButton() {
        const isListening = window.voiceRecognition.isListening;
        this.elements.voiceBtn.classList.toggle('active', isListening);
        this.elements.voiceBtn.querySelector('span').textContent = 
            isListening ? 'Arrêter la dictée' : 'Commencer la dictée';
    }

    updateSequencerControls() {
        const hasSequence = window.sequencer.sequence.length > 0;
        const isPlaying = window.sequencer.isPlaying;
        
        this.elements.playSequenceBtn.disabled = !hasSequence || isPlaying;
        this.elements.stopSequenceBtn.disabled = !isPlaying;
        this.elements.loopBtn.disabled = !hasSequence;
        this.elements.clearSequenceBtn.disabled = !hasSequence;
    }

    updateExportButtons() {
        const hasSequence = window.sequencer.sequence.length > 0;
        this.elements.exportMidiBtn.disabled = !hasSequence;
        this.elements.exportTextBtn.disabled = !hasSequence;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SayChordApp();
});