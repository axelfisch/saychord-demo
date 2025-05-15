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
