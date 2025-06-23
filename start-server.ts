import { config } from 'dotenv';
import { spawn } from 'child_process';

// Charger les variables d'environnement depuis le fichier .env
config();

// Définir NODE_ENV pour le développement
process.env.NODE_ENV = 'development';

console.log('Variables d\'environnement chargées depuis .env');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Défini' : '❌ Non défini'}`);

// Démarrer le serveur
const isWindows = process.platform === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';

const serverProcess = spawn(command, ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: process.env,
  shell: isWindows
});

serverProcess.on('error', (err) => {
  console.error('Erreur lors du démarrage du serveur:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`Le serveur s'est arrêté avec le code: ${code}`);
  process.exit(code || 0);
}); 