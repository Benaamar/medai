import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileCheck, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

interface MedicalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicalCertificateModal({ isOpen, onClose }: MedicalCertificateModalProps) {
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [certificateType, setCertificateType] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const generateCertificateMutation = useMutation({
    mutationFn: async (data: {
      patientId: number;
      certificateType: string;
      startDate: string;
      endDate: string;
      reason: string;
      restrictions: string[];
      notes: string;
    }) => {
      const certificateContent = generateCertificateContent(data);
      
      // Créer une synthèse IA de type certificat
      const response = await apiRequest("POST", "/api/ai-summaries", {
        consultationId: 1, // Temporaire
        patientId: data.patientId,
        doctorId: 1,
        type: "referral", // Utiliser le type referral pour les certificats
        content: certificateContent
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certificat médical créé",
        description: "Le certificat médical a été généré avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-summaries/recent"] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le certificat médical.",
        variant: "destructive",
      });
    },
  });

  const generateCertificateContent = (data: {
    patientId: number;
    certificateType: string;
    startDate: string;
    endDate: string;
    reason: string;
    restrictions: string[];
    notes: string;
  }) => {
    const patient = patients?.find(p => p.id === data.patientId);
    const today = new Date().toLocaleDateString('fr-FR');
    
    let content = `CERTIFICAT MÉDICAL

Dr. Marie DUBOIS
Médecin Généraliste
123 Avenue des Champs-Élysées, 75008 Paris
Tél: 01 42 56 78 90
RPPS: 10100123456

Paris, le ${today}

`;

    if (data.certificateType === "arret_travail") {
      content += `CERTIFICAT MÉDICAL D'ARRÊT DE TRAVAIL

Je soussignée, Docteur Marie DUBOIS, certifie avoir examiné ce jour :

${patient?.firstName} ${patient?.lastName}
Né(e) le ${patient?.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR') : ''}
Demeurant : ${patient?.address || ''}

`;

      if (data.reason) {
        content += `MOTIF MÉDICAL:
${data.reason}

`;
      }

      content += `En conséquence, j'estime que l'état de santé de ce patient justifie un arrêt de travail `;

      if (data.startDate && data.endDate) {
        content += `du ${new Date(data.startDate).toLocaleDateString('fr-FR')} au ${new Date(data.endDate).toLocaleDateString('fr-FR')} inclus.`;
      } else if (data.startDate) {
        content += `à compter du ${new Date(data.startDate).toLocaleDateString('fr-FR')}.`;
      }

      content += `

`;

      if (data.restrictions.length > 0) {
        content += `RESTRICTIONS:
${data.restrictions.join('\n')}

`;
      }

    } else if (data.certificateType === "aptitude_sport") {
      content += `CERTIFICAT MÉDICAL D'APTITUDE AU SPORT

Je soussignée, Docteur Marie DUBOIS, certifie avoir examiné ce jour :

${patient?.firstName} ${patient?.lastName}
Né(e) le ${patient?.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR') : ''}

L'examen clinique ne révèle aucune contre-indication à la pratique sportive `;
      
      if (data.reason) {
        content += `en ${data.reason}`;
      }
      
      content += `.

`;

      if (data.restrictions.length > 0) {
        content += `RESTRICTIONS PARTICULIÈRES:
${data.restrictions.join('\n')}

`;
      }

    } else if (data.certificateType === "contre_indication") {
      content += `CERTIFICAT MÉDICAL DE CONTRE-INDICATION

Je soussignée, Docteur Marie DUBOIS, certifie avoir examiné ce jour :

${patient?.firstName} ${patient?.lastName}
Né(e) le ${patient?.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR') : ''}

`;

      if (data.reason) {
        content += `CONTRE-INDICATION MÉDICALE:
${data.reason}

`;
      }

      if (data.startDate && data.endDate) {
        content += `Cette contre-indication est valable du ${new Date(data.startDate).toLocaleDateString('fr-FR')} au ${new Date(data.endDate).toLocaleDateString('fr-FR')}.

`;
      }

    } else {
      // Certificat général
      content += `CERTIFICAT MÉDICAL

Je soussignée, Docteur Marie DUBOIS, certifie avoir examiné ce jour :

${patient?.firstName} ${patient?.lastName}
Né(e) le ${patient?.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR') : ''}

`;

      if (data.reason) {
        content += `${data.reason}

`;
      }
    }

    if (data.notes) {
      content += `OBSERVATIONS:
${data.notes}

`;
    }

    content += `Certificat établi à la demande de l'intéressé(e) et remis en main propre.

Dr. Marie DUBOIS
Signature et cachet`;

    return content;
  };

  const resetForm = () => {
    setSelectedPatient("");
    setCertificateType("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setRestrictions([]);
    setNotes("");
  };

  const handleRestrictionChange = (restriction: string, checked: boolean) => {
    if (checked) {
      setRestrictions([...restrictions, restriction]);
    } else {
      setRestrictions(restrictions.filter(r => r !== restriction));
    }
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

    generateCertificateMutation.mutate({
      patientId: parseInt(selectedPatient),
      certificateType,
      startDate,
      endDate,
      reason,
      restrictions,
      notes
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileCheck className="h-5 w-5 mr-2 text-medical-amber" />
            Certificat Médical
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="patient">Patient *</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un patient" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.firstName} {patient.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="certificateType">Type de certificat *</Label>
            <Select value={certificateType} onValueChange={setCertificateType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arret_travail">Arrêt de travail</SelectItem>
                <SelectItem value="aptitude_sport">Aptitude au sport</SelectItem>
                <SelectItem value="contre_indication">Contre-indication</SelectItem>
                <SelectItem value="general">Certificat général</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(certificateType === "arret_travail" || certificateType === "contre_indication") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="reason">
              {certificateType === "arret_travail" ? "Motif médical" :
               certificateType === "aptitude_sport" ? "Discipline sportive" :
               certificateType === "contre_indication" ? "Contre-indication" :
               "Motif du certificat"}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                certificateType === "arret_travail" ? "Syndrome grippal, lombalgie..." :
                certificateType === "aptitude_sport" ? "Football, natation, course à pied..." :
                certificateType === "contre_indication" ? "Contre-indication temporaire à..." :
                "Objet du certificat médical"
              }
              rows={3}
            />
          </div>

          {(certificateType === "arret_travail" || certificateType === "aptitude_sport") && (
            <div>
              <Label>Restrictions particulières</Label>
              <div className="space-y-2 mt-2">
                {certificateType === "arret_travail" ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sortie-autorisee"
                        checked={restrictions.includes("Sorties autorisées")}
                        onCheckedChange={(checked) => handleRestrictionChange("Sorties autorisées", !!checked)}
                      />
                      <Label htmlFor="sortie-autorisee" className="text-sm">Sorties autorisées</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="travail-leger"
                        checked={restrictions.includes("Reprise de travail léger possible")}
                        onCheckedChange={(checked) => handleRestrictionChange("Reprise de travail léger possible", !!checked)}
                      />
                      <Label htmlFor="travail-leger" className="text-sm">Reprise de travail léger possible</Label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="competition"
                        checked={restrictions.includes("Pas de compétition")}
                        onCheckedChange={(checked) => handleRestrictionChange("Pas de compétition", !!checked)}
                      />
                      <Label htmlFor="competition" className="text-sm">Pas de compétition</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="contact"
                        checked={restrictions.includes("Éviter les sports de contact")}
                        onCheckedChange={(checked) => handleRestrictionChange("Éviter les sports de contact", !!checked)}
                      />
                      <Label htmlFor="contact" className="text-sm">Éviter les sports de contact</Label>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Observations complémentaires</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations particulières, recommandations..."
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={generateCertificateMutation.isPending}
              className="flex-1 bg-medical-amber text-white hover:bg-amber-600"
            >
              {generateCertificateMutation.isPending
                ? "Génération..."
                : "Créer le certificat"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}