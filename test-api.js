// Script pour tester l'API de génération de synthèses médicales
import axios from 'axios';

async function testAPI() {
  console.log('🧪 Test de l\'API ai-summaries/generate\n');

  // Données de test pour une consultation
  const testData = {
    consultationId: 1,  // Remplacez par un ID valide dans votre base de données
    summaryType: "consultation"  // Peut être "consultation", "prescription" ou "referral"
  };

  try {
    console.log('📤 Envoi des données de test...');
    console.log('URL: http://localhost:3000/api/ai-summaries/generate');
    console.log('Données:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(
      'http://localhost:3000/api/ai-summaries/generate', 
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000  // 60 secondes de timeout
      }
    );

    console.log('\n✅ Succès!');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.content) {
      console.log('Synthèse générée:', response.data.content.length, 'caractères');
      console.log('\nDébut de la synthèse:');
      console.log('=' .repeat(50));
      console.log(response.data.content.substring(0, 300) + '...');
      console.log('=' .repeat(50));
    }

    if (response.data.metadata) {
      console.log('\nMétadonnées:');
      console.log(JSON.stringify(response.data.metadata, null, 2));
    }

  } catch (error) {
    console.log('\n❌ Erreur:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        console.log('\n🔍 Diagnostic erreur 400:');
        console.log('- Vérifiez que consultationId et summaryType sont fournis');
        console.log('- Vérifiez que consultationId correspond à une consultation existante');
      } else if (error.response.status === 404) {
        console.log('\n🔍 Diagnostic erreur 404:');
        console.log('- La consultation ou le patient n\'existe pas');
        console.log('- Vérifiez l\'ID de consultation fourni');
      } else if (error.response.status === 500) {
        console.log('\n🔍 Diagnostic erreur 500:');
        console.log('- Problème avec l\'API Anthropic');
        console.log('- Vérifiez les logs du serveur pour plus de détails');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Serveur non accessible sur localhost:3000');
      console.log('Assurez-vous que votre serveur est démarré avec:');
      console.log('npm run dev');
    } else {
      console.log('Erreur:', error.message);
    }
  }
}

// Test avec données manquantes pour voir la validation
async function testValidation() {
  console.log('\n🧪 Test de validation (données manquantes)\n');

  const invalidData = {
    // consultationId manquant intentionnellement
    summaryType: "consultation"
  };

  try {
    await axios.post(
      'http://localhost:3000/api/ai-summaries/generate',
      invalidData,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('❌ La validation a échoué - la requête aurait dû être rejetée');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Validation fonctionne correctement');
      console.log('Message:', error.response.data.message);
    } else {
      console.log('❌ Erreur inattendue:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 Démarrage des tests\n');
  
  // Test principal
  await testAPI();
  
  // Test de validation
  await testValidation();
  
  console.log('\n✅ Tests terminés');
}

main().catch(console.error); 