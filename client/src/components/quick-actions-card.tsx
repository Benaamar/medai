import { Calendar, FileCheck, Pill, UserPlus } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";

interface QuickActionsProps {
  onNewPrescription: () => void;
  onPlanAppointment: () => void;
  onNewPatient: () => void;
  onCertificate: () => void;
}

export default function QuickActionsCard({
  onNewPrescription,
  onPlanAppointment,
  onNewPatient,
  onCertificate,
}: QuickActionsProps) {
  return (
    <Card className="border border-slate-200 w-full lg:w-80 flex-shrink-0">
      <CardHeader className="px-4 py-2 border-b border-slate-200">
        <h3 className="text-md font-semibold text-slate-900">Actions Rapides</h3>
      </CardHeader>
      <CardContent className="p-3 space-y-1">
        <Button size="sm" variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-50" onClick={onNewPrescription}>
          <Pill className="text-medical-green mr-3 h-4 w-4" />
          Nouvelle ordonnance
        </Button>
        <Button size="sm" variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-50" onClick={onPlanAppointment}>
          <Calendar className="text-medical-blue mr-3 h-4 w-4" />
          Planifier RDV
        </Button>
        <Button size="sm" variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-50" onClick={onNewPatient}>
          <UserPlus className="text-purple-600 mr-3 h-4 w-4" />
          Nouveau patient
        </Button>
        <Button size="sm" variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-50" onClick={onCertificate}>
          <FileCheck className="text-medical-amber mr-3 h-4 w-4" />
          Certificat médical
        </Button>
      </CardContent>
    </Card>
  );
} 