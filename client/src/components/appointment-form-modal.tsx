import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Plus, CalendarDays, User, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useNotificationActions } from "@/hooks/use-notification-actions";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertConsultationSchema } from "@shared/schema";
import type { InsertConsultation, Patient, ConsultationWithPatient } from "@shared/schema";
import { z } from "zod";

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultation?: ConsultationWithPatient;
  mode?: "create" | "edit";
}

const formSchema = insertConsultationSchema.extend({
  date: z.string().min(1, "Date requise"),
  time: z.string().min(1, "Heure requise"),
  reason: z.string().min(1, "Motif requis"),
});

export default function AppointmentFormModal({ isOpen, onClose, consultation, mode }: AppointmentFormModalProps) {
  const { toast } = useToast();
  const { notifyAppointmentCreated, notifyAppointmentUpdated } = useNotificationActions();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: consultation ? {
      patientId: consultation.patientId,
      doctorId: consultation.doctorId,
      date: consultation.date,
      time: consultation.time,
      reason: consultation.reason,
      status: consultation.status,
      notes: consultation.notes ?? "",
      diagnosis: consultation.diagnosis ?? "",
      treatment: consultation.treatment ?? "",
    } : {
      patientId: 0,
      doctorId: 1,
      date: "",
      time: "",
      reason: "",
      status: "scheduled",
      notes: "",
      diagnosis: "",
      treatment: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertConsultation) => {
      const response = await apiRequest("POST", "/api/consultations", data);
      return response.json();
    },
    onSuccess: (newAppointment, variables) => {
      const patient = patients?.find(p => p.id === variables.patientId);
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient';
      const formattedDate = new Date(variables.date).toLocaleDateString('fr-FR');
      
      toast({
        title: "Rendez-vous créé",
        description: "Le rendez-vous a été programmé avec succès.",
      });
      notifyAppointmentCreated(patientName, formattedDate);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultations/today"] });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le rendez-vous.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertConsultation) => {
      const response = await apiRequest("PATCH", `/api/consultations/${consultation?.id}`, data);
      return response.json();
    },
    onSuccess: (updatedAppointment, variables) => {
      const patient = patients?.find(p => p.id === variables.patientId);
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient';
      
      toast({
        title: "Rendez-vous modifié",
        description: "Le rendez-vous a été mis à jour avec succès.",
      });
      notifyAppointmentUpdated(patientName);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultations/today"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rendez-vous.",
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

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                {mode === "edit" ? (
                  <Calendar className="h-5 w-5" />
                ) : (
                  <CalendarDays className="h-5 w-5" />
                )}
              </div>
              {mode === "edit" ? "Modifier le Rendez-vous" : "Nouveau Rendez-vous"}
            </DialogTitle>
            <p className="text-indigo-100 mt-2">
              {mode === "edit" 
                ? "Mettre à jour les détails du rendez-vous" 
                : "Programmer un nouveau rendez-vous avec un patient"
              }
            </p>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto max-h-[60vh] px-1">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section Patient */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <User className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Sélection du patient</h3>
              </div>
              
              <div>
                <Label htmlFor="patientId" className="text-slate-700 font-medium">
                  Patient *
                </Label>
                <Controller
                  name="patientId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <SelectTrigger className="mt-1 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
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
                  )}
                />
                {form.formState.errors.patientId && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <X className="h-3 w-3 mr-1" />
                    {form.formState.errors.patientId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Section Date et Heure */}
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
                    min={getMinDate()}
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
                  <Controller
                    name="time"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="mt-1 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500">
                          <SelectValue placeholder="Sélectionner l'heure" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-48">
                          {generateTimeSlots().map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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

            {/* Section Motif */}
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
                  <Select onValueChange={(value) => form.setValue("reason", value)} value={form.watch("reason")}>
                    <SelectTrigger className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500">
                      <SelectValue placeholder="Sélectionner un motif" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Consultation de routine">Consultation de routine</SelectItem>
                      <SelectItem value="Contrôle médical">Contrôle médical</SelectItem>
                      <SelectItem value="Renouvellement ordonnance">Renouvellement ordonnance</SelectItem>
                      <SelectItem value="Certificat médical">Certificat médical</SelectItem>
                      <SelectItem value="Vaccination">Vaccination</SelectItem>
                      <SelectItem value="Bilan de santé">Bilan de santé</SelectItem>
                      <SelectItem value="Suivi de traitement">Suivi de traitement</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.reason && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {form.formState.errors.reason.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes" className="text-slate-700 font-medium">
                    Notes particulières
                  </Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Informations complémentaires, urgence, allergies..."
                    rows={3}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500 resize-none"
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
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {mode === "edit" ? "Modification..." : "Programmation..."}
              </>
            ) : (
              <>
                {mode === "edit" ? (
                  <Calendar className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {mode === "edit" ? "Modifier le rendez-vous" : "Programmer le rendez-vous"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}