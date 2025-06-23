import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "../components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Plus, X, Award, FileText, Calendar, Download, Printer } from "lucide-react";
import { generatePDF, printDocument, downloadAsText, DocumentData } from "../utils/pdf-generator";
import { AiSummaryWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import SearchBar from "../components/ui/search-bar";
import DateRangePicker from "../components/ui/date-range-picker";
import FloatingChatButton from "../components/floating-chat-button";

const pageSize = 6;

function ViewModal({ cert, onClose }: { cert: AiSummaryWithDetails; onClose: () => void }) {
  const { toast } = useToast();

  const createDocumentData = (cert: AiSummaryWithDetails): DocumentData => ({
    type: 'certificate',
    content: cert.content,
    patientName: cert.patient ? `${cert.patient.firstName} ${cert.patient.lastName}` : 'Patient inconnu',
    date: cert.generatedAt ? format(new Date(cert.generatedAt), 'dd/MM/yyyy', { locale: fr }) : new Date().toLocaleDateString('fr-FR'),
    doctorName: 'Dr. Médecin',
    clinicInfo: {
      name: 'Cabinet Médical AI',
      address: '123 Rue de la Santé, 75000 Paris',
      phone: '01 23 45 67 89',
      email: 'contact@cabinet-medical-ai.fr'
    }
  });

  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Génération en cours...",
        description: "Création du fichier PDF, veuillez patienter.",
      });
      
      const success = await generatePDF(createDocumentData(cert));
      if (success) {
        toast({
          title: "PDF téléchargé",
          description: "Le certificat PDF a été téléchargé avec succès.",
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

  const handlePrint = () => {
    try {
      printDocument(createDocumentData(cert));
      toast({
        title: "Impression lancée",
        description: "La fenêtre d'impression va s'ouvrir.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'impression",
        description: "Impossible d'imprimer le certificat.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Certificat Médical</h2>
                <p className="text-amber-100">{cert.patient?.firstName} {cert.patient?.lastName}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center text-amber-800 mb-2">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="font-medium">Date de génération</span>
            </div>
            <p className="text-amber-900 font-semibold">
              {cert.generatedAt ? format(new Date(cert.generatedAt), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'Date inconnue'}
            </p>
          </div>
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-6 border border-slate-200">
              {cert.content}
            </div>
          </div>
          
          {/* Footer avec boutons d'action */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-6">
            <div className="flex gap-3">
              <Button 
                onClick={handleDownloadPDF}
                variant="outline"
                className="rounded-xl border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
              <Button 
                onClick={handlePrint}
                variant="outline"
                className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
            <Button 
              onClick={onClose} 
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:opacity-90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ cert, onClose, onSave }: { cert: AiSummaryWithDetails; onClose: () => void; onSave: (content: string) => void }) {
  const [content, setContent] = useState(cert.content);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Edit className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Modifier le Certificat</h2>
                <p className="text-blue-100">{cert.patient?.firstName} {cert.patient?.lastName}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Contenu du certificat..."
          />
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={() => onSave(content)} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Certificates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const [viewCert, setViewCert] = useState<AiSummaryWithDetails | null>(null);
  const [editCert, setEditCert] = useState<AiSummaryWithDetails | null>(null);

  // Fonctions pour les actions sur les documents
  const createDocumentData = (cert: AiSummaryWithDetails): DocumentData => ({
    type: 'certificate',
    content: cert.content,
    patientName: cert.patient ? `${cert.patient.firstName} ${cert.patient.lastName}` : 'Patient inconnu',
    date: cert.generatedAt ? format(new Date(cert.generatedAt), 'dd/MM/yyyy', { locale: fr }) : new Date().toLocaleDateString('fr-FR'),
    doctorName: 'Dr. Médecin',
    clinicInfo: {
      name: 'Cabinet Médical AI',
      address: '123 Rue de la Santé, 75000 Paris',
      phone: '01 23 45 67 89',
      email: 'contact@cabinet-medical-ai.fr'
    }
  });

  const handleDownloadPDF = async (cert: AiSummaryWithDetails) => {
    try {
      toast({
        title: "Génération en cours...",
        description: "Création du fichier PDF, veuillez patienter.",
      });
      
      const success = await generatePDF(createDocumentData(cert));
      if (success) {
        toast({
          title: "PDF téléchargé",
          description: "Le certificat PDF a été téléchargé avec succès.",
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

  const handlePrint = (cert: AiSummaryWithDetails) => {
    try {
      printDocument(createDocumentData(cert));
      toast({
        title: "Impression lancée",
        description: "La fenêtre d'impression va s'ouvrir.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'impression",
        description: "Impossible d'imprimer le certificat.",
        variant: "destructive",
      });
    }
  };

  const { data, isLoading } = useQuery<AiSummaryWithDetails[]>({
    queryKey: ["/api/ai-summaries"],
    select: (data) => data?.filter(item => item.type === 'certificate') || []
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      await apiRequest("PATCH", `/api/ai-summaries/${id}`, { content });
    },
    onSuccess: () => {
      toast({ title: "Certificat modifié avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-summaries"] });
      setEditCert(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ai-summaries/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Certificat supprimé avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-summaries"] });
    },
  });

  const filtered = data?.filter(cert => {
    const patientName = cert.patient ? `${cert.patient.firstName} ${cert.patient.lastName}`.toLowerCase() : "";
    const matchesText = patientName.includes(searchTerm.toLowerCase()) || cert.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre de date amélioré
    let inDate = true;
    if (startDate || endDate) {
      if (cert.generatedAt) {
        // Convertir le timestamp PostgreSQL en date YYYY-MM-DD
        const certDate = new Date(cert.generatedAt);
        const generated = certDate.toISOString().split("T")[0];
        
        if (startDate && endDate) {
          inDate = generated >= startDate && generated <= endDate;
        } else if (startDate) {
          inDate = generated >= startDate;
        } else if (endDate) {
          inDate = generated <= endDate;
        }
      } else {
        // Si pas de date de génération et qu'un filtre de date est actif, exclure
        inDate = false;
      }
    }
    
    return matchesText && inDate;
  }) || [];

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-12 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="border border-slate-200 rounded-2xl">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <Award className="h-8 w-8 mr-3 text-amber-200" />
                  Certificats Médicaux
                </h1>
                <p className="text-amber-100 text-lg">
                  {data?.length || 0} certificat{(data?.length || 0) > 1 ? 's' : ''} généré{(data?.length || 0) > 1 ? 's' : ''}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center text-amber-100">
                    <FileText className="h-5 w-5 mr-2" />
                    <span className="font-medium">Documents officiels</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 mb-8">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_auto]">
            <SearchBar 
              placeholder="Rechercher par patient ou contenu..." 
              onSearch={setSearchTerm} 
              className="w-full rounded-xl border-slate-200 focus:ring-amber-500 focus:border-amber-500" 
            />
            <DateRangePicker 
              start={startDate} 
              end={endDate} 
              onStart={setStartDate} 
              onEnd={setEndDate} 
              className="w-full lg:w-auto rounded-xl" 
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-slate-50 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm ? "Aucun certificat trouvé" : "Aucun certificat généré"}
              </h3>
              <p className="text-slate-600">
                {searchTerm ? "Essayez de modifier votre recherche" : "Les certificats générés par l'IA apparaîtront ici"}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((cert) => (
                <Card key={cert.id} className="group hover:shadow-xl transition-all duration-300 border border-slate-200/50 rounded-2xl overflow-hidden bg-white hover:-translate-y-1">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50/50 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-slate-900 group-hover:text-amber-600 transition-colors">
                            {cert.patient?.firstName} {cert.patient?.lastName}
                          </CardTitle>
                          <CardDescription className="text-slate-600">
                            Certificat médical
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                        <div className="flex items-center text-amber-700 mb-2">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">Généré le</span>
                        </div>
                        <p className="text-amber-900 font-semibold">
                          {cert.generatedAt ? format(new Date(cert.generatedAt), 'dd MMM yyyy à HH:mm', { locale: fr }) : 'Date inconnue'}
                        </p>
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {cert.content}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewCert(cert)}
                            className="flex-1 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all duration-200"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditCert(cert)}
                            className="flex-1 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(cert)}
                            className="flex-1 rounded-xl border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrint(cert)}
                            className="flex-1 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(cert.id)}
                            className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
          </>
        )}

        {viewCert && <ViewModal cert={viewCert} onClose={() => setViewCert(null)} />}
        {editCert && (
          <EditModal cert={editCert} onClose={() => setEditCert(null)} onSave={(content) => patchMutation.mutate({id: editCert.id, content})} />
        )}

        {/* Floating Chat */}
        <FloatingChatButton
          gradientColors="from-amber-600 to-orange-600"
          focusColor="amber-500"
          shadowColor="amber-500/25"
        />
      </div>
    </div>
  );
} 