/**
 * Gestionnaire du dictionnaire d'accords pour SayChord
 * Charge et gère le dictionnaire d'accords JSON
 */
class ChordDictionary {
    constructor() {
        this.dictionary = null;
        this.isLoaded = false;
    }

    /**
     * Charge le dictionnaire d'accords depuis le fichier JSON
     * @returns {Promise} Promesse résolue lorsque le dictionnaire est chargé
     */
    async loadDictionary() {
        try {
            const response = await fetch('/chord-dictionary.json');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            this.dictionary = await response.json();
            this.isLoaded = true;
            console.log('Dictionnaire d\'accords chargé avec succès');
            return this.dictionary;
        } catch (error) {
            console.error('Erreur lors du chargement du dictionnaire d\'accords:', error);
            throw error;
        }
    }

    /**
     * Recherche un accord par son nom ou alias
     * @param {string} chordName - Nom de l'accord à rechercher
     * @returns {Object|null} Objet accord trouvé ou null si non trouvé
     */
    findChord(chordName) {
        if (!this.isLoaded) {
            console.error('Le dictionnaire n\'est pas encore chargé');
            return null;
        }

        // Normaliser le nom de l'accord pour la recherche
        const normalizedName = this.normalizeChordName(chordName);
        
        // Parcourir toutes les tonalités
        for (const tonalite in this.dictionary.tonalites) {
            const accords = this.dictionary.tonalites[tonalite].accords;
            
            // Rechercher dans les accords de cette tonalité
            for (const accord of accords) {
                // Vérifier le nom principal
                if (this.normalizeChordName(accord.nom) === normalizedName) {
                    return accord;
                }
                
                // Vérifier le nom français
                if (this.normalizeChordName(accord.nom_fr) === normalizedName) {
                    return accord;
                }
                
                // Vérifier les alias
                for (const alias of accord.aliases) {
                    if (this.normalizeChordName(alias) === normalizedName) {
                        return accord;
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Normalise un nom d'accord pour la recherche
     * @param {string} name - Nom d'accord à normaliser
     * @returns {string} Nom normalisé
     */
    normalizeChordName(name) {
        return name.toLowerCase()
            .replace(/\s+/g, '') // Supprimer les espaces
            .replace(/maj/g, 'major') // Normaliser les variantes
            .replace(/min/g, 'minor')
            .replace(/dim/g, 'diminished')
            .replace(/aug/g, 'augmented');
    }

    /**
     * Obtient les notes d'un accord par son nom
     * @param {string} chordName - Nom de l'accord
     * @returns {Array|null} Tableau des notes de l'accord ou null si non trouvé
     */
    getChordNotes(chordName) {
        const chord = this.findChord(chordName);
        return chord ? chord.notes : null;
    }

    /**
     * Obtient tous les accords d'une tonalité spécifique
     * @param {string} key - Tonalité (ex: "C", "Db", etc.)
     * @returns {Array|null} Tableau des accords de la tonalité ou null si non trouvée
     */
    getChordsInKey(key) {
        if (!this.isLoaded) {
            console.error('Le dictionnaire n\'est pas encore chargé');
            return null;
        }

        const tonalite = this.dictionary.tonalites[key];
        return tonalite ? tonalite.accords : null;
    }

    /**
     * Obtient toutes les tonalités disponibles
     * @returns {Array} Tableau des tonalités
     */
    getAllKeys() {
        if (!this.isLoaded) {
            console.error('Le dictionnaire n\'est pas encore chargé');
            return [];
        }

        return Object.keys(this.dictionary.tonalites);
    }

    /**
     * Obtient tous les accords du dictionnaire
     * @returns {Array} Tableau de tous les accords
     */
    getAllChords() {
        if (!this.isLoaded) {
            console.error('Le dictionnaire n\'est pas encore chargé');
            return [];
        }

        const allChords = [];
        for (const tonalite in this.dictionary.tonalites) {
            allChords.push(...this.dictionary.tonalites[tonalite].accords);
        }
        return allChords;
    }
}

// Exporter l'instance du dictionnaire d'accords
const chordDictionary = new ChordDictionary();
export default chordDictionary;
