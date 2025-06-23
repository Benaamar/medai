import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import type { ConsultationWithPatient } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function UpcomingAppointmentsCard() {
  const { data, isLoading } = useQuery<ConsultationWithPatient[]>({
    queryKey: ["/api/appointments/upcoming"],
    refetchInterval: 30000, // rafraîchit toutes les 30 s
  });

  // Helper to sort by date then time
  const sorted = data?.slice().sort((a,b)=>{
    if(a.date===b.date){return a.time.localeCompare(b.time);}return a.date.localeCompare(b.date);
  });

  return (
    <Card className="border border-slate-200 w-full lg:w-80 flex-shrink-0">
      <CardHeader className="px-4 py-2 border-b border-slate-200">
        <h3 className="text-md font-semibold text-slate-900 flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-medical-blue" /> Rendez-vous à venir
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        ) : sorted && sorted.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {sorted.slice(0,3).map((a) => (
              <div key={a.id} className="p-4 text-sm space-y-1">
                <p className="font-semibold text-slate-800">
                  {a.patient.firstName} {a.patient.lastName}
                </p>
                <p className="text-slate-600">
                  {format(new Date(a.date), "dd/MM/yyyy", { locale: fr })} à {a.time}
                </p>
                <p className="text-slate-500">{a.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500">Aucun rendez-vous planifié</div>
        )}
      </CardContent>
    </Card>
  );
} 