import { X, Bot, Edit, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AiSummaryModalProps {
  summary: {
    content: string;
    patientName: string;
    consultationDate: string;
    type: string;
  };
  onClose: () => void;
}

export default function AiSummaryModal({ summary, onClose }: AiSummaryModalProps) {
  const getSummaryTypeLabel = (type: string) => {
    switch (type) {
      case "consultation": return "Synthèse de Consultation";
      case "prescription": return "Prescription Médicale";
      case "referral": return "Courrier de Correspondance";
      default: return "Synthèse Médicale";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center">
            <Bot className="text-purple-600 mr-2" />
            {getSummaryTypeLabel(summary.type)} Générée par IA
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] p-6">
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Informations Patient</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Nom:</strong> {summary.patientName}</div>
                <div><strong>Date:</strong> {summary.consultationDate}</div>
                <div><strong>Type:</strong> {getSummaryTypeLabel(summary.type)}</div>
              </div>
            </div>
            
            {/* Summary Content */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">{getSummaryTypeLabel(summary.type)}</h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                  {summary.content}
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-500">
                  Généré automatiquement par IA • {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="space-x-3">
                  <Button variant="outline" className="text-slate-700 hover:bg-slate-50">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button className="bg-medical-blue text-white hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
