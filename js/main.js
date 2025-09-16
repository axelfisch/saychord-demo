/**
 * Script principal pour l'application web SayChord
 * Initialise et coordonne tous les modules
 */

// Importer les modules
import chordDictionary from './chord-dictionary.js';
import VoiceRecognitionManager from './voice-recognition.js';
import SynthesizerEngine from './synthesizer.js';
import SequenceManager from './sequence-manager.js';
import UIController from './ui-controller.js';
import VoiceRecognitionAdapter from './voice-recognition-adapter.js';
import AudioEnhancer from './audio-enhancer.js';

// Fonction d'initialisation principale
async function initApp() {
    try {
        console.log('Initialisation de l\'application SayChord...');
        
        // Initialiser le dictionnaire d'accords
        await chordDictionary.loadDictionary();
        console.log('Dictionnaire d\'accords chargé');
        
        // Initialiser le moteur de synthèse
        const synthesizer = new SynthesizerEngine();
        console.log('Moteur de synthèse initialisé');
        
        // Initialiser l'améliorateur audio
        const audioEnhancer = new AudioEnhancer(synthesizer);
        console.log('Améliorateur audio initialisé');
        
        // Appliquer un preset audio
        audioEnhancer.applyPreset('warm');
        
        // Initialiser le gestionnaire de reconnaissance vocale
        const voiceRecognition = new VoiceRecognitionManager(chordDictionary);
        console.log('Gestionnaire de reconnaissance vocale initialisé');
        
        // Initialiser l'adaptateur de reconnaissance vocale
        const voiceAdapter = new VoiceRecognitionAdapter(voiceRecognition, chordDictionary);
        console.log('Adaptateur de reconnaissance vocale initialisé');
        
        // Initialiser le gestionnaire de séquences
        const sequenceManager = new SequenceManager(synthesizer);
        console.log('Gestionnaire de séquences initialisé');
        
        // Initialiser le contrôleur d'interface utilisateur
        const uiController = new UIController(
            chordDictionary,
            voiceRecognition,
            synthesizer,
            sequenceManager
        );
        console.log('Contrôleur d\'interface utilisateur initialisé');
        
        // Configurer les interactions entre les modules
        setupModuleInteractions(voiceRecognition, audioEnhancer, sequenceManager);
        
        // Ajouter l'application à l'objet window pour le débogage
        window.saychordApp = {
            chordDictionary,
            voiceRecognition,
            voiceAdapter,
            synthesizer,
            audioEnhancer,
            sequenceManager,
            uiController
        };
        
        // Exposer un bridge pour une application iOS native (WKWebView)
        if (!window.SayChordBridge) {
            const notifySwift = (payload) => {
                try {
                    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.saychord) {
                        window.webkit.messageHandlers.saychord.postMessage(payload);
                    }
                } catch (e) {
                    console.warn('notifySwift failed', e);
                }
            };

            // Envelopper quelques méthodes clés pour remonter des événements côté Swift
            try {
                const originalAddChord = sequenceManager.addChord.bind(sequenceManager);
                sequenceManager.addChord = (chord) => {
                    const ok = originalAddChord(chord);
                    if (ok && chord && chord.nom) {
                        notifySwift({ event: 'chordAdded', chord: chord.nom });
                    }
                    return ok;
                };

                const originalPlay = sequenceManager.playSequence.bind(sequenceManager);
                sequenceManager.playSequence = () => {
                    const ok = originalPlay();
                    if (ok) notifySwift({ event: 'playbackStarted' });
                    return ok;
                };

                const originalStop = sequenceManager.stopSequence.bind(sequenceManager);
                sequenceManager.stopSequence = () => {
                    const ok = originalStop();
                    if (ok) notifySwift({ event: 'playbackStopped' });
                    return ok;
                };

                const originalSetTempo = sequenceManager.setTempo.bind(sequenceManager);
                sequenceManager.setTempo = (bpm) => {
                    const ok = originalSetTempo(bpm);
                    if (ok) notifySwift({ event: 'tempoChanged', bpm });
                    return ok;
                };
            } catch (e) {
                console.warn('Bridge wrapping failed', e);
            }

            window.SayChordBridge = {
                ingestRecognizedText: (text) => {
                    try {
                        const processed = (voiceRecognition && voiceRecognition.adapter && typeof voiceRecognition.adapter.processText === 'function')
                            ? voiceRecognition.adapter.processText(text)
                            : text;
                        const chord = chordDictionary.findChord(processed);
                        if (chord) {
                            synthesizer.playChord(chord);
                            sequenceManager.addChord(chord);
                            notifySwift({ event: 'chordRecognized', text: processed, chord: chord.nom });
                            return true;
                        } else {
                            notifySwift({ event: 'chordNotRecognized', text: processed });
                            return false;
                        }
                    } catch (e) {
                        console.error('ingestRecognizedText error:', e);
                        notifySwift({ event: 'error', message: String(e) });
                        return false;
                    }
                },
                playChordByName: (name) => {
                    const chord = chordDictionary.findChord(name);
                    if (!chord) {
                        notifySwift({ event: 'chordNotFound', name });
                        return false;
                    }
                    synthesizer.playChord(chord);
                    notifySwift({ event: 'chordPlayed', chord: chord.nom });
                    return true;
                },
                addChordByName: (name) => {
                    const chord = chordDictionary.findChord(name);
                    if (!chord) {
                        notifySwift({ event: 'chordNotFound', name });
                        return false;
                    }
                    const ok = sequenceManager.addChord(chord);
                    return ok;
                },
                clearSequence: () => {
                    const ok = sequenceManager.clearSequence();
                    if (ok) notifySwift({ event: 'sequenceCleared' });
                    return ok;
                },
                playSequence: () => sequenceManager.playSequence(),
                stopSequence: () => sequenceManager.stopSequence(),
                setTempo: (bpm) => sequenceManager.setTempo(parseInt(bpm, 10)),
                resumeAudio: async () => {
                    try {
                        if (synthesizer && synthesizer.audioContext && synthesizer.audioContext.state === 'suspended') {
                            await synthesizer.audioContext.resume();
                        }
                        return true;
                    } catch (e) {
                        notifySwift({ event: 'error', message: 'resumeAudio failed' });
                        return false;
                    }
                }
            };

            console.log('SayChordBridge initialized');
        }
        
        console.log('Application SayChord initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
    }
}

/**
 * Configure les interactions entre les modules
 */
function setupModuleInteractions(voiceRecognition, audioEnhancer, sequenceManager) {
    // Optimiser l'audio pendant la reconnaissance vocale
    let restoreAudioSettings = null;
    
    voiceRecognition.onStart(() => {
        // Réduire les effets audio pendant la reconnaissance
        restoreAudioSettings = audioEnhancer.optimizeForVoiceRecognition();
    });
    
    voiceRecognition.onEnd(() => {
        // Restaurer les effets audio après la reconnaissance
        if (restoreAudioSettings) {
            restoreAudioSettings();
            restoreAudioSettings = null;
        }
    });
    
    // Autres interactions entre modules peuvent être ajoutées ici
}

// Initialiser l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', initApp);

// Gestionnaires pour les onglets de fonctionnalités
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Désactiver tous les onglets
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Activer l'onglet sélectionné
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Gestionnaire pour les questions de la FAQ
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            item.classList.toggle('active');
            
            // Mettre à jour l'icône
            const icon = question.querySelector('.toggle-icon');
            icon.textContent = item.classList.contains('active') ? '−' : '+';
        });
    });
    
    // Gestionnaire pour le menu hamburger
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Fermer le menu lorsqu'un lien est cliqué
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
});
