import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Phone, Mail, MapPin, Calendar, Edit, Eye, Trash2 } from "lucide-react";
import Header from "@/components/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PatientFormModal from "@/components/patient-form-modal";
import type { Patient } from "@shared/schema";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(undefined);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const { toast } = useToast();

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const filteredPatients = patients?.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/patients/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Patient supprimé",
        description: "Le patient a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le patient.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePatient = () => {
    setSelectedPatient(undefined);
    setFormMode("create");
    setIsFormOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleDeletePatient = (patient: Patient) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le patient ${patient.firstName} ${patient.lastName} ?`)) {
      deleteMutation.mutate(patient.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="border border-slate-200">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Patients</h1>
            <p className="text-slate-600 mt-1">
              {patients?.length || 0} patient{(patients?.length || 0) > 1 ? 's' : ''} enregistré{(patients?.length || 0) > 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            onClick={handleCreatePatient}
            className="bg-medical-blue text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Patient
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un patient par nom, téléphone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients && filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => {
              const initials = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
              const age = calculateAge(patient.birthDate);
              
              return (
                <Card key={patient.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-medical-blue rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{initials}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {patient.firstName} {patient.lastName}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {age} ans • Né(e) le {new Date(patient.birthDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {patient.phone && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Phone className="h-4 w-4 mr-2 text-slate-400" />
                            {patient.phone}
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Mail className="h-4 w-4 mr-2 text-slate-400" />
                            {patient.email}
                          </div>
                        )}
                        {patient.address && (
                          <div className="flex items-center text-sm text-slate-600">
                            <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                            {patient.address}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                          Créé le {new Date(patient.createdAt!).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditPatient(patient)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeletePatient(patient)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-slate-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchTerm ? "Aucun patient trouvé" : "Aucun patient enregistré"}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchTerm 
                  ? "Essayez de modifier votre recherche ou d'ajouter un nouveau patient"
                  : "Commencez par ajouter votre premier patient"
                }
              </p>
              <Button 
                onClick={handleCreatePatient}
                className="bg-medical-blue text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Patient
              </Button>
            </div>
          )}
        </div>

        <PatientFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          patient={selectedPatient}
          mode={formMode}
        />
      </div>
    </div>
  );
}