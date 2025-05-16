/**
 * Adaptateur de reconnaissance vocale pour l'application SayChord
 * Améliore la précision de la reconnaissance des accords
 */

class VoiceRecognitionAdapter {
    constructor(voiceRecognitionManager) {
        this.voiceRecognitionManager = voiceRecognitionManager;
        this.initialize();
    }
    
    initialize() {
        // Initialiser l'adaptateur
        console.log('Adaptateur de reconnaissance vocale initialisé');
        
        // Ajouter des messages d'aide spécifiques pour GitHub Pages
        if (window.location.hostname.includes('github.io')) {
            document.addEventListener('DOMContentLoaded', () => {
                this.addHelpMessages();
            });
        }
    }
    
    addHelpMessages() {
        const micButton = document.getElementById('mic-button');
        if (micButton) {
            micButton.setAttribute('title', 'Cliquez pour activer le microphone (nécessite une autorisation)');
            
            micButton.addEventListener('click', () => {
                // Vérifier si le navigateur supporte la reconnaissance vocale
                if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                    alert('Votre navigateur ne supporte pas la reconnaissance vocale. Veuillez utiliser Chrome, Edge ou Safari pour une expérience optimale.');
                }
            });
        }
    }
}

// Initialiser l'adaptateur lorsque la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // L'adaptateur sera initialisé par main.js
    console.log('Adaptateur de reconnaissance vocale prêt à être initialisé');
});
