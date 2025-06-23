import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Charger les variables d'environnement existantes
config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Configuration de la clé API OpenAI ===\n');
console.log('Cette erreur "401 Incorrect API key provided" indique que votre clé API OpenAI est invalide ou non configurée.');
console.log('Ce script va vous aider à configurer correctement votre clé API OpenAI.\n');

// Fonction pour mettre à jour le fichier .env
const updateEnvFile = (apiKey: string) => {
  const envPath = path.resolve(process.cwd(), '.env');
  
  try {
    // Vérifier si le fichier .env existe
    if (fs.existsSync(envPath)) {
      // Lire le contenu actuel
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Vérifier si OPENAI_API_KEY existe déjà
      if (envContent.includes('OPENAI_API_KEY=')) {
        // Remplacer la valeur existante
        envContent = envContent.replace(/OPENAI_API_KEY=.*(\r?\n|$)/g, `OPENAI_API_KEY="${apiKey}"$1`);
      } else {
        // Ajouter la nouvelle variable
        envContent += `\nOPENAI_API_KEY="${apiKey}"\n`;
      }
      
      // Écrire le contenu mis à jour
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ Clé API OpenAI mise à jour avec succès dans le fichier .env');
    } else {
      // Créer un nouveau fichier .env
      const envContent = `OPENAI_API_KEY="${apiKey}"\n`;
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ Fichier .env créé avec la clé API OpenAI');
    }
    
    console.log('\n🔄 Redémarrez votre serveur pour appliquer les changements.');
    console.log('Vous pouvez maintenant utiliser l\'Assistant IA Médical pour générer des documents.');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la mise à jour du fichier .env:', error);
  }
};

// Demander la clé API OpenAI
rl.question('\nVeuillez entrer votre clé API OpenAI (commence par "sk-") : ', (apiKey) => {
  if (!apiKey.trim()) {
    console.log('\n❌ Aucune clé API fournie. Opération annulée.');
    rl.close();
    return;
  }
  
  if (!apiKey.startsWith('sk-')) {
    console.log('\n⚠️ Attention: Les clés API OpenAI commencent généralement par "sk-". Veuillez vérifier votre clé.');
    rl.question('\nContinuer quand même? (o/n) : ', (answer) => {
      if (answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui') {
        updateEnvFile(apiKey);
      } else {
        console.log('\n❌ Opération annulée.');
      }
      rl.close();
    });
  } else {
    updateEnvFile(apiKey);
    rl.close();
  }
});

// Instructions pour obtenir une clé API
console.log('\n📝 Comment obtenir une clé API OpenAI:');
console.log('1. Connectez-vous à votre compte OpenAI sur https://platform.openai.com/');
console.log('2. Accédez à la section API Keys: https://platform.openai.com/account/api-keys');
console.log('3. Cliquez sur "Create new secret key"');
console.log('4. Copiez la clé générée et collez-la ici'); 