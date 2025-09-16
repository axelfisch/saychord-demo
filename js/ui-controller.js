// ui-controller.js - Contrôleur d'interface utilisateur pour SayChord (version alignée avec index.html)

class UIController {
    constructor(chordDictionary, voiceRecognition, synthesizer, sequenceManager) {
        this.chordDictionary = chordDictionary;
        this.voiceRecognition = voiceRecognition;
        this.synthesizer = synthesizer;
        this.sequenceManager = sequenceManager;

        // Éléments DOM utilisés par l'interface actuelle
        this.micButton = document.getElementById('mic-button');
        this.chordNameEl = document.getElementById('chord-name');
        this.chordNotesEl = document.getElementById('chord-notes');

        this.isListening = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.micButton) {
            this.micButton.addEventListener('click', () => this.toggleListening());
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.voiceRecognition.stop();
            this.isListening = false;
            if (this.micButton) {
                this.micButton.classList.remove('active');
                this.micButton.innerHTML = '<i class="fas fa-microphone"></i>';
            }
            return;
        }

        this.voiceRecognition.start(
            (chord, text) => this.handleRecognitionResult(chord, text),
            (error) => this.handleRecognitionError(error)
        );
        this.isListening = true;
        if (this.micButton) {
            this.micButton.classList.add('active');
            this.micButton.innerHTML = '<i class="fas fa-stop"></i>';
        }
        if (this.chordNotesEl) {
            this.chordNotesEl.textContent = 'Écoute...';
        }
    }

    handleRecognitionResult(chord, text) {
        // Afficher le texte reconnu et/ou l'accord
        if (chord) {
            if (this.chordNameEl) {
                this.chordNameEl.textContent = chord.nom || '-';
            }
            if (this.chordNotesEl) {
                const notes = Array.isArray(chord.notes) ? chord.notes.join(', ') : '';
                this.chordNotesEl.textContent = notes || '—';
            }
            if (this.synthesizer) {
                this.synthesizer.playChord(chord);
            }
            if (this.sequenceManager) {
                this.sequenceManager.addChord(chord);
            }
        } else {
            if (this.chordNameEl) {
                this.chordNameEl.textContent = '—';
            }
            if (this.chordNotesEl) {
                this.chordNotesEl.textContent = 'Accord non reconnu';
            }
        }

        // Réinitialiser l'état d'écoute
        this.isListening = false;
        if (this.micButton) {
            this.micButton.classList.remove('active');
            this.micButton.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }

    handleRecognitionError(error) {
        if (this.chordNotesEl) {
            this.chordNotesEl.textContent = error || 'Erreur de reconnaissance vocale';
        }
        this.isListening = false;
        if (this.micButton) {
            this.micButton.classList.remove('active');
            this.micButton.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }
}

export default UIController;
