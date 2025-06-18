import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Calendar, Clock } from "lucide-react";
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
import type { InsertConsultation, Consultation, Patient } from "@shared/schema";
import { z } from "zod";

interface ConsultationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultation?: Consultation;
  mode: "create" | "edit";
}

const formSchema = insertConsultationSchema.extend({
  date: z.string().min(1, "Date requise"),
  time: z.string().min(1, "Heure requise"),
  reason: z.string().min(1, "Motif requis"),
});

export default function ConsultationFormModal({ isOpen, onClose, consultation, mode }: ConsultationFormModalProps) {
  const { toast } = useToast();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: consultation?.patientId || 0,
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

  const createMutation = useMutation({
    mutationFn: async (data: InsertConsultation) => {
      const response = await apiRequest("POST", "/api/consultations", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Consultation créée",
        description: "La consultation a été créée avec succès.",
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
        description: "Impossible de créer la consultation.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertConsultation>) => {
      const response = await apiRequest("PATCH", `/api/consultations/${consultation?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Consultation modifiée",
        description: "La consultation a été modifiée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/consultations/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {mode === "create" ? (
              <>
                <Plus className="h-5 w-5 mr-2 text-medical-blue" />
                Nouvelle Consultation
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5 mr-2 text-medical-blue" />
                Modifier Consultation
              </>
            )}
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
                {...form.register("date")}
              />
              {form.formState.errors.date && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.date.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="time">Heure *</Label>
              <Input
                id="time"
                type="time"
                {...form.register("time")}
              />
              {form.formState.errors.time && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.time.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Motif de consultation *</Label>
            <Input
              id="reason"
              {...form.register("reason")}
              placeholder="ex: Contrôle de routine, Douleurs abdominales..."
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status">Statut</Label>
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
            <Label htmlFor="notes">Notes de consultation</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Observations, examens effectués..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="diagnosis">Diagnostic</Label>
            <Input
              id="diagnosis"
              {...form.register("diagnosis")}
              placeholder="Diagnostic posé"
            />
          </div>

          <div>
            <Label htmlFor="treatment">Traitement</Label>
            <Textarea
              id="treatment"
              {...form.register("treatment")}
              placeholder="Traitements prescrits, recommandations..."
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
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-medical-blue text-white hover:bg-blue-700"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Enregistrement..."
                : mode === "create"
                ? "Créer"
                : "Modifier"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}