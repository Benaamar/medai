import { db } from './db';
import { users, patients, consultations, aiSummaries } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

interface BackupData {
  users: any[];
  patients: any[];
  consultations: any[];
  aiSummaries: any[];
  timestamp: string;
  version: string;
}

export async function restoreFromJson(backupFilePath: string): Promise<void> {
  try {
    console.log('🚀 Début de la restauration de la base de données...');
    console.log(`📁 Fichier de sauvegarde: ${backupFilePath}`);

    // Vérifier que le fichier existe
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Le fichier de sauvegarde n'existe pas: ${backupFilePath}`);
    }

    // Lire le fichier de sauvegarde
    const backupContent = fs.readFileSync(backupFilePath, 'utf-8');
    const backupData: BackupData = JSON.parse(backupContent);

    console.log('📊 Informations de la sauvegarde:');
    console.log(`📅 Date: ${new Date(backupData.timestamp).toLocaleString('fr-FR')}`);
    console.log(`🔢 Version: ${backupData.version}`);
    console.log(`👤 Utilisateurs: ${backupData.users.length}`);
    console.log(`👥 Patients: ${backupData.patients.length}`);
    console.log(`📋 Consultations: ${backupData.consultations.length}`);
    console.log(`🤖 Résumés IA: ${backupData.aiSummaries.length}`);

    // Demander confirmation
    console.log('\n⚠️  ATTENTION: Cette opération va supprimer toutes les données existantes!');
    console.log('Voulez-vous continuer? (o/N)');

    // Pour l'automatisation, on peut passer un paramètre
    const shouldProceed = process.argv.includes('--force') || process.argv.includes('-f');
    
    if (!shouldProceed) {
      console.log('❌ Restauration annulée. Utilisez --force pour forcer la restauration.');
      return;
    }

    // Supprimer les données existantes (dans l'ordre des dépendances)
    console.log('\n🗑️  Suppression des données existantes...');
    await db.delete(aiSummaries);
    console.log('✅ Résumés IA supprimés');
    
    await db.delete(consultations);
    console.log('✅ Consultations supprimées');
    
    await db.delete(patients);
    console.log('✅ Patients supprimés');
    
    await db.delete(users);
    console.log('✅ Utilisateurs supprimés');

    // Restaurer les données
    console.log('\n📥 Restauration des données...');

    // Restaurer les utilisateurs
    if (backupData.users.length > 0) {
      await db.insert(users).values(backupData.users);
      console.log(`✅ ${backupData.users.length} utilisateurs restaurés`);
    }

    // Restaurer les patients
    if (backupData.patients.length > 0) {
      await db.insert(patients).values(backupData.patients);
      console.log(`✅ ${backupData.patients.length} patients restaurés`);
    }

    // Restaurer les consultations
    if (backupData.consultations.length > 0) {
      await db.insert(consultations).values(backupData.consultations);
      console.log(`✅ ${backupData.consultations.length} consultations restaurées`);
    }

    // Restaurer les résumés IA
    if (backupData.aiSummaries.length > 0) {
      await db.insert(aiSummaries).values(backupData.aiSummaries);
      console.log(`✅ ${backupData.aiSummaries.length} résumés IA restaurés`);
    }

    console.log('\n🎉 Restauration terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    throw error;
  }
}

export async function listBackupFiles(): Promise<string[]> {
  const backupDir = path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(backupDir)) {
    console.log('📁 Aucun dossier de sauvegarde trouvé');
    return [];
  }

  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.json') && file.includes('medical-ai-backup'))
    .sort()
    .reverse(); // Plus récent en premier

  return files.map(file => path.join(backupDir, file));
}

async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--list') || args.includes('-l')) {
      // Lister les sauvegardes disponibles
      console.log('📋 Sauvegardes disponibles:');
      const backupFiles = await listBackupFiles();
      
      if (backupFiles.length === 0) {
        console.log('Aucune sauvegarde trouvée.');
        return;
      }

      backupFiles.forEach((file, index) => {
        const filename = path.basename(file);
        const stats = fs.statSync(file);
        const size = (stats.size / 1024).toFixed(2) + ' KB';
        const date = stats.mtime.toLocaleString('fr-FR');
        console.log(`${index + 1}. ${filename} (${size}, ${date})`);
      });
      return;
    }

    // Trouver le fichier de sauvegarde à utiliser
    let backupFile = '';
    
    if (args.length > 0 && !args[0].startsWith('-')) {
      // Fichier spécifié en argument
      backupFile = args[0];
      if (!path.isAbsolute(backupFile)) {
        backupFile = path.resolve(backupFile);
      }
    } else {
      // Utiliser la sauvegarde la plus récente
      const backupFiles = await listBackupFiles();
      if (backupFiles.length === 0) {
        console.log('❌ Aucune sauvegarde trouvée. Créez d\'abord une sauvegarde avec backup-database.ts');
        process.exit(1);
      }
      backupFile = backupFiles[0];
      console.log(`📁 Utilisation de la sauvegarde la plus récente: ${path.basename(backupFile)}`);
    }

    await restoreFromJson(backupFile);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Afficher l'aide
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🗃️  Script de restauration de base de données - Medical AI Companion

USAGE:
  tsx server/restore-database.ts [OPTIONS] [FICHIER_SAUVEGARDE]

OPTIONS:
  --list, -l     Lister les sauvegardes disponibles
  --force, -f    Forcer la restauration sans confirmation
  --help, -h     Afficher cette aide

EXEMPLES:
  tsx server/restore-database.ts --list
  tsx server/restore-database.ts --force
  tsx server/restore-database.ts backups/medical-ai-backup-2024-01-15.json --force

⚠️  ATTENTION: Cette opération supprime toutes les données existantes!
  `);
  process.exit(0);
}

// Exécuter si ce fichier est appelé directement
const isMainModule = process.argv[1] && process.argv[1].endsWith('restore-database.ts');
if (isMainModule) {
  main();
} 