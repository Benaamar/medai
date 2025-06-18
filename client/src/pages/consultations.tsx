import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Calendar, Clock, User, FileText, Filter, Search } from "lucide-react";
import Header from "@/components/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConsultationWithPatient } from "@shared/schema";

export default function Consultations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: consultations, isLoading } = useQuery<ConsultationWithPatient[]>({
    queryKey: ["/api/consultations/today"],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Terminé", className: "bg-medical-green text-white" },
      "in-progress": { label: "En cours", className: "bg-medical-amber text-white" },
      scheduled: { label: "En attente", className: "bg-slate-400 text-white" },
      cancelled: { label: "Annulé", className: "bg-medical-red text-white" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge className={`${config.className} text-xs`}>{config.label}</Badge>;
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

  const filteredConsultations = consultations?.filter(consultation => {
    const matchesSearch = `${consultation.patient.firstName} ${consultation.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || consultation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Card key={i} className="border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-16" />
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
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Consultations</h1>
            <p className="text-slate-600 mt-1">
              {consultations?.length || 0} consultation{(consultations?.length || 0) > 1 ? 's' : ''} programmée{(consultations?.length || 0) > 1 ? 's' : ''} aujourd'hui
            </p>
          </div>
          <Button className="bg-medical-blue text-white hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Consultation
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par patient ou motif..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="scheduled">En attente</SelectItem>
                <SelectItem value="in-progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredConsultations && filteredConsultations.length > 0 ? (
            filteredConsultations.map((consultation) => {
              const initials = `${consultation.patient.firstName[0]}${consultation.patient.lastName[0]}`.toUpperCase();
              const age = calculateAge(consultation.patient.birthDate);
              
              return (
                <Card key={consultation.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-medical-blue rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{initials}</span>
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-slate-900">
                            {consultation.patient.firstName} {consultation.patient.lastName}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {age} ans
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {consultation.time}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(consultation.date).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 font-medium">{consultation.reason}</p>
                          {consultation.notes && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{consultation.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right space-y-2">
                          {getStatusBadge(consultation.status)}
                          {consultation.diagnosis && (
                            <p className="text-xs text-slate-500">
                              Diagnostic: {consultation.diagnosis}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                          {consultation.status === "scheduled" && (
                            <Button size="sm" className="bg-medical-green text-white hover:bg-green-700">
                              Commencer
                            </Button>
                          )}
                          {consultation.status === "in-progress" && (
                            <Button size="sm" className="bg-medical-amber text-white hover:bg-amber-700">
                              Continuer
                            </Button>
                          )}
                          {consultation.status === "completed" && (
                            <Button variant="outline" size="sm">
                              Voir résumé
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border border-slate-200">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {searchTerm || statusFilter !== "all" ? "Aucune consultation trouvée" : "Aucune consultation programmée"}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Essayez de modifier vos critères de recherche"
                    : "Commencez par programmer une nouvelle consultation"
                  }
                </p>
                <Button className="bg-medical-blue text-white hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Consultation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}