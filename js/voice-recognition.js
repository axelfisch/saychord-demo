// voice-recognition.js - Module de reconnaissance vocale pour SayChord
// Version corrigée pour GitHub Pages

class VoiceRecognition {
    constructor(chordDictionary) {
        this.chordDictionary = chordDictionary;
        this.recognition = null;
        this.isListening = false;
        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.adapter = new VoiceRecognitionAdapter(); // Utilise l'adaptateur pour améliorer la reconnaissance
        this.setupRecognition();
    }

    setupRecognition() {
        try {
            // Vérifier si la reconnaissance vocale est disponible dans le navigateur
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                console.error("La reconnaissance vocale n'est pas prise en charge par ce navigateur.");
                this.showBrowserSupportError();
                return;
            }

            // Initialiser l'objet de reconnaissance vocale
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Configurer les options de reconnaissance
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'fr-FR'; // Langue par défaut: français
            
            // Gérer les événements de reconnaissance
            this.recognition.onresult = (event) => this.handleResult(event);
            this.recognition.onerror = (event) => this.handleError(event);
            this.recognition.onend = () => this.handleEnd();
            
            console.log("Module de reconnaissance vocale initialisé avec succès");
        } catch (error) {
            console.error("Erreur lors de l'initialisation de la reconnaissance vocale:", error);
            this.showBrowserSupportError();
        }
    }

    start(onResultCallback, onErrorCallback) {
        if (!this.recognition) {
            console.error("La reconnaissance vocale n'est pas disponible");
            this.showPermissionRequest();
            return;
        }
        
        this.onResultCallback = onResultCallback;
        this.onErrorCallback = onErrorCallback;
        
        try {
            this.recognition.start();
            this.isListening = true;
            console.log("Reconnaissance vocale démarrée");
            
            // Afficher une demande d'autorisation si nécessaire
            this.showPermissionRequest();
        } catch (error) {
            console.error("Erreur lors du démarrage de la reconnaissance vocale:", error);
            if (this.onErrorCallback) {
                this.onErrorCallback("Impossible de démarrer la reconnaissance vocale");
            }
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
                this.isListening = false;
                console.log("Reconnaissance vocale arrêtée");
            } catch (error) {
                console.error("Erreur lors de l'arrêt de la reconnaissance vocale:", error);
            }
        }
    }

    handleResult(event) {
        if (event.results.length > 0) {
            const transcript = event.results[0][0].transcript.trim();
            console.log("Texte reconnu:", transcript);
            
            // Utiliser l'adaptateur pour améliorer la reconnaissance
            const processedText = this.adapter.processText(transcript);
            console.log("Texte traité:", processedText);
            
            // Rechercher l'accord dans le dictionnaire
            const chord = this.chordDictionary.findChord(processedText);
            
            if (this.onResultCallback) {
                this.onResultCallback(chord, processedText);
            }
        }
    }

    handleError(event) {
        console.error("Erreur de reconnaissance vocale:", event.error);
        
        // Gérer les erreurs spécifiques
        let errorMessage = "Une erreur est survenue lors de la reconnaissance vocale";
        
        switch (event.error) {
            case 'not-allowed':
                errorMessage = "L'accès au microphone a été refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.";
                this.showPermissionRequest();
                break;
            case 'no-speech':
                errorMessage = "Aucune parole détectée. Veuillez réessayer.";
                break;
            case 'network':
                errorMessage = "Problème de connexion réseau. Veuillez vérifier votre connexion Internet.";
                break;
        }
        
        if (this.onErrorCallback) {
            this.onErrorCallback(errorMessage);
        }
    }

    handleEnd() {
        this.isListening = false;
        console.log("Session de reconnaissance vocale terminée");
    }

    showPermissionRequest() {
        // Afficher une demande d'autorisation pour le microphone
        const permissionRequest = document.querySelector('.permission-request');
        if (permissionRequest) {
            permissionRequest.classList.add('show');
            
            // Ajouter un gestionnaire d'événements au bouton d'autorisation
            const permissionButton = permissionRequest.querySelector('button');
            if (permissionButton) {
                permissionButton.addEventListener('click', () => {
                    // Demander l'autorisation d'utiliser le microphone
                    navigator.mediaDevices.getUserMedia({ audio: true })
                        .then(() => {
                            console.log("Autorisation microphone accordée");
                            permissionRequest.classList.remove('show');
                            // Redémarrer la reconnaissance vocale
                            if (this.onResultCallback) {
                                this.start(this.onResultCallback, this.onErrorCallback);
                            }
                        })
                        .catch((error) => {
                            console.error("Autorisation microphone refusée:", error);
                            if (this.onErrorCallback) {
                                this.onErrorCallback("L'accès au microphone a été refusé");
                            }
                        });
                });
            }
        }
    }

    showBrowserSupportError() {
        // Afficher un message d'erreur si le navigateur ne prend pas en charge la reconnaissance vocale
        const errorMessage = "Votre navigateur ne prend pas en charge la reconnaissance vocale. Veuillez utiliser Chrome, Edge ou Safari pour une expérience optimale.";
        
        if (this.onErrorCallback) {
            this.onErrorCallback(errorMessage);
        }
        
        // Afficher un message d'erreur dans l'interface
        const appContainer = document.querySelector('#app-container');
        if (appContainer) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = errorMessage;
            appContainer.prepend(errorElement);
        }
    }
}
