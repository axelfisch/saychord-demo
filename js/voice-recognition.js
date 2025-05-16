/**
 * Gestionnaire de reconnaissance vocale pour l'application SayChord
 * Version adaptée pour GitHub Pages avec gestion des permissions et des erreurs
 */

class VoiceRecognitionManager {
    constructor(chordDictionary) {
        this.chordDictionary = chordDictionary;
        this.recognition = null;
        this.isListening = false;
        this.callbacks = {
            onResult: null,
            onStart: null,
            onStop: null,
            onError: null
        };
        this.errorMessages = {
            'not-allowed': "L'accès au microphone a été refusé. Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur.",
            'no-speech': "Aucune parole n'a été détectée. Veuillez parler plus fort ou vérifier votre microphone.",
            'audio-capture': "Aucun microphone n'a été détecté. Veuillez vérifier que votre microphone est correctement connecté.",
            'network': "Une erreur réseau s'est produite. Veuillez vérifier votre connexion internet.",
            'aborted': "La reconnaissance vocale a été interrompue.",
            'service-not-allowed': "Le service de reconnaissance vocale n'est pas disponible dans ce navigateur.",
            'bad-grammar': "Erreur de grammaire dans la reconnaissance vocale.",
            'language-not-supported': "La langue demandée n'est pas prise en charge.",
            'no-match': "Aucune correspondance n'a été trouvée pour ce que vous avez dit.",
            'service-not-available': "Le service de reconnaissance vocale n'est pas disponible actuellement.",
            'default': "Une erreur s'est produite lors de la reconnaissance vocale."
        };
        this.initRecognition();
    }

    initRecognition() {
        try {
            // Vérifier si la reconnaissance vocale est disponible dans le navigateur
            if ('webkitSpeechRecognition' in window) {
                this.recognition = new webkitSpeechRecognition();
            } else if ('SpeechRecognition' in window) {
                this.recognition = new SpeechRecognition();
            } else {
                this.showPermissionRequest('La reconnaissance vocale n\'est pas prise en charge par votre navigateur. Essayez avec Chrome, Edge ou Safari.');
                return;
            }

            // Configuration de la reconnaissance vocale
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'fr-FR'; // Par défaut en français

            // Événements de la reconnaissance vocale
            this.recognition.onstart = () => {
                this.isListening = true;
                if (this.callbacks.onStart) this.callbacks.onStart();
                this.hideErrorMessage();
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (this.callbacks.onStop) this.callbacks.onStop();
            };

            this.recognition.onresult = (event) => {
                const last = event.results.length - 1;
                const text = event.results[last][0].transcript.trim();
                console.log('Texte reconnu:', text);
                
                if (this.callbacks.onResult) {
                    const chord = this.findChord(text);
                    this.callbacks.onResult(text, chord);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Erreur de reconnaissance vocale:', event.error);
                
                // Afficher un message d'erreur approprié
                const errorMessage = this.errorMessages[event.error] || this.errorMessages.default;
                this.showErrorMessage(errorMessage);
                
                if (event.error === 'not-allowed') {
                    this.showPermissionRequest('Veuillez autoriser l\'accès au microphone pour utiliser la dictée vocale.');
                }
                
                if (this.callbacks.onError) this.callbacks.onError(event.error);
            };

            console.log('Reconnaissance vocale initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la reconnaissance vocale:', error);
            this.showErrorMessage('Une erreur s\'est produite lors de l\'initialisation de la reconnaissance vocale.');
        }
    }

    start() {
        if (!this.recognition) {
            this.showPermissionRequest('La reconnaissance vocale n\'est pas disponible. Veuillez utiliser un navigateur compatible comme Chrome, Edge ou Safari.');
            return;
        }

        try {
            this.recognition.start();
            console.log('Reconnaissance vocale démarrée');
        } catch (error) {
            console.error('Erreur lors du démarrage de la reconnaissance vocale:', error);
            this.showErrorMessage('Une erreur s\'est produite lors du démarrage de la reconnaissance vocale.');
            
            // Réinitialiser la reconnaissance en cas d'erreur
            this.recognition.stop();
            setTimeout(() => {
                this.initRecognition();
            }, 500);
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
                console.log('Reconnaissance vocale arrêtée');
            } catch (error) {
                console.error('Erreur lors de l\'arrêt de la reconnaissance vocale:', error);
            }
        }
    }

    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
            console.log('Langue de reconnaissance définie sur:', lang);
        }
    }

    findChord(text) {
        // Normaliser le texte (supprimer les accents, mettre en minuscules)
        const normalizedText = text.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        console.log('Recherche d\'accord pour:', normalizedText);
        
        // Adapter le texte pour la recherche d'accords
        let searchText = normalizedText;
        
        // Remplacer les mots courants par leurs équivalents pour la recherche d'accords
        const replacements = {
            'do majeur': 'cmaj',
            'do mineur': 'cmin',
            're majeur': 'dmaj',
            're mineur': 'dmin',
            'mi majeur': 'emaj',
            'mi mineur': 'emin',
            'fa majeur': 'fmaj',
            'fa mineur': 'fmin',
            'sol majeur': 'gmaj',
            'sol mineur': 'gmin',
            'la majeur': 'amaj',
            'la mineur': 'amin',
            'si majeur': 'bmaj',
            'si mineur': 'bmin',
            'majeur': 'maj',
            'mineur': 'min',
            'septieme': '7',
            'septième': '7',
            'bemol': 'b',
            'bémol': 'b',
            'diese': '#',
            'dièse': '#'
        };
        
        for (const [word, replacement] of Object.entries(replacements)) {
            searchText = searchText.replace(new RegExp(word, 'g'), replacement);
        }
        
        console.log('Texte adapté pour la recherche:', searchText);
        
        // Rechercher dans le dictionnaire d'accords
        return this.chordDictionary.findChordByText(searchText);
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    showErrorMessage(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        } else {
            // Créer l'élément s'il n'existe pas
            const newErrorElement = document.createElement('div');
            newErrorElement.id = 'error-message';
            newErrorElement.className = 'error-message show';
            newErrorElement.textContent = message;
            document.querySelector('.control-panel').prepend(newErrorElement);
        }
    }

    hideErrorMessage() {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    showPermissionRequest(message) {
        let permissionElement = document.getElementById('permission-request');
        
        if (!permissionElement) {
            // Créer l'élément s'il n'existe pas
            permissionElement = document.createElement('div');
            permissionElement.id = 'permission-request';
            permissionElement.className = 'permission-request';
            
            const messageElement = document.createElement('p');
            messageElement.textContent = message;
            
            const button = document.createElement('button');
            button.textContent = 'Autoriser le microphone';
            button.onclick = () => {
                // Demander l'accès au microphone
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(() => {
                        // Accès autorisé
                        permissionElement.classList.remove('show');
                        this.initRecognition();
                        this.start();
                    })
                    .catch((error) => {
                        // Accès refusé
                        console.error('Erreur d\'accès au microphone:', error);
                        this.showErrorMessage('L\'accès au microphone a été refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.');
                    });
            };
            
            permissionElement.appendChild(messageElement);
            permissionElement.appendChild(button);
            
            document.querySelector('.control-panel').prepend(permissionElement);
        } else {
            // Mettre à jour le message
            permissionElement.querySelector('p').textContent = message;
        }
        
        permissionElement.classList.add('show');
    }
}

// Vérifier si le module est chargé dans un contexte GitHub Pages
if (window.location.hostname.includes('github.io')) {
    console.log('Application exécutée sur GitHub Pages - Adaptations spécifiques activées');
    
    // Vérifier les permissions du microphone au chargement
    document.addEventListener('DOMContentLoaded', () => {
        // Vérifier si l'API mediaDevices est disponible
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            console.log('API mediaDevices disponible');
        } else {
            console.warn('API mediaDevices non disponible dans ce navigateur');
            
            // Créer un élément d'avertissement
            const warningElement = document.createElement('div');
            warningElement.className = 'error-message show';
            warningElement.textContent = 'La reconnaissance vocale nécessite un navigateur moderne comme Chrome, Edge ou Safari.';
            document.querySelector('.control-panel').prepend(warningElement);
        }
    });
}
