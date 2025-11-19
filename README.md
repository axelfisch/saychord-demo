# saychord-demo
"SayChord est une application web de dictée vocale d'accords musicaux. Elle permet aux musiciens de dicter des accords, de les entendre joués avec un son de piano électrique FM, de créer des séquences et des boucles, et d'exporter leurs créations. Ce dépôt contient le code source de la version démo de l'application."

## Nouveautés

- **Exports enrichis** : l'interface web propose maintenant des boutons pour générer directement des fichiers MIDI, MusicXML et ABC grâce au module `SequenceExporter`. Les fichiers sont créés côté navigateur et téléchargés instantanément.
- **Intégration GPTs** : le fichier [`gpts-builder-config.json`](./gpts-builder-config.json) peut être importé dans le GPTs builder pour configurer l'assistant AiXelMusicOrchestrator avec les bonnes instructions et les points d'accès de l'application.
