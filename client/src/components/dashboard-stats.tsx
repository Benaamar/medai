import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, CheckCircle, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  todayConsultations: number;
  waitingPatients: number;
  completedConsultations: number;
  aiSummaries: number;
}

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Consultations Aujourd'hui",
      value: stats?.todayConsultations || 0,
      icon: Calendar,
      color: "text-medical-blue"
    },
    {
      label: "En Attente",
      value: stats?.waitingPatients || 0,
      icon: Clock,
      color: "text-medical-amber"
    },
    {
      label: "Terminées",
      value: stats?.completedConsultations || 0,
      icon: CheckCircle,
      color: "text-medical-green"
    },
    {
      label: "Synthèses IA",
      value: stats?.aiSummaries || 0,
      icon: Bot,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Card key={index} className="border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <IconComponent className={`${item.color} text-2xl`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
