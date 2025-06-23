import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import ConsultationFormModal from "./consultation-form-modal";
import PatientDetailsModal from "./patient-details-modal";
import type { ConsultationWithPatient } from "@shared/schema";

export default function ConsultationsList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationWithPatient | undefined>(undefined);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const { data: consultations, isLoading, error } = useQuery<ConsultationWithPatient[]>({
    queryKey: ["/api/consultations"],
  });
  
  const openConsultationForm = (consultation?: ConsultationWithPatient) => {
    setSelectedConsultation(consultation);
    setIsFormOpen(true);
  };

  const openDetailsModal = (consultation: ConsultationWithPatient) => {
    setSelectedConsultation(consultation);
    setDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Terminé", className: "bg-medical-green text-white" },
      "in-progress": { label: "En cours", className: "bg-medical-amber text-white" },
      scheduled: { label: "En attente", className: "bg-slate-400 text-white" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge className={`${config.className} text-xs`}>{config.label}</Badge>;
  };

  const getStatusAction = (status: string) => {
    const actions = {
      completed: "Voir détails",
      "in-progress": "Continuer",
      scheduled: "Commencer"
    };
    return actions[status as keyof typeof actions] || "Voir détails";
  };

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

  if (isLoading) {
    return (
      <Card className="border border-slate-200">
        <CardHeader className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ConsultationFormModal 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setSelectedConsultation(undefined);
        }} 
        mode={selectedConsultation ? "edit" : "create"} 
        consultation={selectedConsultation}
      />
      
      <Card className="border border-slate-200">
        <CardHeader className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Consultations du Jour</h2>
            <Button 
              className="bg-medical-blue text-white hover:bg-blue-700"
              onClick={() => openConsultationForm()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Consultation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {consultations && consultations.length > 0 ? (
              consultations.map((consultation) => {
                const initials = `${consultation.patient.firstName[0]}${consultation.patient.lastName[0]}`.toUpperCase();
                const age = calculateAge(consultation.patient.birthDate);
                
                return (
                  <div key={consultation.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-slate-600 font-medium text-sm">{initials}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            {consultation.patient.firstName} {consultation.patient.lastName}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Né(e) le {new Date(consultation.patient.birthDate).toLocaleDateString('fr-FR')} ({age} ans)
                          </p>
                          <p className="text-xs text-slate-400">{consultation.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-slate-900">{consultation.time}</span>
                          {getStatusBadge(consultation.status)}
                        </div>
                        {consultation.status === "completed" ? (
                          <button
                            className="text-medical-blue hover:text-blue-700 text-sm font-medium"
                            onClick={() => openDetailsModal(consultation)}
                          >
                            Voir détails <ChevronRight className="inline h-3 w-3 ml-1" />
                          </button>
                        ) : (
                          <button
                            className="text-medical-blue hover:text-blue-700 text-sm font-medium"
                            onClick={() => openConsultationForm(consultation)}
                          >
                            {getStatusAction(consultation.status)} <ChevronRight className="inline h-3 w-3 ml-1" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500">
                <p>Aucune consultation programmée pour aujourd'hui</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {selectedConsultation && (
        <PatientDetailsModal
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          patientId={selectedConsultation.patient.id}
          patientName={`${selectedConsultation.patient.firstName} ${selectedConsultation.patient.lastName}`}
        />
      )}
    </>
  );
}
