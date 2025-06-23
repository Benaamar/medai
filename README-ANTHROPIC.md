# Configuration de l'API Anthropic (Claude) pour Medical AI Companion

Ce document explique comment configurer et utiliser l'API Anthropic (Claude) dans l'application Medical AI Companion.

## Pourquoi utiliser Claude ?

Claude est un assistant IA développé par Anthropic qui offre plusieurs avantages :

- Excellente compréhension du contexte médical
- Réponses détaillées et bien structurées
- Moins de problèmes de quota que certaines autres API
- Excellente gestion du français médical

## Configuration

### 1. Obtenir une clé API Anthropic

1. Créez un compte sur [Anthropic Console](https://console.anthropic.com/)
2. Accédez à la section "API Keys"
3. Créez une nouvelle clé API

### 2. Configurer la clé API dans l'application

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```
# Autres configurations...
ANTHROPIC_API_KEY="votre-clé-api-anthropic"
```

Remplacez `votre-clé-api-anthropic` par la clé API que vous avez obtenue.

### 3. Tester la connexion à l'API

Exécutez la commande suivante pour tester la connexion à l'API Anthropic :

```bash
npm run test:anthropic
```

Si tout fonctionne correctement, vous devriez voir une réponse de l'API.

## Utilisation

L'application est maintenant configurée pour utiliser l'API Anthropic (Claude) pour générer :

1. **Synthèses de consultation** - Résumés détaillés et structurés des consultations médicales
2. **Ordonnances médicales** - Prescriptions médicales complètes avec dosages et instructions
3. **Courriers de correspondance** - Lettres professionnelles pour référer des patients à des spécialistes

## Dépannage

### Erreur "401 Unauthorized"

Vérifiez que votre clé API est correctement configurée dans le fichier `.env`.

### Erreur "429 Too Many Requests"

Vous avez dépassé votre quota d'utilisation. Vérifiez votre plan et vos limites sur [Anthropic Console](https://console.anthropic.com/).

### Autres problèmes

Si vous rencontrez d'autres problèmes, consultez la [documentation officielle d'Anthropic](https://docs.anthropic.com/) ou contactez le support technique. 