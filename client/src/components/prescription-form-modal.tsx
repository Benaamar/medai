import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Pill, Plus, X, User, FileText, Stethoscope, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
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

  const isLoading = generatePrescriptionMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 -m-6 mb-6 rounded-t-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                <Pill className="h-5 w-5" />
              </div>
              Nouvelle Ordonnance
            </DialogTitle>
            <p className="text-emerald-100 mt-2">
              Créer une ordonnance médicale personnalisée pour un patient
            </p>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto max-h-[65vh] px-1">
          <div className="space-y-6">
            {/* Section Patient */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Sélection du patient</h3>
              </div>
              
              <div>
                <Label htmlFor="patient" className="text-slate-700 font-medium">
                  Patient *
                </Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger className="mt-1 rounded-xl border-slate-200 focus:ring-emerald-500 focus:border-emerald-500">
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

            {/* Section Diagnostic */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Diagnostic</h3>
              </div>
              
              <div>
                <Label htmlFor="diagnosis" className="text-slate-700 font-medium">
                  Diagnostic posé
                </Label>
                <Input
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Diagnostic posé"
                  className="mt-1 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Section Médicaments */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Pill className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Médicaments prescrits</h3>
                </div>
                <Button
                  type="button"
                  onClick={addMedication}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-4">
                {medications.map((medication, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-900">Médicament {index + 1}</h4>
                      {medications.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedication(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-700 font-medium">
                          Nom du médicament *
                        </Label>
                        <Input
                          value={medication.name}
                          onChange={(e) => updateMedication(index, "name", e.target.value)}
                          placeholder="ex: Paracétamol"
                          className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 font-medium">
                          Dosage
                        </Label>
                        <Input
                          value={medication.dosage}
                          onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                          placeholder="ex: 500 mg"
                          className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 font-medium">
                          Fréquence
                        </Label>
                        <Select
                          value={medication.frequency}
                          onValueChange={(value) => updateMedication(index, "frequency", value)}
                        >
                          <SelectTrigger className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500">
                            <SelectValue placeholder="Fréquence" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="1 fois par jour">1 fois par jour</SelectItem>
                            <SelectItem value="2 fois par jour">2 fois par jour</SelectItem>
                            <SelectItem value="3 fois par jour">3 fois par jour</SelectItem>
                            <SelectItem value="4 fois par jour">4 fois par jour</SelectItem>
                            <SelectItem value="Selon besoin">Selon besoin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-700 font-medium">
                          Durée
                        </Label>
                        <Input
                          value={medication.duration}
                          onChange={(e) => updateMedication(index, "duration", e.target.value)}
                          placeholder="ex: 7 jours"
                          className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Label className="text-slate-700 font-medium">
                        Instructions particulières
                      </Label>
                      <Textarea
                        value={medication.instructions}
                        onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                        placeholder="ex: À prendre pendant les repas"
                        rows={2}
                        className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Notes */}
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Notes et recommandations</h3>
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-slate-700 font-medium">
                  Recommandations particulières
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Recommandations particulières, précautions, conseils..."
                  rows={4}
                  className="mt-1 rounded-xl border-slate-200 focus:ring-amber-500 focus:border-amber-500 resize-none"
                />
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
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Génération...
              </>
            ) : (
              <>
                <Pill className="h-4 w-4 mr-2" />
                Générer l'ordonnance
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}