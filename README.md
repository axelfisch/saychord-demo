# SayChord Demo

SayChord est une application web de dictée vocale d'accords musicaux. Elle permet aux musiciens de dicter des accords, de les entendre joués avec un son de piano électrique FM, de créer des séquences et des boucles, et d'exporter leurs créations.

## Fonctionnalités

### 🎤 Dictée Vocale
- Reconnaissance vocale en français pour dicter des accords
- Support des notations françaises (Do, Ré, Mi...) et anglaises (C, D, E...)
- Reconnaissance des qualités d'accords (majeur, mineur, septième, etc.)

### 🎹 Synthèse Sonore
- Son de piano électrique utilisant la synthèse FM
- Lecture instantanée des accords reconnus
- Voicings réalistes pour chaque type d'accord

### 🎵 Séquenceur
- Création de progressions d'accords
- Lecture en boucle
- Contrôle du tempo (60-200 BPM)
- Visualisation en temps réel

### 💾 Export
- Export en format texte
- Export en format JSON (représentation MIDI simplifiée)

## Utilisation

### Commencer
1. Ouvrez `index.html` dans un navigateur moderne (Chrome, Firefox, Edge)
2. Autorisez l'accès au microphone quand demandé
3. Cliquez sur "Commencer la dictée" pour débuter

### Formats de dictée supportés

#### Notation française
- "Do majeur", "Ré mineur", "Sol septième"
- "La dièse mineur", "Si bémol majeur"
- "Mi suspendu quatre", "Fa augmenté"

#### Notation anglaise
- "C major", "D minor", "G seventh"
- "A sharp minor", "B flat major"
- "E sus four", "F augmented"

#### Notation abrégée
- "C", "Am", "G7", "Dsus4"
- "F#m", "Bb", "Cmaj7"

### Créer une séquence
1. Dictez ou tapez un accord
2. Cliquez sur "Ajouter à la séquence"
3. Répétez pour construire votre progression
4. Utilisez "Jouer" pour écouter la séquence

### Exporter
- **Format texte** : Liste simple des accords
- **Format JSON** : Structure détaillée avec timing et notes

## Technologies utilisées
- Web Audio API pour la synthèse sonore
- Web Speech API pour la reconnaissance vocale
- JavaScript vanilla (pas de framework)
- CSS moderne avec variables et animations

## Compatibilité
- Chrome/Chromium (recommandé)
- Firefox
- Edge
- Safari (reconnaissance vocale limitée)

## Limitations de la démo
- La reconnaissance vocale nécessite une connexion internet
- L'export MIDI est simplifié (format JSON)
- Les voicings sont basiques (triades et accords de septième)

## Structure du projet
```
saychord-demo/
├── index.html          # Page principale
├── styles.css          # Styles et thème
├── js/
│   ├── app.js         # Logique principale
│   ├── audio-engine.js # Synthèse FM
│   ├── chord-parser.js # Analyse des accords
│   ├── voice-recognition.js # Reconnaissance vocale
│   ├── sequencer.js   # Gestion des séquences
│   └── export.js      # Export des données
└── README.md          # Ce fichier
```

## Développement futur
- Export MIDI complet
- Plus de types d'accords (11ème, 13ème, altérés)
- Différents sons d'instruments
- Sauvegarde et chargement de sessions
- Mode tablature/partition
- Intégration avec des DAW

---

© 2025 SayChord Demo - Application de dictée vocale d'accords musicaux