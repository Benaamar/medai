import OpenAI from "openai";
import type { Consultation, Patient, ConsultationWithPatient } from "@shared/schema";

// Initialisation du client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "votre-clé-api-openai"
});

export interface MedicalSummaryRequest {
  consultation: ConsultationWithPatient;
  summaryType: "consultation" | "prescription" | "referral";
}

export interface MedicalSummaryResponse {
  content: string;
  type: string;
}

export async function generateMedicalSummary(request: MedicalSummaryRequest): Promise<MedicalSummaryResponse> {
  const { consultation, summaryType } = request;
  const { patient } = consultation;

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
      Rédigez une ordonnance médicale claire, précise et professionnelle en français.
      Incluez l'en-tête avec les informations du médecin, les informations du patient, la date.
      Pour chaque médicament, précisez: nom, dosage, posologie exacte, durée du traitement, et modalités de renouvellement si nécessaire.
      Ajoutez une section de conseils et recommandations adaptés à la pathologie.
      Terminez par une signature formelle.
      Utilisez un format structuré et professionnel.`;
      
      userPrompt = `Rédigez une ordonnance médicale pour:
      Patient: ${patientInfo}
      Date: ${currentDate}
      Diagnostic: ${consultation.diagnosis || "Consultation de routine"}
      Traitement prescrit: ${consultation.treatment || "Selon indication clinique"}
      
      Créez une ordonnance médicale complète et professionnelle avec tous les éléments requis.`;
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
  }

  try {
    // Utilisation du modèle gpt-3.5-turbo qui est moins coûteux que gpt-4o
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Modèle moins coûteux
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Aucun contenu généré par l'IA");
    }

    return {
      content,
      type: summaryType
    };
  } catch (error) {
    console.error("Erreur lors de la génération de la synthèse IA:", error);
    throw new Error(`Erreur lors de la génération de la synthèse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

export interface SpeechToTextResponse {
  text: string;
  language?: string;
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<SpeechToTextResponse> {
  try {
    console.log('🎵 Début de la transcription, taille du buffer:', audioBuffer.length);
    
    // Vérifier que nous avons une clé API
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-openai-api-key-here") {
      throw new Error("Clé API OpenAI non configurée. Veuillez configurer OPENAI_API_KEY dans le fichier .env");
    }
    
    // Créer un objet File-like pour l'API Whisper
    // Utiliser Blob au lieu de File pour une meilleure compatibilité Node.js
    const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
    
    // Créer un objet compatible avec l'API OpenAI
    const audioFile = new File([audioBlob], "recording.wav", { 
      type: "audio/wav",
      lastModified: Date.now()
    });
    
    console.log('📁 Fichier audio créé pour Whisper:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });
    
    // Utiliser l'API Whisper d'OpenAI pour la transcription
    console.log('🚀 Appel à l\'API Whisper...');
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "fr", // Français
      response_format: "json",
      temperature: 0.2,
    });

    console.log('✅ Transcription Whisper réussie:', response.text);

    if (!response.text || response.text.trim() === '') {
      throw new Error("Aucun texte détecté dans l'audio. Parlez plus clairement ou vérifiez votre microphone.");
    }

    return {
      text: response.text.trim(),
      language: "fr"
    };
  } catch (error) {
    console.error("💥 Erreur lors de la transcription audio:", error);
    
    // Gestion d'erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error("Clé API OpenAI invalide ou non configurée");
      }
      if (error.message.includes('rate limit')) {
        throw new Error("Limite de taux API dépassée. Veuillez réessayer dans quelques instants");
      }
      if (error.message.includes('file size')) {
        throw new Error("Fichier audio trop volumineux. Maximum 25MB");
      }
      if (error.message.includes('file format')) {
        throw new Error("Format de fichier non supporté. Utilisez WAV, MP3, M4A, etc.");
      }
    }
    
    throw new Error(`Erreur lors de la transcription: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
