/**
 * Fichier de test pour l'intégration des fonctionnalités audio et de reconnaissance vocale
 * Ce script permet de tester et d'affiner les fonctionnalités clés de SayChord
 */

// Configuration des tests
const TEST_CONFIG = {
    // Tests de reconnaissance vocale
    voiceRecognition: {
        enabled: true,
        testPhrases: [
            "Do majeur septième",
            "La mineur",
            "Sol septième",
            "Fa dièse mineur septième",
            "Si bémol majeur",
            "Mi diminué"
        ]
    },
    // Tests de synthèse sonore
    synthesizer: {
        enabled: true,
        testChords: [
            { nom: "Cmaj7", notes: ["C", "E", "G", "B"] },
            { nom: "Dm7", notes: ["D", "F", "A", "C"] },
            { nom: "G7", notes: ["G", "B", "D", "F"] },
            { nom: "Fmaj7", notes: ["F", "A", "C", "E"] },
            { nom: "Am", notes: ["A", "C", "E"] }
        ]
    },
    // Tests de séquence
    sequenceManager: {
        enabled: true,
        testSequence: [
            { nom: "Cmaj7", notes: ["C", "E", "G", "B"] },
            { nom: "Dm7", notes: ["D", "F", "A", "C"] },
            { nom: "G7", notes: ["G", "B", "D", "F"] },
            { nom: "Cmaj7", notes: ["C", "E", "G", "B"] }
        ],
        testTempos: [80, 120, 160],
        testTimeSignatures: ['4/4', '3/4'],
        testLoopLengths: [4, 8, 16, 24]
    }
};

/**
 * Fonction principale de test
 */
async function runIntegrationTests() {
    console.log('=== TESTS D\'INTÉGRATION SAYCHORD ===');
    
    try {
        // Attendre que l'application soit initialisée
        await waitForAppInitialization();
        
        // Récupérer les références aux modules
        const { chordDictionary, voiceRecognition, synthesizer, sequenceManager, uiController } = window.saychordApp;
        
        // Tests du dictionnaire d'accords
        await testChordDictionary(chordDictionary);
        
        // Tests de la synthèse sonore
        if (TEST_CONFIG.synthesizer.enabled) {
            await testSynthesizer(synthesizer);
        }
        
        // Tests du gestionnaire de séquences
        if (TEST_CONFIG.sequenceManager.enabled) {
            await testSequenceManager(sequenceManager, synthesizer);
        }
        
        // Tests de la reconnaissance vocale
        if (TEST_CONFIG.voiceRecognition.enabled) {
            await testVoiceRecognition(voiceRecognition, chordDictionary);
        }
        
        // Tests d'intégration complète
        await testFullIntegration(chordDictionary, voiceRecognition, synthesizer, sequenceManager, uiController);
        
        console.log('=== TESTS D\'INTÉGRATION TERMINÉS AVEC SUCCÈS ===');
    } catch (error) {
        console.error('Erreur lors des tests d\'intégration:', error);
    }
}

/**
 * Attend que l'application soit complètement initialisée
 */
function waitForAppInitialization() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.saychordApp) {
                clearInterval(checkInterval);
                // Attendre un peu plus pour s'assurer que tout est prêt
                setTimeout(resolve, 1000);
            }
        }, 100);
    });
}

/**
 * Teste le dictionnaire d'accords
 */
async function testChordDictionary(chordDictionary) {
    console.log('--- Test du dictionnaire d\'accords ---');
    
    // Vérifier que le dictionnaire est chargé
    if (!chordDictionary.isLoaded) {
        await chordDictionary.loadDictionary();
    }
    
    // Tester la recherche d'accords
    const testChords = ['Cmaj7', 'Dm7', 'G7', 'Fmaj7', 'Am'];
    for (const chordName of testChords) {
        const chord = chordDictionary.findChord(chordName);
        console.log(`Recherche de l'accord ${chordName}:`, chord ? 'Trouvé' : 'Non trouvé');
        if (chord) {
            console.log(`Notes: ${chord.notes.join(', ')}`);
        }
    }
    
    // Tester la recherche d'accords en français
    const testChordsFr = ['Do majeur septième', 'Ré mineur septième', 'Sol septième'];
    for (const chordName of testChordsFr) {
        const chord = chordDictionary.findChord(chordName);
        console.log(`Recherche de l'accord ${chordName}:`, chord ? 'Trouvé' : 'Non trouvé');
        if (chord) {
            console.log(`Notes: ${chord.notes.join(', ')}`);
        }
    }
    
    console.log('Test du dictionnaire d\'accords terminé');
}

/**
 * Teste le moteur de synthèse
 */
async function testSynthesizer(synthesizer) {
    console.log('--- Test du moteur de synthèse ---');
    
    // Attendre que le synthétiseur soit initialisé
    if (!synthesizer.isInitialized) {
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Tester la lecture d'accords
    for (const chord of TEST_CONFIG.synthesizer.testChords) {
        console.log(`Lecture de l'accord ${chord.nom}`);
        synthesizer.playChord(chord.notes, 1);
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Tester différents volumes
    console.log('Test des niveaux de volume');
    const testVolumes = [-20, -10, -5];
    for (const volume of testVolumes) {
        console.log(`Volume: ${volume} dB`);
        synthesizer.setVolume(volume);
        synthesizer.playChord(["C", "E", "G", "B"], 1);
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Tester différentes durées de relâchement
    console.log('Test des durées de relâchement');
    const testReleases = [0.5, 1.5, 3];
    for (const release of testReleases) {
        console.log(`Relâchement: ${release} secondes`);
        synthesizer.setRelease(release);
        synthesizer.playChord(["C", "E", "G", "B"], 1);
        await new Promise(resolve => setTimeout(resolve, release * 1000 + 1000));
    }
    
    // Rétablir les paramètres par défaut
    synthesizer.setVolume(-10);
    synthesizer.setRelease(1.5);
    
    console.log('Test du moteur de synthèse terminé');
}

/**
 * Teste le gestionnaire de séquences
 */
async function testSequenceManager(sequenceManager, synthesizer) {
    console.log('--- Test du gestionnaire de séquences ---');
    
    // Effacer la séquence existante
    sequenceManager.clearSequence();
    
    // Ajouter des accords à la séquence
    for (const chord of TEST_CONFIG.sequenceManager.testSequence) {
        console.log(`Ajout de l'accord ${chord.nom} à la séquence`);
        sequenceManager.addChord(chord);
    }
    
    // Tester la lecture de la séquence
    console.log('Lecture de la séquence complète');
    sequenceManager.play();
    await new Promise(resolve => setTimeout(resolve, 8000));
    sequenceManager.stop();
    
    // Tester différents tempos
    for (const tempo of TEST_CONFIG.sequenceManager.testTempos) {
        console.log(`Test du tempo: ${tempo} BPM`);
        sequenceManager.setTempo(tempo);
        sequenceManager.play();
        await new Promise(resolve => setTimeout(resolve, 5000));
        sequenceManager.stop();
    }
    
    // Tester différentes signatures rythmiques
    for (const timeSignature of TEST_CONFIG.sequenceManager.testTimeSignatures) {
        console.log(`Test de la signature rythmique: ${timeSignature}`);
        sequenceManager.setTimeSignature(timeSignature);
        sequenceManager.play();
        await new Promise(resolve => setTimeout(resolve, 5000));
        sequenceManager.stop();
    }
    
    // Tester différentes longueurs de boucle
    for (const loopLength of TEST_CONFIG.sequenceManager.testLoopLengths) {
        console.log(`Test de la longueur de boucle: ${loopLength} mesures`);
        sequenceManager.setLoopLength(loopLength);
        // Pas besoin de jouer pour chaque longueur, juste vérifier que le paramètre est défini
    }
    
    // Tester la lecture en boucle
    console.log('Test de la lecture en boucle');
    sequenceManager.setLooping(true);
    sequenceManager.play();
    await new Promise(resolve => setTimeout(resolve, 8000));
    sequenceManager.stop();
    sequenceManager.setLooping(false);
    
    // Tester la suppression d'un accord
    console.log('Test de la suppression d\'un accord');
    sequenceManager.removeChord(1); // Supprimer le deuxième accord
    
    // Tester l'export (simulation)
    console.log('Test de l\'export WAV (simulation)');
    const wavBlob = await sequenceManager.exportWAV();
    console.log('Export WAV réussi:', !!wavBlob);
    
    console.log('Test de l\'export PDF (simulation)');
    const pdfUrl = await sequenceManager.exportPDF();
    console.log('Export PDF réussi:', !!pdfUrl);
    
    // Rétablir les paramètres par défaut
    sequenceManager.clearSequence();
    sequenceManager.setTempo(120);
    sequenceManager.setTimeSignature('4/4');
    sequenceManager.setLoopLength(4);
    
    console.log('Test du gestionnaire de séquences terminé');
}

/**
 * Teste la reconnaissance vocale
 */
async function testVoiceRecognition(voiceRecognition, chordDictionary) {
    console.log('--- Test de la reconnaissance vocale ---');
    
    // Simuler la reconnaissance vocale
    console.log('Simulation de la reconnaissance vocale');
    
    for (const phrase of TEST_CONFIG.voiceRecognition.testPhrases) {
        console.log(`Test de la phrase: "${phrase}"`);
        
        // Simuler un événement de reconnaissance
        const mockEvent = {
            results: [
                [
                    {
                        transcript: phrase,
                        confidence: 0.9
                    }
                ]
            ]
        };
        
        // Appeler directement la méthode de traitement du résultat
        voiceRecognition.handleResult(mockEvent);
        
        // Attendre un peu entre chaque test
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('Test de la reconnaissance vocale terminé');
}

/**
 * Teste l'intégration complète
 */
async function testFullIntegration(chordDictionary, voiceRecognition, synthesizer, sequenceManager, uiController) {
    console.log('--- Test d\'intégration complète ---');
    
    // Simuler un flux complet
    console.log('Simulation d\'un flux utilisateur complet');
    
    // 1. Reconnaissance d'un accord
    console.log('1. Reconnaissance d\'un accord');
    const mockEvent1 = {
        results: [
            [
                {
                    transcript: 'Do majeur septième',
                    confidence: 0.9
                }
            ]
        ]
    };
    voiceRecognition.handleResult(mockEvent1);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Reconnaissance d'un deuxième accord
    console.log('2. Reconnaissance d\'un deuxième accord');
    const mockEvent2 = {
        results: [
            [
                {
                    transcript: 'La mineur septième',
                    confidence: 0.9
                }
            ]
        ]
    };
    voiceRecognition.handleResult(mockEvent2);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Reconnaissance d'un troisième accord
    console.log('3. Reconnaissance d\'un troisième accord');
    const mockEvent3 = {
        results: [
            [
                {
                    transcript: 'Ré septième',
                    confidence: 0.9
                }
            ]
        ]
    };
    voiceRecognition.handleResult(mockEvent3);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Lecture de la séquence
    console.log('4. Lecture de la séquence');
    sequenceManager.play();
    await new Promise(resolve => setTimeout(resolve, 6000));
    sequenceManager.stop();
    
    // 5. Lecture en boucle
    console.log('5. Lecture en boucle');
    sequenceManager.setLooping(true);
    sequenceManager.play();
    await new Promise(resolve => setTimeout(resolve, 6000));
    sequenceManager.stop();
    sequenceManager.setLooping(false);
    
    console.log('Test d\'intégration complète terminé');
}

// Exécuter les tests lorsque la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que l'application soit complètement chargée
    setTimeout(runIntegrationTests, 3000);
});
