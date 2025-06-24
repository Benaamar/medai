# 🗃️ GUIDE DE SAUVEGARDE ET INTÉGRATION DE BASE DE DONNÉES

## 📊 DONNÉES ACTUELLES DE VOTRE APPLICATION

**Votre base de données contient :**
- 👤 **2 utilisateurs** (comptes admin/docteur)
- 👥 **2 patients** (données de test)
- 📋 **14 consultations** (historique médical)
- 🤖 **12 résumés IA** (synthèses générées)

## 📁 FICHIERS DE SAUVEGARDE CRÉÉS

### 🔧 Dossier `backups/`
```
📁 backups/
├── medical-ai-backup-[date].json  ← Sauvegarde JSON complète
└── medical-ai-backup-[date].sql   ← Script SQL avec données
```

### 📦 Dossier `exports/`
```
📁 exports/
├── medical-ai-complete-[date].sql ← Export optimisé pour déploiement
└── medical-ai-data-[date].json    ← Données structurées
```

## 🚀 COMMANDES DISPONIBLES

### Sauvegarde et export
```bash
# Créer une sauvegarde complète
npm run db:backup

# Créer un export pour déploiement
npm run db:export

# Lister les sauvegardes disponibles
npm run db:list-backups
```

### Restauration (pour tests locaux)
```bash
# Restaurer la dernière sauvegarde
npm run db:restore-force

# Restaurer une sauvegarde spécifique
npm run db:restore fichier-sauvegarde.json --force
```

## 🌐 INTÉGRATION SUR VOTRE NOUVEL HÉBERGEMENT

### Option 1 : Vercel (RECOMMANDÉ - Gratuit)

1. **Créer un compte** sur [vercel.com](https://vercel.com)

2. **Upload votre code** sur GitHub

3. **Connecter à Vercel** :
   - New Project → Import from GitHub
   - Choisir votre repository

4. **Ajouter PostgreSQL** :
   - Integrations → Neon PostgreSQL
   - Ou utiliser votre propre base

5. **Importer vos données** :
   ```sql
   -- Connectez-vous à votre base PostgreSQL
   -- Exécutez le fichier exports/medical-ai-complete-[date].sql
   \i exports/medical-ai-complete-[date].sql
   ```

6. **Variables d'environnement** :
   ```env
   DATABASE_URL=postgresql://...  # Auto-généré par Neon
   ANTHROPIC_API_KEY=sk-ant-...   # Votre clé Claude
   OPENAI_API_KEY=sk-...          # Votre clé OpenAI
   JWT_SECRET=votre-secret-secure
   ```

### Option 2 : Railway

1. **Créer un compte** sur [railway.app](https://railway.app)

2. **Nouveau projet** → Deploy from GitHub

3. **Ajouter PostgreSQL** :
   - Add Service → PostgreSQL
   - Railway génère automatiquement DATABASE_URL

4. **Importer les données** :
   - Utilisez l'interface Railway Query
   - Ou connectez-vous via psql et importez le fichier SQL

5. **Variables d'environnement** :
   - Ajoutez vos clés API dans l'onglet Variables

### Option 3 : Hébergement traditionnel avec PostgreSQL

1. **Préparer votre serveur** :
   - Node.js 18+ installé
   - PostgreSQL 12+ installé
   - npm/yarn disponible

2. **Créer la base de données** :
   ```bash
   createdb medicalaicompanion
   ```

3. **Importer le schéma et les données** :
   ```bash
   psql medicalaicompanion < exports/medical-ai-complete-[date].sql
   ```

4. **Configurer les variables d'environnement** :
   ```bash
   # Créer un fichier .env
   DATABASE_URL=postgresql://user:password@localhost:5432/medicalaicompanion
   ANTHROPIC_API_KEY=votre-cle-anthropic
   OPENAI_API_KEY=votre-cle-openai
   JWT_SECRET=votre-secret-jwt
   ```

5. **Déployer l'application** :
   ```bash
   npm install
   npm run build
   npm start
   ```

## 🔐 COMPTES UTILISATEURS INCLUS

Vos données incluent ces comptes (à changer après déploiement) :

- **Admin** : `admin` / `admin123`
- **Docteur** : `doctor` / `password`

⚠️ **IMPORTANT** : Changez ces mots de passe après le déploiement !

## 📋 DONNÉES DE TEST INCLUSES

Votre sauvegarde contient :
- 2 patients de démonstration
- 14 consultations d'exemple
- 12 résumés IA générés
- Configuration complète de l'application

## 🔧 STRUCTURE DE BASE DE DONNÉES

```sql
users           ← Médecins et administrateurs
├── patients    ← Dossiers patients
├── consultations ← Rendez-vous et consultations
└── ai_summaries  ← Résumés IA générés
```

## 🆘 DÉPANNAGE

### Erreur de connexion PostgreSQL
- Vérifiez votre `DATABASE_URL`
- Assurez-vous que PostgreSQL est démarré
- Vérifiez les permissions de connexion

### Données manquantes après import
- Vérifiez que le fichier SQL s'est exécuté sans erreur
- Regardez les logs pour les erreurs d'insertion
- Assurez-vous que les séquences sont correctement configurées

### Fonctionnalités IA ne marchent pas
- Vérifiez vos clés API `ANTHROPIC_API_KEY` et `OPENAI_API_KEY`
- Testez les clés avec les scripts de test :
  ```bash
  npm run test:anthropic
  npm run test:openai
  ```

## 📞 COMMANDES UTILES

```bash
# Gestion de base de données
npm run db:backup           # Sauvegarde complète
npm run db:export           # Export pour déploiement
npm run db:restore-force    # Restauration forcée
npm run db:list-backups     # Lister les sauvegardes
npm run db:create-admin     # Créer un utilisateur admin
npm run db:clear            # Vider la base (ATTENTION!)

# Tests et vérification
npm run test:anthropic      # Tester l'API Claude
npm run test:openai         # Tester l'API OpenAI
npm run check               # Vérifier le TypeScript

# Développement et production
npm run dev                 # Mode développement
npm run build              # Compiler pour production
npm run start              # Démarrer en production
```

## 🎯 PROCHAINES ÉTAPES

1. ✅ **Choisir votre hébergeur** (Vercel recommandé)
2. ✅ **Configurer la base de données**
3. ✅ **Importer vos données** (fichiers créés)
4. ✅ **Ajouter vos clés API**
5. ✅ **Tester l'authentification**
6. ✅ **Personnaliser les comptes utilisateurs**

---

💡 **Conseil** : Gardez toujours une copie de vos sauvegardes en sécurité ! 🔒 