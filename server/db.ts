import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Charger les variables d'environnement depuis le fichier .env à la racine du projet
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(`Chargement des variables d'environnement depuis ${envPath}`);
  config({ path: envPath });
}

// Définir directement la chaîne de connexion si elle n'est pas dans les variables d'environnement
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:1234PP@localhost:5432/medicalaicompanion";
console.log("Utilisation de la connexion DB:", DATABASE_URL);

export const client = postgres(DATABASE_URL);
export const db = drizzle(client, { schema });