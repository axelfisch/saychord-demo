/**
 * Adaptateur de compatibilité pour la reconnaissance vocale
 * Assure la compatibilité entre différents navigateurs et améliore la précision
 */
class VoiceRecognitionAdapter {
    constructor(voiceRecognition, chordDictionary) {
        this.voiceRecognition = voiceRecognition;
        this.chordDictionary = chordDictionary;
        this.isInitialized = false;
        
        // Dictionnaire de correction pour les erreurs courantes
        this.correctionDictionary = {
            // Corrections françaises
            'domaine': 'do mineur',
            'dominé': 'do mineur',
            'demi-neur': 'do mineur',
            'la mine': 'la mineur',
            'la mine heure': 'la mineur',
            'sol mine': 'sol mineur',
            'sol mine heure': 'sol mineur',
            'c\'est 7': 'C7',
            'c\'est majeur': 'C majeur',
            'c\'est mineur': 'C mineur',
            'g7': 'G7',
            'd7': 'D7',
            'a7': 'A7',
            'e7': 'E7',
            'b7': 'B7',
            'f7': 'F7',
            
            // Corrections anglaises
            'see major': 'C major',
            'see minor': 'C minor',
            'see seven': 'C7',
            'g major': 'G major',
            'g minor': 'G minor',
            'g seven': 'G7',
            'd major': 'D major',
            'd minor': 'D minor',
            'd seven': 'D7'
        };
        
        this.init();
    }
    
    /**
     * Initialise l'adaptateur
     */
    init() {
        // Remplacer la méthode de traitement des résultats
        const originalHandleResult = this.voiceRecognition.handleResult.bind(this.voiceRecognition);
        
        this.voiceRecognition.handleResult = (event) => {
            const result = event.results[0][0].transcript.trim();
            console.log('Texte reconnu brut:', result);
            
            // Appliquer les corrections
            const correctedResult = this.correctRecognitionErrors(result);
            console.log('Texte corrigé:', correctedResult);
            
            // Créer un nouvel événement avec le texte corrigé
            const correctedEvent = {
                results: [
                    [
                        {
                            transcript: correctedResult,
                            confidence: event.results[0][0].confidence
                        }
                    ]
                ]
            };
            
            // Appeler la méthode originale avec le texte corrigé
            originalHandleResult(correctedEvent);
        };
        
        // Améliorer la méthode d'analyse des accords
        const originalParseChord = this.voiceRecognition.parseChordFromText.bind(this.voiceRecognition);
        
        this.voiceRecognition.parseChordFromText = (text) => {
            // Essayer d'abord avec la méthode originale
            let chord = originalParseChord(text);
            
            // Si aucun accord n'est trouvé, essayer des approches alternatives
            if (!chord) {
                chord = this.advancedChordParsing(text);
            }
            
            return chord;
        };
        
        this.isInitialized = true;
        console.log('Adaptateur de reconnaissance vocale initialisé');
    }
    
    /**
     * Corrige les erreurs courantes de reconnaissance
     * @param {string} text - Texte reconnu
     * @returns {string} Texte corrigé
     */
    correctRecognitionErrors(text) {
        let correctedText = text.toLowerCase();
        
        // Appliquer les corrections du dictionnaire
        for (const [error, correction] of Object.entries(this.correctionDictionary)) {
            const regex = new RegExp(`\\b${error}\\b`, 'gi');
            correctedText = correctedText.replace(regex, correction);
        }
        
        // Corrections spécifiques aux accords
        correctedText = correctedText
            .replace(/(\w+)\s+majeur\s+(\d+)/g, '$1maj$2') // "do majeur 7" -> "domaj7"
            .replace(/(\w+)\s+mineur\s+(\d+)/g, '$1min$2') // "la mineur 7" -> "lamin7"
            .replace(/(\w+)\s+7\s+bémol\s+5/g, '$1 7b5') // "sol 7 bémol 5" -> "sol 7b5"
            .replace(/(\w+)\s+7\s+dièse\s+9/g, '$1 7#9') // "fa 7 dièse 9" -> "fa 7#9"
            .replace(/(\w+)\s+7\s+bémol\s+9/g, '$1 7b9') // "mi 7 bémol 9" -> "mi 7b9"
            .replace(/(\w+)\s+7\s+plus\s+5/g, '$1 7+5') // "ré 7 plus 5" -> "ré 7+5"
            .replace(/(\w+)\s+7\s+sus\s+4/g, '$1 7sus4'); // "do 7 sus 4" -> "do 7sus4"
        
        return correctedText;
    }
    
    /**
     * Analyse avancée des accords
     * @param {string} text - Texte à analyser
     * @returns {Object|null} Accord trouvé ou null
     */
    advancedChordParsing(text) {
        // Normaliser le texte
        const normalizedText = text.toLowerCase();
        
        // Rechercher des motifs d'accords plus complexes
        const complexPatterns = [
            // Motifs français avec altérations
            /\b(do|ré|re|mi|fa|sol|la|si)\s*(bémol|bemol|dièse|diese|b|#)?\s*(majeur|maj|mineur|min|m|7|9|13)?\s*(bémol|bemol|dièse|diese|b|#)?\s*(5|7|9|11|13)?\s*(plus|augmenté|augmente|diminué|diminue|\+|\-)?/gi,
            
            // Motifs avec notation slash (ex: "C sur E")
            /\b([a-g])(b|#)?\s*(maj|min|m|7|9)?\s*sur\s*([a-g])(b|#)?/gi,
            
            // Motifs avec altérations multiples (ex: "C7 bémol 5 dièse 9")
            /\b([a-g])(b|#)?\s*(7|9|13)\s*(bémol|bemol|b)\s*(5|9|13)\s*(dièse|diese|#)?\s*(5|9|13)?/gi
        ];
        
        // Tester chaque motif complexe
        for (const pattern of complexPatterns) {
            const matches = normalizedText.match(pattern);
            if (matches && matches.length > 0) {
                // Rechercher l'accord dans le dictionnaire
                for (const match of matches) {
                    // Essayer de trouver l'accord exact
                    const chord = this.chordDictionary.findChord(match);
                    if (chord) {
                        return chord;
                    }
                    
                    // Si pas trouvé, essayer de construire un accord à partir des composants
                    const constructedChord = this.constructChordFromComponents(match);
                    if (constructedChord) {
                        return constructedChord;
                    }
                }
            }
        }
        
        // Si aucun motif complexe ne correspond, essayer de rechercher des sous-chaînes
        const allChords = this.chordDictionary.getAllChords();
        for (const chord of allChords) {
            // Vérifier si le nom de l'accord est contenu dans le texte
            if (normalizedText.includes(chord.nom.toLowerCase()) || 
                (chord.nom_fr && normalizedText.includes(chord.nom_fr.toLowerCase()))) {
                return chord;
            }
            
            // Vérifier les alias
            for (const alias of chord.aliases) {
                if (normalizedText.includes(alias.toLowerCase())) {
                    return chord;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Construit un accord à partir de ses composants
     * @param {string} text - Texte décrivant l'accord
     * @returns {Object|null} Accord construit ou null
     */
    constructChordFromComponents(text) {
        // Cette méthode est une version simplifiée
        // Dans une implémentation réelle, elle analyserait les composants
        // et construirait un accord personnalisé
        
        // Pour l'instant, retourner null
        return null;
    }
}

export default VoiceRecognitionAdapter;
