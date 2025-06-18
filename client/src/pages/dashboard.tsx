import { useState } from "react";
import Header from "@/components/header";
import DashboardStats from "@/components/dashboard-stats";
import ConsultationsList from "@/components/consultations-list";
import AiAssistant from "@/components/ai-assistant";
import AiSummaryModal from "@/components/ai-summary-modal";

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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ConsultationsList />
          </div>
          <div>
            <AiAssistant onViewSummary={handleViewSummary} />
          </div>
        </div>
      </div>

      {selectedSummary && (
        <AiSummaryModal
          summary={selectedSummary}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
