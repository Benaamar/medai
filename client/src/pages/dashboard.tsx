import { useState } from "react";
import Header from "../components/header";
import DashboardStats from "../components/dashboard-stats";
import ConsultationsList from "../components/consultations-list";
import AiSummaryModal from "../components/ai-summary-modal";
import QuickActionsCard from "../components/quick-actions-card";
import RecentSummariesCard from "../components/recent-summaries-card";
import PrescriptionFormModal from "../components/prescription-form-modal";
import AppointmentFormModal from "../components/appointment-form-modal";
import PatientFormModal from "../components/patient-form-modal";
import MedicalCertificateModal from "../components/medical-certificate-modal";
import UpcomingAppointmentsCard from "../components/upcoming-appointments-card";
import { Sparkles } from "lucide-react";
import FloatingChatButton from "../components/floating-chat-button";

export default function Dashboard() {
  const [selectedSummary, setSelectedSummary] = useState<{
    content: string;
    patientName: string;
    consultationDate: string;
    type: string;
  } | null>(null);

  const handleViewSummary = (summary: {
    content: string;
    patientName: string;
    consultationDate: string;
    type: string;
  }) => {
    setSelectedSummary(summary);
  };

  const handleCloseModal = () => {
    setSelectedSummary(null);
  };

  // Quick actions modals
  const [isPrescriptionOpen, setPrescriptionOpen] = useState(false);
  const [isAppointmentOpen, setAppointmentOpen] = useState(false);
  const [isPatientModalOpen, setPatientModalOpen] = useState(false);
  const [isCertificateOpen, setCertificateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <Sparkles className="h-8 w-8 mr-3 text-yellow-300" />
                  Tableau de Bord Médical
                </h1>
                <p className="text-blue-100 text-lg">
                  Gérez vos consultations, patients et rendez-vous en toute simplicité
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">
                    {new Date().toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 mt-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
              <QuickActionsCard
                onNewPrescription={() => setPrescriptionOpen(true)}
                onPlanAppointment={() => setAppointmentOpen(true)}
                onNewPatient={() => setPatientModalOpen(true)}
                onCertificate={() => setCertificateOpen(true)}
              />
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
              <UpcomingAppointmentsCard />
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
              <RecentSummariesCard patientId={undefined} onView={handleViewSummary} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></div>
                Consultations Récentes
              </h2>
            </div>
            <div className="p-6">
              <ConsultationsList />
            </div>
          </div>
        </div>
      </div>

      {selectedSummary && (
        <AiSummaryModal
          isOpen={!!selectedSummary}
          summary={selectedSummary}
          onClose={handleCloseModal}
        />
      )}

      {/* Modals triggered by quick actions */}
      <PrescriptionFormModal isOpen={isPrescriptionOpen} onClose={() => setPrescriptionOpen(false)} />
      <AppointmentFormModal isOpen={isAppointmentOpen} onClose={() => setAppointmentOpen(false)} />
      <PatientFormModal isOpen={isPatientModalOpen} onClose={() => setPatientModalOpen(false)} mode="create" />
      <MedicalCertificateModal isOpen={isCertificateOpen} onClose={() => setCertificateOpen(false)} />

      {/* Floating Chat */}
      <FloatingChatButton
        gradientColors="from-purple-600 to-indigo-600"
        focusColor="purple-500"
        shadowColor="purple-500/25"
      />
    </div>
  );
}
