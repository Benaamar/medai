import { useNotifications } from './use-notifications';

export function useNotificationActions() {
  const { addNotification } = useNotifications();

  const notifyPatientCreated = (patientName: string) => {
    addNotification({
      title: 'Nouveau patient créé',
      message: `Le patient ${patientName} a été ajouté avec succès au système.`,
      type: 'patient',
    });
  };

  const notifyPatientUpdated = (patientName: string) => {
    addNotification({
      title: 'Patient modifié',
      message: `Les informations de ${patientName} ont été mises à jour.`,
      type: 'patient',
    });
  };

  const notifyConsultationCreated = (patientName: string) => {
    addNotification({
      title: 'Nouvelle consultation',
      message: `Une consultation a été créée pour ${patientName}.`,
      type: 'consultation',
    });
  };

  const notifyConsultationCompleted = (patientName: string) => {
    addNotification({
      title: 'Consultation terminée',
      message: `La consultation de ${patientName} a été marquée comme terminée.`,
      type: 'consultation',
    });
  };

  const notifyCertificateGenerated = (patientName: string) => {
    addNotification({
      title: 'Certificat médical généré',
      message: `Un certificat médical a été généré pour ${patientName}.`,
      type: 'certificate',
    });
  };

  const notifyPrescriptionGenerated = (patientName: string) => {
    addNotification({
      title: 'Ordonnance générée',
      message: `Une ordonnance a été générée pour ${patientName}.`,
      type: 'prescription',
    });
  };

  const notifyAppointmentCreated = (patientName: string, date: string) => {
    addNotification({
      title: 'Rendez-vous programmé',
      message: `Un rendez-vous a été programmé pour ${patientName} le ${date}.`,
      type: 'appointment',
    });
  };

  const notifyAppointmentUpdated = (patientName: string) => {
    addNotification({
      title: 'Rendez-vous modifié',
      message: `Le rendez-vous de ${patientName} a été modifié.`,
      type: 'appointment',
    });
  };

  const notifyAiSummaryGenerated = (type: string, patientName: string) => {
    const typeLabels = {
      certificate: 'certificat médical',
      prescription: 'ordonnance',
      consultation: 'résumé de consultation',
    };
    
    addNotification({
      title: 'Résumé IA généré',
      message: `Un ${typeLabels[type as keyof typeof typeLabels] || 'document'} a été généré par l'IA pour ${patientName}.`,
      type: type as any,
    });
  };

  const notifyGeneral = (title: string, message: string) => {
    addNotification({
      title,
      message,
      type: 'general',
    });
  };

  return {
    notifyPatientCreated,
    notifyPatientUpdated,
    notifyConsultationCreated,
    notifyConsultationCompleted,
    notifyCertificateGenerated,
    notifyPrescriptionGenerated,
    notifyAppointmentCreated,
    notifyAppointmentUpdated,
    notifyAiSummaryGenerated,
    notifyGeneral,
  };
} 