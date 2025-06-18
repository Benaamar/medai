import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPatientSchema } from "@shared/schema";
import type { InsertPatient, Patient } from "@shared/schema";
import { z } from "zod";

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
  mode: "create" | "edit";
}

const formSchema = insertPatientSchema.extend({
  birthDate: z.string().min(1, "Date de naissance requise"),
});

export default function PatientFormModal({ isOpen, onClose, patient, mode }: PatientFormModalProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: patient?.firstName || "",
      lastName: patient?.lastName || "",
      birthDate: patient?.birthDate || "",
      phone: patient?.phone || "",
      email: patient?.email || "",
      address: patient?.address || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest("POST", "/api/patients", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Patient créé",
        description: "Le patient a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le patient.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertPatient>) => {
      const response = await apiRequest("PATCH", `/api/patients/${patient?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Patient modifié",
        description: "Le patient a été modifié avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le patient.",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {mode === "create" ? (
              <>
                <Plus className="h-5 w-5 mr-2 text-medical-blue" />
                Nouveau Patient
              </>
            ) : (
              <>
                Modifier Patient
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="Prénom"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Nom de famille"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="birthDate">Date de naissance *</Label>
            <Input
              id="birthDate"
              type="date"
              {...form.register("birthDate")}
            />
            {form.formState.errors.birthDate && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.birthDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="01 23 45 67 89"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="patient@email.com"
            />
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              {...form.register("address")}
              placeholder="Adresse complète"
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