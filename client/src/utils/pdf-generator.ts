// Utilitaire pour générer des PDFs et imprimer des documents médicaux
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DocumentData {
  type: 'certificate' | 'prescription' | 'consultation';
  content: string;
  patientName: string;
  date: string;
  doctorName?: string;
  clinicInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

// Fonction pour créer et télécharger un PDF
export const generatePDF = async (data: DocumentData) => {
  try {
    // Créer un élément temporaire avec le contenu HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generateHTMLDocument(escapeDocumentData(data));
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '794px'; // Largeur A4 en pixels (210mm)
    tempDiv.style.backgroundColor = 'white';
    document.body.appendChild(tempDiv);

    // Attendre que les styles soient appliqués
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capturer l'élément en canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123 // Hauteur A4 en pixels (297mm)
    });

    // Supprimer l'élément temporaire
    document.body.removeChild(tempDiv);

    // Créer le PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Ajouter la première page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Ajouter des pages supplémentaires si nécessaire
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Télécharger le PDF
    const filename = `${getDocumentTitle(data.type)}_${data.patientName.replace(/\s+/g, '_')}_${data.date.replace(/\//g, '-')}.pdf`;
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    // Fallback vers la méthode d'impression
    return generatePDFPrint(data);
  }
};

// Fonction fallback pour créer un PDF en utilisant l'API Print du navigateur
export const generatePDFPrint = (data: DocumentData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour télécharger le PDF');
    return false;
  }

  const htmlContent = generateHTMLDocument(escapeDocumentData(data));
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Attendre que le contenu soit chargé avant d'imprimer
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Fermer la fenêtre après impression (optionnel)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  };
  
  return true;
};

// Fonction pour imprimer directement
export const printDocument = (data: DocumentData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour imprimer');
    return;
  }

  const htmlContent = generateHTMLDocument(escapeDocumentData(data));
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
};

// Fonction pour télécharger en tant que fichier texte (fallback)
export const downloadAsText = (data: DocumentData) => {
  const filename = `${data.type}_${data.patientName.replace(/\s+/g, '_')}_${data.date.replace(/\//g, '-')}.txt`;
  const content = formatDocumentContent(data);
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Fonction de sécurisation des données pour éviter les injections XSS
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Fonction pour échapper toutes les données utilisateur dans DocumentData
const escapeDocumentData = (data: DocumentData): DocumentData => {
  return {
    ...data,
    content: escapeHtml(data.content),
    patientName: escapeHtml(data.patientName),
    date: escapeHtml(data.date),
    doctorName: data.doctorName ? escapeHtml(data.doctorName) : data.doctorName,
    clinicInfo: data.clinicInfo ? {
      name: escapeHtml(data.clinicInfo.name),
      address: escapeHtml(data.clinicInfo.address),
      phone: escapeHtml(data.clinicInfo.phone),
      email: escapeHtml(data.clinicInfo.email)
    } : data.clinicInfo
  };
};

// Génération du contenu HTML pour l'impression/PDF
const generateHTMLDocument = (data: DocumentData): string => {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const doctorName = data.doctorName || 'Dr. Médecin';
  const clinicInfo = data.clinicInfo || {
    name: 'Cabinet Médical',
    address: '123 Rue de la Santé, 75000 Paris',
    phone: '01 23 45 67 89',
    email: 'contact@cabinet-medical.fr'
  };

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${getDocumentTitle(data.type)} - ${data.patientName}</title>
        <style>
            @media print {
                @page {
                    margin: 2cm;
                    size: A4;
                }
                body {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                width: 794px;
                margin: 0;
                padding: 40px;
                background: white;
                box-sizing: border-box;
            }
            
            .header {
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            
            .clinic-info {
                text-align: left;
            }
            
            .clinic-name {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 5px;
            }
            
            .clinic-details {
                font-size: 14px;
                color: #666;
                line-height: 1.4;
            }
            
            .document-type {
                text-align: right;
                background: ${getTypeColorSolid(data.type)};
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                font-weight: bold;
                font-size: 18px;
            }
            
            .patient-info {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 30px;
            }
            
            .patient-name {
                font-size: 20px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 10px;
            }
            
            .document-date {
                color: #64748b;
                font-size: 14px;
            }
            
            .content {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 30px;
                margin-bottom: 30px;
                min-height: 400px;
            }
            
            .content h3 {
                color: #2563eb;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            
            .content pre {
                white-space: pre-wrap;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                margin: 0;
            }
            
            .footer {
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
                text-align: center;
                color: #64748b;
                font-size: 12px;
            }
            
            .signature-section {
                margin-top: 50px;
                text-align: right;
            }
            
            .signature-line {
                border-bottom: 1px solid #333;
                width: 200px;
                margin: 30px 0 10px auto;
            }
            
            .doctor-name {
                font-weight: bold;
                color: #2563eb;
            }
            
            .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 100px;
                color: rgba(37, 99, 235, 0.1);
                z-index: -1;
                pointer-events: none;
            }
        </style>
    </head>
    <body>
        <div class="watermark">MÉDICAL</div>
        
        <div class="header">
            <div class="clinic-info">
                <div class="clinic-name">${clinicInfo.name}</div>
                <div class="clinic-details">
                    ${clinicInfo.address}<br>
                    Tél: ${clinicInfo.phone}<br>
                    Email: ${clinicInfo.email}
                </div>
            </div>
            <div class="document-type">
                ${getDocumentTitle(data.type)}
            </div>
        </div>
        
        <div class="patient-info">
            <div class="patient-name">Patient: ${data.patientName}</div>
            <div class="document-date">Date: ${data.date}</div>
        </div>
        
        <div class="content">
            <h3>${getDocumentTitle(data.type)}</h3>
            <pre>${data.content}</pre>
        </div>
        
        <div class="signature-section">
            <div>Fait le ${currentDate}</div>
            <div class="signature-line"></div>
            <div class="doctor-name">${doctorName}</div>
        </div>
        
        <div class="footer">
            Document généré par le système de gestion médicale
        </div>
    </body>
    </html>
  `;
};

// Formatage du contenu pour le téléchargement texte
const formatDocumentContent = (data: DocumentData): string => {
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const doctorName = data.doctorName || 'Dr. Médecin';
  
  return `
${getDocumentTitle(data.type).toUpperCase()}

Patient: ${data.patientName}
Date: ${data.date}

${'-'.repeat(50)}

${data.content}

${'-'.repeat(50)}

Fait le ${currentDate}
${doctorName}

Document généré par le système de gestion médicale
  `.trim();
};

// Helpers
const getDocumentTitle = (type: string): string => {
  switch (type) {
    case 'certificate':
      return 'Certificat Médical';
    case 'prescription':
      return 'Ordonnance Médicale';
    case 'consultation':
      return 'Synthèse de Consultation';
    default:
      return 'Document Médical';
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'certificate':
      return 'linear-gradient(135deg, #f59e0b, #d97706)';
    case 'prescription':
      return 'linear-gradient(135deg, #10b981, #059669)';
    case 'consultation':
      return 'linear-gradient(135deg, #06b6d4, #0891b2)';
    default:
      return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
  }
};

const getTypeColorSolid = (type: string): string => {
  switch (type) {
    case 'certificate':
      return '#f59e0b';
    case 'prescription':
      return '#10b981';
    case 'consultation':
      return '#06b6d4';
    default:
      return '#8b5cf6';
  }
}; 