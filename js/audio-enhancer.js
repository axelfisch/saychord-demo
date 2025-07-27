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
}

// Initialiser l'améliorateur audio lorsque la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // L'améliorateur sera initialisé par main.js
    console.log('Améliorateur audio prêt à être initialisé');
});

export default AudioEnhancer;
