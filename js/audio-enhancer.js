/**
 * Améliorations audio pour SayChord
 * Optimise la qualité sonore et ajoute des fonctionnalités audio avancées
 */
class AudioEnhancer {
    constructor(synthesizer) {
        this.synthesizer = synthesizer;
        this.isInitialized = false;
        this.effects = {};
        
        // Paramètres audio
        this.reverbLevel = 0.2;
        this.chorusLevel = 0;
        this.delayLevel = 0;
        this.eqSettings = {
            low: 0,
            mid: 0,
            high: 0
        };
        
        this.init();
    }
    
    /**
     * Initialise l'améliorateur audio
     */
    async init() {
        try {
            // Vérifier si Tone.js est disponible
            if (typeof Tone === 'undefined') {
                console.error('Tone.js n\'est pas chargé');
                return;
            }
            
            // Attendre que le synthétiseur soit initialisé
            if (!this.synthesizer.isInitialized) {
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (this.synthesizer.isInitialized) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                });
            }
            
            // Créer les effets audio
            this.createAudioEffects();
            
            // Connecter les effets
            this.connectEffects();
            
            this.isInitialized = true;
            console.log('Améliorateur audio initialisé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'améliorateur audio:', error);
        }
    }
    
    /**
     * Crée les effets audio
     */
    createAudioEffects() {
        // Créer un égaliseur 3 bandes
        this.effects.eq = new Tone.EQ3(0, 0, 0);
        
        // Créer une réverbération
        this.effects.reverb = new Tone.Reverb({
            decay: 2,
            wet: this.reverbLevel
        });
        
        // Créer un chorus
        this.effects.chorus = new Tone.Chorus({
            frequency: 1.5,
            delayTime: 3.5,
            depth: 0.7,
            wet: this.chorusLevel
        }).start();
        
        // Créer un délai
        this.effects.delay = new Tone.FeedbackDelay({
            delayTime: 0.25,
            feedback: 0.3,
            wet: this.delayLevel
        });
        
        // Créer un limiteur pour éviter l'écrêtage
        this.effects.limiter = new Tone.Limiter(-3);
        
        console.log('Effets audio créés');
    }
    
    /**
     * Connecte les effets audio
     */
    connectEffects() {
        // Déconnecter le synthétiseur de la destination
        this.synthesizer.synth.disconnect();
        
        // Connecter la chaîne d'effets
        this.synthesizer.synth.chain(
            this.effects.eq,
            this.effects.chorus,
            this.effects.reverb,
            this.effects.delay,
            this.effects.limiter,
            Tone.Destination
        );
        
        console.log('Effets audio connectés');
    }
    
    /**
     * Définit le niveau de réverbération
     * @param {number} level - Niveau de réverbération (0-1)
     */
    setReverbLevel(level) {
        if (!this.isInitialized) {
            console.error('L\'améliorateur audio n\'est pas initialisé');
            return;
        }
        
        this.reverbLevel = Math.max(0, Math.min(1, level));
        this.effects.reverb.wet.value = this.reverbLevel;
        console.log(`Niveau de réverbération défini à ${this.reverbLevel}`);
    }
    
    /**
     * Définit le niveau de chorus
     * @param {number} level - Niveau de chorus (0-1)
     */
    setChorusLevel(level) {
        if (!this.isInitialized) {
            console.error('L\'améliorateur audio n\'est pas initialisé');
            return;
        }
        
        this.chorusLevel = Math.max(0, Math.min(1, level));
        this.effects.chorus.wet.value = this.chorusLevel;
        console.log(`Niveau de chorus défini à ${this.chorusLevel}`);
    }
    
    /**
     * Définit le niveau de délai
     * @param {number} level - Niveau de délai (0-1)
     */
    setDelayLevel(level) {
        if (!this.isInitialized) {
            console.error('L\'améliorateur audio n\'est pas initialisé');
            return;
        }
        
        this.delayLevel = Math.max(0, Math.min(1, level));
        this.effects.delay.wet.value = this.delayLevel;
        console.log(`Niveau de délai défini à ${this.delayLevel}`);
    }
    
    /**
     * Définit les paramètres d'égalisation
     * @param {Object} settings - Paramètres d'égalisation
     * @param {number} settings.low - Gain des basses fréquences (dB)
     * @param {number} settings.mid - Gain des moyennes fréquences (dB)
     * @param {number} settings.high - Gain des hautes fréquences (dB)
     */
    setEQ(settings) {
        if (!this.isInitialized) {
            console.error('L\'améliorateur audio n\'est pas initialisé');
            return;
        }
        
        if (settings.low !== undefined) {
            this.eqSettings.low = settings.low;
            this.effects.eq.low.value = settings.low;
        }
        
        if (settings.mid !== undefined) {
            this.eqSettings.mid = settings.mid;
            this.effects.eq.mid.value = settings.mid;
        }
        
        if (settings.high !== undefined) {
            this.eqSettings.high = settings.high;
            this.effects.eq.high.value = settings.high;
        }
        
        console.log(`Égalisation définie à: Basses=${this.eqSettings.low}dB, Moyennes=${this.eqSettings.mid}dB, Hautes=${this.eqSettings.high}dB`);
    }
    
    /**
     * Applique un preset d'effets
     * @param {string} presetName - Nom du preset
     */
    applyPreset(presetName) {
        if (!this.isInitialized) {
            console.error('L\'améliorateur audio n\'est pas initialisé');
            return;
        }
        
        const presets = {
            'default': {
                reverb: 0.2,
                chorus: 0,
                delay: 0,
                eq: { low: 0, mid: 0, high: 0 }
            },
            'warm': {
                reverb: 0.3,
                chorus: 0.1,
                delay: 0,
                eq: { low: 2, mid: 0, high: -1 }
            },
            'bright': {
                reverb: 0.2,
                chorus: 0,
                delay: 0,
                eq: { low: -1, mid: 0, high: 3 }
            },
            'spacious': {
                reverb: 0.5,
                chorus: 0.2,
                delay: 0.15,
                eq: { low: 1, mid: -1, high: 2 }
            },
            'vintage': {
                reverb: 0.3,
                chorus: 0.3,
                delay: 0.1,
                eq: { low: 3, mid: -2, high: -1 }
            }
        };
        
        const preset = presets[presetName];
        if (!preset) {
            console.error(`Preset "${presetName}" non trouvé`);
            return;
        }
        
        this.setReverbLevel(preset.reverb);
        this.setChorusLevel(preset.chorus);
        this.setDelayLevel(preset.delay);
        this.setEQ(preset.eq);
        
        console.log(`Preset "${presetName}" appliqué`);
    }
    
    /**
     * Optimise les paramètres audio pour la reconnaissance vocale
     * (réduit les effets pendant la reconnaissance)
     */
    optimizeForVoiceRecognition() {
        if (!this.isInitialized) {
            console.error('L\'améliorateur audio n\'est pas initialisé');
            return;
        }
        
        // Sauvegarder les paramètres actuels
        const savedSettings = {
            reverb: this.reverbLevel,
            chorus: this.chorusLevel,
            delay: this.delayLevel,
            eq: { ...this.eqSettings }
        };
        
        // Réduire les effets
        this.setReverbLevel(0);
        this.setChorusLevel(0);
        this.setDelayLevel(0);
        
        console.log('Paramètres audio optimisés pour la reconnaissance vocale');
        
        // Retourner une fonction pour restaurer les paramètres
        return () => {
            this.setReverbLevel(savedSettings.reverb);
            this.setChorusLevel(savedSettings.chorus);
            this.setDelayLevel(savedSettings.delay);
            this.setEQ(savedSettings.eq);
            console.log('Paramètres audio restaurés');
        };
    }
}

export default AudioEnhancer;
