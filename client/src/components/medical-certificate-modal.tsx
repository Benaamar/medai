import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileCheck, Plus, User, Calendar, FileText, Award, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import type { Patient } from "@shared/schema";

interface MedicalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicalCertificateModal({ isOpen, onClose }: MedicalCertificateModalProps) {
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [certificateType, setCertificateType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [restrictions, setRestrictions] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const { toast } = useToast();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const generateCertificateMutation = useMutation({
    mutationFn: async (data: {
      patientId: number;
      type: string;
      startDate: string;
      endDate?: string;
      reason: string;
      restrictions?: string;
      isUrgent: boolean;
    }) => {
      const certificateContent = generateCertificateContent(data);
      
      const response = await apiRequest("POST", "/api/ai-summaries", {
        consultationId: 1,
        patientId: data.patientId,
        doctorId: 1,
        type: "certificate",
        content: certificateContent
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certificat généré",
        description: "Le certificat médical a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-summaries/recent"] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer le certificat.",
        variant: "destructive",
      });
    },
  });

  const generateCertificateContent = (data: {
    patientId: number;
    type: string;
    startDate: string;
    endDate?: string;
    reason: string;
    restrictions?: string;
    isUrgent: boolean;
  }) => {
    const patient = patients?.find(p => p.id === data.patientId);
    const today = new Date().toLocaleDateString('fr-FR');
    
    let content = `CERTIFICAT MÉDICAL

Dr. Marie DUBOIS
Médecin Généraliste
123 Avenue des Champs-Élysées, 75008 Paris
Tél: 01 42 56 78 90
RPPS: 12345678901

Paris, le ${today}

Je soussignée, Dr. Marie DUBOIS, certifie avoir examiné ce jour :

M./Mme ${patient?.firstName} ${patient?.lastName}
Né(e) le ${patient?.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR') : ''}
Demeurant : ${patient?.address || ''}

`;

    switch (data.type) {
      case "arret_travail":
        content += `ARRÊT DE TRAVAIL

Motif médical : ${data.reason}

L'état de santé du patient nécessite un arrêt de travail du ${new Date(data.startDate).toLocaleDateString('fr-FR')} au ${data.endDate ? new Date(data.endDate).toLocaleDateString('fr-FR') : 'à déterminer'}.

${data.restrictions ? `Restrictions particulières : ${data.restrictions}` : ''}

Certificat établi à la demande de l'intéressé(e) et remis en main propre pour faire valoir ce que de droit.`;
        break;
        
      case "aptitude_sport":
        content += `CERTIFICAT D'APTITUDE AU SPORT

Je certifie que l'état de santé de ${patient?.firstName} ${patient?.lastName} lui permet la pratique d'activités sportives.

${data.reason ? `Observations : ${data.reason}` : ''}
${data.restrictions ? `Restrictions ou recommandations : ${data.restrictions}` : ''}

Certificat valable pour la saison sportive en cours.`;
        break;
        
      case "contre_indication":
        content += `CERTIFICAT DE CONTRE-INDICATION

Je certifie que l'état de santé de ${patient?.firstName} ${patient?.lastName} présente une contre-indication temporaire à :

${data.reason}

Période de contre-indication : du ${new Date(data.startDate).toLocaleDateString('fr-FR')} ${data.endDate ? 'au ' + new Date(data.endDate).toLocaleDateString('fr-FR') : ''}

${data.restrictions ? `Précisions : ${data.restrictions}` : ''}`;
        break;
        
      default:
        content += `CERTIFICAT MÉDICAL GÉNÉRAL

${data.reason}

${data.startDate ? `Date d'effet : ${new Date(data.startDate).toLocaleDateString('fr-FR')}` : ''}
${data.endDate ? `Validité jusqu'au : ${new Date(data.endDate).toLocaleDateString('fr-FR')}` : ''}

${data.restrictions ? `Observations : ${data.restrictions}` : ''}`;
    }

    content += `

${data.isUrgent ? 'CERTIFICAT URGENT\n' : ''}
Certificat établi à la demande de l'intéressé(e) et remis en main propre pour faire valoir ce que de droit.

Dr. Marie DUBOIS`;

    return content;
  };

  const resetForm = () => {
    setSelectedPatient("");
    setCertificateType("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setRestrictions("");
    setIsUrgent(false);
  };

  const handleSubmit = () => {
    if (!selectedPatient) {
      toast({
        title: "Patient requis",
        description: "Veuillez sélectionner un patient.",
        variant: "destructive"
      });
      return;
    }

    if (!certificateType) {
      toast({
        title: "Type de certificat requis",
        description: "Veuillez sélectionner le type de certificat.",
        variant: "destructive"
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Motif requis",
        description: "Veuillez indiquer le motif du certificat.",
        variant: "destructive"
      });
      return;
    }

    generateCertificateMutation.mutate({
      patientId: parseInt(selectedPatient),
      type: certificateType,
      startDate,
      endDate,
      reason,
      restrictions,
      isUrgent
    });
  };

  const isLoading = generateCertificateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="certificate-modal-desc" className="max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 -m-6 mb-6 rounded-t-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                <FileCheck className="h-5 w-5" />
              </div>
              Certificat Médical
            </DialogTitle>
            <DialogDescription id="certificate-modal-desc" className="text-amber-100 mt-2">
              Générer et personnaliser un certificat médical pour un patient
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto max-h-[60vh] px-1">
          <div className="space-y-6">
            {/* Section Patient */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                  <User className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Sélection du patient</h3>
              </div>
              
              <div>
                <Label htmlFor="patient" className="text-slate-700 font-medium">
                  Patient *
                </Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger className="mt-1 rounded-xl border-slate-200 focus:ring-amber-500 focus:border-amber-500">
                    <SelectValue placeholder="Sélectionner un patient" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {patients?.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section Type de certificat */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Award className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Type de certificat</h3>
              </div>
              
              <div>
                <Label htmlFor="certificateType" className="text-slate-700 font-medium">
                  Type de certificat *
                </Label>
                <Select value={certificateType} onValueChange={setCertificateType}>
                  <SelectTrigger className="mt-1 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="arret_travail">Arrêt de travail</SelectItem>
                    <SelectItem value="aptitude_sport">Aptitude au sport</SelectItem>
                    <SelectItem value="contre_indication">Contre-indication</SelectItem>
                    <SelectItem value="general">Certificat général</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section Dates */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Période de validité</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-slate-700 font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-green-600" />
                    Date de début
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate" className="text-slate-700 font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-green-600" />
                    Date de fin (optionnelle)
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Section Détails */}
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Détails du certificat</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason" className="text-slate-700 font-medium">
                    Motif / Diagnostic *
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Indiquez le motif médical ou le diagnostic justifiant ce certificat..."
                    rows={3}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="restrictions" className="text-slate-700 font-medium">
                    Restrictions ou observations
                  </Label>
                  <Textarea
                    id="restrictions"
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    placeholder="Restrictions particulières, recommandations, observations..."
                    rows={3}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="urgent"
                    checked={isUrgent}
                    onCheckedChange={(checked) => setIsUrgent(checked === true)}
                    className="rounded-md"
                  />
                  <Label htmlFor="urgent" className="text-slate-700 font-medium cursor-pointer">
                    Certificat urgent
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec boutons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="rounded-xl border-slate-200 hover:bg-slate-50"
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Génération...
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4 mr-2" />
                Générer le certificat
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}