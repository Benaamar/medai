import axios from 'axios';
import { config } from 'dotenv';

// Charger les variables d'environnement du fichier .env
config();

// Interface pour la réponse de l'API Anthropic
interface AnthropicResponse {
  content: Array<{text: string}>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Utiliser la clé API depuis les variables d'environnement
const apiKey = process.env.ANTHROPIC_API_KEY;
console.log("Clé API utilisée:", apiKey ? `${apiKey.substring(0, 10)}...` : "non définie");

async function testAnthropic() {
  try {
    console.log("🔄 Test de connexion à l'API Anthropic (Claude) en cours...");
    
    // Appel à l'API Anthropic
    const response = await axios.post<AnthropicResponse>(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          { role: "user", content: "Écrivez une histoire courte d'une phrase sur une licorne avant de dormir." }
        ]
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        }
      }
    );

    // Afficher la réponse
    const content = response.data.content[0].text;
    console.log("\n✅ Connexion réussie à l'API Anthropic (Claude)!");
    console.log("\nRéponse de l'API:");
    console.log("----------------");
    console.log(content);
    console.log("----------------");
    
    // Afficher les informations d'utilisation si disponibles
    if (response.data.usage) {
      console.log("\nInformations d'utilisation:");
      console.log(JSON.stringify(response.data.usage, null, 2));
    }

  } catch (error: any) {
    console.error("\n❌ Erreur lors de la connexion à l'API Anthropic (Claude):");
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'état
      console.error(`- Status: ${error.response.status}`);
      console.error(`- Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error("- Aucune réponse reçue du serveur");
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error(`- Message: ${error.message || String(error)}`);
    }
  }
}

// Exécuter le test
testAnthropic(); 