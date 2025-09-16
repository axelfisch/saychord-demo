// Voice Recognition Module
class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.onResult = null;
        this.onError = null;
        this.onStatusChange = null;
        this.initRecognition();
    }

    initRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'fr-FR'; // French language
        this.recognition.maxAlternatives = 3;

        // Event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onStatusChange) {
                this.onStatusChange('Écoute en cours...');
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onStatusChange) {
                this.onStatusChange('');
            }
        };

        this.recognition.onerror = (event) => {
            this.isListening = false;
            if (this.onError) {
                this.onError(event.error);
            }
            if (this.onStatusChange) {
                this.onStatusChange(`Erreur: ${this.getErrorMessage(event.error)}`);
            }
        };

        this.recognition.onresult = (event) => {
            const results = event.results;
            const lastResult = results[results.length - 1];
            
            if (lastResult.isFinal) {
                const transcript = lastResult[0].transcript.trim();
                if (this.onResult) {
                    this.onResult(transcript);
                }
            } else {
                // Interim results
                const interimTranscript = lastResult[0].transcript.trim();
                if (this.onStatusChange) {
                    this.onStatusChange(`En cours: "${interimTranscript}"`);
                }
            }
        };
    }

    start() {
        if (!this.recognition) {
            if (this.onError) {
                this.onError('Speech recognition not supported');
            }
            return;
        }

        if (this.isListening) {
            this.stop();
        } else {
            this.recognition.start();
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    getErrorMessage(error) {
        const errorMessages = {
            'network': 'Erreur réseau',
            'not-allowed': 'Microphone non autorisé',
            'no-speech': 'Aucune parole détectée',
            'aborted': 'Reconnaissance annulée',
            'audio-capture': 'Aucun microphone trouvé',
            'language-not-supported': 'Langue non supportée'
        };
        return errorMessages[error] || 'Erreur inconnue';
    }

    // Set language
    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }
}

// Export voice recognition instance
window.voiceRecognition = new VoiceRecognition();