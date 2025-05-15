/**
 * Moteur de synthèse sonore pour SayChord
 * Utilise Tone.js pour générer des sons de piano électrique FM
 */
class SynthesizerEngine {
    constructor() {
        this.synth = null;
        this.isInitialized = false;
        this.volume = -10; // Volume en dB
        this.release = 1.5; // Durée de relâchement en secondes
        this.attack = 0.01; // Durée d'attaque en secondes
        
        // Initialiser le synthétiseur
        this.init();
    }

    /**
     * Initialise le synthétiseur
     */
    async init() {
        try {
            // Vérifier si Tone.js est disponible
            if (typeof Tone === 'undefined') {
                console.error('Tone.js n\'est pas chargé');
                return;
            }
            
            // Attendre que le contexte audio soit démarré
            await Tone.start();
            
            // Créer le synthétiseur FM
            this.synth = new Tone.PolySynth(Tone.FMSynth).toDestination();
            
            // Configurer les paramètres du synthétiseur pour un son de piano électrique FM
            this.synth.set({
                harmonicity: 3.01,
                modulationIndex: 14,
                oscillator: {
                    type: "sine"
                },
                envelope: {
                    attack: this.attack,
                    decay: 0.2,
                    sustain: 0.8,
                    release: this.release
                },
                modulation: {
                    type: "square"
                },
                modulationEnvelope: {
                    attack: 0.5,
                    decay: 0.01,
                    sustain: 1,
                    release: 0.5
                },
                volume: this.volume
            });
            
            // Ajouter un effet de réverbération
            this.reverb = new Tone.Reverb({
                decay: 2,
                wet: 0.2
            }).toDestination();
            
            this.synth.connect(this.reverb);
            
            this.isInitialized = true;
            console.log('Synthétiseur initialisé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du synthétiseur:', error);
        }
    }

    /**
     * Joue un accord à partir d'un tableau de notes
     * @param {Array} notes - Tableau des notes à jouer (ex: ["C4", "E4", "G4"])
     * @param {number} duration - Durée en secondes (par défaut: 2)
     */
    playChord(notes, duration = 2) {
        if (!this.isInitialized || !this.synth) {
            console.error('Le synthétiseur n\'est pas initialisé');
            return;
        }
        
        // Convertir les notes en notation Tone.js (ajouter l'octave si nécessaire)
        const formattedNotes = notes.map(note => this.formatNote(note));
        
        // Jouer l'accord
        this.synth.triggerAttackRelease(formattedNotes, duration);
        console.log(`Accord joué: ${formattedNotes.join(', ')}`);
    }

    /**
     * Formate une note pour Tone.js (ajoute l'octave si nécessaire)
     * @param {string} note - Note à formater (ex: "C", "Eb")
     * @returns {string} Note formatée (ex: "C4", "Eb4")
     */
    formatNote(note) {
        // Si la note contient déjà un chiffre (octave), la retourner telle quelle
        if (/\d/.test(note)) {
            return note;
        }
        
        // Sinon, ajouter l'octave 4 par défaut
        return `${note}4`;
    }

    /**
     * Joue un accord à partir de son nom
     * @param {Object} chord - Objet accord du dictionnaire
     * @param {number} duration - Durée en secondes (par défaut: 2)
     */
    playChordByName(chord, duration = 2) {
        if (!chord || !chord.notes || !Array.isArray(chord.notes)) {
            console.error('Accord invalide');
            return;
        }
        
        this.playChord(chord.notes, duration);
    }

    /**
     * Définit le volume du synthétiseur
     * @param {number} volumeDb - Volume en dB (entre -60 et 0)
     */
    setVolume(volumeDb) {
        if (!this.isInitialized || !this.synth) {
            console.error('Le synthétiseur n\'est pas initialisé');
            return;
        }
        
        // Limiter le volume entre -60 et 0 dB
        this.volume = Math.max(-60, Math.min(0, volumeDb));
        this.synth.volume.value = this.volume;
        console.log(`Volume défini à ${this.volume} dB`);
    }

    /**
     * Définit la durée de relâchement (release) du synthétiseur
     * @param {number} releaseTime - Durée de relâchement en secondes
     */
    setRelease(releaseTime) {
        if (!this.isInitialized || !this.synth) {
            console.error('Le synthétiseur n\'est pas initialisé');
            return;
        }
        
        this.release = releaseTime;
        this.synth.set({
            envelope: {
                release: this.release
            },
            modulationEnvelope: {
                release: this.release / 2
            }
        });
        console.log(`Durée de relâchement définie à ${this.release} secondes`);
    }

    /**
     * Arrête tous les sons en cours
     */
    stopAllSounds() {
        if (!this.isInitialized || !this.synth) {
            console.error('Le synthétiseur n\'est pas initialisé');
            return;
        }
        
        this.synth.releaseAll();
        console.log('Tous les sons arrêtés');
    }
}

export default SynthesizerEngine;
