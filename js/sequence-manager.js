/**
 * Gestionnaire de séquences d'accords pour l'application SayChord
 * Version adaptée pour GitHub Pages avec gestion des erreurs et compatibilité navigateur
 */

class SequenceManager {
    constructor(synthesizer) {
        this.synthesizer = synthesizer;
        this.sequence = [];
        this.isPlaying = false;
        this.isLooping = false;
        this.currentIndex = -1;
        this.tempo = 120; // BPM
        this.timeSignature = '4/4'; // 4/4 par défaut
        this.loopLength = 4; // Nombre de mesures par défaut
        this.playbackTimer = null;
        
        // Éléments DOM
        this.sequenceListElement = null;
        this.playButton = null;
        this.stopButton = null;
        this.loopButton = null;
        this.tempoSlider = null;
        this.tempoValue = null;
        
        // Initialiser les éléments DOM après le chargement de la page
        document.addEventListener('DOMContentLoaded', () => {
            this.initDOMElements();
        });
    }

    // Initialiser les références aux éléments DOM
    initDOMElements() {
        try {
            this.sequenceListElement = document.getElementById('sequence-list');
            this.playButton = document.getElementById('play-button');
            this.stopButton = document.getElementById('stop-button');
            this.loopButton = document.getElementById('loop-button');
            this.tempoSlider = document.getElementById('tempo-slider');
            this.tempoValue = document.getElementById('tempo-value');
            
            // Initialiser les écouteurs d'événements
            if (this.playButton) {
                this.playButton.addEventListener('click', () => this.playSequence());
            }
            
            if (this.stopButton) {
                this.stopButton.addEventListener('click', () => this.stopSequence());
            }
            
            if (this.loopButton) {
                this.loopButton.addEventListener('click', () => this.toggleLoop());
            }
            
            if (this.tempoSlider) {
                this.tempoSlider.addEventListener('input', (e) => {
                    this.setTempo(parseInt(e.target.value));
                });
            }
            
            console.log('Éléments DOM du gestionnaire de séquences initialisés');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des éléments DOM :', error);
        }
    }

    // Ajouter un accord à la séquence
    addChord(chord) {
        if (!chord || !chord.nom) {
            console.error('Accord invalide :', chord);
            return false;
        }
        
        try {
            // Ajouter l'accord à la séquence
            this.sequence.push(chord);
            console.log('Accord ajouté à la séquence :', chord.nom);
            
            // Mettre à jour l'affichage
            this.updateSequenceDisplay();
            
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'accord à la séquence :', error);
            return false;
        }
    }

    // Supprimer un accord de la séquence
    removeChord(index) {
        if (index < 0 || index >= this.sequence.length) {
            console.error('Index d\'accord invalide :', index);
            return false;
        }
        
        try {
            // Supprimer l'accord de la séquence
            this.sequence.splice(index, 1);
            console.log('Accord supprimé de la séquence à l\'index :', index);
            
            // Mettre à jour l'affichage
            this.updateSequenceDisplay();
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'accord de la séquence :', error);
            return false;
        }
    }

    // Effacer toute la séquence
    clearSequence() {
        try {
            // Arrêter la lecture si elle est en cours
            this.stopSequence();
            
            // Effacer la séquence
            this.sequence = [];
            console.log('Séquence effacée');
            
            // Mettre à jour l'affichage
            this.updateSequenceDisplay();
            
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'effacement de la séquence :', error);
            return false;
        }
    }

    // Jouer la séquence
    playSequence() {
        if (this.sequence.length === 0) {
            console.warn('La séquence est vide');
            return false;
        }
        
        try {
            // Arrêter la lecture précédente si elle est en cours
            this.stopSequence();
            
            // Démarrer la lecture
            this.isPlaying = true;
            this.currentIndex = 0;
            
            // Mettre à jour l'interface
            if (this.playButton) {
                this.playButton.classList.add('active');
            }
            
            // Jouer le premier accord
            this.playCurrentChord();
            
            console.log('Lecture de la séquence démarrée');
            return true;
        } catch (error) {
            console.error('Erreur lors du démarrage de la lecture de la séquence :', error);
            return false;
        }
    }

    // Arrêter la lecture de la séquence
    stopSequence() {
        try {
            // Arrêter la lecture
            this.isPlaying = false;
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
            this.currentIndex = -1;
            
            // Arrêter le son
            if (this.synthesizer) {
                this.synthesizer.stopAllOscillators();
            }
            
            // Mettre à jour l'interface
            if (this.playButton) {
                this.playButton.classList.remove('active');
            }
            
            if (this.loopButton) {
                this.loopButton.classList.remove('active');
            }
            
            // Réinitialiser la mise en évidence des accords
            this.updateSequenceDisplay();
            
            console.log('Lecture de la séquence arrêtée');
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'arrêt de la lecture de la séquence :', error);
            return false;
        }
    }

    // Activer/désactiver la lecture en boucle
    toggleLoop() {
        try {
            this.isLooping = !this.isLooping;
            
            // Mettre à jour l'interface
            if (this.loopButton) {
                if (this.isLooping) {
                    this.loopButton.classList.add('active');
                } else {
                    this.loopButton.classList.remove('active');
                }
            }
            
            console.log('Lecture en boucle :', this.isLooping ? 'activée' : 'désactivée');
            return true;
        } catch (error) {
            console.error('Erreur lors de la modification du mode de lecture en boucle :', error);
            return false;
        }
    }

    // Définir le tempo (BPM)
    setTempo(bpm) {
        try {
            // Vérifier que le tempo est valide
            if (isNaN(bpm) || bpm < 40 || bpm > 240) {
                console.error('Tempo invalide :', bpm);
                return false;
            }
            
            this.tempo = bpm;
            
            // Mettre à jour l'affichage du tempo
            if (this.tempoValue) {
                this.tempoValue.textContent = `${bpm} BPM`;
            }
            
            if (this.tempoSlider) {
                this.tempoSlider.value = bpm;
            }
            
            console.log('Tempo défini à :', bpm, 'BPM');
            return true;
        } catch (error) {
            console.error('Erreur lors de la modification du tempo :', error);
            return false;
        }
    }

    // Définir la signature rythmique
    setTimeSignature(signature) {
        try {
            // Vérifier que la signature est valide
            if (signature !== '4/4' && signature !== '3/4') {
                console.error('Signature rythmique invalide :', signature);
                return false;
            }
            
            this.timeSignature = signature;
            console.log('Signature rythmique définie à :', signature);
            return true;
        } catch (error) {
            console.error('Erreur lors de la modification de la signature rythmique :', error);
            return false;
        }
    }

    // Définir la longueur de la boucle
    setLoopLength(measures) {
        try {
            // Vérifier que la longueur est valide
            if (isNaN(measures) || measures < 1 || measures > 32) {
                console.error('Longueur de boucle invalide :', measures);
                return false;
            }
            
            this.loopLength = measures;
            console.log('Longueur de boucle définie à :', measures, 'mesures');
            return true;
        } catch (error) {
            console.error('Erreur lors de la modification de la longueur de boucle :', error);
            return false;
        }
    }

    // Jouer l'accord courant
    playCurrentChord() {
        if (!this.isPlaying || this.currentIndex < 0 || this.currentIndex >= this.sequence.length) {
            return;
        }
        
        try {
            const chord = this.sequence[this.currentIndex];
            
            // Jouer l'accord
            if (this.synthesizer) {
                this.synthesizer.playChord(chord);
            }
            
            // Mettre à jour l'affichage
            this.updateSequenceDisplay();
            
            // Calculer la durée de l'accord en fonction du tempo et de la signature rythmique
            const beatsPerMeasure = parseInt(this.timeSignature.split('/')[0]);
            const beatDuration = 60 / this.tempo; // Durée d'un temps en secondes
            const chordDuration = beatDuration * beatsPerMeasure; // Durée d'une mesure en secondes
            
            // Programmer la lecture du prochain accord
            this.playbackTimer = setTimeout(() => {
                this.currentIndex++;
                
                // Vérifier si on a atteint la fin de la séquence
                if (this.currentIndex >= this.sequence.length) {
                    if (this.isLooping) {
                        // Recommencer la séquence
                        this.currentIndex = 0;
                        this.playCurrentChord();
                    } else {
                        // Arrêter la lecture
                        this.stopSequence();
                    }
                } else {
                    // Jouer l'accord suivant
                    this.playCurrentChord();
                }
            }, chordDuration * 1000);
        } catch (error) {
            console.error('Erreur lors de la lecture de l\'accord courant :', error);
        }
    }

    // Mettre à jour l'affichage de la séquence
    updateSequenceDisplay() {
        if (!this.sequenceListElement) {
            return;
        }
        
        try {
            // Vider la liste
            this.sequenceListElement.innerHTML = '';
            
            // Ajouter chaque accord à la liste
            this.sequence.forEach((chord, index) => {
                const item = document.createElement('li');
                item.className = 'sequence-item';
                
                // Ajouter la classe 'active' à l'accord en cours de lecture
                if (index === this.currentIndex && this.isPlaying) {
                    item.classList.add('active');
                }
                
                // Créer le contenu de l'élément
                item.innerHTML = `
                    <span class="sequence-chord">${chord.nom}</span>
                    <div class="sequence-controls">
                        <button class="play-chord-button" title="Jouer cet accord">▶</button>
                        <button class="remove-chord-button" title="Supprimer cet accord">×</button>
                    </div>
                `;
                
                // Ajouter les écouteurs d'événements
                const playButton = item.querySelector('.play-chord-button');
                if (playButton) {
                    playButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (this.synthesizer) {
                            this.synthesizer.playChord(chord);
                        }
                    });
                }
                
                const removeButton = item.querySelector('.remove-chord-button');
                if (removeButton) {
                    removeButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.removeChord(index);
                    });
                }
                
                // Ajouter l'élément à la liste
                this.sequenceListElement.appendChild(item);
            });
            
            // Afficher un message si la séquence est vide
            if (this.sequence.length === 0) {
                const emptyItem = document.createElement('li');
                emptyItem.className = 'sequence-item empty';
                emptyItem.textContent = 'La séquence est vide. Dictez des accords pour les ajouter.';
                this.sequenceListElement.appendChild(emptyItem);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'affichage de la séquence :', error);
        }
    }

    // Exporter la séquence au format WAV
    exportToWAV() {
        try {
            // Vérifier que la séquence n'est pas vide
            if (this.sequence.length === 0) {
                console.warn('La séquence est vide, impossible d\'exporter');
                alert('La séquence est vide. Veuillez ajouter des accords avant d\'exporter.');
                return false;
            }
            
            // Simuler l'export pour la démo GitHub Pages
            alert('Fonctionnalité d\'export WAV simulée pour la démo GitHub Pages.\n\nDans la version complète, cette fonction permettrait d\'exporter la séquence d\'accords au format audio WAV.');
            
            console.log('Export WAV simulé pour la démo GitHub Pages');
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'export WAV :', error);
            return false;
        }
    }

    // Exporter la séquence au format PDF
    exportToPDF() {
        try {
            // Vérifier que la séquence n'est pas vide
            if (this.sequence.length === 0) {
                console.warn('La séquence est vide, impossible d\'exporter');
                alert('La séquence est vide. Veuillez ajouter des accords avant d\'exporter.');
                return false;
            }
            
            // Simuler l'export pour la démo GitHub Pages
            alert('Fonctionnalité d\'export PDF simulée pour la démo GitHub Pages.\n\nDans la version complète, cette fonction permettrait d\'exporter la notation des accords au format PDF.');
            
            console.log('Export PDF simulé pour la démo GitHub Pages');
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'export PDF :', error);
            return false;
        }
    }
}

// Vérifier si le module est chargé dans un contexte GitHub Pages
if (window.location.hostname.includes('github.io')) {
    console.log('Application exécutée sur GitHub Pages - Adaptations de séquence spécifiques activées');
}
