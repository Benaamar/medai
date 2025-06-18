import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot, Eye, Wand2, FileText, Pill, Mail, Calendar, UserPlus, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AiSummaryModal from "@/components/ai-summary-modal";
import PrescriptionFormModal from "@/components/prescription-form-modal";
import AppointmentFormModal from "@/components/appointment-form-modal";
import PatientFormModal from "@/components/patient-form-modal";
import MedicalCertificateModal from "@/components/medical-certificate-modal";
import type { ConsultationWithPatient, AiSummaryWithDetails } from "@shared/schema";

interface AiAssistantProps {
  onViewSummary: (summary: {
    content: string;
    patientName: string;
    consultationDate: string;
    type: string;
  }) => void;
}

export default function AiAssistant({ onViewSummary }: AiAssistantProps) {
  const [selectedConsultation, setSelectedConsultation] = useState<string>("");
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

  const { data: consultations, isLoading: consultationsLoading } = useQuery<ConsultationWithPatient[]>({
    queryKey: ["/api/consultations/today"],
  });

  const { data: recentSummaries, isLoading: summariesLoading } = useQuery<AiSummaryWithDetails[]>({
    queryKey: ["/api/ai-summaries/recent"],
  });

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
        const consultation = consultations?.find(c => c.id.toString() === selectedConsultation);
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

  const handleGenerateSummary = () => {
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
      summaryType
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
      case "prescription": return "Pill";
      case "referral": return "Courrier";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Assistant Panel */}
      <Card className="border border-slate-200">
        <CardHeader className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center">
            <Bot className="text-purple-600 mr-2" />
            Assistant IA Médical
          </h2>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">Sélectionner un patient</Label>
              <Select value={selectedConsultation} onValueChange={setSelectedConsultation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un patient..." />
                </SelectTrigger>
                <SelectContent>
                  {consultationsLoading ? (
                    <div className="p-2">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : consultations?.map((consultation) => (
                    <SelectItem key={consultation.id} value={consultation.id.toString()}>
                      {consultation.patient.firstName} {consultation.patient.lastName} - {consultation.reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">Type de synthèse</Label>
              <RadioGroup value={summaryType} onValueChange={setSummaryType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="consultation" id="consultation" />
                  <Label htmlFor="consultation" className="text-sm text-slate-700">Synthèse de consultation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="prescription" id="prescription" />
                  <Label htmlFor="prescription" className="text-sm text-slate-700">Pill médicale</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="referral" id="referral" />
                  <Label htmlFor="referral" className="text-sm text-slate-700">Courrier de correspondance</Label>
                </div>
              </RadioGroup>
            </div>
            
            <Button 
              onClick={handleGenerateSummary}
              disabled={generateSummaryMutation.isPending || !selectedConsultation}
              className="w-full bg-purple-600 text-white hover:bg-purple-700"
            >
              {generateSummaryMutation.isPending ? (
                <>Génération en cours...</>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Générer avec IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent AI Summaries */}
      <Card className="border border-slate-200">
        <CardHeader className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-md font-semibold text-slate-900">Synthèses Récentes</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {summariesLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-4 w-4 mt-1" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))
            ) : recentSummaries && recentSummaries.length > 0 ? (
              recentSummaries.map((summary) => (
                <div key={summary.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getSummaryTypeIcon(summary.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {summary.patient.firstName} {summary.patient.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getSummaryTypeLabel(summary.type)} - {new Date(summary.generatedAt!).toLocaleDateString('fr-FR')} {new Date(summary.generatedAt!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {summary.content.substring(0, 80)}...
                      </p>
                    </div>
                    <button 
                      onClick={() => onViewSummary({
                        content: summary.content,
                        patientName: `${summary.patient.firstName} ${summary.patient.lastName}`,
                        consultationDate: new Date(summary.generatedAt!).toLocaleDateString('fr-FR'),
                        type: summary.type
                      })}
                      className="text-medical-blue hover:text-blue-700 text-xs"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500">
                <p className="text-sm">Aucune synthèse générée</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-slate-200">
        <CardHeader className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-md font-semibold text-slate-900">Actions Rapides</h3>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-700 hover:bg-slate-50"
            onClick={() => setIsPrescriptionModalOpen(true)}
          >
            <Pill className="text-medical-green mr-3 h-4 w-4" />
            Nouvelle ordonnance
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-700 hover:bg-slate-50"
            onClick={() => setIsAppointmentModalOpen(true)}
          >
            <Calendar className="text-medical-blue mr-3 h-4 w-4" />
            Planifier RDV
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-700 hover:bg-slate-50"
            onClick={() => setIsPatientModalOpen(true)}
          >
            <UserPlus className="text-purple-600 mr-3 h-4 w-4" />
            Nouveau patient
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-700 hover:bg-slate-50"
            onClick={() => setIsCertificateModalOpen(true)}
          >
            <FileCheck className="text-medical-amber mr-3 h-4 w-4" />
            Certificat médical
          </Button>
        </CardContent>
      </Card>

      {selectedSummary && (
        <AiSummaryModal
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
        onClose={() => setIsPatientModalOpen(false)}
        mode="create"
      />

      <MedicalCertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
      />
    </div>
  );
}
