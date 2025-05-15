/**
 * Contrôleur d'interface utilisateur pour SayChord
 * Gère les interactions utilisateur et coordonne les différents modules
 */
class UIController {
    constructor(chordDictionary, voiceRecognition, synthesizer, sequenceManager) {
        this.chordDictionary = chordDictionary;
        this.voiceRecognition = voiceRecognition;
        this.synthesizer = synthesizer;
        this.sequenceManager = sequenceManager;
        
        // Éléments DOM
        this.micButton = document.getElementById('mic-button');
        this.recognitionStatus = document.getElementById('recognition-status');
        this.chordName = document.getElementById('chord-name');
        this.chordNotes = document.getElementById('chord-notes');
        this.pianoKeyboard = document.querySelector('.piano-keyboard');
        this.playButton = document.getElementById('play-button');
        this.stopButton = document.getElementById('stop-button');
        this.loopButton = document.getElementById('loop-button');
        this.tempoSlider = document.getElementById('tempo-slider');
        this.tempoValue = document.getElementById('tempo-value');
        this.sequenceList = document.getElementById('sequence-list');
        this.clearSequenceButton = document.getElementById('clear-sequence');
        this.exportWavButton = document.getElementById('export-wav');
        this.exportPdfButton = document.getElementById('export-pdf');
        this.loopButtons = document.querySelectorAll('.loop-button');
        this.timeButtons = document.querySelectorAll('.time-button');
        
        // État de l'interface
        this.currentChord = null;
        this.isListening = false;
        
        // Initialiser l'interface
        this.init();
    }

    /**
     * Initialise l'interface utilisateur
     */
    async init() {
        try {
            // Charger le dictionnaire d'accords
            await this.chordDictionary.loadDictionary();
            
            // Initialiser le clavier de piano
            this.initPianoKeyboard();
            
            // Configurer les gestionnaires d'événements
            this.setupEventListeners();
            
            // Configurer les callbacks
            this.setupCallbacks();
            
            console.log('Interface utilisateur initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'interface utilisateur:', error);
        }
    }

    /**
     * Initialise le clavier de piano
     */
    initPianoKeyboard() {
        // Créer les touches du piano (2 octaves)
        const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const blackKeys = ['C#', 'D#', null, 'F#', 'G#', 'A#', null, 'C#', 'D#', null, 'F#', 'G#', 'A#', null];
        
        // Vider le clavier
        this.pianoKeyboard.innerHTML = '';
        
        // Créer les touches blanches
        for (let i = 0; i < whiteKeys.length; i++) {
            const key = document.createElement('div');
            key.className = 'piano-key white-key';
            key.dataset.note = whiteKeys[i] + (i < 7 ? '4' : '5');
            this.pianoKeyboard.appendChild(key);
        }
        
        // Créer les touches noires
        for (let i = 0; i < blackKeys.length; i++) {
            if (blackKeys[i]) {
                const key = document.createElement('div');
                key.className = 'piano-key black-key';
                key.dataset.note = blackKeys[i] + (i < 7 ? '4' : '5');
                key.style.left = `${(i * 30) + 20}px`;
                this.pianoKeyboard.appendChild(key);
            }
        }
        
        // Ajouter le CSS pour les touches du piano
        const style = document.createElement('style');
        style.textContent = `
            .piano-keyboard {
                position: relative;
                height: 120px;
                background-color: #f0f0f0;
                border-radius: 5px;
                padding: 5px;
                overflow-x: auto;
                white-space: nowrap;
            }
            .piano-key {
                display: inline-block;
                position: relative;
                cursor: pointer;
                vertical-align: top;
                transition: background-color 0.1s;
            }
            .white-key {
                width: 30px;
                height: 120px;
                background-color: white;
                border: 1px solid #ccc;
                border-radius: 0 0 3px 3px;
                z-index: 1;
            }
            .black-key {
                position: absolute;
                width: 20px;
                height: 80px;
                background-color: #333;
                border-radius: 0 0 3px 3px;
                z-index: 2;
            }
            .key-active {
                background-color: #4A90E2;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Configure les gestionnaires d'événements
     */
    setupEventListeners() {
        // Bouton microphone
        this.micButton.addEventListener('click', () => {
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        });
        
        // Boutons de lecture
        this.playButton.addEventListener('click', () => {
            this.sequenceManager.play();
        });
        
        this.stopButton.addEventListener('click', () => {
            this.sequenceManager.stop();
        });
        
        this.loopButton.addEventListener('click', () => {
            const isLooping = !this.sequenceManager.isLooping;
            this.sequenceManager.setLooping(isLooping);
            this.loopButton.classList.toggle('active', isLooping);
        });
        
        // Slider de tempo
        this.tempoSlider.addEventListener('input', () => {
            const tempo = parseInt(this.tempoSlider.value);
            this.tempoValue.textContent = tempo;
            this.sequenceManager.setTempo(tempo);
        });
        
        // Bouton d'effacement de séquence
        this.clearSequenceButton.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir effacer la séquence ?')) {
                this.sequenceManager.clearSequence();
            }
        });
        
        // Boutons d'export
        this.exportWavButton.addEventListener('click', async () => {
            const blob = await this.sequenceManager.exportWAV();
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'saychord-sequence.wav';
                a.click();
                URL.revokeObjectURL(url);
            }
        });
        
        this.exportPdfButton.addEventListener('click', async () => {
            const url = await this.sequenceManager.exportPDF();
            if (url) {
                const a = document.createElement('a');
                a.href = url;
                a.download = 'saychord-sequence.pdf';
                a.click();
            }
        });
        
        // Boutons de longueur de boucle
        this.loopButtons.forEach(button => {
            button.addEventListener('click', () => {
                const bars = parseInt(button.dataset.bars);
                this.sequenceManager.setLoopLength(bars);
                
                // Mettre à jour l'interface
                this.loopButtons.forEach(btn => {
                    btn.classList.toggle('active', btn === button);
                });
            });
        });
        
        // Boutons de signature rythmique
        this.timeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const timeSignature = button.dataset.time;
                this.sequenceManager.setTimeSignature(timeSignature);
                
                // Mettre à jour l'interface
                this.timeButtons.forEach(btn => {
                    btn.classList.toggle('active', btn === button);
                });
            });
        });
        
        // Délégation d'événements pour les boutons de la séquence
        this.sequenceList.addEventListener('click', event => {
            const target = event.target.closest('button');
            if (!target) return;
            
            const item = target.closest('.sequence-item');
            const index = Array.from(this.sequenceList.children).indexOf(item);
            
            if (target.classList.contains('play-chord')) {
                this.sequenceManager.playChord(index);
            } else if (target.classList.contains('remove-chord')) {
                this.sequenceManager.removeChord(index);
            }
        });
    }

    /**
     * Configure les callbacks des modules
     */
    setupCallbacks() {
        // Callbacks de reconnaissance vocale
        this.voiceRecognition.onResult(chord => {
            this.handleRecognizedChord(chord);
        });
        
        this.voiceRecognition.onStart(() => {
            this.isListening = true;
            this.micButton.classList.add('listening');
            this.recognitionStatus.textContent = 'Écoute en cours...';
        });
        
        this.voiceRecognition.onEnd(() => {
            this.isListening = false;
            this.micButton.classList.remove('listening');
            this.recognitionStatus.textContent = 'Prêt à écouter';
        });
        
        this.voiceRecognition.onError(error => {
            this.isListening = false;
            this.micButton.classList.remove('listening');
            this.recognitionStatus.textContent = `Erreur: ${error}`;
        });
        
        // Callbacks de séquence
        this.sequenceManager.onSequenceChange(sequence => {
            this.updateSequenceList(sequence);
        });
        
        this.sequenceManager.onPlay(() => {
            this.playButton.classList.add('active');
            this.stopButton.classList.remove('active');
        });
        
        this.sequenceManager.onStop(() => {
            this.playButton.classList.remove('active');
            this.stopButton.classList.add('active');
        });
    }

    /**
     * Démarre l'écoute vocale
     */
    startListening() {
        this.voiceRecognition.startListening();
    }

    /**
     * Arrête l'écoute vocale
     */
    stopListening() {
        this.voiceRecognition.stopListening();
    }

    /**
     * Gère un accord reconnu
     * @param {Object} chord - Accord reconnu
     */
    handleRecognizedChord(chord) {
        if (!chord) return;
        
        // Mettre à jour l'affichage de l'accord
        this.currentChord = chord;
        this.chordName.textContent = chord.nom;
        this.chordNotes.textContent = chord.notes.join(' - ');
        
        // Jouer l'accord
        this.synthesizer.playChordByName(chord);
        
        // Mettre à jour le clavier
        this.highlightChordOnKeyboard(chord.notes);
        
        // Ajouter l'accord à la séquence
        this.sequenceManager.addChord(chord);
    }

    /**
     * Met en évidence les notes d'un accord sur le clavier
     * @param {Array} notes - Notes à mettre en évidence
     */
    highlightChordOnKeyboard(notes) {
        // Réinitialiser toutes les touches
        const keys = this.pianoKeyboard.querySelectorAll('.piano-key');
        keys.forEach(key => {
            key.classList.remove('key-active');
        });
        
        // Mettre en évidence les notes de l'accord
        notes.forEach(note => {
            // Ajouter l'octave si nécessaire
            const formattedNote = /\d/.test(note) ? note : `${note}4`;
            const key = this.pianoKeyboard.querySelector(`.piano-key[data-note="${formattedNote}"]`);
            if (key) {
                key.classList.add('key-active');
            }
        });
    }

    /**
     * Met à jour la liste des accords de la séquence
     * @param {Array} sequence - Séquence d'accords
     */
    updateSequenceList(sequence) {
        // Vider la liste
        this.sequenceList.innerHTML = '';
        
        // Ajouter chaque accord
        sequence.forEach(chord => {
            const item = document.createElement('div');
            item.className = 'sequence-item';
            
            const chordInfo = document.createElement('div');
            chordInfo.className = 'chord-info';
            chordInfo.textContent = chord.nom;
            
            const chordActions = document.createElement('div');
            chordActions.className = 'chord-actions';
            
            const playButton = document.createElement('button');
            playButton.className = 'play-chord';
            playButton.innerHTML = '<i class="fas fa-play"></i>';
            
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-chord';
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
            
            chordActions.appendChild(playButton);
            chordActions.appendChild(removeButton);
            
            item.appendChild(chordInfo);
            item.appendChild(chordActions);
            
            this.sequenceList.appendChild(item);
        });
    }
}

export default UIController;
