import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertConsultationSchema } from "@shared/schema";
import type { InsertConsultation, Patient } from "@shared/schema";
import { z } from "zod";

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = insertConsultationSchema.extend({
  date: z.string().min(1, "Date requise"),
  time: z.string().min(1, "Heure requise"),
  reason: z.string().min(1, "Motif requis"),
});

export default function AppointmentFormModal({ isOpen, onClose }: AppointmentFormModalProps) {
  const { toast } = useToast();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: InsertConsultation) => {
      const response = await apiRequest("POST", "/api/consultations", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rendez-vous planifié",
        description: "Le rendez-vous a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/consultations/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createAppointmentMutation.mutate(data);
  };

  // Générer les créneaux horaires disponibles
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minutes of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  // Obtenir la date minimum (aujourd'hui)
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-medical-blue" />
            Planifier un Rendez-vous
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="patientId">Patient *</Label>
            <Controller
              name="patientId"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
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
              )}
            />
            {form.formState.errors.patientId && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.patientId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                min={getMinDate()}
                {...form.register("date")}
              />
              {form.formState.errors.date && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.date.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="time">Heure *</Label>
              <Controller
                name="time"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Heure" />
                    </SelectTrigger>
                    <SelectContent>
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
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.time.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Motif de consultation *</Label>
            <Select onValueChange={(value) => form.setValue("reason", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un motif" />
              </SelectTrigger>
              <SelectContent>
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
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes particulières</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Informations complémentaires, urgence, allergies..."
              rows={3}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Horaires de consultation</p>
                <p>Lundi - Vendredi: 8h00 - 18h00</p>
                <p>Créneaux de 30 minutes</p>
              </div>
            </div>
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
              type="submit"
              disabled={createAppointmentMutation.isPending}
              className="flex-1 bg-medical-blue text-white hover:bg-blue-700"
            >
              {createAppointmentMutation.isPending
                ? "Planification..."
                : "Planifier"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}