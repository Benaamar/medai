import axios from 'axios';
import type { Consultation, Patient, ConsultationWithPatient, AiSummaryWithDetails } from "@shared/schema";
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

// Clé API Anthropic - utiliser la variable d'environnement
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022";

export interface MedicalSummaryRequest {
  consultation: ConsultationWithPatient;
  summaryType: "consultation" | "prescription" | "referral";
}

export interface MedicalSummaryResponse {
  content: string;
  type: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatContext {
  consultation: ConsultationWithPatient;
  previousConsultations: ConsultationWithPatient[];
  previousSummaries: AiSummaryWithDetails[];
  messageHistory: ChatMessage[];
}

export interface ChatRequest {
  message: string;
  context: ChatContext;
}

export interface ChatResponse {
  content: string;
}

export interface GeneralChatRequest {
  message: string;
  messageHistory: ChatMessage[];
}

export interface GeneralChatResponse {
  content: string;
}

export async function processAiChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const { message, context } = request;
  const { consultation, previousConsultations, previousSummaries, messageHistory } = context;

  if (!consultation || !message) {
    throw new Error("Données de consultation ou message manquants");
  }

  const patient = consultation.patient;
  if (!patient) {
    throw new Error("Données du patient manquantes");
  }

  const patientAge = calculateAge(patient.birthDate);
  const patientInfo = `${patient.firstName} ${patient.lastName}, ${patientAge} ans, né(e) le ${patient.birthDate}`;
  
  // Construire le contexte des consultations précédentes
  let previousConsultationsContext = "";
  if (previousConsultations && previousConsultations.length > 0) {
    previousConsultationsContext = "Consultations précédentes:\n";
    previousConsultations.forEach((prev, index) => {
      previousConsultationsContext += `${index + 1}. Date: ${prev.date}, Motif: ${prev.reason}, Diagnostic: ${prev.diagnosis || "Non spécifié"}\n`;
      if (prev.notes) {
        previousConsultationsContext += `   Notes: ${prev.notes}\n`;
      }
      if (prev.treatment) {
        previousConsultationsContext += `   Traitement: ${prev.treatment}\n`;
      }
    });
  }

  // Construire le contexte des synthèses IA précédentes
  let previousSummariesContext = "";
  if (previousSummaries && previousSummaries.length > 0) {
    previousSummariesContext = "Synthèses IA précédentes:\n";
    previousSummaries.slice(0, 3).forEach((summary, index) => {
      const date = summary.generatedAt ? new Date(summary.generatedAt).toLocaleDateString('fr-FR') : "Date inconnue";
      previousSummariesContext += `${index + 1}. Type: ${summary.type}, Date: ${date}\n`;
      previousSummariesContext += `   Contenu: ${summary.content.substring(0, 200)}...\n`;
    });
  }

  // Construire l'historique des messages
  let conversationHistory = "";
  if (messageHistory && messageHistory.length > 0) {
    messageHistory.forEach((msg) => {
      conversationHistory += `${msg.role === 'user' ? 'Médecin' : 'Assistant'}: ${msg.content}\n`;
    });
  }

  // Obtenir la date et l'heure actuelles
  const now = new Date();
  const currentDate = now.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const currentTime = now.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Système prompt pour le chat médical
  const systemPrompt = `Vous êtes un assistant médical IA expert conçu pour aider les médecins dans leur pratique quotidienne.

  CONTEXTE TEMPOREL ACTUEL :
  - Date d'aujourd'hui : ${currentDate}
  - Heure actuelle : ${currentTime}
  - Utilisez ces informations pour contextualiser vos réponses
  
  Informations patient actuelles:
  - Nom: ${patientInfo}
  - Motif de consultation: ${consultation.reason}
  - Notes: ${consultation.notes || "Aucune note"}
  - Diagnostic: ${consultation.diagnosis || "Non établi"}
  - Traitement: ${consultation.treatment || "Non prescrit"}
  
  ${previousConsultationsContext}
  
  ${previousSummariesContext}
  
  Votre rôle est d'aider le médecin à:
  1. Comprendre et analyser les symptômes décrits en langage naturel
  2. Proposer des diagnostics différentiels pertinents
  3. Suggérer des examens complémentaires appropriés
  4. Recommander des traitements basés sur les dernières recommandations
  5. Générer des synthèses structurées des consultations
  
  Répondez de manière professionnelle, précise et concise, en utilisant la terminologie médicale appropriée.
  Gardez à l'esprit tout l'historique médical du patient pour contextualiser vos réponses.`;

  const userPrompt = `CONTEXTE ACTUEL :
Date et heure : ${currentDate} à ${currentTime}

${conversationHistory ? `Historique de la conversation:
${conversationHistory}` : ''}

Message du médecin: ${message}

Répondez en tenant compte du contexte temporel actuel et de l'historique médical du patient.`;

  try {
    console.log("Envoi de la requête chat à l'API Anthropic...");
    
    // Création de l'objet de requête pour l'API Anthropic
    const requestBody = {
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ]
    };
    
    // Appel à l'API Anthropic
    const response = await axios.post(
      ANTHROPIC_API_URL,
      requestBody,
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        timeout: 30000 // 30 secondes de timeout
      }
    );

    console.log("Réponse chat reçue de l'API Anthropic");
    
    // Validation et extraction du contenu de la réponse
    if (!response.data || !response.data.content || !Array.isArray(response.data.content) || 
        response.data.content.length === 0 || !response.data.content[0].text) {
      console.error("Format de réponse inattendu:", JSON.stringify(response.data, null, 2));
      throw new Error("Format de réponse inattendu de l'API Anthropic");
    }
    
    const content = response.data.content[0].text;
    console.log("Contenu de réponse généré:", content.substring(0, 100) + "...");

    return {
      content
    };
  } catch (error) {
    console.error("Erreur lors du traitement du message chat avec Anthropic:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("Détails de l'erreur API:", {
          status: error.response.status,
          data: error.response.data
        });
      }
    }
    
    throw new Error(`Erreur lors du traitement du message: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

export async function processGeneralChatMessage(request: GeneralChatRequest): Promise<GeneralChatResponse> {
  // Obtenir la date et l'heure actuelles
  const now = new Date();
  const currentDate = now.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const currentTime = now.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Préparer le prompt système pour l'assistant médical général
  const systemPrompt = `Tu es un assistant IA médical professionnel et expérimenté. Tu aides les médecins dans leurs tâches quotidiennes.

CONTEXTE TEMPOREL ACTUEL :
- Date d'aujourd'hui : ${currentDate}
- Heure actuelle : ${currentTime}
- Utilise toujours ces informations temporelles dans tes réponses quand c'est pertinent

DIRECTIVES IMPORTANTES :
- Réponds en français de manière professionnelle et bienveillante
- Fournis des informations médicales précises et basées sur les preuves
- Reste dans ton rôle d'assistant médical
- Si tu n'es pas sûr d'une information, dis-le clairement
- Ne donne jamais de diagnostic définitif sans examen clinique
- Encourage toujours la consultation médicale appropriée
- Utilise un langage médical approprié mais accessible
- Référence la date et l'heure actuelles quand c'est approprié

CAPACITÉS :
- Aide à l'analyse de symptômes
- Suggestions de diagnostics différentiels
- Recommandations de traitements standard
- Conseils sur les examens complémentaires
- Support pour les procédures administratives médicales
- Aide à la rédaction de documents médicaux
- Planification et rappels temporels

Réponds de manière structurée et professionnelle en tenant compte du contexte temporel actuel.`;

  // Préparer l'historique des messages pour le contexte
  const messageHistoryText = request.messageHistory.length > 0 
    ? request.messageHistory.map(msg => `${msg.role === 'user' ? 'Médecin' : 'Assistant'}: ${msg.content}`).join('\n')
    : "Début de la conversation";

  // Préparer le prompt utilisateur
  const userPrompt = `CONTEXTE ACTUEL :
Date et heure : ${currentDate} à ${currentTime}

Historique de la conversation:
${messageHistoryText}

Nouveau message du médecin: ${request.message}

Réponds de manière professionnelle et utile en tant qu'assistant médical IA, en tenant compte de la date et l'heure actuelles.`;

  try {
    console.log("Envoi de la requête chat général à l'API Anthropic...");
    
    // Création de l'objet de requête pour l'API Anthropic
    const requestBody = {
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ]
    };
    
    // Appel à l'API Anthropic
    const response = await axios.post(
      ANTHROPIC_API_URL,
      requestBody,
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        timeout: 30000 // 30 secondes de timeout
      }
    );

    console.log("Réponse chat général reçue de l'API Anthropic");
    
    // Validation et extraction du contenu de la réponse
    if (!response.data || !response.data.content || !Array.isArray(response.data.content) || 
        response.data.content.length === 0 || !response.data.content[0].text) {
      console.error("Format de réponse inattendu:", JSON.stringify(response.data, null, 2));
      throw new Error("Format de réponse inattendu de l'API Anthropic");
    }
    
    const content = response.data.content[0].text;
    console.log("Contenu de réponse générale généré:", content.substring(0, 100) + "...");

    return {
      content
    };
  } catch (error) {
    console.error("Erreur lors du traitement du message chat général avec Anthropic:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("Détails de l'erreur API:", {
          status: error.response.status,
          data: error.response.data
        });
      }
    }
    
    throw new Error(`Erreur lors du traitement du message général: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

export async function generateMedicalSummary(request: MedicalSummaryRequest): Promise<MedicalSummaryResponse> {
  const { consultation, summaryType } = request;
  const { patient } = consultation;

  if (!consultation || !patient || !summaryType) {
    throw new Error("Données de consultation ou patient manquantes");
  }

  let systemPrompt = "";
  let userPrompt = "";

  const patientAge = calculateAge(patient.birthDate);
  const patientInfo = `${patient.firstName} ${patient.lastName}, ${patientAge} ans, né(e) le ${patient.birthDate}`;
  const currentDate = new Date().toLocaleDateString('fr-FR');

  switch (summaryType) {
    case "consultation":
      systemPrompt = `Vous êtes un médecin expérimenté spécialisé dans la rédaction de synthèses de consultations médicales.
      Rédigez une synthèse professionnelle, structurée et complète en français médical approprié.
      Utilisez une structure claire avec des sections bien définies: MOTIF DE CONSULTATION, ANAMNÈSE, EXAMEN CLINIQUE, DIAGNOSTIC, CONDUITE À TENIR.
      Soyez précis, factuel et utilisez une terminologie médicale appropriée.
      Répondez uniquement avec le contenu de la synthèse, sans introduction ni conclusion.`;
      
      userPrompt = `Rédigez une synthèse de consultation médicale pour:
      Patient: ${patientInfo}
      Date de consultation: ${currentDate}
      Motif de consultation: ${consultation.reason}
      Notes de consultation: ${consultation.notes || "Examen de routine"}
      Diagnostic: ${consultation.diagnosis || "À déterminer"}
      Traitement: ${consultation.treatment || "À définir"}
      
      Créez une synthèse médicale professionnelle complète en utilisant un format structuré avec des sections clairement identifiées.`;
      break;

    case "prescription":
      systemPrompt = `Vous êtes un médecin expérimenté spécialisé dans la rédaction d'ordonnances médicales.
      Votre objectif est de proposer la meilleure prise en charge thérapeutique en fonction de la pathologie décrite.
      1. Commencez par un en-tête : informations du médecin, informations du patient, date.
      2. Générez ensuite **une liste de médicaments adaptés au diagnostic**.
         • Pour chaque médicament, indiquez : nom (DCI si possible), dosage, posologie exacte (fréquence journalière), durée du traitement, conditions de renouvellement.
         • Proposez plusieurs options thérapeutiques si cela est pertinent (ex. première intention, alternative en cas d'allergie).
      3. Ajoutez une section « Conseils et recommandations » personnalisée à la pathologie (mesures hygiéno-diététiques, signes d'alerte, suivi).
      4. Terminez par une zone de signature formelle (Nom du médecin, numéro RPPS).
      
      Format attendu :
      --------------------------------------
      ORDONNANCE
      [En-tête médecin / patient / date]
      
      Médicaments :
      1. Nom – Dosage – Posologie – Durée – Renouvellement
      2. … (autres lignes si nécessaire)
      
      Conseils & recommandations :
      • …
      
      Signature
      --------------------------------------
      
      Répondez uniquement avec le contenu de l'ordonnance, sans introduction ni conclusion supplémentaires.`;
      
      userPrompt = `Vous devez rédiger une ordonnance médicale détaillée pour:
      Patient: ${patientInfo}
      Date: ${currentDate}
      Pathologie: ${consultation.diagnosis || consultation.reason || "À préciser"}
      Notes supplémentaires: ${consultation.notes || "N/A"}
      
      Suivez exactement le format décrit dans le message système et proposez la liste de médicaments adaptée.`;
      break;

    case "referral":
      systemPrompt = `Vous êtes un médecin expérimenté spécialisé dans la rédaction de courriers de correspondance médicale.
      Rédigez un courrier professionnel adressé à un confrère spécialiste en français médical approprié.
      Incluez: en-tête professionnel, formule d'introduction courtoise, présentation du patient, motif d'adressage, 
      anamnèse détaillée, résultats de l'examen clinique, examens complémentaires réalisés, 
      diagnostic provisoire, traitements déjà instaurés, demande spécifique au spécialiste, et formule de conclusion courtoise.
      Utilisez un ton professionnel et une terminologie médicale précise.`;
      
      userPrompt = `Rédigez un courrier de correspondance médicale pour:
      Patient: ${patientInfo}
      Date: ${currentDate}
      Motif de consultation initiale: ${consultation.reason}
      Diagnostic actuel: ${consultation.diagnosis || "À préciser"}
      Notes cliniques: ${consultation.notes || "Examen clinique normal"}
      Traitement actuel: ${consultation.treatment || "Aucun traitement en cours"}
      
      Rédigez un courrier de correspondance complet pour adresser ce patient à un spécialiste approprié en fonction du diagnostic ou des symptômes présentés.`;
      break;
    
    default:
      throw new Error(`Type de synthèse non supporté: ${summaryType}`);
  }

  try {
    console.log("Envoi de la requête à l'API Anthropic...");
    console.log("Clé API utilisée:", ANTHROPIC_API_KEY.substring(0, 10) + "...");
    console.log("Type de synthèse:", summaryType);
    console.log("Patient:", patientInfo);
    
    // Création de l'objet de requête avec la structure correcte pour l'API Anthropic
    const requestBody = {
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      system: systemPrompt,  // Le message système est un paramètre de premier niveau
      messages: [
        { role: "user", content: userPrompt }  // Seul le message utilisateur va dans le tableau messages
      ]
    };
    
    console.log("Requête API (structure):", JSON.stringify({
      model: requestBody.model,
      max_tokens: requestBody.max_tokens,
      temperature: requestBody.temperature,
      system: "...",
      messages: [
        { role: "user", content: "..." }
      ]
    }, null, 2));
    
    // Appel à l'API Anthropic avec timeout
    const response = await axios.post(
      ANTHROPIC_API_URL,
      requestBody,
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        timeout: 30000 // 30 secondes de timeout
      }
    );

    console.log("Réponse reçue de l'API Anthropic");
    
    // Validation et extraction du contenu de la réponse
    if (!response.data || !response.data.content || !Array.isArray(response.data.content) || 
        response.data.content.length === 0 || !response.data.content[0].text) {
      console.error("Format de réponse inattendu:", JSON.stringify(response.data, null, 2));
      throw new Error("Format de réponse inattendu de l'API Anthropic");
    }
    
    const content = response.data.content[0].text;
    console.log("Contenu généré:", content.substring(0, 100) + "...");
    
    // Afficher les informations d'utilisation si disponibles
    if (response.data.usage) {
      console.log("Informations d'utilisation:", JSON.stringify(response.data.usage, null, 2));
    }

    return {
      content,
      type: summaryType
    };
  } catch (error) {
    console.error("Erreur lors de la génération de la synthèse IA avec Anthropic:", error);
    
    // Afficher plus de détails sur l'erreur
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        console.error("Détails de l'erreur API:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Gestion des erreurs spécifiques
        if (error.response.status === 400) {
          console.error("Erreur 400: Problème avec les paramètres de la requête");
          console.error("Vérifiez le format des messages et les paramètres model/max_tokens");
        } else if (error.response.status === 401) {
          console.error("Erreur 401: Clé API invalide ou expirée");
        } else if (error.response.status === 429) {
          console.error("Erreur 429: Limite de taux dépassée");
        }
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error("Aucune réponse reçue:", error.request);
        console.error("Vérifiez votre connexion Internet ou si l'API Anthropic est accessible");
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error("Erreur de configuration:", error.message);
      }
      
      throw new Error(`Erreur lors de la génération de la synthèse: ${error.message}`);
    } else {
      throw new Error(`Erreur lors de la génération de la synthèse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
} 