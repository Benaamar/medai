import OpenAI from "openai";
import type { Consultation, Patient, ConsultationWithPatient } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
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

  switch (summaryType) {
    case "consultation":
      systemPrompt = `Vous êtes un assistant médical spécialisé dans la rédaction de synthèses de consultations médicales. 
      Rédigez une synthèse professionnelle, structurée et complète en français médical approprié. 
      Incluez tous les éléments importants : motif, anamnèse, examen clinique, diagnostic et conduite à tenir.
      Répondez uniquement avec le contenu de la synthèse, sans introduction ni conclusion.`;
      
      userPrompt = `Rédigez une synthèse de consultation médicale pour:
      Patient: ${patientInfo}
      Motif de consultation: ${consultation.reason}
      Notes de consultation: ${consultation.notes || "Examen de routine"}
      Diagnostic: ${consultation.diagnosis || "À déterminer"}
      Traitement: ${consultation.treatment || "À définir"}
      
      Rédigez une synthèse médicale professionnelle complète.`;
      break;

    case "prescription":
      systemPrompt = `Vous êtes un assistant médical spécialisé dans la rédaction d'ordonnances médicales.
      Rédigez une prescription médicale claire et professionnelle en français.
      Incluez les médicaments, posologies, durée de traitement et conseils d'usage.
      Répondez uniquement avec le contenu de l'ordonnance.`;
      
      userPrompt = `Rédigez une ordonnance médicale pour:
      Patient: ${patientInfo}
      Diagnostic: ${consultation.diagnosis || "Consultation de routine"}
      Traitement prescrit: ${consultation.treatment || "Selon indication clinique"}
      
      Rédigez une ordonnance médicale complète avec posologies et conseils.`;
      break;

    case "referral":
      systemPrompt = `Vous êtes un assistant médical spécialisé dans la rédaction de courriers de correspondance médicale.
      Rédigez un courrier professionnel pour un confrère spécialiste en français médical approprié.
      Incluez l'anamnèse, l'examen clinique, et la demande spécifique.
      Répondez uniquement avec le contenu du courrier.`;
      
      userPrompt = `Rédigez un courrier de correspondance médicale pour:
      Patient: ${patientInfo}
      Motif de consultation initiale: ${consultation.reason}
      Diagnostic actuel: ${consultation.diagnosis || "À préciser"}
      Notes cliniques: ${consultation.notes || "Examen clinique normal"}
      
      Rédigez un courrier de correspondance pour adresser ce patient à un spécialiste approprié.`;
      break;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
