# 📋 Guide d'Import Complet sur Neon PostgreSQL

## 🎯 Fichier à utiliser
**`exports/neon-complete-import.sql`** - Contient SCHÉMA + DONNÉES

## ✅ Étapes d'import sur Neon

### 1. **Dans l'interface Neon (SQL Editor)**
```sql
-- Copier-coller le contenu de exports/neon-complete-import.sql
-- et l'exécuter directement dans l'éditeur SQL de Neon
```

### 2. **Ou via psql en ligne de commande**
```bash
# Avec l'URL de connexion Neon
psql "postgresql://username:password@ep-xxx.neon.tech/neondb" -f exports/neon-complete-import.sql
```

## 🗂️ Tables créées
- ✅ **users** - 2 utilisateurs (admin + ben)  
- ✅ **patients** - 2 patients (lamar + mossaab)
- ✅ **consultations** - 7 consultations avec données réelles
- ✅ **ai_summaries** - 2 résumés IA d'exemple

## 🔑 Utilisateurs créés
```
Username: admin
Password: admin123

Username: ben  
Password: [hashé] - utiliser le formulaire de connexion
```

## ⚠️ Important
1. **Supprime les tables existantes** avant de les recréer
2. **Données prêtes à l'emploi** - pas besoin de migration
3. **Structure optimisée** avec index et contraintes

## 🚀 Après l'import
1. Configurer les variables d'environnement Netlify
2. Tester la connexion via l'app
3. Vérifier que les données s'affichent correctement 