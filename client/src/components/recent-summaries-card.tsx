import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, FileText, Mail } from "lucide-react";
import { AiSummaryWithDetails } from "@shared/schema";
import React, { useState, useEffect } from "react";
import { RxPaperPlane, RxCheckCircled } from "react-icons/rx";

interface Props {
  patientId?: number;
  onView: (summary: { content: string; patientName: string; consultationDate: string; type: string }) => void;
}

const pageSize = 5;

export default function RecentSummariesCard({ patientId, onView }: Props) {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery<AiSummaryWithDetails[]>({
    queryKey: ["/api/ai-summaries", patientId ?? "all"],
    queryFn: async () => {
      const url = patientId ? `/api/ai-summaries?patientId=${patientId}` : "/api/ai-summaries?limit=20";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur fetch summaries");
      return res.json();
    },
  });

  useEffect(() => setPage(0), [patientId]);

  const paginated = data?.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = data ? Math.ceil(data.length / pageSize) : 0;

  const getIcon = (type: string) => {
    switch (type) {
      case "consultation":
        return <FileText className="text-medical-blue" />;
      case "prescription":
        return <RxPaperPlane />;
      case "referral":
        return <Mail className="text-purple-600" />;
      case "certificate":
        return <RxCheckCircled />;
      default:
        return <FileText className="text-medical-blue" />;
    }
  };

  return (
    <Card className="border border-slate-200 w-full lg:w-80 flex-shrink-0">
      <CardHeader className="px-4 py-2 border-b border-slate-200">
        <h3 className="text-md font-semibold text-slate-900">Synthèses Récentes</h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-200">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-4 w-4 mt-1" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))
          ) : paginated && paginated.length > 0 ? (
            paginated.map((s) => (
              <div key={s.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">{getIcon(s.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {s.patient.firstName} {s.patient.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(s.generatedAt!).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {s.content.substring(0, 100)}...
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onView({
                    content: s.content,
                    patientName: `${s.patient.firstName} ${s.patient.lastName}`,
                    consultationDate: new Date(s.generatedAt!).toLocaleDateString("fr-FR"),
                    type: s.type,
                  })} className="text-medical-blue">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-500">Aucune synthèse récente</p>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center py-2 space-x-2">
              <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Précédent
              </Button>
              <span className="text-xs text-slate-500">
                Page {page + 1} / {totalPages}
              </span>
              <Button variant="ghost" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Suivant
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 