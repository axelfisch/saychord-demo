/**
 * Gestionnaire de séquences d'accords pour SayChord
 * Gère la création, la lecture et l'export de séquences d'accords
 */
class SequenceManager {
    constructor(synthesizer) {
        this.synthesizer = synthesizer;
        this.sequence = [];
        this.isPlaying = false;
        this.isLooping = false;
        this.currentIndex = 0;
        this.tempo = 120; // BPM
        this.timeSignature = '4/4'; // Signature rythmique
        this.loopLength = 4; // Nombre de mesures dans la boucle
        this.playbackInterval = null;
        this.onPlayCallback = null;
        this.onStopCallback = null;
        this.onSequenceChangeCallback = null;
    }

    /**
     * Ajoute un accord à la séquence
     * @param {Object} chord - Objet accord à ajouter
     */
    addChord(chord) {
        if (!chord) {
            console.error('Accord invalide');
            return;
        }
        
        this.sequence.push(chord);
        console.log(`Accord ajouté à la séquence: ${chord.nom}`);
        
        if (this.onSequenceChangeCallback) {
            this.onSequenceChangeCallback(this.sequence);
        }
    }

    /**
     * Supprime un accord de la séquence
     * @param {number} index - Index de l'accord à supprimer
     */
    removeChord(index) {
        if (index < 0 || index >= this.sequence.length) {
            console.error('Index d\'accord invalide');
            return;
        }
        
        this.sequence.splice(index, 1);
        console.log(`Accord supprimé de la séquence à l'index ${index}`);
        
        if (this.onSequenceChangeCallback) {
            this.onSequenceChangeCallback(this.sequence);
        }
    }

    /**
     * Joue un accord spécifique de la séquence
     * @param {number} index - Index de l'accord à jouer
     */
    playChord(index) {
        if (index < 0 || index >= this.sequence.length) {
            console.error('Index d\'accord invalide');
            return;
        }
        
        const chord = this.sequence[index];
        this.synthesizer.playChordByName(chord);
    }

    /**
     * Démarre la lecture de la séquence
     */
    play() {
        if (this.isPlaying) {
            this.stop();
        }
        
        if (this.sequence.length === 0) {
            console.error('La séquence est vide');
            return;
        }
        
        this.isPlaying = true;
        this.currentIndex = 0;
        
        // Calculer l'intervalle entre les accords en fonction du tempo
        const beatDuration = 60 / this.tempo; // Durée d'un temps en secondes
        const chordDuration = this.getChordDuration(); // Durée d'un accord en temps
        const intervalMs = beatDuration * chordDuration * 1000; // Intervalle en millisecondes
        
        // Jouer le premier accord immédiatement
        this.playCurrentChord();
        
        // Configurer l'intervalle pour jouer les accords suivants
        this.playbackInterval = setInterval(() => {
            this.currentIndex++;
            
            // Si on atteint la fin de la séquence
            if (this.currentIndex >= this.sequence.length) {
                if (this.isLooping) {
                    this.currentIndex = 0; // Revenir au début
                } else {
                    this.stop(); // Arrêter la lecture
                    return;
                }
            }
            
            this.playCurrentChord();
        }, intervalMs);
        
        console.log('Lecture de la séquence démarrée');
        
        if (this.onPlayCallback) {
            this.onPlayCallback();
        }
    }

    /**
     * Joue l'accord courant
     */
    playCurrentChord() {
        if (this.currentIndex < 0 || this.currentIndex >= this.sequence.length) {
            return;
        }
        
        const chord = this.sequence[this.currentIndex];
        this.synthesizer.playChordByName(chord);
    }

    /**
     * Arrête la lecture de la séquence
     */
    stop() {
        if (!this.isPlaying) {
            return;
        }
        
        clearInterval(this.playbackInterval);
        this.playbackInterval = null;
        this.isPlaying = false;
        this.synthesizer.stopAllSounds();
        
        console.log('Lecture de la séquence arrêtée');
        
        if (this.onStopCallback) {
            this.onStopCallback();
        }
    }

    /**
     * Active/désactive la lecture en boucle
     * @param {boolean} looping - État de la lecture en boucle
     */
    setLooping(looping) {
        this.isLooping = looping;
        console.log(`Lecture en boucle ${looping ? 'activée' : 'désactivée'}`);
    }

    /**
     * Définit le tempo de lecture
     * @param {number} bpm - Tempo en battements par minute
     */
    setTempo(bpm) {
        this.tempo = Math.max(40, Math.min(240, bpm)); // Limiter entre 40 et 240 BPM
        console.log(`Tempo défini à ${this.tempo} BPM`);
        
        // Si la lecture est en cours, redémarrer pour appliquer le nouveau tempo
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
    }

    /**
     * Définit la signature rythmique
     * @param {string} timeSignature - Signature rythmique ('4/4' ou '3/4')
     */
    setTimeSignature(timeSignature) {
        if (timeSignature !== '4/4' && timeSignature !== '3/4') {
            console.error('Signature rythmique non supportée');
            return;
        }
        
        this.timeSignature = timeSignature;
        console.log(`Signature rythmique définie à ${this.timeSignature}`);
    }

    /**
     * Définit la longueur de la boucle en mesures
     * @param {number} bars - Nombre de mesures (4, 8, 16 ou 24)
     */
    setLoopLength(bars) {
        const validLengths = [4, 8, 16, 24];
        if (!validLengths.includes(bars)) {
            console.error('Longueur de boucle non supportée');
            return;
        }
        
        this.loopLength = bars;
        console.log(`Longueur de boucle définie à ${this.loopLength} mesures`);
    }

    /**
     * Calcule la durée d'un accord en temps
     * @returns {number} Durée en temps
     */
    getChordDuration() {
        // Par défaut, un accord dure une mesure
        const beatsPerMeasure = parseInt(this.timeSignature.split('/')[0]);
        return beatsPerMeasure;
    }

    /**
     * Efface la séquence
     */
    clearSequence() {
        this.stop();
        this.sequence = [];
        console.log('Séquence effacée');
        
        if (this.onSequenceChangeCallback) {
            this.onSequenceChangeCallback(this.sequence);
        }
    }

    /**
     * Exporte la séquence au format WAV
     * @returns {Promise<Blob>} Promesse résolue avec le blob WAV
     */
    async exportWAV() {
        if (this.sequence.length === 0) {
            console.error('La séquence est vide');
            return null;
        }
        
        try {
            // Créer un enregistreur avec Tone.js
            const recorder = new Tone.Recorder();
            this.synthesizer.synth.connect(recorder);
            
            // Démarrer l'enregistrement
            recorder.start();
            
            // Jouer la séquence
            const beatDuration = 60 / this.tempo;
            const chordDuration = this.getChordDuration();
            
            for (const chord of this.sequence) {
                this.synthesizer.playChordByName(chord, beatDuration * chordDuration);
                await new Promise(resolve => setTimeout(resolve, beatDuration * chordDuration * 1000));
            }
            
            // Attendre un peu pour capturer la fin du dernier accord
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Arrêter l'enregistrement et obtenir le blob
            const blob = await recorder.stop();
            
            // Déconnecter l'enregistreur
            this.synthesizer.synth.disconnect(recorder);
            
            console.log('Séquence exportée au format WAV');
            return blob;
        } catch (error) {
            console.error('Erreur lors de l\'export WAV:', error);
            return null;
        }
    }

    /**
     * Exporte la séquence au format PDF (simulation)
     * @returns {Promise<string>} Promesse résolue avec l'URL du PDF
     */
    async exportPDF() {
        if (this.sequence.length === 0) {
            console.error('La séquence est vide');
            return null;
        }
        
        // Note: Dans une implémentation réelle, nous utiliserions une bibliothèque comme jsPDF
        // pour générer un véritable PDF. Pour cette démo, nous simulons l'export.
        
        console.log('Séquence exportée au format PDF (simulation)');
        
        // Simuler un délai de génération
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retourner une URL fictive
        return 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDM4Pj5zdHJlYW0KeJwr5HIK4TI2UzC2NFMISeFyDeEK5CpUMFQwAEIImZZmqGBhYaJgqGhmAgBBdQb9CmVuZHN0cmVhbQplbmRvYmoKNiAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDIzODQ+PnN0cmVhbQp4nO1aS3PbNhD+rhm';
    }

    /**
     * Sauvegarde la séquence dans le stockage local
     * @param {string} name - Nom de la séquence
     */
    saveSequence(name) {
        if (this.sequence.length === 0) {
            console.error('La séquence est vide');
            return;
        }
        
        try {
            // Créer un objet de sauvegarde
            const saveData = {
                name: name,
                sequence: this.sequence,
                tempo: this.tempo,
                timeSignature: this.timeSignature,
                loopLength: this.loopLength,
                date: new Date().toISOString()
            };
            
            // Récupérer les séquences existantes
            let savedSequences = JSON.parse(localStorage.getItem('saychord-sequences') || '[]');
            
            // Ajouter la nouvelle séquence
            savedSequences.push(saveData);
            
            // Sauvegarder dans le stockage local
            localStorage.setItem('saychord-sequences', JSON.stringify(savedSequences));
            
            console.log(`Séquence "${name}" sauvegardée`);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la séquence:', error);
        }
    }

    /**
     * Charge une séquence depuis le stockage local
     * @param {string} name - Nom de la séquence
     * @returns {boolean} Succès du chargement
     */
    loadSequence(name) {
        try {
            // Récupérer les séquences existantes
            const savedSequences = JSON.parse(localStorage.getItem('saychord-sequences') || '[]');
            
            // Rechercher la séquence par son nom
            const saveData = savedSequences.find(seq => seq.name === name);
            
            if (!saveData) {
                console.error(`Séquence "${name}" non trouvée`);
                return false;
            }
            
            // Arrêter la lecture en cours
            this.stop();
            
            // Charger les données
            this.sequence = saveData.sequence;
            this.tempo = saveData.tempo;
            this.timeSignature = saveData.timeSignature;
            this.loopLength = saveData.loopLength;
            
            console.log(`Séquence "${name}" chargée`);
            
            if (this.onSequenceChangeCallback) {
                this.onSequenceChangeCallback(this.sequence);
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement de la séquence:', error);
            return false;
        }
    }

    /**
     * Définit le callback pour le changement de séquence
     * @param {Function} callback - Fonction à appeler quand la séquence change
     */
    onSequenceChange(callback) {
        this.onSequenceChangeCallback = callback;
    }

    /**
     * Définit le callback pour le début de lecture
     * @param {Function} callback - Fonction à appeler au début de la lecture
     */
    onPlay(callback) {
        this.onPlayCallback = callback;
    }

    /**
     * Définit le callback pour l'arrêt de lecture
     * @param {Function} callback - Fonction à appeler à l'arrêt de la lecture
     */
    onStop(callback) {
        this.onStopCallback = callback;
    }
}

export default SequenceManager;
