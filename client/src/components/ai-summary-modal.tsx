import { Brain, X, FileText, User, Calendar, Stethoscope, Pill, Award, Download, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generatePDF, printDocument, downloadAsText, DocumentData } from "@/utils/pdf-generator";
import { useToast } from "@/hooks/use-toast";

interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: {
    content: string;
    patientName: string;
    consultationDate: string;
    type: string;
  } | null;
}

export default function AiSummaryModal({ isOpen, onClose, summary }: AiSummaryModalProps) {
  const { toast } = useToast();

  if (!summary) return null;

  const getTypeInfo = (type: string) => {
    switch (type) {
      case "consultation":
        return { 
          icon: Stethoscope, 
          label: "Synthèse de consultation", 
          color: "from-teal-600 to-cyan-600",
          bgColor: "bg-teal-50",
          borderColor: "border-teal-200",
          iconColor: "text-teal-600"
        };
      case "prescription":
        return { 
          icon: Pill, 
          label: "Ordonnance médicale", 
          color: "from-emerald-600 to-teal-600",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          iconColor: "text-emerald-600"
        };
      case "certificate":
        return { 
          icon: Award, 
          label: "Certificat médical", 
          color: "from-amber-600 to-orange-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          iconColor: "text-amber-600"
        };
      default:
        return { 
          icon: FileText, 
          label: "Synthèse IA", 
          color: "from-purple-600 to-pink-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          iconColor: "text-purple-600"
        };
    }
  };

  const typeInfo = getTypeInfo(summary.type);
  const IconComponent = typeInfo.icon;

  // Préparer les données pour le PDF
  const documentData: DocumentData = {
    type: summary.type as 'certificate' | 'prescription' | 'consultation',
    content: summary.content,
    patientName: summary.patientName,
    date: summary.consultationDate,
    doctorName: 'Dr. Médecin', // À récupérer depuis le contexte utilisateur
    clinicInfo: {
      name: 'Cabinet Médical AI',
      address: '123 Rue de la Santé, 75000 Paris',
      phone: '01 23 45 67 89',
      email: 'contact@cabinet-medical-ai.fr'
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Génération en cours...",
        description: "Création du fichier PDF, veuillez patienter.",
      });
      
      const success = await generatePDF(documentData);
      if (success) {
        toast({
          title: "PDF téléchargé",
          description: "Le document PDF a été téléchargé avec succès.",
        });
      } else {
        throw new Error("Échec de la génération PDF");
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF. Téléchargement du fichier texte...",
        variant: "destructive",
      });
      downloadAsText(documentData);
    }
  };

  const handlePrint = () => {
    try {
      printDocument(documentData);
      toast({
        title: "Impression lancée",
        description: "La fenêtre d'impression va s'ouvrir.",
      });
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
    toast({
        title: "Erreur d'impression",
        description: "Impossible d'ouvrir la fenêtre d'impression.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadText = () => {
    try {
      downloadAsText(documentData);
      toast({
        title: "Téléchargement réussi",
        description: "Le fichier texte a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le fichier.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header avec gradient */}
        <div className={`bg-gradient-to-r ${typeInfo.color} text-white p-6 -m-6 mb-6 rounded-t-2xl`}>
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                <IconComponent className="h-5 w-5" />
              </div>
              {typeInfo.label}
            </DialogTitle>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
                <User className="h-4 w-4" />
                <span>{summary.patientName}</span>
                    </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(summary.consultationDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </DialogHeader>
              </div>
              
        {/* Contenu */}
        <div className="overflow-y-auto max-h-[65vh] px-1">
          <div className={`${typeInfo.bgColor} rounded-xl p-6 border ${typeInfo.borderColor}`}>
            <div className="flex items-center mb-4">
              <div className={`w-8 h-8 ${typeInfo.bgColor} rounded-lg flex items-center justify-center mr-3`}>
                <Brain className={`h-4 w-4 ${typeInfo.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Contenu généré par l'IA</h3>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">
                {summary.content}
              </pre>
                </div>
              </div>
            </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
          <div className="flex gap-3">
                  <Button 
              onClick={handleDownloadPDF}
                    variant="outline" 
              className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
                  </Button>
                  <Button 
              onClick={handlePrint}
                    variant="outline" 
              className="rounded-xl border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimer
                  </Button>
                  <Button 
              onClick={handleDownloadText}
                    variant="outline" 
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Texte
                  </Button>
          </div>
          <Button 
            onClick={onClose} 
            className={`bg-gradient-to-r ${typeInfo.color} text-white hover:opacity-90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
