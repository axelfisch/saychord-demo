/**
 * Module d'amélioration audio pour l'application SayChord
 * Ajoute des effets et optimise la qualité sonore
 */

class AudioEnhancer {
    constructor(synthesizer) {
        this.synthesizer = synthesizer;
        this.initialized = false;
        this.pendingPreset = null;
        this.activePreset = null;
        this.initialize();
    }
    
    initialize() {
        if (!this.synthesizer) {
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

            document.addEventListener('synthesizer:initialized', () => {
                if (this.pendingPreset) {
                    this.applyPreset(this.pendingPreset);
                    this.pendingPreset = null;
                }
            });
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

    applyPreset(presetName) {
        const presetMap = {
            warm: { volume: 0.7, reverb: 0.25 },
            bright: { volume: 0.8, reverb: 0.15 },
            dry: { volume: 0.75, reverb: 0.05 }
        };

        const preset = presetMap[presetName];
        if (!preset) {
            console.warn('Preset audio inconnu :', presetName);
            return false;
        }

        if (!this.synthesizer || !this.synthesizer.initialized) {
            this.pendingPreset = presetName;
            return false;
        }

        if (this.synthesizer.masterGain) {
            this.synthesizer.masterGain.gain.value = preset.volume;
        }

        if (this.synthesizer.reverbGain) {
            this.synthesizer.reverbGain.gain.value = preset.reverb;
        }

        this.activePreset = presetName;
        return true;
    }

    optimizeForVoiceRecognition() {
        if (!this.synthesizer || !this.synthesizer.initialized) {
            return null;
        }

        const previousSettings = {
            volume: this.synthesizer.masterGain?.gain.value ?? 0.7,
            reverb: this.synthesizer.reverbGain?.gain.value ?? 0.2
        };

        if (this.synthesizer.masterGain) {
            this.synthesizer.masterGain.gain.value = Math.min(previousSettings.volume, 0.4);
        }

        if (this.synthesizer.reverbGain) {
            this.synthesizer.reverbGain.gain.value = 0.05;
        }

        return () => {
            if (this.synthesizer.masterGain) {
                this.synthesizer.masterGain.gain.value = previousSettings.volume;
            }
            if (this.synthesizer.reverbGain) {
                this.synthesizer.reverbGain.gain.value = previousSettings.reverb;
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
