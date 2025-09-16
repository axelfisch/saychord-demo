/**
 * Module d'amélioration audio pour l'application SayChord
 * Ajoute des effets et optimise la qualité sonore
 */

class AudioEnhancer {
    constructor(synthesizer) {
        this.synthesizer = synthesizer;
        this.initialized = false;
        this.initialize();
    }
    
    initialize() {
        if (!this.synthesizer || !this.synthesizer.audioContext) {
            console.warn('Impossible d\'initialiser l\'améliorateur audio : synthétiseur non disponible');
            return;
        }
        
        try {
            // Initialiser l'améliorateur audio
            console.log('Améliorateur audio initialisé');
            this.initialized = true;
            
            // Ajouter des messages d'aide spécifiques pour GitHub Pages
            if (window.location.hostname.includes('github.io')) {
                document.addEventListener('DOMContentLoaded', () => {
                    this.addHelpMessages();
                });
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'améliorateur audio :', error);
        }
    }
    
    addHelpMessages() {
        // Ajouter un message d'aide pour l'activation audio sur GitHub Pages
        const controlPanel = document.querySelector('.control-panel');
        if (controlPanel) {
            const helpMessage = document.createElement('div');
            helpMessage.className = 'audio-help-message';
            helpMessage.style.fontSize = '0.8rem';
            helpMessage.style.color = '#666';
            helpMessage.style.marginTop = '10px';
            helpMessage.style.textAlign = 'center';
            helpMessage.textContent = 'Conseil : Cliquez n\'importe où sur la page pour activer l\'audio si vous ne l\'entendez pas.';
            
            controlPanel.appendChild(helpMessage);
        }
    }

    applyPreset(name) {
        // Appliquer des préréglages simples sur le volume et la réverbération
        if (!this.synthesizer || !this.synthesizer.masterGain) {
            return;
        }
        const preset = String(name || '').toLowerCase();
        try {
            switch (preset) {
                case 'warm':
                    this.synthesizer.masterGain.gain.value = 0.7;
                    if (this.synthesizer.reverbGain) {
                        this.synthesizer.reverbGain.gain.value = 0.25;
                    }
                    break;
                case 'bright':
                    this.synthesizer.masterGain.gain.value = 0.85;
                    if (this.synthesizer.reverbGain) {
                        this.synthesizer.reverbGain.gain.value = 0.15;
                    }
                    break;
                case 'dry':
                    this.synthesizer.masterGain.gain.value = 0.75;
                    if (this.synthesizer.reverbGain) {
                        this.synthesizer.reverbGain.gain.value = 0.0;
                    }
                    break;
                default:
                    // Valeurs par défaut sûres
                    this.synthesizer.masterGain.gain.value = 0.7;
                    if (this.synthesizer.reverbGain) {
                        this.synthesizer.reverbGain.gain.value = 0.2;
                    }
            }
        } catch (error) {
            console.error('Erreur lors de l\'application du preset audio:', error);
        }
    }

    optimizeForVoiceRecognition() {
        // Réduire les effets et le volume pendant l'écoute
        if (!this.synthesizer || !this.synthesizer.masterGain) {
            return () => {};
        }
        const previous = {
            volume: this.synthesizer.masterGain.gain.value,
            reverb: this.synthesizer.reverbGain ? this.synthesizer.reverbGain.gain.value : null
        };
        try {
            this.synthesizer.masterGain.gain.value = Math.max(0.3, previous.volume * 0.6);
            if (this.synthesizer.reverbGain) {
                this.synthesizer.reverbGain.gain.value = 0.0;
            }
        } catch (error) {
            console.error('Erreur lors de l\'optimisation audio:', error);
        }
        // Fonction de restauration
        return () => {
            try {
                if (typeof previous.volume === 'number') {
                    this.synthesizer.masterGain.gain.value = previous.volume;
                }
                if (this.synthesizer.reverbGain && typeof previous.reverb === 'number') {
                    this.synthesizer.reverbGain.gain.value = previous.reverb;
                }
            } catch (error) {
                console.error('Erreur lors de la restauration des paramètres audio:', error);
            }
        };
    }
}

// Initialiser l'améliorateur audio lorsque la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // L'améliorateur sera initialisé par main.js
    console.log('Améliorateur audio prêt à être initialisé');
});

export default AudioEnhancer;
