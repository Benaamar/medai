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

export async function backupDatabase(): Promise<void> {
  try {
    console.log('🚀 Début de la sauvegarde de la base de données...');

    // Récupérer toutes les données
    console.log('📊 Récupération des utilisateurs...');
    const allUsers = await db.select().from(users);
    
    console.log('👥 Récupération des patients...');
    const allPatients = await db.select().from(patients);
    
    console.log('📋 Récupération des consultations...');
    const allConsultations = await db.select().from(consultations);
    
    console.log('🤖 Récupération des résumés IA...');
    const allAiSummaries = await db.select().from(aiSummaries);

    // Créer l'objet de sauvegarde
    const backupData: BackupData = {
      users: allUsers,
      patients: allPatients,
      consultations: allConsultations,
      aiSummaries: allAiSummaries,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    // Créer le dossier backup s'il n'existe pas
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Noms des fichiers de sauvegarde
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonBackupPath = path.join(backupDir, `medical-ai-backup-${timestamp}.json`);
    const sqlBackupPath = path.join(backupDir, `medical-ai-backup-${timestamp}.sql`);

    // Sauvegarder en JSON
    fs.writeFileSync(jsonBackupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log('✅ Sauvegarde JSON créée:', jsonBackupPath);

    // Générer le SQL
    const sqlContent = generateSqlBackup(backupData);
    fs.writeFileSync(sqlBackupPath, sqlContent, 'utf-8');
    console.log('✅ Sauvegarde SQL créée:', sqlBackupPath);

    // Afficher les statistiques
    console.log('\n📈 STATISTIQUES DE SAUVEGARDE:');
    console.log(`👤 Utilisateurs: ${allUsers.length}`);
    console.log(`👥 Patients: ${allPatients.length}`);
    console.log(`📋 Consultations: ${allConsultations.length}`);
    console.log(`🤖 Résumés IA: ${allAiSummaries.length}`);
    console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
    
    console.log('\n🎉 Sauvegarde terminée avec succès!');
    console.log(`📁 Fichiers créés dans: ${backupDir}`);

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    throw error;
  }
}

function generateSqlBackup(data: BackupData): string {
  const lines: string[] = [];
  
  // En-tête SQL
  lines.push('-- Medical AI Companion - Sauvegarde de base de données');
  lines.push(`-- Générée le: ${new Date().toLocaleString('fr-FR')}`);
  lines.push(`-- Version: ${data.version}`);
  lines.push('');
  lines.push('-- Désactiver les contraintes de clés étrangères temporairement');
  lines.push('SET session_replication_role = replica;');
  lines.push('');

  // Nettoyer les tables existantes
  lines.push('-- Nettoyer les données existantes');
  lines.push('DELETE FROM "ai_summaries";');
  lines.push('DELETE FROM "consultations";');
  lines.push('DELETE FROM "patients";');
  lines.push('DELETE FROM "users";');
  lines.push('');

  // Réinitialiser les séquences
  lines.push('-- Réinitialiser les séquences');
  lines.push('ALTER SEQUENCE "users_id_seq" RESTART WITH 1;');
  lines.push('ALTER SEQUENCE "patients_id_seq" RESTART WITH 1;');
  lines.push('ALTER SEQUENCE "consultations_id_seq" RESTART WITH 1;');
  lines.push('ALTER SEQUENCE "ai_summaries_id_seq" RESTART WITH 1;');
  lines.push('');

  // Insérer les utilisateurs
  if (data.users.length > 0) {
    lines.push('-- Insertion des utilisateurs');
    data.users.forEach(user => {
      const values = [
        user.id,
        escapeString(user.username),
        escapeString(user.password),
        escapeString(user.name),
        escapeString(user.role)
      ].join(', ');
      lines.push(`INSERT INTO "users" ("id", "username", "password", "name", "role") VALUES (${values});`);
    });
    lines.push('');
  }

  // Insérer les patients
  if (data.patients.length > 0) {
    lines.push('-- Insertion des patients');
    data.patients.forEach(patient => {
      const values = [
        patient.id,
        escapeString(patient.firstName),
        escapeString(patient.lastName),
        escapeString(patient.birthDate),
        patient.phone ? escapeString(patient.phone) : 'NULL',
        patient.email ? escapeString(patient.email) : 'NULL',
        patient.address ? escapeString(patient.address) : 'NULL',
        patient.createdAt ? `'${patient.createdAt.toISOString()}'` : 'NOW()'
      ].join(', ');
      lines.push(`INSERT INTO "patients" ("id", "first_name", "last_name", "birth_date", "phone", "email", "address", "created_at") VALUES (${values});`);
    });
    lines.push('');
  }

  // Insérer les consultations
  if (data.consultations.length > 0) {
    lines.push('-- Insertion des consultations');
    data.consultations.forEach(consultation => {
      const values = [
        consultation.id,
        consultation.patientId,
        consultation.doctorId,
        escapeString(consultation.date),
        escapeString(consultation.time),
        escapeString(consultation.reason),
        escapeString(consultation.status),
        consultation.notes ? escapeString(consultation.notes) : 'NULL',
        consultation.diagnosis ? escapeString(consultation.diagnosis) : 'NULL',
        consultation.treatment ? escapeString(consultation.treatment) : 'NULL',
        consultation.createdAt ? `'${consultation.createdAt.toISOString()}'` : 'NOW()'
      ].join(', ');
      lines.push(`INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (${values});`);
    });
    lines.push('');
  }

  // Insérer les résumés IA
  if (data.aiSummaries.length > 0) {
    lines.push('-- Insertion des résumés IA');
    data.aiSummaries.forEach(summary => {
      const values = [
        summary.id,
        summary.consultationId,
        summary.patientId,
        summary.doctorId,
        escapeString(summary.type),
        escapeString(summary.content),
        summary.generatedAt ? `'${summary.generatedAt.toISOString()}'` : 'NOW()'
      ].join(', ');
      lines.push(`INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (${values});`);
    });
    lines.push('');
  }

  // Mettre à jour les séquences
  lines.push('-- Mettre à jour les séquences');
  if (data.users.length > 0) {
    lines.push(`SELECT setval('"users_id_seq"', ${Math.max(...data.users.map(u => u.id))}, true);`);
  }
  if (data.patients.length > 0) {
    lines.push(`SELECT setval('"patients_id_seq"', ${Math.max(...data.patients.map(p => p.id))}, true);`);
  }
  if (data.consultations.length > 0) {
    lines.push(`SELECT setval('"consultations_id_seq"', ${Math.max(...data.consultations.map(c => c.id))}, true);`);
  }
  if (data.aiSummaries.length > 0) {
    lines.push(`SELECT setval('"ai_summaries_id_seq"', ${Math.max(...data.aiSummaries.map(s => s.id))}, true);`);
  }
  lines.push('');

  // Réactiver les contraintes
  lines.push('-- Réactiver les contraintes de clés étrangères');
  lines.push('SET session_replication_role = DEFAULT;');
  lines.push('');
  lines.push('-- Fin de la sauvegarde');

  return lines.join('\n');
}

function escapeString(str: string): string {
  if (str === null || str === undefined) {
    return 'NULL';
  }
  return `'${str.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

// Fonction principale pour exécuter la sauvegarde
async function main() {
  try {
    await backupDatabase();
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Exécuter si ce fichier est appelé directement
const isMainModule = process.argv[1] && process.argv[1].endsWith('backup-database.ts');
if (isMainModule) {
  main();
} 