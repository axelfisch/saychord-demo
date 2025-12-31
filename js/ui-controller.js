// ui-controller.js - Contrôleur d'interface utilisateur pour SayChord
// Version corrigée pour GitHub Pages
import ChordDictionary from './chord-dictionary.js';
import Synthesizer from './synthesizer.js';
import VoiceRecognition from './voice-recognition.js';
import SequenceManager from './sequence-manager.js';

class UIController {
    constructor(chordDictionary, voiceRecognition, synthesizer, sequenceManager) {
        // Initialiser les modules principaux
        this.chordDictionary = chordDictionary || new ChordDictionary();
        this.synthesizer = synthesizer || new Synthesizer();
        this.voiceRecognition = voiceRecognition || new VoiceRecognition(this.chordDictionary);
        this.sequenceManager = sequenceManager || new SequenceManager(this.synthesizer);
        
        // Éléments DOM
        this.micButton = document.getElementById('mic-button');
        this.chordName = document.getElementById('chord-name');
        this.chordNotes = document.getElementById('chord-notes');
        this.sequenceList = document.getElementById('sequence-list');
        this.tempoSlider = document.getElementById('tempo-slider');
        this.playButton = document.getElementById('play-button');
        this.stopButton = document.getElementById('stop-button');
        this.loopButton = document.getElementById('loop-button');
        this.exportWavButton = document.getElementById('export-wav');
        this.exportPdfButton = document.getElementById('export-pdf');
        this.exportJsonButton = document.getElementById('export-json');
        
        // État de l'interface
        this.isListening = false;
        
        // Initialiser l'interface
        this.initializeUI();
    }

    async initializeUI() {
        // Charger le dictionnaire d'accords
        if (!this.chordDictionary.isLoaded) {
            await this.chordDictionary.loadDictionary();
        }
        
        // Configurer les gestionnaires d'événements
        this.setupEventListeners();
        
        // Initialiser l'affichage
        this.updateSequenceDisplay();
        this.updateTempoDisplay();
        
        // Ajouter un élément pour les messages de permission
        this.createPermissionRequestElement();
        
        console.log("Interface utilisateur initialisée");
    }

    setupEventListeners() {
        // Bouton microphone
        if (this.micButton) {
            this.micButton.addEventListener('click', () => this.toggleListening());
        }
        
        // Contrôles de séquence
        if (this.playButton) {
            this.playButton.addEventListener('click', () => this.sequenceManager.playSequence());
        }
        
        if (this.stopButton) {
            this.stopButton.addEventListener('click', () => this.sequenceManager.stopSequence());
        }

        if (this.loopButton) {
            this.loopButton.addEventListener('click', () => this.sequenceManager.toggleLoop());
        }
        
        // Contrôle du tempo
        if (this.tempoSlider) {
            this.tempoSlider.addEventListener('input', () => {
                const tempo = parseInt(this.tempoSlider.value);
                this.sequenceManager.setTempo(tempo);
                this.updateTempoDisplay();
            });
        }
        
        // Boutons d'export
        if (this.exportWavButton) {
            this.exportWavButton.addEventListener('click', () => this.sequenceManager.exportToWAV());
        }
        
        if (this.exportPdfButton) {
            this.exportPdfButton.addEventListener('click', () => this.sequenceManager.exportToPDF());
        }

        if (this.exportJsonButton) {
            this.exportJsonButton.addEventListener('click', () => this.sequenceManager.exportToJSON());
        }
        
        // Écouter l'événement de lecture d'accord
        document.addEventListener('chordPlayed', (event) => {
            this.highlightPlayingChord(event.detail.index);
        });
    }

    toggleListening() {
        if (this.isListening) {
            // Arrêter la reconnaissance
            this.voiceRecognition.stop();
            this.isListening = false;
            
            // Mettre à jour l'interface
            if (this.micButton) {
                this.micButton.classList.remove('active');
                this.micButton.innerHTML = '<i class="fas fa-microphone"></i>';
            }
            
            if (this.chordNotes) {
                this.chordNotes.textContent = "Dictez un accord pour commencer";
            }
        } else {
            // Démarrer la reconnaissance
            this.voiceRecognition.start(
                (chord, text) => this.handleRecognitionResult(chord, text),
                (error) => this.handleRecognitionError(error)
            );
            
            this.isListening = true;
            
            // Mettre à jour l'interface
            if (this.micButton) {
                this.micButton.classList.add('active');
                this.micButton.innerHTML = '<i class="fas fa-stop"></i>';
            }
            
            if (this.chordNotes) {
                this.chordNotes.textContent = "Écoute...";
            }
        }
    }

    handleRecognitionResult(chord, text) {
        // Si un accord a été reconnu
        if (chord) {
            // Afficher l'accord
            if (this.chordName) {
                this.chordName.textContent = chord.nom;
            }
            
            if (this.chordNotes) {
                const notes = chord.notes?.length ? chord.notes.join(' • ') : 'Notes indisponibles';
                const normalizedText = text?.trim();
                const noteSuffix = normalizedText && normalizedText.toLowerCase() !== chord.nom.toLowerCase()
                    ? ` (Reconnu : ${normalizedText})`
                    : '';
                this.chordNotes.textContent = `Notes : ${notes}${noteSuffix}`;
            }

            // Jouer l'accord
            this.synthesizer.playChord(chord);
            
            // Ajouter l'accord à la séquence
            this.sequenceManager.addChord(chord);
        } else {
            // Aucun accord reconnu
            if (this.chordName) {
                this.chordName.textContent = "Accord non reconnu";
            }
            if (this.chordNotes) {
                this.chordNotes.textContent = text
                    ? `Texte reconnu : ${text}`
                    : "Aucun accord reconnu";
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
        // Afficher l'erreur
        if (this.chordNotes) {
            this.chordNotes.textContent = error;
        }
        
        // Réinitialiser l'état d'écoute
        this.isListening = false;
        if (this.micButton) {
            this.micButton.classList.remove('active');
            this.micButton.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }

    updateSequenceDisplay() {
        if (this.sequenceManager?.updateSequenceDisplay) {
            this.sequenceManager.updateSequenceDisplay();
        }
    }

    highlightPlayingChord(index) {
        // Supprimer la surbrillance de tous les accords
        const chordElements = document.querySelectorAll('.sequence-chord');
        chordElements.forEach(el => el.classList.remove('playing'));
        
        // Ajouter la surbrillance à l'accord en cours
        const currentChord = document.querySelector(`.sequence-chord[data-index="${index}"]`);
        if (currentChord) {
            currentChord.classList.add('playing');
        }
    }

    updateTempoDisplay() {
        if (this.tempoSlider) {
            this.tempoSlider.value = this.sequenceManager.tempo;
        }
        
        const tempoDisplay = document.getElementById('tempo-value');
        if (tempoDisplay) {
            tempoDisplay.textContent = `${this.sequenceManager.tempo} BPM`;
        }
    }

    createPermissionRequestElement() {
        // Créer l'élément de demande d'autorisation s'il n'existe pas déjà
        if (!document.querySelector('.permission-request')) {
            const permissionRequest = document.createElement('div');
            permissionRequest.className = 'permission-request';
            permissionRequest.innerHTML = `
                <p>SayChord a besoin d'accéder à votre microphone pour la dictée vocale.</p>
                <button>Autoriser le microphone</button>
            `;
            
            // Insérer avant le conteneur de l'application
            const appSection = document.getElementById('app');
            if (appSection) {
                appSection.querySelector('.container')?.prepend(permissionRequest);
            } else {
                document.body.insertBefore(permissionRequest, document.body.firstChild);
            }
        }
    }
}

export default UIController;
