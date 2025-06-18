import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot, Wand2, FileText, Pill, Mail, Eye, Download, Share, Trash2, Filter } from "lucide-react";
import Header from "@/components/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AiSummaryModal from "@/components/ai-summary-modal";
import type { ConsultationWithPatient, AiSummaryWithDetails } from "@shared/schema";

export default function AiAssistant() {
  const [selectedConsultation, setSelectedConsultation] = useState<string>("");
  const [summaryType, setSummaryType] = useState<string>("consultation");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedSummary, setSelectedSummary] = useState<{
    content: string;
    patientName: string;
    consultationDate: string;
    type: string;
  } | null>(null);
  const { toast } = useToast();

  const { data: consultations, isLoading: consultationsLoading } = useQuery<ConsultationWithPatient[]>({
    queryKey: ["/api/consultations/today"],
  });

  const { data: allSummaries, isLoading: summariesLoading } = useQuery<AiSummaryWithDetails[]>({
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
      
      if (selectedConsultation) {
        const consultation = consultations?.find(c => c.id.toString() === selectedConsultation);
        if (consultation) {
          setSelectedSummary({
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
      case "consultation": return <FileText className="text-medical-blue h-5 w-5" />;
      case "prescription": return <Pill className="text-medical-green h-5 w-5" />;
      case "referral": return <Mail className="text-purple-600 h-5 w-5" />;
      default: return <FileText className="text-medical-blue h-5 w-5" />;
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

  const getSummaryTypeBadge = (type: string) => {
    const config = {
      consultation: "bg-medical-blue text-white",
      prescription: "bg-medical-green text-white",
      referral: "bg-purple-600 text-white"
    };
    return config[type as keyof typeof config] || "bg-slate-400 text-white";
  };

  const filteredSummaries = allSummaries?.filter(summary => 
    typeFilter === "all" || summary.type === typeFilter
  );

  const handleViewSummary = (summary: AiSummaryWithDetails) => {
    setSelectedSummary({
      content: summary.content,
      patientName: `${summary.patient.firstName} ${summary.patient.lastName}`,
      consultationDate: new Date(summary.generatedAt!).toLocaleDateString('fr-FR'),
      type: summary.type
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Bot className="text-purple-600 mr-3" />
            Assistant IA Médical
          </h1>
          <p className="text-slate-600 mt-1">
            Générez automatiquement des synthèses, prescriptions et courriers médicaux
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Panel */}
          <div className="space-y-6">
            <Card className="border border-slate-200">
              <CardHeader className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  Générer une Synthèse IA
                </h2>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">
                      Sélectionner un patient
                    </Label>
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
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">
                      Type de document à générer
                    </Label>
                    <RadioGroup value={summaryType} onValueChange={setSummaryType} className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                        <RadioGroupItem value="consultation" id="consultation" />
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-medical-blue" />
                          <Label htmlFor="consultation" className="text-sm font-medium cursor-pointer">
                            Synthèse de consultation
                          </Label>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                        <RadioGroupItem value="prescription" id="prescription" />
                        <div className="flex items-center space-x-2">
                          <Pill className="h-4 w-4 text-medical-green" />
                          <Label htmlFor="prescription" className="text-sm font-medium cursor-pointer">
                            Prescription médicale
                          </Label>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                        <RadioGroupItem value="referral" id="referral" />
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-purple-600" />
                          <Label htmlFor="referral" className="text-sm font-medium cursor-pointer">
                            Courrier de correspondance
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <Button 
                    onClick={handleGenerateSummary}
                    disabled={generateSummaryMutation.isPending || !selectedConsultation}
                    className="w-full bg-purple-600 text-white hover:bg-purple-700"
                    size="lg"
                  >
                    {generateSummaryMutation.isPending ? (
                      <>
                        <Bot className="h-4 w-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
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
          </div>

          {/* Summaries History */}
          <div className="space-y-6">
            <Card className="border border-slate-200">
              <CardHeader className="px-6 py-4 border-b border-slate-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Historique des Synthèses
                  </h2>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="consultation">Synthèses</SelectItem>
                      <SelectItem value="prescription">Prescriptions</SelectItem>
                      <SelectItem value="referral">Courriers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {summariesLoading ? (
                    <div className="p-4 space-y-4">
                      {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <Skeleton className="h-5 w-5 mt-1" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : filteredSummaries && filteredSummaries.length > 0 ? (
                    <div className="divide-y divide-slate-200">
                      {filteredSummaries.map((summary) => (
                        <div key={summary.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between space-x-3">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 mt-1">
                                {getSummaryTypeIcon(summary.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-medium text-slate-900">
                                    {summary.patient.firstName} {summary.patient.lastName}
                                  </p>
                                  <Badge className={`text-xs ${getSummaryTypeBadge(summary.type)}`}>
                                    {getSummaryTypeLabel(summary.type)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">
                                  {new Date(summary.generatedAt!).toLocaleDateString('fr-FR')} à {new Date(summary.generatedAt!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-xs text-slate-400 line-clamp-2">
                                  {summary.content.substring(0, 120)}...
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewSummary(summary)}
                                className="text-medical-blue hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-500 hover:text-slate-700"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-500 hover:text-slate-700"
                              >
                                <Share className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-sm font-medium text-slate-900 mb-2">
                        {typeFilter === "all" ? "Aucune synthèse générée" : "Aucune synthèse de ce type"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {typeFilter === "all" 
                          ? "Commencez par générer votre première synthèse IA"
                          : "Modifiez le filtre ou générez un nouveau document"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {selectedSummary && (
        <AiSummaryModal
          summary={selectedSummary}
          onClose={() => setSelectedSummary(null)}
        />
      )}
    </div>
  );
}