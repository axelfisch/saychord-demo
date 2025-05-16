/**
 * Moteur de synthèse sonore pour l'application SayChord
 * Version adaptée pour GitHub Pages avec gestion des erreurs et compatibilité navigateur
 */

class Synthesizer {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.oscillators = {};
        this.initialized = false;
        this.errorMessages = {
            'not-allowed': "L'accès audio a été refusé. Veuillez autoriser l'accès audio dans les paramètres de votre navigateur.",
            'not-supported': "L'API Web Audio n'est pas prise en charge par votre navigateur.",
            'context-not-allowed': "Le contexte audio n'a pas pu être démarré. Veuillez interagir avec la page (cliquer) pour autoriser la lecture audio.",
            'default': "Une erreur s'est produite lors de l'initialisation du synthétiseur audio."
        };
        
        // Tenter d'initialiser le contexte audio au chargement
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            // Vérifier si l'API Web Audio est disponible
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContextClass();
                
                // Créer le nœud de gain principal
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = 0.7; // Volume par défaut
                this.masterGain.connect(this.audioContext.destination);
                
                console.log('Contexte audio initialisé avec succès');
                this.initialized = true;
                
                // Vérifier l'état du contexte audio
                if (this.audioContext.state === 'suspended') {
                    this.showAudioActivationMessage();
                }
                
                // Écouter les changements d'état du contexte audio
                this.audioContext.onstatechange = () => {
                    console.log('État du contexte audio changé :', this.audioContext.state);
                    if (this.audioContext.state === 'running') {
                        this.hideErrorMessage();
                    }
                };
            } else {
                console.error("L'API Web Audio n'est pas prise en charge par ce navigateur");
                this.showErrorMessage(this.errorMessages['not-supported']);
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du contexte audio :', error);
            this.showErrorMessage(this.errorMessages.default);
        }
    }

    // Méthode pour démarrer le contexte audio suite à une interaction utilisateur
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume()
                .then(() => {
                    console.log('Contexte audio démarré avec succès');
                    this.hideErrorMessage();
                })
                .catch(error => {
                    console.error('Erreur lors du démarrage du contexte audio :', error);
                    this.showErrorMessage(this.errorMessages['context-not-allowed']);
                });
        }
    }

    // Méthode pour jouer un accord
    playChord(chord) {
        if (!this.initialized) {
            this.initAudioContext();
            if (!this.initialized) {
                console.error('Impossible de jouer l\'accord : synthétiseur non initialisé');
                return;
            }
        }
        
        // Démarrer le contexte audio si nécessaire
        if (this.audioContext.state === 'suspended') {
            this.resumeAudioContext();
        }
        
        // Arrêter les oscillateurs précédents
        this.stopAllOscillators();
        
        // Vérifier que l'accord est valide
        if (!chord || !chord.notes || !Array.isArray(chord.notes) || chord.notes.length === 0) {
            console.error('Accord invalide :', chord);
            return;
        }
        
        try {
            // Jouer chaque note de l'accord
            chord.notes.forEach((note, index) => {
                const frequency = this.noteToFrequency(note);
                this.playNote(frequency, index);
            });
            
            console.log('Accord joué :', chord.nom);
        } catch (error) {
            console.error('Erreur lors de la lecture de l\'accord :', error);
        }
    }

    // Méthode pour jouer une note
    playNote(frequency, id) {
        if (!this.audioContext) return;
        
        try {
            // Créer un oscillateur FM pour un son de piano électrique
            const carrier = this.audioContext.createOscillator();
            const modulator = this.audioContext.createOscillator();
            const modulatorGain = this.audioContext.createGain();
            const noteGain = this.audioContext.createGain();
            
            // Configurer le modulateur
            modulator.type = 'sine';
            modulator.frequency.value = frequency * 2; // Ratio de modulation
            modulatorGain.gain.value = 100; // Indice de modulation
            
            // Configurer la porteuse
            carrier.type = 'sine';
            carrier.frequency.value = frequency;
            
            // Configurer le gain de la note
            noteGain.gain.value = 0;
            
            // Connecter les nœuds
            modulator.connect(modulatorGain);
            modulatorGain.connect(carrier.frequency);
            carrier.connect(noteGain);
            noteGain.connect(this.masterGain);
            
            // Enveloppe ADSR pour un son de piano électrique
            const now = this.audioContext.currentTime;
            
            // Attack
            noteGain.gain.setValueAtTime(0, now);
            noteGain.gain.linearRampToValueAtTime(0.7, now + 0.02);
            
            // Decay
            noteGain.gain.linearRampToValueAtTime(0.5, now + 0.1);
            
            // Sustain (maintenu pendant la durée de la note)
            noteGain.gain.linearRampToValueAtTime(0.3, now + 0.3);
            
            // Release (après 2 secondes)
            noteGain.gain.linearRampToValueAtTime(0, now + 2);
            
            // Démarrer les oscillateurs
            modulator.start();
            carrier.start();
            
            // Arrêter les oscillateurs après 2 secondes
            modulator.stop(now + 2);
            carrier.stop(now + 2);
            
            // Stocker les oscillateurs pour pouvoir les arrêter plus tard
            this.oscillators[id] = {
                carrier,
                modulator,
                noteGain,
                modulatorGain
            };
            
            // Nettoyer après l'arrêt
            carrier.onended = () => {
                delete this.oscillators[id];
            };
        } catch (error) {
            console.error('Erreur lors de la lecture de la note :', error);
        }
    }

    // Méthode pour arrêter tous les oscillateurs
    stopAllOscillators() {
        const now = this.audioContext ? this.audioContext.currentTime : 0;
        
        Object.values(this.oscillators).forEach(osc => {
            try {
                // Appliquer un fade-out rapide pour éviter les clics
                osc.noteGain.gain.cancelScheduledValues(now);
                osc.noteGain.gain.setValueAtTime(osc.noteGain.gain.value, now);
                osc.noteGain.gain.linearRampToValueAtTime(0, now + 0.01);
                
                // Arrêter les oscillateurs après le fade-out
                osc.carrier.stop(now + 0.02);
                osc.modulator.stop(now + 0.02);
            } catch (error) {
                console.error('Erreur lors de l\'arrêt des oscillateurs :', error);
            }
        });
        
        // Réinitialiser la liste des oscillateurs
        this.oscillators = {};
    }

    // Méthode pour convertir une note en fréquence
    noteToFrequency(note) {
        const notes = {
            'C': 261.63, // Do
            'C#': 277.18, 'Db': 277.18,
            'D': 293.66, // Ré
            'D#': 311.13, 'Eb': 311.13,
            'E': 329.63, // Mi
            'F': 349.23, // Fa
            'F#': 369.99, 'Gb': 369.99,
            'G': 392.00, // Sol
            'G#': 415.30, 'Ab': 415.30,
            'A': 440.00, // La
            'A#': 466.16, 'Bb': 466.16,
            'B': 493.88  // Si
        };
        
        // Extraire la note de base et l'octave
        const notePattern = /^([A-G][b#]?)(\d*)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Format de note invalide :', note);
            return 440; // La 440Hz par défaut
        }
        
        const [, noteName, octaveStr] = match;
        const octave = octaveStr ? parseInt(octaveStr) : 4; // Octave 4 par défaut
        
        // Calculer la fréquence en fonction de l'octave
        const baseFreq = notes[noteName] || 440;
        const octaveDiff = octave - 4; // Par rapport à l'octave 4
        
        return baseFreq * Math.pow(2, octaveDiff);
    }

    // Méthode pour définir le volume principal
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    // Méthode pour afficher un message d'erreur
    showErrorMessage(message) {
        let errorElement = document.getElementById('audio-error-message');
        
        if (!errorElement) {
            // Créer l'élément s'il n'existe pas
            errorElement = document.createElement('div');
            errorElement.id = 'audio-error-message';
            errorElement.className = 'error-message show';
            
            // Ajouter au DOM
            const controlPanel = document.querySelector('.control-panel');
            if (controlPanel) {
                controlPanel.prepend(errorElement);
            } else {
                document.body.prepend(errorElement);
            }
        }
        
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    // Méthode pour masquer le message d'erreur
    hideErrorMessage() {
        const errorElement = document.getElementById('audio-error-message');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // Méthode pour afficher un message d'activation audio
    showAudioActivationMessage() {
        let activationElement = document.getElementById('audio-activation-message');
        
        if (!activationElement) {
            // Créer l'élément s'il n'existe pas
            activationElement = document.createElement('div');
            activationElement.id = 'audio-activation-message';
            activationElement.className = 'permission-request show';
            
            const messageElement = document.createElement('p');
            messageElement.textContent = 'Cliquez sur le bouton ci-dessous pour activer l\'audio.';
            
            const button = document.createElement('button');
            button.textContent = 'Activer l\'audio';
            button.onclick = () => {
                this.resumeAudioContext();
                activationElement.classList.remove('show');
            };
            
            activationElement.appendChild(messageElement);
            activationElement.appendChild(button);
            
            // Ajouter au DOM
            const controlPanel = document.querySelector('.control-panel');
            if (controlPanel) {
                controlPanel.prepend(activationElement);
            } else {
                document.body.prepend(activationElement);
            }
        } else {
            activationElement.classList.add('show');
        }
    }
}

// Vérifier si le module est chargé dans un contexte GitHub Pages
if (window.location.hostname.includes('github.io')) {
    console.log('Application exécutée sur GitHub Pages - Adaptations audio spécifiques activées');
    
    // Ajouter un gestionnaire d'événements global pour démarrer le contexte audio
    document.addEventListener('click', function audioActivationHandler() {
        // Créer une instance temporaire du synthétiseur si nécessaire
        if (window.synthesizer && window.synthesizer.audioContext) {
            window.synthesizer.resumeAudioContext();
        } else {
            const tempSynth = new Synthesizer();
            tempSynth.resumeAudioContext();
        }
        
        // Supprimer ce gestionnaire après la première interaction
        document.removeEventListener('click', audioActivationHandler);
    }, { once: false });
}
