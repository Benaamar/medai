import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Calendar, Clock, UserPlus, Stethoscope, User, FileText, Activity, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useNotificationActions } from "../hooks/use-notification-actions";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertConsultationSchema } from "@shared/schema";
import type { InsertConsultation, Consultation, ConsultationWithPatient, Patient } from "@shared/schema";
import { z } from "zod";
import PatientFormModal from "./patient-form-modal";

interface ConsultationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultation?: Consultation | ConsultationWithPatient;
  mode: "create" | "edit";
}

const formSchema = insertConsultationSchema.extend({
  patientId: z.number().min(1, "Patient requis"),
  doctorId: z.number().min(1),
  date: z.string().min(1, "Date requise"),
  time: z.string().min(1, "Heure requise"),
  reason: z.string().min(1, "Motif requis"),
});

export default function ConsultationFormModal({ isOpen, onClose, consultation, mode }: ConsultationFormModalProps) {
  const { toast } = useToast();
  const { notifyConsultationCreated, notifyConsultationCompleted } = useNotificationActions();
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les patients uniquement quand le modal est ouvert
  useEffect(() => {
    async function loadPatients() {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const response = await fetch("/api/patients");
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Patients chargés:", data);
        setPatients(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erreur lors du chargement des patients:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des patients.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadPatients();
  }, [isOpen, isPatientFormOpen, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: consultation?.patientId ?? undefined,
      doctorId: consultation?.doctorId || 1,
      date: consultation?.date || new Date().toISOString().split('T')[0],
      time: consultation?.time || "",
      reason: consultation?.reason || "",
      status: consultation?.status || "scheduled",
      notes: consultation?.notes || "",
      diagnosis: consultation?.diagnosis || "",
      treatment: consultation?.treatment || "",
    },
  });

  // When consultation changes (edit), reset the form with its values so that fields are pre-filled
  useEffect(() => {
    if (!isOpen) return;
    form.reset({
      patientId: consultation?.patientId ?? undefined,
      doctorId: consultation?.doctorId || 1,
      date: consultation?.date || new Date().toISOString().split('T')[0],
      time: consultation?.time || "",
      reason: consultation?.reason || "",
      status: consultation?.status || "scheduled",
      notes: consultation?.notes || "",
      diagnosis: consultation?.diagnosis || "",
      treatment: consultation?.treatment || "",
    });
  }, [consultation, isOpen, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertConsultation) => {
      const response = await apiRequest("POST", "/api/consultations", data);
      return response.json();
    },
    onSuccess: (newConsultation, variables) => {
      const patient = patients.find(p => p.id === variables.patientId);
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient';
      
      toast({
        title: "Consultation créée",
        description: "La consultation a été créée avec succès.",
      });
      
      if (variables.status === 'completed') {
        notifyConsultationCompleted(patientName);
      } else {
        notifyConsultationCreated(patientName);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/upcoming"] });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la consultation.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertConsultation) => {
      const response = await apiRequest("PATCH", `/api/consultations/${consultation?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Consultation modifiée",
        description: "La consultation a été modifiée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/upcoming"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la consultation.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (mode === "edit" && consultation) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isMutationLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 -m-6 mb-6 rounded-t-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                {mode === "create" ? (
                  <Plus className="h-5 w-5" />
                ) : (
                  <Stethoscope className="h-5 w-5" />
                )}
              </div>
              {mode === "create" ? "Nouvelle Consultation" : "Modifier Consultation"}
            </DialogTitle>
            <p className="text-teal-100 mt-2">
              {mode === "create" 
                ? "Créer une nouvelle consultation médicale" 
                : "Mettre à jour les informations de la consultation"
              }
            </p>
          </DialogHeader>
        </div>

        <PatientFormModal
          isOpen={isPatientFormOpen}
          onClose={() => {
            setIsPatientFormOpen(false);
            // Recharger les patients après avoir ajouté un nouveau patient
          }}
          mode="create"
        />

        <div className="overflow-y-auto max-h-[60vh] px-1">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section Patient */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                  <User className="h-4 w-4 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Sélection du patient</h3>
              </div>
              
              <div>
                <Label htmlFor="patientId" className="text-slate-700 font-medium">
                  Patient *
                </Label>
                <div className="flex space-x-2 mt-1">
                  <div className="flex-1">
                    <Controller
                      name="patientId"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value ? field.value.toString() : undefined}>
                          <SelectTrigger className="rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-500">
                            <SelectValue placeholder="Sélectionner un patient" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {isLoading ? (
                              <SelectItem value="loading" disabled>Chargement des patients...</SelectItem>
                            ) : patients.length > 0 ? (
                              patients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id.toString()}>
                                  {patient.firstName} {patient.lastName}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>Aucun patient disponible</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setIsPatientFormOpen(true)}
                    className="flex-shrink-0 rounded-xl border-teal-200 text-teal-600 hover:bg-teal-50"
                    title="Ajouter un nouveau patient"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
                {form.formState.errors.patientId && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <X className="h-3 w-3 mr-1" />
                    {form.formState.errors.patientId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Section Planification */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Planification</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-slate-700 font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register("date")}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {form.formState.errors.date && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {form.formState.errors.date.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="time" className="text-slate-700 font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-600" />
                    Heure *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    {...form.register("time")}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {form.formState.errors.time && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {form.formState.errors.time.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Consultation */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Détails de la consultation</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason" className="text-slate-700 font-medium">
                    Motif de consultation *
                  </Label>
                  <Input
                    id="reason"
                    {...form.register("reason")}
                    placeholder="ex: Contrôle de routine, Douleurs abdominales..."
                    className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500"
                  />
                  {form.formState.errors.reason && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {form.formState.errors.reason.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status" className="text-slate-700 font-medium flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-green-600" />
                    Statut
                  </Label>
                  <Controller
                    name="status"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="scheduled">En attente</SelectItem>
                          <SelectItem value="in-progress">En cours</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                          <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-slate-700 font-medium">
                    Notes de consultation
                  </Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Observations, examens effectués..."
                    rows={3}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section Diagnostic et Traitement */}
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                  <Stethoscope className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Diagnostic et traitement</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="diagnosis" className="text-slate-700 font-medium">
                    Diagnostic
                  </Label>
                  <Input
                    id="diagnosis"
                    {...form.register("diagnosis")}
                    placeholder="Diagnostic posé"
                    className="mt-1 rounded-xl border-slate-200 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <Label htmlFor="treatment" className="text-slate-700 font-medium">
                    Traitement
                  </Label>
                  <Textarea
                    id="treatment"
                    {...form.register("treatment")}
                    placeholder="Traitements prescrits, recommandations..."
                    rows={3}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-amber-500 focus:border-amber-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer avec boutons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="rounded-xl border-slate-200 hover:bg-slate-50"
            disabled={isMutationLoading}
          >
            Annuler
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isMutationLoading}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isMutationLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {mode === "create" ? "Création..." : "Modification..."}
              </>
            ) : (
              <>
                {mode === "create" ? (
                  <Plus className="h-4 w-4 mr-2" />
                ) : (
                  <Stethoscope className="h-4 w-4 mr-2" />
                )}
                {mode === "create" ? "Créer la consultation" : "Modifier la consultation"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}