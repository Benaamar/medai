import OpenAI from "openai";
import { config } from 'dotenv';

// Charger les variables d'environnement du fichier .env
config();

// Vérifier si la clé API est définie
const apiKey = process.env.OPENAI_API_KEY || "votre-clé-api-openai";
if (apiKey === "votre-clé-api-openai") {
  console.error("⚠️ Erreur: Veuillez configurer votre clé API OpenAI dans le fichier .env");
  console.error("Créez un fichier .env à la racine du projet avec: OPENAI_API_KEY=votre-clé-api");
  process.exit(1);
}

// Initialisation du client OpenAI
const client = new OpenAI({
  apiKey: apiKey
});

async function testOpenAI() {
  try {
    console.log("🔄 Test de connexion à l'API OpenAI en cours...");
    
    // Test avec une requête simple
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo", // Utilisation d'un modèle moins coûteux
      messages: [
        { role: "system", content: "Vous êtes un assistant utile et concis." },
        { role: "user", content: "Écrivez une histoire courte d'une phrase sur une licorne avant de dormir." }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    // Afficher la réponse
    const content = response.choices[0].message.content;
    console.log("\n✅ Connexion réussie à l'API OpenAI!");
    console.log("\nRéponse de l'API:");
    console.log("----------------");
    console.log(content);
    console.log("----------------");
    
    // Afficher les informations d'utilisation
    console.log("\nInformations d'utilisation:");
    console.log(`- Tokens utilisés: ${response.usage?.total_tokens || 'N/A'}`);
    console.log(`- Modèle: ${response.model}`);

  } catch (error) {
    console.error("\n❌ Erreur lors de la connexion à l'API OpenAI:");
    if (error instanceof Error) {
      console.error(`- Message: ${error.message}`);
      
      // Conseils spécifiques selon le type d'erreur
      if (error.message.includes("401")) {
        console.error("\nConseil: Votre clé API est invalide ou a expiré.");
        console.error("Vérifiez votre clé sur https://platform.openai.com/account/api-keys");
      } else if (error.message.includes("429")) {
        console.error("\nConseil: Vous avez dépassé votre quota d'utilisation.");
        console.error("Vérifiez votre plan et vos détails de facturation sur https://platform.openai.com/account/billing/overview");
        console.error("Ou utilisez un modèle moins coûteux comme 'gpt-3.5-turbo' au lieu de 'gpt-4'.");
      }
    } else {
      console.error(error);
    }
  }
}

// Exécuter le test
testOpenAI(); 