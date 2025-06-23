import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Calendar, Clock, User, FileText, Filter, Search, Edit, Trash2, ChevronLeft, ChevronRight, Stethoscope, Activity, Download, Printer } from "lucide-react";
import { generatePDF, printDocument, downloadAsText, DocumentData } from "../utils/pdf-generator";
import Header from "../components/header";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import ConsultationFormModal from "../components/consultation-form-modal";
import type { ConsultationWithPatient } from "@shared/schema";
import SearchBar from "../components/ui/search-bar";
import DateRangePicker from "../components/ui/date-range-picker";
import PatientFormModal from "../components/patient-form-modal";
import PatientDetailsModal from "../components/patient-details-modal";
import AiSummaryModal from "../components/ai-summary-modal";
import FloatingChatButton from "../components/floating-chat-button";

export default function Consultations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationWithPatient | undefined>(undefined);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const { toast } = useToast();
  const pageSize = 3;
  const [page, setPage] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [summary, setSummary] = useState<{content:string;patientName:string;consultationDate:string;type:string;patientId?:number}|null>(null);

  // Fonctions pour les actions sur les documents
  const createDocumentData = (consultation: ConsultationWithPatient): DocumentData => ({
    type: 'consultation',
    content: `SYNTHÈSE DE CONSULTATION

Patient: ${consultation.patient.firstName} ${consultation.patient.lastName}
Date: ${new Date(consultation.date).toLocaleDateString('fr-FR')}
Heure: ${consultation.time}

MOTIF DE CONSULTATION:
${consultation.reason}

DIAGNOSTIC:
${consultation.diagnosis || 'Non renseigné'}

TRAITEMENT PRESCRIT:
${consultation.treatment || 'Non renseigné'}

NOTES COMPLÉMENTAIRES:
${consultation.notes || 'Aucune note complémentaire'}

STATUT: ${consultation.status === 'completed' ? 'Terminé' : consultation.status === 'in-progress' ? 'En cours' : 'Planifié'}`,
    patientName: `${consultation.patient.firstName} ${consultation.patient.lastName}`,
    date: new Date(consultation.date).toLocaleDateString('fr-FR'),
    doctorName: 'Dr. Médecin',
    clinicInfo: {
      name: 'Cabinet Médical AI',
      address: '123 Rue de la Santé, 75000 Paris',
      phone: '01 23 45 67 89',
      email: 'contact@cabinet-medical-ai.fr'
    }
  });

  const handleDownloadPDF = async (consultation: ConsultationWithPatient) => {
    try {
      toast({
        title: "Génération en cours...",
        description: "Création du fichier PDF, veuillez patienter.",
      });
      
      const success = await generatePDF(createDocumentData(consultation));
      if (success) {
        toast({
          title: "PDF téléchargé",
          description: "La synthèse PDF a été téléchargée avec succès.",
        });
      } else {
        throw new Error("Échec de la génération PDF");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = (consultation: ConsultationWithPatient) => {
    try {
      printDocument(createDocumentData(consultation));
      toast({
        title: "Impression lancée",
        description: "La fenêtre d'impression va s'ouvrir.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'impression",
        description: "Impossible d'imprimer la synthèse.",
        variant: "destructive",
      });
    }
  };

  const { data: consultations, isLoading } = useQuery<ConsultationWithPatient[]>({
    queryKey: ["/api/consultations"],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Terminé", className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg" },
      "in-progress": { label: "En cours", className: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg" },
      scheduled: { label: "En attente", className: "bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg" },
      cancelled: { label: "Annulé", className: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge className={`${config.className} text-xs px-3 py-1 rounded-full`}>{config.label}</Badge>;
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const filteredConsultations = consultations?.filter(consultation => {
    const matchesSearch = `${consultation.patient.firstName} ${consultation.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || consultation.status === statusFilter;
    
    let inDate = true;
    if (startDate || endDate) {
      if (consultation.date) {
        const consultationDate = consultation.date.includes('T') 
          ? new Date(consultation.date).toISOString().split("T")[0]
          : consultation.date.split(' ')[0];
        inDate = (!startDate || consultationDate >= startDate) && (!endDate || consultationDate <= endDate);
      } else {
        inDate = false;
      }
    }
    
    return matchesSearch && matchesStatus && inDate;
  });

  const totalPages = filteredConsultations ? Math.ceil(filteredConsultations.length / pageSize) : 0;
  const paginated = filteredConsultations?.slice(page * pageSize, (page + 1) * pageSize);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/consultations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Consultation supprimée",
        description: "La consultation a été supprimée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la consultation.",
        variant: "destructive",
      });
    },
  });

  const handleCreateConsultation = () => {
    setSelectedConsultation(undefined);
    setFormMode("create");
    setIsFormOpen(true);
  };

  const handleEditConsultation = (consultation: ConsultationWithPatient) => {
    setSelectedConsultation(consultation);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleViewDetails = (consultation: ConsultationWithPatient) => {
    setSelectedConsultation(consultation);
    setDetailsOpen(true);
  };

  const handleStartConsultation = async (consultation: ConsultationWithPatient) => {
    await apiRequest("PATCH", `/api/consultations/${consultation.id}`, { status: "in-progress" });
    queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
    handleEditConsultation({ ...consultation, status: "in-progress" });
  };

  const handleContinueConsultation = (consultation: ConsultationWithPatient) => {
    handleEditConsultation(consultation);
  };

  const handleViewSummary = (consultation: ConsultationWithPatient) => {
    (async () => {
      try {
        const res = await fetch(`/api/ai-summaries?patientId=${consultation.patientId}`);
        if (!res.ok) return;
        const summaries: any[] = await res.json();
        const latest = summaries.find(s=>s.consultationId === consultation.id);
        if(latest){
          setSummary({
            content: latest.content,
            patientName: `${consultation.patient.firstName} ${consultation.patient.lastName}`,
            consultationDate: new Date(consultation.date).toLocaleDateString('fr-FR'),
            type: latest.type,
            patientId: consultation.patientId
          });
        } else {
          toast({
            title: "Résumé introuvable",
            description: "Aucun résumé IA n'a encore été généré pour cette consultation.",
            variant: "destructive"
          });
        }
      }catch(e){console.error(e);}
    })();
  };

  const handleDeleteConsultation = (consultation: ConsultationWithPatient) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la consultation de ${consultation.patient.firstName} ${consultation.patient.lastName} ?`)) {
      deleteMutation.mutate(consultation.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-12 w-48" />
          </div>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Card key={i} className="border border-slate-200 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <Stethoscope className="h-8 w-8 mr-3 text-teal-200" />
                  Gestion des Consultations
                </h1>
                <p className="text-teal-100 text-lg">
                  {consultations?.length || 0} consultation{(consultations?.length || 0) > 1 ? 's' : ''} enregistrée{(consultations?.length || 0) > 1 ? 's' : ''}
                </p>
              </div>
              <Button 
                onClick={handleCreateConsultation}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouvelle Consultation
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 mb-8">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_auto_auto]">
            <SearchBar 
              placeholder="Rechercher par patient ou motif..." 
              onSearch={setSearchTerm} 
              className="w-full rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-500" 
            />
            <DateRangePicker 
              start={startDate} 
              end={endDate} 
              onStart={setStartDate} 
              onEnd={setEndDate} 
              className="w-full lg:w-auto rounded-xl" 
            />
            <div className="flex justify-end">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 rounded-xl border-slate-200">
                  <Filter className="h-4 w-4 mr-2 text-teal-600" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="scheduled">En attente</SelectItem>
                  <SelectItem value="in-progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {paginated && paginated.length > 0 ? (
            paginated.map((consultation) => {
              const initials = `${consultation.patient.firstName[0]}${consultation.patient.lastName[0]}`.toUpperCase();
              const age = calculateAge(consultation.patient.birthDate);
              
              return (
                <Card key={consultation.id} className="group border border-slate-200/50 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {initials}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                            <Activity className="h-3 w-3 text-teal-600" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-bold text-xl text-slate-900 group-hover:text-teal-600 transition-colors">
                            {consultation.patient.firstName} {consultation.patient.lastName}
                          </h3>
                          <div className="flex items-center space-x-6 text-sm text-slate-600">
                            <div className="flex items-center bg-slate-50 rounded-lg px-3 py-1">
                              <User className="h-4 w-4 mr-2 text-teal-500" />
                              {age} ans
                            </div>
                            <div className="flex items-center bg-slate-50 rounded-lg px-3 py-1">
                              <Clock className="h-4 w-4 mr-2 text-teal-500" />
                              {consultation.time}
                            </div>
                            <div className="flex items-center bg-slate-50 rounded-lg px-3 py-1">
                              <Calendar className="h-4 w-4 mr-2 text-teal-500" />
                              {new Date(consultation.date).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-3 border-l-4 border-teal-500">
                            <p className="text-sm font-medium text-slate-900 mb-1">Motif de consultation</p>
                            <p className="text-slate-700">{consultation.reason}</p>
                          </div>
                          {consultation.notes && (
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-xs text-slate-600 line-clamp-2">{consultation.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right space-y-3">
                          {getStatusBadge(consultation.status)}
                          {consultation.diagnosis && (
                            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                              <p className="text-xs font-medium text-blue-900 mb-1">Diagnostic</p>
                              <p className="text-xs text-blue-700">{consultation.diagnosis}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={()=>handleViewDetails(consultation)}
                            className="rounded-lg border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition-all duration-200 text-xs px-2 py-1"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Détails
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditConsultation(consultation)}
                            className="rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-xs px-2 py-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadPDF(consultation)}
                            className="rounded-lg border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-xs px-2 py-1"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            PDF
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePrint(consultation)}
                            className="rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 text-xs px-2 py-1"
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Imprimer
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteConsultation(consultation)}
                            className="rounded-lg border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-xs px-2 py-1"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Supprimer
                          </Button>
                          {consultation.status === "scheduled" && (
                            <Button 
                              size="sm" 
                              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-xs px-2 py-1" 
                              onClick={()=>handleStartConsultation(consultation)}
                            >
                              Commencer
                            </Button>
                          )}
                          {consultation.status === "in-progress" && (
                            <Button 
                              size="sm" 
                              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-xs px-2 py-1" 
                              onClick={()=>handleContinueConsultation(consultation)}
                            >
                              Continuer
                            </Button>
                          )}
                          {consultation.status === "completed" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={()=>handleViewSummary(consultation)}
                              className="rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 text-xs px-2 py-1"
                            >
                              Voir résumé
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-16">
              <div className="bg-slate-50 rounded-2xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {searchTerm || statusFilter !== "all" ? "Aucune consultation trouvée" : "Aucune consultation programmée"}
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchTerm || statusFilter !== "all" 
                    ? "Essayez de modifier vos critères de recherche"
                    : "Commencez par programmer une nouvelle consultation"
                  }
                </p>
                <Button 
                  onClick={handleCreateConsultation}
                  className="bg-teal-600 hover:bg-teal-700 rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Consultation
                </Button>
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center py-8">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 px-6 py-3">
              <div className="flex items-center space-x-4">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-xl hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-slate-700 px-4">
                  Page {page + 1} sur {totalPages}
                </span>
                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-xl hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <ConsultationFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          consultation={selectedConsultation}
          mode={formMode}
        />

        {detailsOpen && selectedConsultation && (
          <PatientDetailsModal isOpen={detailsOpen} onClose={()=>setDetailsOpen(false)} patientId={selectedConsultation.patient.id} patientName={`${selectedConsultation.patient.firstName} ${selectedConsultation.patient.lastName}`}/>
        )}

        {summary && (
          <AiSummaryModal isOpen={!!summary} summary={summary} onClose={()=>setSummary(null)} />
        )}
      </div>

      {/* Floating Chat */}
      <FloatingChatButton
        gradientColors="from-teal-600 to-cyan-600"
        focusColor="teal-500"
        shadowColor="teal-500/25"
      />
    </div>
  );
}