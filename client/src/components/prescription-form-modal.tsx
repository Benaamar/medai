import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Pill, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

interface PrescriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export default function PrescriptionFormModal({ isOpen, onClose }: PrescriptionFormModalProps) {
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const generatePrescriptionMutation = useMutation({
    mutationFn: async (data: {
      patientId: number;
      medications: Medication[];
      diagnosis: string;
      notes: string;
    }) => {
      // Simuler la génération d'une prescription
      const prescriptionContent = generatePrescriptionContent(data);
      
      // Pour l'instant, on peut créer une synthèse IA de type prescription
      const response = await apiRequest("POST", "/api/ai-summaries", {
        consultationId: 1, // Temporaire - devrait être lié à une consultation
        patientId: data.patientId,
        doctorId: 1,
        type: "prescription",
        content: prescriptionContent
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ordonnance créée",
        description: "L'ordonnance a été générée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-summaries/recent"] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'ordonnance.",
        variant: "destructive",
      });
    },
  });

  const generatePrescriptionContent = (data: {
    patientId: number;
    medications: Medication[];
    diagnosis: string;
    notes: string;
  }) => {
    const patient = patients?.find(p => p.id === data.patientId);
    const today = new Date().toLocaleDateString('fr-FR');
    
    let content = `ORDONNANCE MÉDICALE

Dr. Marie DUBOIS
Médecin Généraliste
123 Avenue des Champs-Élysées, 75008 Paris
Tél: 01 42 56 78 90

Patient: ${patient?.firstName} ${patient?.lastName}
Né(e) le ${patient?.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR') : ''} 
${patient?.address || ''}

Paris, le ${today}

DIAGNOSTIC: ${data.diagnosis}

PRESCRIPTION:

`;

    data.medications.forEach((med, index) => {
      if (med.name) {
        content += `${index + 1}. ${med.name.toUpperCase()}
   ${med.dosage}
   ${med.frequency}
   Durée: ${med.duration}
   ${med.instructions ? `Instructions: ${med.instructions}` : ''}

`;
      }
    });

    if (data.notes) {
      content += `NOTES ET RECOMMANDATIONS:
${data.notes}

`;
    }

    content += `En cas d'effets indésirables, consulter rapidement.

Dr. Marie DUBOIS`;

    return content;
  };

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = medications.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setMedications(updated);
  };

  const resetForm = () => {
    setSelectedPatient("");
    setMedications([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
    setDiagnosis("");
    setNotes("");
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

    const validMedications = medications.filter(med => med.name.trim() !== "");
    if (validMedications.length === 0) {
      toast({
        title: "Médicaments requis",
        description: "Veuillez ajouter au moins un médicament.",
        variant: "destructive"
      });
      return;
    }

    generatePrescriptionMutation.mutate({
      patientId: parseInt(selectedPatient),
      medications: validMedications,
      diagnosis,
      notes
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Pill className="h-5 w-5 mr-2 text-medical-green" />
            Nouvelle Ordonnance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
            <Label htmlFor="diagnosis">Diagnostic</Label>
            <Input
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Diagnostic posé"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Médicaments *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedication}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
            
            {medications.map((medication, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4 mb-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Médicament {index + 1}</h4>
                  {medications.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom du médicament *</Label>
                    <Input
                      value={medication.name}
                      onChange={(e) => updateMedication(index, "name", e.target.value)}
                      placeholder="ex: Paracétamol"
                    />
                  </div>
                  <div>
                    <Label>Dosage</Label>
                    <Input
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                      placeholder="ex: 500mg"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fréquence</Label>
                    <Select
                      value={medication.frequency}
                      onValueChange={(value) => updateMedication(index, "frequency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1 fois par jour">1 fois par jour</SelectItem>
                        <SelectItem value="2 fois par jour">2 fois par jour</SelectItem>
                        <SelectItem value="3 fois par jour">3 fois par jour</SelectItem>
                        <SelectItem value="Matin et soir">Matin et soir</SelectItem>
                        <SelectItem value="Au besoin">Au besoin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Durée</Label>
                    <Input
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, "duration", e.target.value)}
                      placeholder="ex: 7 jours"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Instructions particulières</Label>
                  <Input
                    value={medication.instructions}
                    onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                    placeholder="ex: À prendre pendant les repas"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="notes">Notes et recommandations</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conseils, précautions particulières..."
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
              disabled={generatePrescriptionMutation.isPending}
              className="flex-1 bg-medical-green text-white hover:bg-green-700"
            >
              {generatePrescriptionMutation.isPending
                ? "Génération..."
                : "Créer l'ordonnance"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}