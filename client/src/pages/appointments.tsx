import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import type { ConsultationWithPatient } from "@shared/schema";
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Calendar, CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import AppointmentFormModal from "../components/appointment-form-modal";
import FloatingChatButton from "../components/floating-chat-button";
import DateRangePicker from "../components/ui/date-range-picker";

export default function Appointments() {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const [selected, setSelected] = useState<ConsultationWithPatient | undefined>();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery<ConsultationWithPatient[]>({
    queryKey: ["/api/appointments/upcoming"],
  });

  const filtered = data?.filter(item => {
    const matchText = `${item.patient.firstName} ${item.patient.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      item.reason.toLowerCase().includes(search.toLowerCase());
    
    // Filtre de date pour les rendez-vous
    let inDate = true;
    if (startDate || endDate) {
      if (item.date) {
        const appointmentDate = item.date.includes('T') 
          ? new Date(item.date).toISOString().split("T")[0]
          : item.date.split(' ')[0]; // Au cas où il y aurait un format avec heure
        inDate = (!startDate || appointmentDate >= startDate) && (!endDate || appointmentDate <= endDate);
      } else {
        // Si pas de date et qu'un filtre de date est actif, exclure
        inDate = false;
      }
    }
    
    return matchText && inDate;
  }) || [];

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      case 'in-progress': return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'completed': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'cancelled': return 'bg-gradient-to-r from-red-500 to-red-600';
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programmé';
      case 'in-progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return 'Inconnu';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <CalendarDays className="h-8 w-8 mr-3 text-indigo-200" />
                  Gestion des Rendez-vous
                </h1>
                <p className="text-indigo-100 text-lg">
                  {data?.length || 0} rendez-vous programmé{(data?.length || 0) > 1 ? 's' : ''}
                </p>
              </div>
              <Button 
                onClick={() => setModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouveau Rendez-vous
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 mb-8">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher par patient ou motif..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
              />
            </div>
            <DateRangePicker 
              start={startDate} 
              end={endDate} 
              onStart={setStartDate} 
              onEnd={setEndDate} 
              className="w-full lg:w-auto rounded-xl" 
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-slate-50 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {search ? "Aucun rendez-vous trouvé" : "Aucun rendez-vous programmé"}
              </h3>
              <p className="text-slate-600 mb-6">
                {search ? "Essayez de modifier votre recherche" : "Commencez par programmer votre premier rendez-vous"}
              </p>
              <Button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Rendez-vous
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((appointment) => (
                <Card key={appointment.id} className="group hover:shadow-xl transition-all duration-300 border border-slate-200/50 rounded-2xl overflow-hidden bg-white hover:-translate-y-1">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {appointment.patient.firstName[0]}{appointment.patient.lastName[0]}
                        </div>
                        <div>
                          <CardTitle className="text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </CardTitle>
                          <CardDescription className="text-slate-600">
                            {appointment.reason}
                          </CardDescription>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                          <div className="flex items-center text-indigo-700">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Date</span>
                          </div>
                          <p className="text-indigo-900 font-semibold mt-1">
                            {format(new Date(appointment.date), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <div className="flex items-center text-purple-700">
                            <Clock className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Heure</span>
                          </div>
                          <p className="text-purple-900 font-semibold mt-1">
                            {appointment.time}
                          </p>
                        </div>
                      </div>
                      
                      {appointment.notes && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <p className="text-xs text-slate-600 leading-relaxed">{appointment.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {setSelected(appointment); setModalOpen(true);}}
                          className="flex-1 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center py-8">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 px-6 py-3">
                  <div className="flex items-center space-x-4">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                      className="p-2 rounded-xl hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-medium text-slate-700 px-4">
                      Page {page + 1} sur {totalPages}
                    </span>
                    <button
                      disabled={page + 1 >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="p-2 rounded-xl hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {modalOpen && (
          <AppointmentFormModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelected(undefined);
            }}
          />
        )}

        {/* Floating Chat */}
        <FloatingChatButton
          gradientColors="from-indigo-600 to-purple-600"
          focusColor="indigo-500"
          shadowColor="indigo-500/25"
        />
      </div>
    </div>
  );
} 