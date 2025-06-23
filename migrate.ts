import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Charger les variables d'environnement
config();

const execAsync = promisify(exec);

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL n\'est pas défini dans le fichier .env');
  }

  console.log('🔄 Génération des migrations...');
  
  try {
    // Générer les migrations avec drizzle-kit
    await execAsync('npx drizzle-kit generate');
    console.log('✅ Migrations générées avec succès');
    
    // Connexion à la base de données
    console.log('🔄 Connexion à la base de données...');
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    // Appliquer les migrations
    console.log('🔄 Application des migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Migrations appliquées avec succès');
    
    await client.end();
    console.log('✅ Migration terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

main(); 