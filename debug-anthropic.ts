import axios from 'axios';
import { config } from 'dotenv';

config();

const apiKey = process.env.ANTHROPIC_API_KEY;

// Interface pour la réponse de l'API Anthropic
interface AnthropicResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

async function diagnosticAnthropic() {
  console.log('🔍 Diagnostic de l\'API Anthropic...\n');
  
  // Test 1: Vérification de la clé API
  console.log('1. Vérification de la clé API:');
  console.log(`   Clé présente: ${apiKey ? 'Oui' : 'Non'}`);
  console.log(`   Format: ${apiKey ? apiKey.substring(0, 15) + '...' : 'N/A'}`);
  console.log(`   Longueur: ${apiKey ? apiKey.length : 0} caractères\n`);

  if (!apiKey) {
    console.error('❌ Aucune clé API trouvée. Vérifiez votre fichier .env');
    return;
  }

  // Test 2: Requête simple
  console.log('2. Test de requête simple...');
  try {
    const simpleResponse = await axios.post<AnthropicResponse>(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 100,
        messages: [
          { role: "user", content: "Bonjour, répondez juste 'Test réussi'" }
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
    
    console.log('   ✅ Requête simple réussie');
    console.log(`   Réponse: ${simpleResponse.data.content[0].text}`);
    console.log(`   Tokens utilisés: ${simpleResponse.data.usage?.input_tokens + (simpleResponse.data.usage?.output_tokens || 0)}\n`);
    
  } catch (error: any) {
    console.log('   ❌ Erreur lors de la requête simple:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`   Erreur: ${error.message}`);
    }
    console.log('');
    return;
  }

  // Test 3: Requête avec structure de consultation médicale
  console.log('3. Test avec structure de consultation médicale...');
  try {
    const systemPrompt = `Vous êtes un médecin expérimenté spécialisé dans la rédaction de synthèses de consultations médicales.
    Rédigez une synthèse professionnelle, structurée et complète en français médical approprié.
    Utilisez une structure claire avec des sections bien définies: MOTIF DE CONSULTATION, ANAMNÈSE, EXAMEN CLINIQUE, DIAGNOSTIC, CONDUITE À TENIR.
    Soyez précis, factuel et utilisez une terminologie médicale appropriée.
    Répondez uniquement avec le contenu de la synthèse, sans introduction ni conclusion.`;
    
    const userPrompt = `Rédigez une synthèse de consultation médicale pour:
    Patient: Jean Dupont, 45 ans, né le 1978-05-15
    Date de consultation: ${new Date().toLocaleDateString('fr-FR')}
    Motif de consultation: Douleurs lombaires
    Notes de consultation: Patient se plaint de douleurs lombaires depuis 3 jours, sans traumatisme apparent
    Diagnostic: Lombalgie aiguë
    Traitement: Antalgiques, repos relatif
    
    Créez une synthèse médicale professionnelle complète en utilisant un format structuré avec des sections clairement identifiées.`;

    console.log('   Envoi de la requête...');
    const response = await axios.post<AnthropicResponse>(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        timeout: 30000
      }
    );

    console.log('   ✅ Requête avec consultation médicale réussie');
    console.log(`   Longueur de la réponse: ${response.data.content[0].text.length} caractères`);
    console.log(`   Tokens utilisés: ${response.data.usage?.input_tokens + (response.data.usage?.output_tokens || 0)}`);
    console.log('\n   Début de la réponse:');
    console.log('   ' + '='.repeat(50));
    console.log('   ' + response.data.content[0].text.substring(0, 300) + '...');
    console.log('   ' + '='.repeat(50));
    
  } catch (error: any) {
    console.log('   ❌ Erreur lors de la requête avec consultation médicale:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
      
      // Diagnostic spécifique selon l'erreur
      if (error.response.status === 400) {
        console.log('\n   🔍 Diagnostic erreur 400:');
        console.log('   - Vérifiez la structure du prompt');
        console.log('   - Vérifiez les paramètres max_tokens et model');
        console.log('   - Vérifiez le format des messages');
      } else if (error.response.status === 401) {
        console.log('\n   🔍 Diagnostic erreur 401:');
        console.log('   - Clé API invalide ou expirée');
        console.log('   - Vérifiez votre compte Anthropic');
      } else if (error.response.status === 429) {
        console.log('\n   🔍 Diagnostic erreur 429:');
        console.log('   - Limite de taux dépassée');
        console.log('   - Attendez avant de réessayer');
      }
    } else {
      console.log(`   Erreur: ${error.message}`);
    }
  }

  // Test 4: Vérification de la limite de taux
  console.log('\n4. Informations sur les limites:');
  console.log('   - Modèle: claude-3-5-sonnet-20241022');
  console.log('   - Limite recommandée: 1000 tokens/minute pour les comptes gratuits');
  console.log('   - Limite recommandée: 10000 tokens/minute pour les comptes payants');
  console.log('\n✅ Diagnostic terminé');
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage du diagnostic complet\n');
  
  // Diagnostic de l'API Anthropic
  await diagnosticAnthropic();
  
  console.log('\n📋 Résumé des recommandations:');
  console.log('');
  console.log('1. Vérifiez que votre clé API Anthropic est correcte');
  console.log('2. Assurez-vous que votre serveur est démarré');
  console.log('3. Vérifiez la structure de votre requête API');
  console.log('4. Surveillez les limites de taux de l\'API');
  console.log('5. Utilisez des timeouts appropriés (30-60 secondes)');
  console.log('6. Gérez les erreurs spécifiques (400, 401, 429, 500)');
  console.log('');
  console.log('Pour exécuter ce script:');
  console.log('npx ts-node debug-anthropic.ts');
}

// Exécution du diagnostic
if (require.main === module) {
  main().catch(console.error);
}

export { diagnosticAnthropic }; 