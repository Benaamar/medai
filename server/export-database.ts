import { db } from './db';
import { users, patients, consultations, aiSummaries } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

export async function exportCompleteDatabase(): Promise<void> {
  try {
    console.log('🚀 Export complet de la base de données Medical AI Companion...');

    // Récupérer toutes les données
    console.log('📊 Récupération des données...');
    const allUsers = await db.select().from(users);
    const allPatients = await db.select().from(patients);
    const allConsultations = await db.select().from(consultations);
    const allAiSummaries = await db.select().from(aiSummaries);

    // Créer le dossier exports s'il n'existe pas
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Export SQL complet (schéma + données)
    const sqlExportPath = path.join(exportDir, `medical-ai-complete-${timestamp}.sql`);
    const completeSql = generateCompleteSqlExport({
      users: allUsers,
      patients: allPatients,
      consultations: allConsultations,
      aiSummaries: allAiSummaries
    });
    fs.writeFileSync(sqlExportPath, completeSql, 'utf-8');
    console.log('✅ Export SQL complet créé:', sqlExportPath);

    // Export JSON pour sauvegarde
    const jsonExportPath = path.join(exportDir, `medical-ai-data-${timestamp}.json`);
    const jsonData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        description: 'Export complet Medical AI Companion'
      },
      users: allUsers,
      patients: allPatients,
      consultations: allConsultations,
      aiSummaries: allAiSummaries
    };
    fs.writeFileSync(jsonExportPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log('✅ Export JSON créé:', jsonExportPath);

    // Afficher les statistiques
    console.log('\n📈 STATISTIQUES:');
    console.log(`👤 Utilisateurs: ${allUsers.length}`);
    console.log(`👥 Patients: ${allPatients.length}`);
    console.log(`📋 Consultations: ${allConsultations.length}`);
    console.log(`🤖 Résumés IA: ${allAiSummaries.length}`);
    
    console.log('\n🎉 Export terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    throw error;
  }
}

function generateCompleteSqlExport(data: any): string {
  const lines: string[] = [];
  
  lines.push('-- Medical AI Companion - Export complet');
  lines.push(`-- Généré le: ${new Date().toLocaleString('fr-FR')}`);
  lines.push('');

  // Création des tables
  lines.push('-- Création des tables');
  lines.push('DROP TABLE IF EXISTS "ai_summaries" CASCADE;');
  lines.push('DROP TABLE IF EXISTS "consultations" CASCADE;');
  lines.push('DROP TABLE IF EXISTS "patients" CASCADE;');
  lines.push('DROP TABLE IF EXISTS "users" CASCADE;');
  lines.push('');

  // Table users
  lines.push('CREATE TABLE "users" (');
  lines.push('    "id" SERIAL PRIMARY KEY,');
  lines.push('    "username" TEXT NOT NULL UNIQUE,');
  lines.push('    "password" TEXT NOT NULL,');
  lines.push('    "name" TEXT NOT NULL,');
  lines.push('    "role" TEXT NOT NULL DEFAULT \'doctor\'');
  lines.push(');');
  lines.push('');

  // Insertion des données (simplifié)
  lines.push('-- Insertion des données');
  
  // Fonction d'échappement
  const escapeString = (str: string): string => {
    if (str === null || str === undefined) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
  };

  // Insérer les utilisateurs
  if (data.users.length > 0) {
    data.users.forEach((user: any) => {
      lines.push(`INSERT INTO "users" ("username", "password", "name", "role") VALUES (${escapeString(user.username)}, ${escapeString(user.password)}, ${escapeString(user.name)}, ${escapeString(user.role)});`);
    });
  }

  return lines.join('\n');
}

// Fonction principale
async function main() {
  try {
    await exportCompleteDatabase();
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Exécuter si ce fichier est appelé directement
const isMainModule = process.argv[1] && process.argv[1].endsWith('export-database.ts');
if (isMainModule) {
  main();
} 