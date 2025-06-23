import { db } from './db';
import { users, patients, consultations, aiSummaries } from '@shared/schema';

async function clearDatabase() {
  try {
    console.log('🔄 Suppression de toutes les données de la base de données...');
    
    // Supprimer d'abord les tables avec des clés étrangères
    console.log('🔄 Suppression des résumés AI...');
    await db.delete(aiSummaries);
    console.log('✅ Résumés AI supprimés');
    
    console.log('🔄 Suppression des consultations...');
    await db.delete(consultations);
    console.log('✅ Consultations supprimées');
    
    console.log('🔄 Suppression des patients...');
    await db.delete(patients);
    console.log('✅ Patients supprimés');
    
    console.log('🔄 Suppression des utilisateurs...');
    await db.delete(users);
    console.log('✅ Utilisateurs supprimés');
    
    console.log('✅ Base de données nettoyée avec succès!');
    console.log('\nVous pouvez maintenant créer un nouvel utilisateur administrateur avec:');
    console.log('npm run db:create-admin');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage de la base de données:', error);
  } finally {
    process.exit(0);
  }
}

// Demander confirmation avant de supprimer toutes les données
console.log('⚠️ ATTENTION: Cette opération va supprimer TOUTES les données de la base de données!');
console.log('⚠️ Cette action est IRRÉVERSIBLE!');
console.log('');
console.log('Pour continuer, tapez "OUI" et appuyez sur Entrée.');

process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  const input = data.toString().trim();
  if (input === 'OUI') {
    clearDatabase();
  } else {
    console.log('❌ Opération annulée. La base de données n\'a pas été modifiée.');
    process.exit(0);
  }
}); 