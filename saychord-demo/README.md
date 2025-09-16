# SayChord — Démo

SayChord est une application web de dictée vocale d'accords musicaux. Elle permet aux musiciens de dicter des accords, de les entendre joués avec un son de piano électrique FM, de créer des séquences et des boucles, et d'exporter leurs créations. Ce dépôt contient le code source de la version démo de l'application.

## Démarrage

```bash
npm install
npm run dev
```

Ouvrez le navigateur à l'URL indiquée, cliquez sur « Démarrer l'audio », puis utilisez le champ d'entrée ou le bouton « Dicter (FR) » pour prononcer un accord (exemples: "do majeur", "ré mineur 7", "sol 7").

## Fonctionnalités

- Dictée vocale en français (Web Speech API)
- Parsing d'accords FR vers des notes avec `tonal`
- Synthèse FM polyphonique via `tone`
- Séquenceur avec `Tone.Transport` (tempo, subdivision, boucle)
- Export MIDI et enregistrement WAV (basique)

## Limitations

- La reconnaissance vocale dépend du navigateur (Chrome recommandé). Safari utilise `webkitSpeechRecognition`.
- Parsing ciblé sur les cas courants: majeur, mineur, 7, maj7, m7, dim, aug, sus2/sus4, dièse/bémol.

## Licence

MIT
