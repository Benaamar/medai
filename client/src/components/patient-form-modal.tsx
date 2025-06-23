import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { User, UserPlus, X, Calendar, Mail, Phone, MapPin, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useNotificationActions } from "@/hooks/use-notification-actions";
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
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().min(1, "Téléphone requis"),
});

export default function PatientFormModal({ isOpen, onClose, patient, mode }: PatientFormModalProps) {
  const { toast } = useToast();
  const { notifyPatientCreated, notifyPatientUpdated } = useNotificationActions();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: patient ? {
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthDate: patient.birthDate,
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
    } : {
      firstName: "",
      lastName: "",
      birthDate: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest("POST", "/api/patients", data);
      return response.json();
    },
    onSuccess: (newPatient, variables) => {
      const patientName = `${variables.firstName} ${variables.lastName}`;
      toast({
        title: "Patient créé",
        description: "Le patient a été créé avec succès.",
      });
      notifyPatientCreated(patientName);
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
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest("PATCH", `/api/patients/${patient?.id}`, data);
      return response.json();
    },
    onSuccess: (updatedPatient, variables) => {
      const patientName = `${variables.firstName} ${variables.lastName}`;
      toast({
        title: "Patient modifié",
        description: "Le patient a été modifié avec succès.",
      });
      notifyPatientUpdated(patientName);
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
    if (mode === "edit" && patient) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 -m-6 mb-6 rounded-t-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                {mode === "create" ? (
                  <UserPlus className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              {mode === "create" ? "Nouveau Patient" : "Modifier Patient"}
            </DialogTitle>
            <p className="text-green-100 mt-2">
              {mode === "create" 
                ? "Ajouter un nouveau patient à votre base de données" 
                : "Mettre à jour les informations du patient"
              }
            </p>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto max-h-[60vh] px-1">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section Identité */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Informations personnelles</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-slate-700 font-medium">
                    Prénom *
                  </Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500"
                    placeholder="Prénom du patient"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-slate-700 font-medium">
                    Nom *
                  </Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500"
                    placeholder="Nom de famille"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="birthDate" className="text-slate-700 font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-green-600" />
                    Date de naissance *
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...form.register("birthDate")}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500"
                  />
                  {form.formState.errors.birthDate && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {form.formState.errors.birthDate.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Contact */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Informations de contact</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-slate-700 font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-blue-600" />
                    Téléphone *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register("phone")}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="06 12 34 56 78"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-slate-700 font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-blue-600" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    className="mt-1 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@exemple.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="address" className="text-slate-700 font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                  Adresse
                </Label>
                <Textarea
                  id="address"
                  {...form.register("address")}
                  className="mt-1 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Adresse complète du patient"
                  rows={2}
                />
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
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {mode === "create" ? "Création..." : "Modification..."}
              </>
            ) : (
              <>
                {mode === "create" ? (
                  <UserPlus className="h-4 w-4 mr-2" />
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                {mode === "create" ? "Créer le patient" : "Modifier le patient"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}