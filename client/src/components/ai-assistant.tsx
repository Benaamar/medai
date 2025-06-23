import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot, Eye, Wand2, FileText, Pill, Mail, Calendar, UserPlus, FileCheck, Send, Paperclip, RefreshCw, AlertCircle, Stethoscope, Activity, Heart, Brain, Microscope, WifiOff, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Skeleton } from "./ui/skeleton";
import { Textarea } from "./ui/textarea";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import AiSummaryModal from "./ai-summary-modal";
import PrescriptionFormModal from "./prescription-form-modal";
import AppointmentFormModal from "./appointment-form-modal";
import PatientFormModal from "./patient-form-modal";
import MedicalCertificateModal from "./medical-certificate-modal";
import type { ConsultationWithPatient, AiSummaryWithDetails, Patient } from "@shared/schema";
import { Avatar } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Loader2, SendHorizonal } from "lucide-react";
import * as chrono from "chrono-node";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  medicalContext?: {
    symptoms: string[];
    suggestedActions: string[];
    priority: 'low' | 'medium' | 'high';
  };
}

interface AiAssistantProps {
  onViewSummary: (summary: {
    content: string;
    patientName: string;
    consultationDate: string;
    type: string;
    patientId?: number;
  }) => void;
  onPatientSelected?: (patientId?: number) => void;
}

// Enhanced medical intelligence functions
const analyzeMedicalContent = (text: string, patientData?: any) => {
  const lowerText = text.toLowerCase();
  
  // Symptom categories with medical significance
  const symptomCategories = {
    cardiovascular: ['palpitations', 'douleur thoracique', 'essoufflement', 'dyspnée', 'œdème', 'gonflement', 'syncope', 'malaise'],
    respiratory: ['toux', 'expectoration', 'dyspnée', 'sibilants', 'douleur pleurale', 'hémoptysie'],
    neurological: ['céphalée', 'migraine', 'vertiges', 'convulsions', 'paresthésie', 'faiblesse', 'trouble vision'],
    gastrointestinal: ['nausée', 'vomissement', 'diarrhée', 'constipation', 'douleur abdominale', 'dysphagie', 'reflux'],
    infectious: ['fièvre', 'frissons', 'sueurs', 'asthénie', 'myalgie', 'adénopathie'],
    musculoskeletal: ['arthralgie', 'myalgie', 'raideur', 'gonflement articulaire'],
    dermatological: ['éruption', 'prurit', 'rougeur', 'lésion', 'ulcération'],
    genitourinary: ['dysurie', 'pollakiurie', 'hématurie', 'douleur lombaire'],
    general: ['fatigue', 'asthénie', 'anorexie', 'amaigrissement', 'insomnie']
  };
  
  const detectedSymptoms: {[key: string]: string[]} = {};
  let totalSymptoms = 0;
  
  Object.entries(symptomCategories).forEach(([category, symptoms]) => {
    const foundSymptoms = symptoms.filter(symptom => lowerText.includes(symptom));
    if (foundSymptoms.length > 0) {
      detectedSymptoms[category] = foundSymptoms;
      totalSymptoms += foundSymptoms.length;
    }
  });
  
  // Determine priority based on symptom severity and combinations
  let priority: 'low' | 'medium' | 'high' = 'low';
  
  if (detectedSymptoms.cardiovascular || detectedSymptoms.neurological) {
    priority = 'high';
  } else if (totalSymptoms >= 3 || detectedSymptoms.infectious) {
    priority = 'medium';
  }
  
  return {
    detectedSymptoms,
    totalSymptoms,
    priority,
    categories: Object.keys(detectedSymptoms)
  };
};

const generateMedicalResponse = (userMessage: string, patientData: any, analysis: any) => {
  const patientName = `${patientData.patient.firstName} ${patientData.patient.lastName}`;
  const lowerMessage = userMessage.toLowerCase();
  
  // Generate contextual medical responses
  if (lowerMessage.includes('synthèse') || lowerMessage.includes('résumé')) {
    return generateSynthesisResponse(patientName, analysis, patientData);
  } else if (lowerMessage.includes('prescription') || lowerMessage.includes('traitement')) {
    return generatePrescriptionResponse(patientName, analysis, patientData);
  } else if (lowerMessage.includes('diagnostic')) {
    return generateDiagnosticResponse(patientName, analysis, patientData);
  } else if (lowerMessage.includes('examen') || lowerMessage.includes('bilan')) {
    return generateExaminationResponse(patientName, analysis, patientData);
  } else {
    return generateContextualResponse(patientName, analysis, patientData);
  }
};

const generateSynthesisResponse = (patientName: string, analysis: any, patientData: any) => {
  let response = `**Synthèse médicale pour ${patientName}** 📋\n\n`;
  
  if (analysis.totalSymptoms > 0) {
    response += `**Tableau clinique identifié :**\n`;
    Object.entries(analysis.detectedSymptoms).forEach(([category, symptoms]) => {
      const categoryName = getCategoryDisplayName(category);
      response += `• ${categoryName}: ${(symptoms as string[]).join(', ')}\n`;
    });
    
    response += `\n**Ma recommandation :** Synthèse structurée avec focus sur `;
    if (analysis.priority === 'high') {
      response += `l'urgence clinique identifiée. ⚠️`;
    } else if (analysis.categories.length > 1) {
      response += `l'approche plurisystémique nécessaire.`;
    } else {
      response += `l'exploration ciblée des symptômes.`;
    }
  } else {
    response += `**Éléments cliniques :** Consultation de routine ou suivi.\n\n`;
    response += `**Ma recommandation :** Synthèse de suivi avec évaluation de l'évolution.`;
  }
  
  response += `\n\n**Prêt à générer :**\n✅ Synthèse structurée SOAP\n✅ Plan de prise en charge\n✅ Recommandations de suivi`;
  
  return response;
};

const generatePrescriptionResponse = (patientName: string, analysis: any, patientData: any) => {
  let response = `**Prescription thérapeutique pour ${patientName}** 💊\n\n`;
  
  if (analysis.detectedSymptoms.infectious) {
    response += `**Symptomatologie infectieuse détectée** 🦠\n`;
    response += `• Traitement symptomatique prioritaire\n`;
    response += `• Antibiothérapie à considérer selon contexte\n\n`;
  }
  
  if (analysis.detectedSymptoms.cardiovascular) {
    response += `**Signes cardiovasculaires** ❤️\n`;
    response += `• Prise en charge cardiologique urgente recommandée\n`;
    response += `• Bilan paraclinique nécessaire\n\n`;
  }
  
  if (analysis.detectedSymptoms.neurological) {
    response += `**Symptômes neurologiques** 🧠\n`;
    response += `• Évaluation neurologique spécialisée\n`;
    response += `• Imagerie cérébrale à envisager\n\n`;
  }
  
  response += `**Suggestions thérapeutiques personnalisées :**\n`;
  
  // Generate specific treatment suggestions based on symptoms
  if (analysis.detectedSymptoms.infectious?.includes('fièvre')) {
    response += `• **Antipyrétique :** Paracétamol 1g x3/j\n`;
  }
  if (analysis.detectedSymptoms.gastrointestinal?.includes('nausée')) {
    response += `• **Antiémétique :** Métoclopramide 10mg x3/j\n`;
  }
  if (analysis.detectedSymptoms.respiratory?.includes('toux')) {
    response += `• **Antitussif/Expectorant :** Selon type de toux\n`;
  }
  
  response += `\n**Prêt à prescrire :**\n✅ Ordonnance complète sécurisée\n✅ Posologies adaptées\n✅ Contre-indications vérifiées`;
  
  return response;
};

const generateDiagnosticResponse = (patientName: string, analysis: any, patientData: any) => {
  let response = `**Analyse diagnostique pour ${patientName}** 🔍\n\n`;
  
  if (analysis.priority === 'high') {
    response += `⚠️ **Signes d'alarme identifiés** - Évaluation urgente recommandée\n\n`;
  }
  
  response += `**Hypothèses diagnostiques par ordre de probabilité :**\n\n`;
  
  // Generate differential diagnosis based on symptom patterns
  if (analysis.detectedSymptoms.cardiovascular && analysis.detectedSymptoms.respiratory) {
    response += `**1. Insuffisance cardiaque aiguë** 🫀\n`;
    response += `• Dyspnée + œdème suggèrent une décompensation\n`;
    response += `• BNP, échographie cardiaque, radio thorax\n\n`;
    
    response += `**2. Embolie pulmonaire** 🫁\n`;
    response += `• Dyspnée + douleur thoracique\n`;
    response += `• Angio-scanner pulmonaire, D-dimères\n\n`;
  } else if (analysis.detectedSymptoms.infectious) {
    response += `**1. Syndrome infectieux** 🦠\n`;
    response += `• Fièvre + symptômes systémiques\n`;
    response += `• NFS, CRP, hémocultures si besoin\n\n`;
    
    if (analysis.detectedSymptoms.respiratory) {
      response += `**2. Pneumonie communautaire** 🫁\n`;
      response += `• Toux + fièvre + dyspnée\n`;
      response += `• Radiographie thoracique, ECBC\n\n`;
    }
  } else if (analysis.detectedSymptoms.neurological) {
    response += `**1. Céphalée primaire (migraine/tension)** 🧠\n`;
    response += `• Pattern typique de céphalée\n`;
    response += `• Examen neurologique, imagerie si atypique\n\n`;
    
    response += `**2. Hypertension intracrânienne** ⚠️\n`;
    response += `• Céphalée + signes associés\n`;
    response += `• IRM cérébrale urgente\n\n`;
  }
  
  response += `**Démarche diagnostique recommandée :**\n✅ Examen clinique ciblé\n✅ Examens paracliniques orientés\n✅ Réévaluation selon évolution`;
  
  return response;
};

const generateExaminationResponse = (patientName: string, analysis: any, patientData: any) => {
  let response = `**Bilan paraclinique pour ${patientName}** 🔬\n\n`;
  
  response += `**Examens prioritaires selon la clinique :**\n\n`;
  
  // Basic workup
  response += `**Bilan biologique de base** 🩸\n`;
  response += `• NFS plaquettes\n• Ionogramme, créatinine\n• CRP, VS\n\n`;
  
  // Specific examinations based on symptoms
  if (analysis.detectedSymptoms.cardiovascular) {
    response += `**Bilan cardiologique** ❤️\n`;
    response += `• ECG 12 dérivations\n• Troponine\n• BNP/NT-proBNP\n• Échographie cardiaque\n\n`;
  }
  
  if (analysis.detectedSymptoms.respiratory) {
    response += `**Bilan respiratoire** 🫁\n`;
    response += `• Radiographie thoracique\n• Gazométrie artérielle si dyspnée\n• D-dimères si suspicion EP\n\n`;
  }
  
  if (analysis.detectedSymptoms.infectious) {
    response += `**Bilan infectieux** 🦠\n`;
    response += `• Hémocultures x2\n• ECBU\n• Procalcitonine\n\n`;
  }
  
  if (analysis.detectedSymptoms.neurological) {
    response += `**Bilan neurologique** 🧠\n`;
    response += `• Scanner cérébral sans injection\n• IRM si signes de localisation\n• Ponction lombaire si méningisme\n\n`;
  }
  
  response += `**Surveillance clinique :**\n✅ Constantes vitales\n✅ Échelles de douleur\n✅ Réévaluation H+4-6h`;
  
  return response;
};

const generateContextualResponse = (patientName: string, analysis: any, patientData: any) => {
  let response = `**Analyse clinique pour ${patientName}** 🩺\n\n`;
  
  if (analysis.totalSymptoms === 0) {
    response += `**Consultation de routine** - Aucun symptôme aigu identifié.\n\n`;
    response += `**Je vous propose :**\n`;
    response += `✅ **Synthèse de suivi** - Évaluation de l'état général\n`;
    response += `✅ **Prescription préventive** - Renouvellement traitements\n`;
    response += `✅ **Certificat médical** - Si besoin administratif\n\n`;
  } else {
    response += `**Tableau clinique analysé** - ${analysis.totalSymptoms} symptôme(s) identifié(s)\n\n`;
    
    if (analysis.priority === 'high') {
      response += `⚠️ **Priorité élevée** - Prise en charge urgente recommandée\n\n`;
    }
    
    // Show detected symptom categories
    if (analysis.categories.length > 0) {
      response += `**Systèmes concernés :** ${analysis.categories.map((cat: string) => getCategoryDisplayName(cat)).join(', ')}\n\n`;
    }
    
    response += `**Actions recommandées par ordre de priorité :**\n\n`;
    
    if (analysis.priority === 'high') {
      response += `🚨 **1. Évaluation urgente** - Bilan paraclinique immédiat\n`;
      response += `📋 **2. Synthèse d'urgence** - Dossier de transfert si besoin\n`;
      response += `💊 **3. Traitement symptomatique** - Soulagement immédiat\n\n`;
    } else {
      response += `📋 **1. Synthèse médicale** - Analyse complète du tableau\n`;
      response += `🔍 **2. Diagnostic différentiel** - Hypothèses cliniques\n`;
      response += `💊 **3. Prescription adaptée** - Traitement symptomatique\n`;
      response += `📄 **4. Courrier spécialisé** - Si orientation nécessaire\n\n`;
    }
  }
  
  response += `**Prêt à vous assister - Que souhaitez-vous prioriser ?** 🤝`;
  
  return response;
};

const getCategoryDisplayName = (category: string): string => {
  const displayNames: {[key: string]: string} = {
    cardiovascular: 'Cardiovasculaire ❤️',
    respiratory: 'Respiratoire 🫁',
    neurological: 'Neurologique 🧠',
    gastrointestinal: 'Digestif 🟡',
    infectious: 'Infectieux 🦠',
    musculoskeletal: 'Ostéo-articulaire 🦴',
    dermatological: 'Dermatologique 🟠',
    genitourinary: 'Génito-urinaire 🔵',
    general: 'Général ⚪'
  };
  return displayNames[category] || category;
};

// helper to detect and create appointment
const tryHandleAppointmentCommand = async (message: string, consultation: ConsultationWithPatient) => {
  const lower = message.toLowerCase();
  if (!lower.includes("rendez") || !lower.includes("planifie")) return false;

  const parsed = chrono.fr.parse(message);
  if (!parsed || parsed.length === 0) return false;
  const dateObj = parsed[0].start.date();
  const isoDate = dateObj.toISOString().split("T")[0];
  const time = dateObj.toTimeString().slice(0,5);

  // extraire motif après "pour"
  let reason = "Consultation";
  const idx = lower.lastIndexOf("pour ");
  if (idx !== -1) {
    reason = message.slice(idx + 5).trim();
  }

  try {
    await apiRequest("POST", "/api/appointments", {
      patientId: consultation.patientId,
      date: isoDate,
      time,
      reason,
      doctorId: consultation.doctorId,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/appointments/upcoming"] });
    return { isoDate, time, reason };
  } catch {
    return false;
  }
};

export default function AiAssistant({ onViewSummary, onPatientSelected }: AiAssistantProps) {
  const [selectedConsultation, setSelectedConsultation] = useState<string | undefined>("");
  const [summaryType, setSummaryType] = useState<string>("consultation");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedSummary, setSelectedSummary] = useState<{
    content: string;
    patientName: string;
    consultationDate: string;
    type: string;
  } | null>(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const { toast } = useToast();
  
  // État pour les consultations chargées directement
  const [consultations, setConsultations] = useState<ConsultationWithPatient[]>([]);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
  
  // État pour le chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // État pour suivre le mode de fonctionnement (en ligne ou hors ligne)
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false); // Mode en ligne par défaut

  // Pagination pour les synthèses
  const pageSize = 5;
  const [page, setPage] = useState(0);

  // Patient sélectionné
  const selectedPatientId = consultations.find(c => c.id.toString() === selectedConsultation)?.patient.id;

  const [selectedPatient, setSelectedPatient] = useState<string | undefined>();

  const { data: patients } = useQuery<Patient[]>({ queryKey: ["/api/patients"] });

  // when patient selected fetch or create today's consultation
  useEffect(() => {
    (async () => {
      if (!selectedPatient) return;
      const today = new Date().toISOString().split("T")[0];
      // fetch existing
      const res = await fetch(`/api/consultations?patientId=${selectedPatient}`);
      if (res.ok) {
        const cons: ConsultationWithPatient[] = await res.json();
        const todayCons = cons.find(c => c.date === today);
        if (todayCons) {
          setSelectedConsultation(todayCons.id.toString());
          return;
        }
      }
      // create one
      const createRes = await apiRequest("POST", "/api/consultations", {
        patientId: parseInt(selectedPatient),
        doctorId: 1,
        date: today,
        time: new Date().toTimeString().slice(0,5),
        reason: "Consultation IA",
        status: "in-progress",
      });
      const newCons = await createRes.json();
      setSelectedConsultation(newCons.id.toString());
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
    })();
  }, [selectedPatient]);

  const { data: recentSummaries, isLoading: summariesLoading } = useQuery<AiSummaryWithDetails[]>({
    queryKey: ["/api/ai-summaries", selectedPatientId ?? "all"],
    queryFn: async () => {
      const url = selectedPatientId ? `/api/ai-summaries?patientId=${selectedPatientId}` : "/api/ai-summaries?limit=20";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur fetch summaries");
      return res.json();
    },
  });

  useEffect(() => { setPage(0); }, [selectedPatientId]);

  const paginatedSummaries = recentSummaries?.slice(page * pageSize, (page + 1) * pageSize);

  const totalPages = recentSummaries ? Math.ceil(recentSummaries.length / pageSize) : 0;

  // Charger les consultations directement
  useEffect(() => {
    async function loadConsultations() {
      setIsLoadingConsultations(true);
      try {
        const response = await fetch("/api/consultations");
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Consultations chargées:", data);
        setConsultations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erreur lors du chargement des consultations:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des consultations.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingConsultations(false);
      }
    }

    loadConsultations();
  }, [isPatientModalOpen, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateSummaryMutation = useMutation({
    mutationFn: async ({ consultationId, summaryType }: { consultationId: number, summaryType: string }) => {
      const response = await apiRequest("POST", "/api/ai-summaries/generate", {
        consultationId,
        summaryType
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Synthèse générée avec succès",
        description: "La synthèse IA a été créée et sauvegardée."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-summaries/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      // Show the generated summary
      if (selectedConsultation) {
        const consultation = consultations.find(c => c.id.toString() === selectedConsultation);
        if (consultation) {
          onViewSummary({
            content: data.content,
            patientName: `${consultation.patient.firstName} ${consultation.patient.lastName}`,
            consultationDate: new Date().toLocaleDateString('fr-FR'),
            type: summaryType
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur lors de la génération",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la génération de la synthèse.",
        variant: "destructive"
      });
    }
  });

  // Fonction pour rafraîchir les consultations
  const handleRefresh = () => {
    // Recharger les consultations
    async function loadConsultations() {
      setIsLoadingConsultations(true);
      try {
        const response = await fetch("/api/consultations");
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Consultations chargées:", data);
        setConsultations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erreur lors du chargement des consultations:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des consultations.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingConsultations(false);
      }
    }

    loadConsultations();
    // Réinitialiser la conversation
    clearConversation();
  };

  const handleGenerateSummary = (type: string = 'consultation') => {
    if (!selectedConsultation) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner une consultation.",
        variant: "destructive"
      });
      return;
    }

    generateSummaryMutation.mutate({
      consultationId: parseInt(selectedConsultation),
      summaryType: type
    });
  };

  const getSummaryTypeIcon = (type: string) => {
    switch (type) {
      case "consultation": return <FileText className="text-medical-blue" />;
      case "prescription": return <Pill className="text-medical-green" />;
      case "referral": return <Mail className="text-purple-600" />;
      default: return <FileText className="text-medical-blue" />;
    }
  };

  const getSummaryTypeLabel = (type: string) => {
    switch (type) {
      case "consultation": return "Synthèse de consultation";
      case "prescription": return "Prescription médicale";
      case "referral": return "Courrier de correspondance";
      default: return type;
    }
  };
  
  // Vérifier la connexion au serveur au chargement et régulièrement
  useEffect(() => {
    async function checkServerConnection() {
      const isServerAvailable = await checkApiStatus();
      
      if (isServerAvailable) {
        console.log("Connexion au serveur IA établie");
        setIsOfflineMode(false);
      } else {
        console.log("Serveur IA non disponible");
        // Ne pas basculer automatiquement en mode hors ligne, mais informer l'utilisateur
        if (!isOfflineMode) {
          toast({
            title: "Serveur IA non disponible",
            description: "Tentative de connexion au serveur IA échouée. Voulez-vous passer en mode hors-ligne?",
            action: (
              <Button 
                variant="outline" 
                onClick={() => setIsOfflineMode(true)}
                className="bg-white"
              >
                Passer en mode hors-ligne
              </Button>
            ),
            variant: "destructive"
          });
        }
      }
    }
    
    // Vérifier au chargement
    checkServerConnection();
    
    // Vérifier toutes les 30 secondes
    const intervalId = setInterval(checkServerConnection, 30000);
    
    // Nettoyer l'intervalle au démontage du composant
    return () => clearInterval(intervalId);
  }, [toast, isOfflineMode]);

  // Fonction pour utiliser le message de bienvenue généré localement
  const generateLocalWelcomeMessage = (consultation: ConsultationWithPatient, analysis: any) => {
    const patientName = `${consultation.patient.firstName} ${consultation.patient.lastName}`;
    
    // Fallback au message généré localement en cas d'erreur
    let welcomeContent = `**Bonjour Docteur** 👋\n\n`;
    welcomeContent += `**Dossier patient :** ${patientName}\n`;
    welcomeContent += `**Motif de consultation :** ${consultation.reason || 'Non spécifié'}\n\n`;
    
    if (analysis.totalSymptoms > 0) {
      welcomeContent += `**Éléments cliniques identifiés** 🔍\n`;
      Object.entries(analysis.detectedSymptoms).forEach(([category, symptoms]) => {
        welcomeContent += `• ${getCategoryDisplayName(category)}: ${(symptoms as string[]).join(', ')}\n`;
      });
      
      welcomeContent += `\n**Mes recommandations immédiates :**\n`;
      welcomeContent += `📋 **Synthèse structurée** avec analyse du tableau clinique\n`;
      welcomeContent += `💊 **Prescription ciblée** adaptée aux symptômes\n`;
      welcomeContent += `🔬 **Bilan paraclinique** selon les indications\n`;
    } else {
      welcomeContent += `**Consultation de routine** 📝\n\n`;
      welcomeContent += `**Je peux vous aider à :**\n`;
      welcomeContent += `📋 Générer une synthèse de suivi\n`;
      welcomeContent += `💊 Renouveler des prescriptions\n`;
      welcomeContent += `📄 Rédiger des certificats médicaux\n`;
    }
    
    welcomeContent += `\n\n**Prêt à vous assister** - Décrivez-moi les éléments cliniques ou indiquez-moi ce que vous souhaitez faire ! 🩺`;
    
    return welcomeContent;
  };

  // Fonction pour vérifier l'état du serveur API
  const checkApiStatus = async () => {
    try {
      const response = await fetch("/api/health");
      return response.ok;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'API:", error);
      return false;
    }
  };

  // Fonction pour appeler l'API d'IA
  const callAiApi = async (message: string, consultation: ConsultationWithPatient, messageHistory: any[] = []) => {
    try {
      const response = await fetch("/api/ai-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId: consultation.id,
          message,
          messageHistory
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Erreur lors de l'appel à l'API IA:", error);
      throw error; // La gestion de l'erreur est faite par l'appelant
    }
  };

  // Ajouter un message de bienvenue lorsqu'un patient est sélectionné
  useEffect(() => {
    if (selectedConsultation && messages.length === 0) {
      const consultation = consultations.find(c => c.id.toString() === selectedConsultation);
      
      if (consultation) {
        setIsProcessing(true);
        
        // Analyse locale pour l'UI
        const patientName = `${consultation.patient.firstName} ${consultation.patient.lastName}`;
        const analysisData = {
          reason: consultation.reason || '',
          diagnosis: consultation.diagnosis || '',
          notes: consultation.notes || ''
        };
        const combinedText = `${analysisData.reason} ${analysisData.diagnosis} ${analysisData.notes}`;
        const analysis = analyzeMedicalContent(combinedText, consultation);
        
        // Message de bienvenue pour l'API
        const welcomePrompt = `Bonjour, je suis le médecin traitant de ${patientName}. Pouvez-vous me donner un résumé de son dossier et m'aider avec cette consultation?`;
        
        // Appel à l'API d'IA réelle
        callAiApi(welcomePrompt, consultation).then(response => {
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            medicalContext: {
              symptoms: Object.values(analysis.detectedSymptoms).flat(),
              suggestedActions: ['synthesis', 'prescription', 'examination'],
              priority: analysis.priority
            }
          };
          
          setMessages([welcomeMessage]);
          setIsProcessing(false);
        }).catch(error => {
          console.error("Erreur lors de la génération du message de bienvenue:", error);
          toast({
            title: "Erreur de connexion",
            description: "Impossible de contacter le serveur IA. Vérifiez votre connexion.",
            variant: "destructive"
          });
          setIsProcessing(false);
        });
      }
    }
  }, [selectedConsultation, consultations]);

  // Fonctions pour le chat améliorées
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedConsultation) return;
    
    const consultation = consultations.find(c => c.id.toString() === selectedConsultation);
    if (!consultation) return;
    
    // Vérifier si la commande est une planification de RDV avant d'appeler l'IA
    const appointmentResult = await tryHandleAppointmentCommand(inputMessage, consultation);
    if (appointmentResult) {
      toast({
        title: "Rendez-vous planifié",
        description: `Le ${appointmentResult.isoDate} à ${appointmentResult.time} – ${appointmentResult.reason}`,
      });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Rendez-vous planifié le ${appointmentResult.isoDate} à ${appointmentResult.time} pour ${appointmentResult.reason}.`,
        timestamp: new Date(),
      }]);
      setIsProcessing(false);
      return;
    }

    // Analyze the medical content locally pour l'UI
    const analysis = analyzeMedicalContent(inputMessage, consultation);
    
    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      medicalContext: {
        symptoms: Object.values(analysis.detectedSymptoms).flat(),
        suggestedActions: [],
        priority: analysis.priority
      }
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);
    
    // Préparer l'historique des messages pour l'API
    const messageHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }));
    
    try {
      // Appel à l'API d'IA réelle
      const responseContent = await callAiApi(inputMessage, consultation, messageHistory);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        medicalContext: {
          symptoms: Object.values(analysis.detectedSymptoms).flat(),
          suggestedActions: ['synthesis', 'prescription', 'examination'],
          priority: analysis.priority
        }
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast({
        title: "Erreur de communication",
        description: "Impossible de contacter le serveur IA. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const clearConversation = () => {
    setMessages([]);
  };

  // Fonction pour basculer manuellement entre le mode en ligne et hors ligne
  const toggleOfflineMode = async () => {
    if (isOfflineMode) {
      // Si on passe du mode hors ligne au mode en ligne, vérifier la connexion au serveur
      const isServerAvailable = await checkApiStatus();
      
      if (isServerAvailable) {
        setIsOfflineMode(false);
        toast({
          title: "Mode en ligne activé",
          description: "Les réponses seront générées par le serveur IA",
          variant: "default"
        });
      } else {
        // Le serveur n'est pas disponible
        toast({
          title: "Serveur IA non disponible",
          description: "Impossible de passer en mode en ligne. Le serveur n'est pas accessible.",
          variant: "destructive"
        });
      }
    } else {
      // Passage du mode en ligne au mode hors ligne (toujours possible)
      setIsOfflineMode(true);
      toast({
        title: "Mode hors-ligne activé",
        description: "Les réponses seront générées localement",
        variant: "default"
      });
    }
  };

  // Affichage du mode hors ligne dans l'interface
  const renderOfflineModeBanner = () => {
    if (isOfflineMode) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <WifiOff className="h-5 w-5 text-amber-500" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Mode hors-ligne</h4>
              <p className="text-xs text-amber-600">
                L'assistant fonctionne actuellement en mode local. Les réponses sont générées sans connexion au serveur IA.
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={toggleOfflineMode}
            className="bg-white hover:bg-amber-50"
          >
            Activer mode en ligne
          </Button>
        </div>
      );
    } else {
      return (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-5 w-5 text-green-500" />
            <div>
              <h4 className="text-sm font-medium text-green-800">Mode en ligne</h4>
              <p className="text-xs text-green-600">
                L'assistant est connecté au serveur IA. Les réponses sont générées par l'API Claude.
              </p>
            </div>
          </div>
       
        </div>
      );
    }
  };

  const [showFloatingChat, setShowFloatingChat] = useState(false);

  return (
    <div className="space-y-6">
      {/* Assistant IA */}
      <div className="flex justify-center">
        {/* AI Assistant Panel with Chat Interface */}
        <Card className="border border-slate-00 h-full flex flex-col">
          <CardHeader className="px-6 py-4 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <Bot className="text-purple-600 mr-2 h-5 w-5" />
                Assistant IA Médical
              </h2>
              <div className="flex items-center space-x-2 ml-4 lg:ml-8">
                <Select value={selectedPatient ?? ''} onValueChange={v => setSelectedPatient(v)}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Sélectionnez un patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients?.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{`${p.firstName} ${p.lastName}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isProcessing}
                >
                  <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow flex flex-col">
            <div className="p-4 flex-grow overflow-y-auto max-h-[550px]">
              {renderOfflineModeBanner()}
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Bot className="h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    Assistant IA Médical
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mb-6">
                    Sélectionnez un patient pour commencer une consultation assistée par IA.
                    L'assistant analysera le dossier médical et vous aidera dans votre diagnostic.
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                    <Card className="p-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-medical-blue" />
                        <div className="text-left">
                          <h4 className="text-sm font-medium text-slate-800">Synthèse</h4>
                          <p className="text-xs text-slate-500">Générer un compte-rendu</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <Pill className="h-5 w-5 text-medical-green" />
                        <div className="text-left">
                          <h4 className="text-sm font-medium text-slate-800">Ordonnance</h4>
                          <p className="text-xs text-slate-500">Prescrire un traitement</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-lg p-4 ${
                          message.role === 'user' 
                            ? 'bg-medical-blue text-white' 
                            : 'bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center mb-2">
                            <Bot className="h-5 w-5 mr-2 text-purple-600" />
                            <span className="text-sm font-medium text-purple-600">Assistant IA</span>
                            {message.medicalContext?.priority && (
                              <Badge 
                                className={`ml-2 ${
                                  message.medicalContext.priority === 'high' 
                                    ? 'bg-red-100 text-red-800 hover:bg-red-100' 
                                    : message.medicalContext.priority === 'medium'
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' 
                                    : 'bg-green-100 text-green-800 hover:bg-green-100'
                                }`}
                              >
                                {message.medicalContext.priority === 'high' 
                                  ? 'Priorité haute' 
                                  : message.medicalContext.priority === 'medium'
                                  ? 'Priorité moyenne' 
                                  : 'Priorité basse'}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="space-y-3">
                          {message.content.split('\n').map((paragraph, i) => (
                            <p key={i} className="text-sm leading-relaxed">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                        {message.role === 'assistant' && message.medicalContext?.symptoms && message.medicalContext.symptoms.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-500 mb-2">Symptômes détectés:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.medicalContext.symptoms.map((symptom, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-slate-50">
                                  {symptom}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {message.role === 'assistant' && message.medicalContext?.suggestedActions && (
                          <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                            <p className="text-xs text-slate-500">Actions suggérées:</p>
                            <div className="flex space-x-1">
                              {message.medicalContext.suggestedActions.includes('synthesis') && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 text-xs text-medical-blue hover:text-blue-700"
                                  onClick={() => handleGenerateSummary('consultation')}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Synthèse
                                </Button>
                              )}
                              {message.medicalContext.suggestedActions.includes('prescription') && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 text-xs text-medical-green hover:text-green-700"
                                  onClick={() => handleGenerateSummary('prescription')}
                                >
                                  <Pill className="h-3 w-3 mr-1" />
                                  Ordonnance
                                </Button>
                              )}
                              {message.medicalContext.suggestedActions.includes('referral') && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 text-xs text-purple-600 hover:text-purple-700"
                                  onClick={() => handleGenerateSummary('referral')}
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  Courrier
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="mt-2 text-xs opacity-70 text-right">
                          {new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-4 bg-slate-100 text-slate-800 border border-slate-200">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-5 w-5 text-purple-600" />
                          <div className="flex space-x-1">
                            <span className="animate-bounce">•</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>•</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Décrivez les symptômes ou posez une question médicale..."
                  disabled={!selectedConsultation || isProcessing}
                  className="flex-grow resize-none min-h-[60px] max-h-40 overflow-auto"
                  onKeyDown={handleKeyPress}
                />
                <Button 
                  type="submit" 
                  disabled={!selectedConsultation || !inputMessage.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizonal className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
         
      {selectedSummary && (
        <AiSummaryModal
          isOpen={!!selectedSummary}
          summary={selectedSummary}
          onClose={() => setSelectedSummary(null)}
        />
      )}

      <PrescriptionFormModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
      />

      <AppointmentFormModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
      />

      <PatientFormModal
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          // Recharger les consultations après avoir ajouté un nouveau patient
          const loadConsultations = async () => {
            setIsLoadingConsultations(true);
            try {
              const response = await fetch("/api/consultations");
              if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
              }
              
              const data = await response.json();
              setConsultations(Array.isArray(data) ? data : []);
            } catch (error) {
              console.error("Erreur lors du rechargement des consultations:", error);
            } finally {
              setIsLoadingConsultations(false);
            }
          };
          loadConsultations();
        }}
        mode="create"
      />

      <MedicalCertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
      />

      {/* Floating Chat Bubble */}
      {showFloatingChat && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 w-80 max-h-96 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-slate-900">Assistant IA</span>
              </div>
              <button 
                onClick={() => setShowFloatingChat(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 flex-1 overflow-y-auto">
              <div className="bg-slate-100 rounded-lg p-3 text-sm">
                <p className="text-slate-700">
                  👋 Bonjour ! Je suis votre assistant IA médical. Comment puis-je vous aider aujourd'hui ?
                </p>
              </div>
            </div>
            <div className="p-3 border-t border-slate-200">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      {!showFloatingChat && (
        <button
          onClick={() => setShowFloatingChat(true)}
          className="fixed bottom-6 right-6 z-50 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-200 hover:scale-110 cursor-pointer"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
