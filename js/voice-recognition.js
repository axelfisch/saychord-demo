/**
 * Gestionnaire de reconnaissance vocale pour SayChord
 * Utilise l'API Web Speech pour reconnaître les accords dictés vocalement
 */
class VoiceRecognitionManager {
    constructor(chordDictionary) {
        this.chordDictionary = chordDictionary;
        this.recognition = null;
        this.isListening = false;
        this.onResultCallback = null;
        this.onStartCallback = null;
        this.onEndCallback = null;
        this.onErrorCallback = null;
        this.lang = 'fr-FR'; // Langue par défaut
        
        this.initRecognition();
    }

    /**
     * Initialise le système de reconnaissance vocale
     */
    initRecognition() {
        // Vérifier si l'API Web Speech est supportée
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('La reconnaissance vocale n\'est pas supportée par ce navigateur.');
            return;
        }

        // Créer l'objet de reconnaissance vocale
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configurer les options
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = this.lang;
        
        // Configurer les gestionnaires d'événements
        this.recognition.onresult = (event) => this.handleResult(event);
        this.recognition.onstart = () => this.handleStart();
        this.recognition.onend = () => this.handleEnd();
        this.recognition.onerror = (event) => this.handleError(event);
        
        console.log('Système de reconnaissance vocale initialisé');
    }

    /**
     * Démarre l'écoute vocale
     */
    startListening() {
        if (!this.recognition) {
            console.error('La reconnaissance vocale n\'est pas initialisée');
            return;
        }
        
        if (this.isListening) {
            this.stopListening();
        }
        
        try {
            this.recognition.start();
            this.isListening = true;
            console.log('Écoute vocale démarrée');
        } catch (error) {
            console.error('Erreur lors du démarrage de l\'écoute vocale:', error);
        }
    }

    /**
     * Arrête l'écoute vocale
     */
    stopListening() {
        if (!this.recognition || !this.isListening) {
            return;
        }
        
        try {
            this.recognition.stop();
            this.isListening = false;
            console.log('Écoute vocale arrêtée');
        } catch (error) {
            console.error('Erreur lors de l\'arrêt de l\'écoute vocale:', error);
        }
    }

    /**
     * Change la langue de reconnaissance
     * @param {string} lang - Code de langue (ex: 'fr-FR', 'en-US')
     */
    setLanguage(lang) {
        this.lang = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
            console.log(`Langue de reconnaissance changée pour: ${lang}`);
        }
    }

    /**
     * Gère les résultats de la reconnaissance vocale
     * @param {SpeechRecognitionEvent} event - Événement de résultat
     */
    handleResult(event) {
        const result = event.results[0][0].transcript.trim();
        console.log('Texte reconnu:', result);
        
        // Analyser le résultat pour identifier l'accord
        const chord = this.parseChordFromText(result);
        
        if (this.onResultCallback && chord) {
            this.onResultCallback(chord);
        }
    }

    /**
     * Analyse le texte reconnu pour identifier un accord
     * @param {string} text - Texte reconnu
     * @returns {Object|null} Objet accord identifié ou null si non trouvé
     */
    parseChordFromText(text) {
        // Normaliser le texte
        const normalizedText = text.toLowerCase()
            .replace(/majeur/g, 'maj')
            .replace(/mineur/g, 'min')
            .replace(/septième/g, '7')
            .replace(/septieme/g, '7')
            .replace(/bémol/g, 'b')
            .replace(/dièse/g, '#')
            .replace(/diese/g, '#')
            .replace(/augmenté/g, 'aug')
            .replace(/augmente/g, 'aug')
            .replace(/diminué/g, 'dim')
            .replace(/diminue/g, 'dim');
        
        // Rechercher des motifs d'accords courants
        const chordPatterns = [
            // Motifs en français
            /\b(do|ré|re|mi|fa|sol|la|si)\s*(bémol|bemol|dièse|diese|b|#)?\s*(maj|min|m|7|maj7|min7|m7|dim|aug|sus4|sus2|6|9|11|13)?\s*(bémol|bemol|dièse|diese|b|#)?\s*(5|7|9|11|13)?\b/gi,
            // Motifs en notation anglo-saxonne
            /\b([a-g])(b|#)?\s*(maj|min|m|7|maj7|min7|m7|dim|aug|sus4|sus2|6|9|11|13)?\s*(b|#)?\s*(5|7|9|11|13)?\b/gi
        ];
        
        // Tester chaque motif
        for (const pattern of chordPatterns) {
            const matches = normalizedText.match(pattern);
            if (matches && matches.length > 0) {
                // Rechercher l'accord dans le dictionnaire
                for (const match of matches) {
                    const chord = this.chordDictionary.findChord(match);
                    if (chord) {
                        return chord;
                    }
                }
            }
        }
        
        // Si aucun motif ne correspond, essayer de rechercher directement dans le dictionnaire
        return this.chordDictionary.findChord(normalizedText);
    }

    /**
     * Gère le début de la reconnaissance vocale
     */
    handleStart() {
        console.log('Reconnaissance vocale démarrée');
        if (this.onStartCallback) {
            this.onStartCallback();
        }
    }

    /**
     * Gère la fin de la reconnaissance vocale
     */
    handleEnd() {
        console.log('Reconnaissance vocale terminée');
        this.isListening = false;
        if (this.onEndCallback) {
            this.onEndCallback();
        }
    }

    /**
     * Gère les erreurs de reconnaissance vocale
     * @param {SpeechRecognitionError} event - Événement d'erreur
     */
    handleError(event) {
        console.error('Erreur de reconnaissance vocale:', event.error);
        this.isListening = false;
        if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
        }
    }

    /**
     * Définit le callback pour les résultats de reconnaissance
     * @param {Function} callback - Fonction à appeler avec l'accord reconnu
     */
    onResult(callback) {
        this.onResultCallback = callback;
    }

    /**
     * Définit le callback pour le début de la reconnaissance
     * @param {Function} callback - Fonction à appeler au début de la reconnaissance
     */
    onStart(callback) {
        this.onStartCallback = callback;
    }

    /**
     * Définit le callback pour la fin de la reconnaissance
     * @param {Function} callback - Fonction à appeler à la fin de la reconnaissance
     */
    onEnd(callback) {
        this.onEndCallback = callback;
    }

    /**
     * Définit le callback pour les erreurs de reconnaissance
     * @param {Function} callback - Fonction à appeler en cas d'erreur
     */
    onError(callback) {
        this.onErrorCallback = callback;
    }
}

export default VoiceRecognitionManager;
