import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { AiSummaryWithDetails } from "@shared/schema";
import { FileText, Mail, Download, Printer, Eye } from "lucide-react";
import { RxPaperPlane, RxCheckCircled } from "react-icons/rx";
import AiSummaryModal from "./ai-summary-modal";
import { generatePDF, printDocument, downloadAsText, DocumentData } from "../utils/pdf-generator";
import { useToast } from "../hooks/use-toast";

interface PatientDetailsModalProps {
  patientId: number;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case "certificate":
      return <RxCheckCircled className="text-medical-amber" />;
    case "prescription":
      return <RxPaperPlane className="text-medical-green" />;
    case "referral":
      return <Mail className="text-purple-600" />;
    default:
      return <FileText className="text-medical-blue" />;
  }
};

export default function PatientDetailsModal({ patientId, patientName, isOpen, onClose }: PatientDetailsModalProps) {
  const [tab, setTab] = useState("all");
  const { toast } = useToast();

  const { data: summaries, isLoading } = useQuery<AiSummaryWithDetails[]>({
    queryKey: ["/api/ai-summaries", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/ai-summaries?patientId=${patientId}`);
      if (!res.ok) throw new Error("Erreur fetch summaries");
      return res.json();
    },
    enabled: isOpen,
  });

  const filtered = tab === "all" ? summaries : summaries?.filter(s => s.type === tab);

  const [openSummary, setOpenSummary] = useState<AiSummaryWithDetails | null>(null);

  // Fonctions pour les actions sur les documents
  const createDocumentData = (summary: AiSummaryWithDetails): DocumentData => ({
    type: summary.type as 'certificate' | 'prescription' | 'consultation',
    content: summary.content,
    patientName,
    date: new Date(summary.generatedAt!).toLocaleDateString("fr-FR"),
    doctorName: 'Dr. Médecin',
    clinicInfo: {
      name: 'Cabinet Médical AI',
      address: '123 Rue de la Santé, 75000 Paris',
      phone: '01 23 45 67 89',
      email: 'contact@cabinet-medical-ai.fr'
    }
  });

  const handleDownloadPDF = async (summary: AiSummaryWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast({
        title: "Génération en cours...",
        description: "Création du fichier PDF, veuillez patienter.",
      });
      
      const success = await generatePDF(createDocumentData(summary));
      if (success) {
        toast({
          title: "PDF téléchargé",
          description: "Le document PDF a été téléchargé avec succès.",
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

  const handlePrint = (summary: AiSummaryWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      printDocument(createDocumentData(summary));
      toast({
        title: "Impression lancée",
        description: "La fenêtre d'impression va s'ouvrir.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'impression",
        description: "Impossible d'imprimer le document.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Détails du patient – {patientName}</DialogTitle>
          <DialogDescription>Certificats, ordonnances et synthèses générées par l'IA</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">Tout</TabsTrigger>
            <TabsTrigger value="certificate">Certificats</TabsTrigger>
            <TabsTrigger value="prescription">Ordonnances</TabsTrigger>
            <TabsTrigger value="consultation">Synthèses</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="overflow-y-auto max-h-[calc(90vh-12rem)]">
            {isLoading ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : filtered && filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map(summary => (
                  <button 
                    key={summary.id} 
                    className="p-4 w-full text-left flex items-start space-x-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                    onClick={() => setOpenSummary(summary)}
                  >
                    <div className="mt-1 group-hover:scale-110 transition-transform duration-200">
                      {getIcon(summary.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {summary.type.charAt(0).toUpperCase() + summary.type.slice(1)}
                        </p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <FileText className="h-4 w-4 text-blue-500" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">
                        {new Date(summary.generatedAt!).toLocaleDateString("fr-FR", {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 whitespace-pre-wrap">
                        {summary.content.substring(0, 120)}...
                      </p>
                      
                      {/* Boutons d'action */}
                      <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenSummary(summary);
                          }}
                          className="h-7 px-2 text-xs rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleDownloadPDF(summary, e)}
                          className="h-7 px-2 text-xs rounded-lg border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handlePrint(summary, e)}
                          className="h-7 px-2 text-xs rounded-lg border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun document disponible</h3>
                <p className="text-sm text-slate-500">
                  {tab === "all" 
                    ? "Aucun document n'a encore été généré pour ce patient."
                    : `Aucun document de type "${tab}" n'a été trouvé pour ce patient.`
                  }
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AiSummaryModal
          isOpen={!!openSummary}
          summary={openSummary ? {
            content: openSummary.content,
            patientName,
            consultationDate: new Date(openSummary.generatedAt!).toLocaleDateString("fr-FR"),
            type: openSummary.type,
          } : null}
          onClose={() => setOpenSummary(null)}
        />
      </DialogContent>
    </Dialog>
  );
} 