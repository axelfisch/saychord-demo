// synthesizer.js - Module de synthèse sonore pour SayChord
// Version corrigée pour GitHub Pages

class Synthesizer {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;
        this.initPromise = null;
        this.fmSynths = {};
        this.reverb = null;
        this.isPlaying = false;
    }

    async initialize() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise(async (resolve, reject) => {
            try {
                // Créer un nouveau contexte audio avec gestion des erreurs
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                } catch (error) {
                    console.error("Erreur lors de la création du contexte audio:", error);
                    reject("Votre navigateur ne prend pas en charge l'API Web Audio. Veuillez utiliser un navigateur moderne comme Chrome, Edge ou Firefox.");
                    return;
                }

                // Créer le gain master
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = 0.7;
                this.masterGain.connect(this.audioContext.destination);

                // Créer l'effet de réverbération
                this.reverb = await this.createReverb();
                
                // Marquer comme initialisé
                this.initialized = true;
                console.log("Synthétiseur initialisé avec succès");
                resolve();
            } catch (error) {
                console.error("Erreur lors de l'initialisation du synthétiseur:", error);
                reject("Impossible d'initialiser le synthétiseur audio");
            }
        });

        return this.initPromise;
    }

    async createReverb() {
        // Créer un nœud de convolution pour la réverbération
        const convolver = this.audioContext.createConvolver();
        
        // Créer un tampon d'impulsion de réverbération simple
        const bufferSize = this.audioContext.sampleRate * 3; // 3 secondes
        const buffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);
        
        // Remplir les canaux avec un bruit décroissant exponentiel
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }
        }
        
        convolver.buffer = buffer;
        
        // Créer un nœud de gain pour contrôler le niveau de réverbération
        const reverbGain = this.audioContext.createGain();
        reverbGain.gain.value = 0.2;
        
        // Connecter le convolver au gain de réverbération
        convolver.connect(reverbGain);
        reverbGain.connect(this.masterGain);
        
        return convolver;
    }

    async playChord(chord) {
        if (!this.initialized) {
            try {
                await this.initialize();
            } catch (error) {
                console.error("Impossible de jouer l'accord:", error);
                return;
            }
        }

        // Réactiver le contexte audio si nécessaire (pour les navigateurs qui le suspendent)
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.error("Impossible de reprendre le contexte audio:", error);
                return;
            }
        }

        // Arrêter les notes précédentes
        this.stopAllNotes();

        // Jouer chaque note de l'accord
        if (chord && chord.notes && chord.notes.length > 0) {
            chord.notes.forEach((note, index) => {
                const frequency = this.noteToFrequency(note);
                const delay = index * 0.02; // Léger arpège pour un son plus naturel
                this.playNote(frequency, delay);
            });
            
            this.isPlaying = true;
        }
    }

    playNote(frequency, delay = 0) {
        // Créer un synthétiseur FM pour cette note
        const synth = this.createFMSynth(frequency);
        
        // Stocker le synthétiseur pour pouvoir l'arrêter plus tard
        this.fmSynths[frequency] = synth;
        
        // Planifier le début de la note
        const startTime = this.audioContext.currentTime + delay;
        
        // Modulateur
        synth.modulator.frequency.setValueAtTime(frequency * 2, startTime);
        synth.modulator.gain.setValueAtTime(0, startTime);
        synth.modulator.gain.linearRampToValueAtTime(frequency * 2, startTime + 0.01);
        
        // Porteuse
        synth.carrier.frequency.setValueAtTime(frequency, startTime);
        
        // Enveloppe d'amplitude
        synth.envelope.gain.setValueAtTime(0, startTime);
        synth.envelope.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        synth.envelope.gain.exponentialRampToValueAtTime(0.2, startTime + 0.3);
        synth.envelope.gain.exponentialRampToValueAtTime(0.1, startTime + 2);
        synth.envelope.gain.linearRampToValueAtTime(0, startTime + 4);
    }

    stopAllNotes() {
        if (!this.initialized) return;
        
        // Arrêter toutes les notes en cours
        const currentTime = this.audioContext.currentTime;
        
        Object.values(this.fmSynths).forEach(synth => {
            // Fade out rapide
            synth.envelope.gain.cancelScheduledValues(currentTime);
            synth.envelope.gain.setValueAtTime(synth.envelope.gain.value, currentTime);
            synth.envelope.gain.linearRampToValueAtTime(0, currentTime + 0.05);
            
            // Déconnecter après le fade out
            setTimeout(() => {
                synth.carrier.disconnect();
                synth.modulator.disconnect();
                synth.envelope.disconnect();
            }, 100);
        });
        
        // Réinitialiser la liste des synthés
        this.fmSynths = {};
        this.isPlaying = false;
    }

    createFMSynth(frequency) {
        // Créer les oscillateurs et les nœuds de gain
        const carrier = this.audioContext.createOscillator();
        const modulator = this.audioContext.createOscillator();
        const modulatorGain = this.audioContext.createGain();
        const envelope = this.audioContext.createGain();
        
        // Configurer les oscillateurs
        carrier.type = 'sine';
        modulator.type = 'sine';
        
        // Connecter le modulateur au gain du modulateur
        modulator.connect(modulatorGain);
        modulatorGain.connect(carrier.frequency);
        
        // Connecter la porteuse à l'enveloppe
        carrier.connect(envelope);
        
        // Connecter l'enveloppe à la sortie principale et à la réverbération
        envelope.connect(this.masterGain);
        envelope.connect(this.reverb);
        
        // Démarrer les oscillateurs
        carrier.start();
        modulator.start();
        
        return {
            carrier: carrier,
            modulator: modulator,
            modulatorGain: modulatorGain,
            envelope: envelope
        };
    }

    noteToFrequency(note) {
        // Table de correspondance des notes et fréquences
        const noteTable = {
            'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00, 'G#': 415.30,
            'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
        };
        
        // Extraire la note de base et l'octave
        const regex = /([A-G][b#]?)(\d*)/;
        const match = note.match(regex);
        
        if (!match) return 440; // A4 par défaut
        
        const noteName = match[1];
        const octave = match[2] ? parseInt(match[2]) : 4; // Octave 4 par défaut
        
        // Calculer la fréquence en fonction de l'octave
        const baseFreq = noteTable[noteName] || 440;
        const octaveDiff = octave - 4; // Relatif à l'octave 4
        
        return baseFreq * Math.pow(2, octaveDiff);
    }

    setVolume(volume) {
        if (!this.initialized) return;
        
        // Volume entre 0 et 1
        const safeVolume = Math.max(0, Math.min(1, volume));
        this.masterGain.gain.value = safeVolume;
    }
}
