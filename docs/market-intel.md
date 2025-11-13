# Synthèse outils et tendances IA

## 1. Fiches par outil

### GPT-4o (OpenAI)
- **Positionnement** : modèle généraliste premium pour agents conversationnels et multimodalité en production.
- **Cas d'usage idéal** : copilotes textuels/visuels riches, génération de contenu marketing, agents support client nécessitant contexte long.
- **Différenciation** : compréhension multimodale temps réel, outils API (function calling, voice) intégrés et écosystème plugins.
- **Prix** : environ 5-15 $/1M tokens selon entrée/sortie (tarifs publics mai 2024) + facturation usage outils.
- **Maturité** : production (API stable, support entreprise SOC2, gouvernance).

### Claude 3 Opus (Anthropic)
- **Positionnement** : assistant aligné sécurité avec fenêtre contexte élargie.
- **Cas d'usage idéal** : synthèse documents réglementaires, copilotes conformité, brainstorming créatif respectant garde-fous stricts.
- **Différenciation** : gouvernance « Constitutional AI », réponses sobres, contrôle sur tonalité, 200k tokens contexte.
- **Prix** : ~15 $/1M input, 75 $/1M output (public avril 2024).
- **Maturité** : production (SLA entreprise, SOC2 type II, fine-tuning bêta).

### Gemini 1.5 Pro (Google)
- **Positionnement** : modèle multimodal cloud-first intégré à Google Workspace & Vertex AI.
- **Cas d'usage idéal** : automatisation knowledge management vidéo+texte, copilotes data reliés à BigQuery, agents marketing utilisant Search/YouTube.
- **Différenciation** : contexte 1M tokens streaming, intégration native aux APIs Google et recherche multimédia.
- **Prix** : tarification preview (mai 2024) : 3,5 $/1M input, 10,5 $/1M output via Vertex AI (peut évoluer).
- **Maturité** : bêta avancée (service managed, contrats entreprise disponibles, mais certaines fonctionnalités preview).

### Microsoft Copilot Studio
- **Positionnement** : plateforme low-code pour créer copilotes d’entreprise connectés à Microsoft 365 et Dynamics.
- **Cas d'usage idéal** : agents internes IT/HR, automatisation CRM, front office connecté à sources SharePoint.
- **Différenciation** : orchestration Power Platform, connecteurs + governance M365, monitoring intégré.
- **Prix** : licence Copilot Studio ~200 $/locuteur/mois (tarif public nov 2023) + consommation Azure OpenAI.
- **Maturité** : production (support entreprise, conformité Microsoft, GA).

## 2. Matrice Outil / Personae / Valeur / Limites / Contenu prévu

| Outil | Personae | Valeur | Limites | Contenu prévu |
| --- | --- | --- | --- | --- |
| GPT-4o | CMO / Content Lead | Génération campagnes multimodales, scripts vidéo personnalisés | Coût unitaire élevé, dépendance API externe | Guides d’activation social ads, playbooks prompts brand voice |
| GPT-4o | Support Lead | Résolution tickets multilingues avec accès base interne | Besoin RAG robuste pour exactitude | Tutoriel intégration RAG + indicateurs QA |
| Claude 3 Opus | Legal / Compliance | Synthèse réglementaire avec tonalité contrôlée | Pas d’accès direct outils Microsoft, latence plus élevée | Template copilote conformité + checklists gouvernance |
| Gemini 1.5 Pro | Knowledge Manager | Recherche multimodale dans archives vidéo | Disponibilité régionale limitée, politique données Google | Étude de cas « KM multimodal » + scripts Vertex AI |
| Copilot Studio | IT Service Owner | Automatiser helpdesk M365 | Verrou Microsoft (licences, Azure AD) | Atelier « build your IT agent » + packages Power Automate |
| Copilot Studio | Sales Ops | Processus CRM automatisés dans Dynamics | Nécéssite harmoniser données CRM | Séquence emails nurturing + modèles conversationnels |

## 3. Tendances fortes et pertinence

1. **Agents autonomes orchestrés** : combiner LLM + outils (API internes, CRM) pour workflows sans intervention. Pertinent pour équipes support/commerciales visant réduction temps de traitement et reporting automatique.
2. **IA multimodale** : modèles traitant texte, image, audio, vidéo (ex : Gemini 1.5 Pro, GPT-4o). Permet réutiliser assets marketing, générer insights sur enregistrements commerciaux et produire contenus rich media rapidement.
3. **Copilotes verticaux** : solutions spécialisées par fonction (Copilot Studio pour IT/HR, copilotes compliance sur Claude). Aligné à l’audience métier qui attend ROI mesurable et intégration SI existant.

## 4. Processus de mise à jour mensuelle

- Ajouter un rappel mensuel (ex : 1er lundi) dans le backlog de veille.
- Vérifier annonces produits/pricing (blogs officiels, release notes).
- Actualiser fiches, matrice et tendances dans ce document avec date de mise à jour.
- Communiquer la synthèse aux parties prenantes (newsletter interne, canal #ia-watch).

> Dernière mise à jour : 2025-11-13
