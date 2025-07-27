// voice-recognition-adapter.js - Adaptateur pour améliorer la reconnaissance vocale
// Version pour GitHub Pages

class VoiceRecognitionAdapter {
    constructor() {
        // Dictionnaire de corrections courantes
        this.corrections = {
            // Corrections françaises
            'domaine': 'do mineur',
            'dominante': 'do mineur',
            'domine': 'do mineur',
            'domi': 'do mineur',
            'c mineur': 'do mineur',
            'c majeur': 'do majeur',
            'c major': 'do majeur',
            'si mineur': 'si mineur',
            'si majeur': 'si majeur',
            'la mineur': 'la mineur',
            'la majeur': 'la majeur',
            'sol mineur': 'sol mineur',
            'sol majeur': 'sol majeur',
            'fa mineur': 'fa mineur',
            'fa majeur': 'fa majeur',
            'mi mineur': 'mi mineur',
            'mi majeur': 'mi majeur',
            're mineur': 'ré mineur',
            're majeur': 'ré majeur',
            
            // Corrections anglaises
            'c minor': 'do mineur',
            'c major': 'do majeur',
            'b minor': 'si mineur',
            'b major': 'si majeur',
            'a minor': 'la mineur',
            'a major': 'la majeur',
            'g minor': 'sol mineur',
            'g major': 'sol majeur',
            'f minor': 'fa mineur',
            'f major': 'fa majeur',
            'e minor': 'mi mineur',
            'e major': 'mi majeur',
            'd minor': 'ré mineur',
            'd major': 'ré majeur'
        };
        
        // Expressions régulières pour la détection d'accords
        this.chordRegexPatterns = [
            // Patterns français
            /\b(do|ré|re|mi|fa|sol|la|si)\s+(mineur|majeur|min|maj)(?:\s+(\d+))?\b/i,
            /\b(do|ré|re|mi|fa|sol|la|si)\s+(m|M)(?:(\d+))?\b/i,
            
            // Patterns anglais
            /\b([a-g])(?:(#|b))?\s+(minor|major|min|maj)(?:\s+(\d+))?\b/i,
            /\b([a-g])(?:(#|b))?\s+(m|M)(?:(\d+))?\b/i
        ];
    }

    processText(text) {
        if (!text) return text;
        
        // Convertir en minuscules pour les comparaisons
        const lowerText = text.toLowerCase();
        
        // Vérifier les corrections directes
        if (this.corrections[lowerText]) {
            return this.corrections[lowerText];
        }
        
        // Appliquer des corrections partielles et des transformations
        let processedText = this.applyPartialCorrections(lowerText);
        
        // Détecter et formater les accords
        processedText = this.detectAndFormatChords(processedText);
        
        return processedText;
    }

    applyPartialCorrections(text) {
        // Remplacer les chiffres écrits en toutes lettres par des chiffres
        const numberWords = {
            'sept': '7',
            'neuf': '9',
            'onze': '11',
            'treize': '13'
        };
        
        let result = text;
        
        // Appliquer les remplacements de nombres
        Object.entries(numberWords).forEach(([word, number]) => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            result = result.replace(regex, number);
        });
        
        // Corriger les erreurs courantes de reconnaissance
        result = result
            .replace(/(?:de|the)\s+(do|ré|re|mi|fa|sol|la|si)/gi, '$1')
            .replace(/(?:c'est|ces)\s+(do|ré|re|mi|fa|sol|la|si)/gi, '$1')
            .replace(/(?:un|une)\s+(do|ré|re|mi|fa|sol|la|si)/gi, '$1')
            .replace(/(?:à|a)\s+(do|ré|re|mi|fa|sol|la|si)/gi, '$1');
        
        return result;
    }

    detectAndFormatChords(text) {
        // Tester chaque pattern de regex sur le texte
        for (const pattern of this.chordRegexPatterns) {
            const match = text.match(pattern);
            if (match) {
                // Extraire les composants de l'accord
                const note = match[1];
                const quality = match[2];
                const extension = match[3] || '';
                
                // Formater l'accord selon les conventions
                let formattedChord = note;
                
                // Traiter la qualité de l'accord
                if (quality === 'mineur' || quality === 'minor' || quality === 'min' || quality === 'm') {
                    formattedChord += ' mineur';
                } else {
                    formattedChord += ' majeur';
                }
                
                // Ajouter l'extension si présente
                if (extension) {
                    formattedChord += ' ' + extension;
                }
                
                return formattedChord;
            }
        }
        
        // Si aucun pattern ne correspond, retourner le texte original
        return text;
    }
}

export default VoiceRecognitionAdapter;
