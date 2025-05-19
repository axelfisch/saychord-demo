// ui-controller.js - Contrôleur d'interface utilisateur pour SayChord
// Version corrigée pour GitHub Pages

class UIController {
    constructor() {
        // Initialiser les modules principaux
        this.chordDictionary = new ChordDictionary();
        this.synthesizer = new Synthesizer();
        this.voiceRecognition = new VoiceRecognition(this.chordDictionary);
        this.sequenceManager = new SequenceManager(this.synthesizer);
        
        // Éléments DOM
        this.micButton = document.getElementById('mic-button');
        this.recognizedText = document.getElementById('recognized-text');
        this.chordDisplay = document.getElementById('chord-display');
        this.sequenceContainer = document.getElementById('sequence-container');
        this.tempoInput = document.getElementById('tempo-input');
        this.playButton = document.getElementById('play-button');
        this.stopButton = document.getElementById('stop-button');
        this.clearButton = document.getElementById('clear-button');
        this.exportWavButton = document.getElementById('export-wav');
        this.exportPdfButton = document.getElementById('export-pdf');
        
        // État de l'interface
        this.isListening = false;
        
        // Initialiser l'interface
        this.initializeUI();
    }

    async initializeUI() {
        // Charger le dictionnaire d'accords
        await this.chordDictionary.loadDictionary('./chord-dictionary.json');
        
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
            this.playButton.addEventListener('click', () => this.sequenceManager.play());
        }
        
        if (this.stopButton) {
            this.stopButton.addEventListener('click', () => this.sequenceManager.stop());
        }
        
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.sequenceManager.clearSequence();
                this.updateSequenceDisplay();
            });
        }
        
        // Contrôle du tempo
        if (this.tempoInput) {
            this.tempoInput.addEventListener('change', () => {
                const tempo = parseInt(this.tempoInput.value);
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
            
            if (this.recognizedText) {
                this.recognizedText.textContent = "Dictez un accord pour commencer";
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
            
            if (this.recognizedText) {
                this.recognizedText.textContent = "Écoute...";
            }
        }
    }

    handleRecognitionResult(chord, text) {
        // Mettre à jour l'affichage du texte reconnu
        if (this.recognizedText) {
            this.recognizedText.textContent = text;
        }
        
        // Si un accord a été reconnu
        if (chord) {
            // Afficher l'accord
            if (this.chordDisplay) {
                this.chordDisplay.textContent = chord.nom;
            }
            
            // Jouer l'accord
            this.synthesizer.playChord(chord);
            
            // Ajouter l'accord à la séquence
            this.sequenceManager.addChord(chord);
            this.updateSequenceDisplay();
        } else {
            // Aucun accord reconnu
            if (this.chordDisplay) {
                this.chordDisplay.textContent = "Accord non reconnu";
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
        if (this.recognizedText) {
            this.recognizedText.textContent = error;
        }
        
        // Réinitialiser l'état d'écoute
        this.isListening = false;
        if (this.micButton) {
            this.micButton.classList.remove('active');
            this.micButton.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }

    updateSequenceDisplay() {
        if (!this.sequenceContainer) return;
        
        // Vider le conteneur
        this.sequenceContainer.innerHTML = '';
        
        // Si la séquence est vide
        if (this.sequenceManager.sequence.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = "La séquence est vide. Dictez des accords pour les ajouter.";
            this.sequenceContainer.appendChild(emptyMessage);
            return;
        }
        
        // Créer un élément pour chaque accord
        this.sequenceManager.sequence.forEach((chord, index) => {
            const chordElement = document.createElement('div');
            chordElement.className = 'sequence-chord';
            chordElement.textContent = chord.nom;
            chordElement.dataset.index = index;
            
            // Ajouter un gestionnaire de clic pour supprimer l'accord
            chordElement.addEventListener('click', () => {
                this.sequenceManager.removeChord(index);
                this.updateSequenceDisplay();
            });
            
            this.sequenceContainer.appendChild(chordElement);
        });
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
        if (this.tempoInput) {
            this.tempoInput.value = this.sequenceManager.tempo;
        }
        
        const tempoDisplay = document.getElementById('tempo-display');
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
            const appContainer = document.getElementById('app-container');
            if (appContainer) {
                appContainer.parentNode.insertBefore(permissionRequest, appContainer);
            } else {
                document.body.insertBefore(permissionRequest, document.body.firstChild);
            }
        }
    }
}
