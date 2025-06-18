import { db } from "./db";
import { users, patients, consultations, aiSummaries } from "@shared/schema";

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return true;
    }

    // Create sample doctor
    const [doctor] = await db
      .insert(users)
      .values({
        username: "doctor",
        password: "password",
        name: "Dr. Marie Dubois",
        role: "doctor"
      })
      .returning();

    // Create sample patients
    const patientData = [
      {
        firstName: "Jean",
        lastName: "Martin",
        birthDate: "1985-03-15",
        phone: "01 42 56 78 90",
        email: "jean.martin@email.com",
        address: "12 rue de la Paix, 75001 Paris"
      },
      {
        firstName: "Sophie",
        lastName: "Dubois",
        birthDate: "1992-07-22",
        phone: "01 43 67 89 01",
        email: "sophie.dubois@email.com",
        address: "45 avenue Victor Hugo, 75016 Paris"
      },
      {
        firstName: "Pierre",
        lastName: "Leroy",
        birthDate: "1975-11-08",
        phone: "01 44 78 90 12",
        email: "pierre.leroy@email.com",
        address: "8 boulevard Saint-Germain, 75005 Paris"
      },
      {
        firstName: "Marie",
        lastName: "Moreau",
        birthDate: "1988-01-30",
        phone: "01 45 89 01 23",
        email: "marie.moreau@email.com",
        address: "23 rue du Faubourg Saint-Antoine, 75011 Paris"
      },
      {
        firstName: "Thomas",
        lastName: "Bernard",
        birthDate: "1995-09-14",
        phone: "01 46 90 12 34",
        email: "thomas.bernard@email.com",
        address: "67 rue de Rivoli, 75004 Paris"
      }
    ];

    const createdPatients = await db
      .insert(patients)
      .values(patientData)
      .returning();

    // Create sample consultations for today
    const today = new Date().toISOString().split('T')[0];
    
    const consultationData = [
      {
        patientId: createdPatients[0].id,
        doctorId: doctor.id,
        date: today,
        time: "09:00",
        reason: "Contrôle de tension artérielle",
        status: "completed",
        notes: "Patient présente une légère hypertension. TA: 145/90 mmHg. Recommandation de réduire le sel et de faire plus d'exercice.",
        diagnosis: "Hypertension artérielle légère",
        treatment: "Amlodipine 5mg 1cp/jour, contrôle dans 1 mois"
      },
      {
        patientId: createdPatients[1].id,
        doctorId: doctor.id,
        date: today,
        time: "09:30",
        reason: "Douleurs abdominales",
        status: "in-progress",
        notes: "Douleurs épigastriques depuis 2 jours, pas de fièvre. Abdomen souple, sensible en épigastre.",
        diagnosis: "Gastrite probable",
        treatment: "IPP, régime alimentaire adapté"
      },
      {
        patientId: createdPatients[2].id,
        doctorId: doctor.id,
        date: today,
        time: "10:00",
        reason: "Toux persistante",
        status: "scheduled",
        notes: null,
        diagnosis: null,
        treatment: null
      },
      {
        patientId: createdPatients[3].id,
        doctorId: doctor.id,
        date: today,
        time: "10:30",
        reason: "Renouvellement ordonnance",
        status: "completed",
        notes: "Patiente sous traitement pour diabète type 2. Glycémie bien contrôlée. HbA1c = 6.8%.",
        diagnosis: "Diabète type 2 équilibré",
        treatment: "Metformine 850mg 2cp/jour, poursuite du traitement"
      },
      {
        patientId: createdPatients[4].id,
        doctorId: doctor.id,
        date: today,
        time: "11:00",
        reason: "Mal de dos",
        status: "scheduled",
        notes: null,
        diagnosis: null,
        treatment: null
      }
    ];

    const createdConsultations = await db
      .insert(consultations)
      .values(consultationData)
      .returning();

    // Create sample AI summaries
    const summaryData = [
      {
        consultationId: createdConsultations[0].id,
        patientId: createdPatients[0].id,
        doctorId: doctor.id,
        type: "consultation",
        content: `SYNTHÈSE DE CONSULTATION MÉDICALE

Patient: Jean MARTIN, 39 ans, né le 15/03/1985

MOTIF DE CONSULTATION:
Contrôle de tension artérielle

ANAMNÈSE:
Patient suivi pour surveillance tensionnelle. Antécédents familiaux d'hypertension artérielle. Mode de vie sédentaire, consommation de sel importante.

EXAMEN CLINIQUE:
- État général conservé
- Poids: stable
- Tension artérielle: 145/90 mmHg (confirmée par 3 mesures)
- Auscultation cardiaque: rythme régulier, pas de souffle
- Examen neurologique: normal

DIAGNOSTIC:
Hypertension artérielle légère

CONDUITE À TENIR:
- Prescription d'Amlodipine 5mg 1 comprimé par jour
- Conseils hygiéno-diététiques: réduction du sel, activité physique régulière
- Contrôle tensionnel dans 1 mois
- Surveillance biologique (créatinine, ionogramme) dans 3 mois`
      },
      {
        consultationId: createdConsultations[3].id,
        patientId: createdPatients[3].id,
        doctorId: doctor.id,
        type: "prescription",
        content: `ORDONNANCE MÉDICALE

Dr. Marie DUBOIS
Médecin Généraliste
123 Avenue des Champs-Élysées, 75008 Paris
Tél: 01 42 56 78 90

Patient: Marie MOREAU
Née le 30/01/1988 (36 ans)
23 rue du Faubourg Saint-Antoine, 75011 Paris

Paris, le ${new Date().toLocaleDateString('fr-FR')}

PRESCRIPTION:

1. METFORMINE 850 mg
   1 comprimé matin et soir au cours des repas
   Boîte de 90 comprimés
   QSP 45 jours
   Renouvellement: 2 fois

CONSEILS ET RECOMMANDATIONS:
- Prendre les comprimés pendant les repas pour limiter les troubles digestifs
- Surveiller la glycémie selon les recommandations
- Régime alimentaire adapté au diabète
- Activité physique régulière recommandée
- Contrôle biologique dans 3 mois (HbA1c, créatinine)

En cas d'effets indésirables, consulter rapidement.

Dr. Marie DUBOIS`
      },
      {
        consultationId: createdConsultations[0].id,
        patientId: createdPatients[0].id,
        doctorId: doctor.id,
        type: "referral",
        content: `COURRIER DE CORRESPONDANCE MÉDICALE

Dr. Marie DUBOIS
Médecin Généraliste
123 Avenue des Champs-Élysées, 75008 Paris
Tél: 01 42 56 78 90

À l'attention du Docteur [Cardiologue]

Cher(e) Confrère,

Je vous adresse Monsieur Jean MARTIN, né le 15/03/1985, pour avis cardiologique dans le cadre d'une hypertension artérielle récemment diagnostiquée.

ANAMNÈSE:
Ce patient de 39 ans consulte pour un contrôle tensionnel systématique. Il présente des antécédents familiaux d'hypertension artérielle du côté paternel. Mode de vie plutôt sédentaire avec une alimentation riche en sel.

EXAMEN CLINIQUE:
Lors de la consultation, la tension artérielle était mesurée à 145/90 mmHg (confirmée par plusieurs mesures). L'auscultation cardiaque révèle un rythme régulier sans souffle audible. L'examen général est par ailleurs normal.

EXAMENS COMPLÉMENTAIRES:
Pas d'examens récents disponibles.

TRAITEMENT ACTUEL:
Amlodipine 5mg 1 comprimé par jour débuté ce jour.

Je sollicite votre avis concernant:
- Évaluation du retentissement cardiovasculaire
- Pertinence d'examens complémentaires (ECG, échocardiographie, MAPA)
- Optimisation de la prise en charge thérapeutique

En vous remerciant pour votre collaboration.

Confraternellement,

Dr. Marie DUBOIS`
      }
    ];

    await db
      .insert(aiSummaries)
      .values(summaryData);

    console.log("Database seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
}