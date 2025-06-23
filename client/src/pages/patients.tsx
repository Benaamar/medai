import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Phone, Mail, MapPin, Calendar as CalendarIcon, Edit, Eye, Trash2, Users, Sparkles, X } from "lucide-react";
import FloatingChatButton from "../components/floating-chat-button";
import Header from "../components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import SearchBar from "../components/ui/search-bar";
import DateRangePicker from "../components/ui/date-range-picker";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import PatientFormModal from "../components/patient-form-modal";
import type { Patient } from "@shared/schema";
import PatientDetailsModal from "../components/patient-details-modal";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(undefined);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();


  const { data: patients, isLoading, error } = useQuery<Patient[]>({
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

  const filteredPatients = patients?.filter(patient => {
    const matchText = `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone?.includes(searchTerm) ?? false) ||
      (patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    let inDate = true;
    if (startDate || endDate) {
      if (patient.createdAt) {
        const patientDate = new Date(patient.createdAt);
        const created = patientDate.toISOString().split("T")[0];
        
        if (startDate && endDate) {
          inDate = created >= startDate && created <= endDate;
        } else if (startDate) {
          inDate = created >= startDate;
        } else if (endDate) {
          inDate = created <= endDate;
        }
      } else {
        inDate = false;
      }
    }
    
    return matchText && inDate;
  });

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

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const handleDeletePatient = (patient: Patient) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le patient ${patient.firstName} ${patient.lastName} ?`)) {
      deleteMutation.mutate(patient.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-12 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="border border-slate-200 rounded-2xl">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <Users className="h-8 w-8 mr-3 text-green-200" />
                  Gestion des Patients
                </h1>
                <p className="text-green-100 text-lg">
                  {patients?.length || 0} patient{(patients?.length || 0) > 1 ? 's' : ''} enregistré{(patients?.length || 0) > 1 ? 's' : ''}
                </p>
              </div>
              <Button 
                onClick={handleCreatePatient} 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouveau Patient
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 mb-8">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_auto]">
            <SearchBar 
              placeholder="Recherche par nom, téléphone ou email..." 
              onSearch={setSearchTerm} 
              className="w-full rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500" 
            />
            <DateRangePicker 
              start={startDate} 
              end={endDate} 
              onStart={setStartDate} 
              onEnd={setEndDate} 
              className="w-full lg:w-auto rounded-xl" 
            />
          </div>
        </div>

        {error ? (
          <div className="text-center py-16">
            <div className="bg-red-50 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">Erreur lors du chargement des patients</p>
            </div>
          </div>
        ) : filteredPatients?.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-slate-50 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm ? "Aucun patient trouvé" : "Aucun patient enregistré"}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchTerm ? "Essayez de modifier votre recherche" : "Commencez par ajouter votre premier patient"}
              </p>
              <Button onClick={handleCreatePatient} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Patient
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients?.map((patient) => (
              <Card key={patient.id} className="group hover:shadow-xl transition-all duration-300 border border-slate-200/50 rounded-2xl overflow-hidden bg-white hover:-translate-y-1">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {patient.firstName[0]}{patient.lastName[0]}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-900 group-hover:text-green-600 transition-colors">
                          {patient.firstName} {patient.lastName}
                        </CardTitle>
                                                 <CardDescription className="text-slate-600">
                           {calculateAge(patient.birthDate)} ans
                         </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-slate-600">
                      <Mail className="h-4 w-4 mr-3 text-green-500" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Phone className="h-4 w-4 mr-3 text-green-500" />
                      <span>{patient.phone}</span>
                    </div>
                    {patient.address && (
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mr-3 text-green-500" />
                        <span className="truncate">{patient.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPatient(patient)}
                      className="flex-1 rounded-xl border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Détails
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPatient(patient)}
                      className="flex-1 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        patient={selectedPatient}
        mode={formMode}
      />

      {selectedPatient && (
        <PatientDetailsModal
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
        />
      )}

      {/* Floating Chat */}
      <FloatingChatButton
        gradientColors="from-green-600 to-emerald-600"
        focusColor="green-500"
        shadowColor="green-500/25"
      />
    </div>
  );
} 