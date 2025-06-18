import { 
  users, patients, consultations, aiSummaries,
  type User, type InsertUser,
  type Patient, type InsertPatient,
  type Consultation, type InsertConsultation, type ConsultationWithPatient,
  type AiSummary, type InsertAiSummary, type AiSummaryWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Patient methods
  getPatient(id: number): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;

  // Consultation methods
  getConsultation(id: number): Promise<Consultation | undefined>;
  getAllConsultations(): Promise<ConsultationWithPatient[]>;
  getConsultationsByDate(date: string): Promise<ConsultationWithPatient[]>;
  getConsultationsByPatient(patientId: number): Promise<Consultation[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultation(id: number, consultation: Partial<InsertConsultation>): Promise<Consultation | undefined>;
  deleteConsultation(id: number): Promise<boolean>;

  // AI Summary methods
  getAiSummary(id: number): Promise<AiSummary | undefined>;
  getAiSummaryWithDetails(id: number): Promise<AiSummaryWithDetails | undefined>;
  getAiSummariesByPatient(patientId: number): Promise<AiSummaryWithDetails[]>;
  getRecentAiSummaries(limit?: number): Promise<AiSummaryWithDetails[]>;
  createAiSummary(summary: InsertAiSummary): Promise<AiSummary>;
  updateAiSummary(id: number, summary: Partial<InsertAiSummary>): Promise<AiSummary | undefined>;
  deleteAiSummary(id: number): Promise<boolean>;

  // Statistics
  getDashboardStats(): Promise<{
    todayConsultations: number;
    waitingPatients: number;
    completedConsultations: number;
    aiSummaries: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private consultations: Map<number, Consultation>;
  private aiSummaries: Map<number, AiSummary>;
  private currentUserId: number;
  private currentPatientId: number;
  private currentConsultationId: number;
  private currentAiSummaryId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.consultations = new Map();
    this.aiSummaries = new Map();
    this.currentUserId = 1;
    this.currentPatientId = 1;
    this.currentConsultationId = 1;
    this.currentAiSummaryId = 1;
  }

  private async initializeSampleData() {
    // Create sample doctor
    await this.createUser({
      username: "doctor",
      password: "password",
      name: "Dr. Marie Dubois",
      role: "doctor"
    });

    // Create sample patients
    const patient1 = await this.createPatient({
      firstName: "Jean",
      lastName: "Martin",
      birthDate: "1985-03-15",
      phone: "01 42 56 78 90",
      email: "jean.martin@email.com",
      address: "12 rue de la Paix, 75001 Paris"
    });

    const patient2 = await this.createPatient({
      firstName: "Sophie",
      lastName: "Dubois",
      birthDate: "1992-07-22",
      phone: "01 43 67 89 01",
      email: "sophie.dubois@email.com",
      address: "45 avenue Victor Hugo, 75016 Paris"
    });

    const patient3 = await this.createPatient({
      firstName: "Pierre",
      lastName: "Leroy",
      birthDate: "1975-11-08",
      phone: "01 44 78 90 12",
      email: "pierre.leroy@email.com",
      address: "8 boulevard Saint-Germain, 75005 Paris"
    });

    const patient4 = await this.createPatient({
      firstName: "Marie",
      lastName: "Moreau",
      birthDate: "1988-01-30",
      phone: "01 45 89 01 23",
      email: "marie.moreau@email.com",
      address: "23 rue du Faubourg Saint-Antoine, 75011 Paris"
    });

    const patient5 = await this.createPatient({
      firstName: "Thomas",
      lastName: "Bernard",
      birthDate: "1995-09-14",
      phone: "01 46 90 12 34",
      email: "thomas.bernard@email.com",
      address: "67 rue de Rivoli, 75004 Paris"
    });

    // Create sample consultations for today
    const today = new Date().toISOString().split('T')[0];
    
    const consultation1 = await this.createConsultation({
      patientId: patient1.id,
      doctorId: 1,
      date: today,
      time: "09:00",
      reason: "Contrôle de tension artérielle",
      status: "completed",
      notes: "Patient présente une légère hypertension. TA: 145/90 mmHg. Recommandation de réduire le sel et de faire plus d'exercice.",
      diagnosis: "Hypertension artérielle légère",
      treatment: "Amlodipine 5mg 1cp/jour, contrôle dans 1 mois"
    });

    const consultation2 = await this.createConsultation({
      patientId: patient2.id,
      doctorId: 1,
      date: today,
      time: "09:30",
      reason: "Douleurs abdominales",
      status: "in-progress",
      notes: "Douleurs épigastriques depuis 2 jours, pas de fièvre. Abdomen souple, sensible en épigastre.",
      diagnosis: "Gastrite probable",
      treatment: "IPP, régime alimentaire adapté"
    });

    const consultation3 = await this.createConsultation({
      patientId: patient3.id,
      doctorId: 1,
      date: today,
      time: "10:00",
      reason: "Toux persistante",
      status: "scheduled",
      notes: "",
      diagnosis: "",
      treatment: ""
    });

    const consultation4 = await this.createConsultation({
      patientId: patient4.id,
      doctorId: 1,
      date: today,
      time: "10:30",
      reason: "Renouvellement ordonnance",
      status: "completed",
      notes: "Patiente sous traitement pour diabète type 2. Glycémie bien contrôlée. HbA1c = 6.8%.",
      diagnosis: "Diabète type 2 équilibré",
      treatment: "Metformine 850mg 2cp/jour, poursuite du traitement"
    });

    const consultation5 = await this.createConsultation({
      patientId: patient5.id,
      doctorId: 1,
      date: today,
      time: "11:00",
      reason: "Mal de dos",
      status: "scheduled",
      notes: "",
      diagnosis: "",
      treatment: ""
    });

    // Create sample AI summaries
    await this.createAiSummary({
      consultationId: consultation1.id,
      patientId: patient1.id,
      doctorId: 1,
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
    });

    await this.createAiSummary({
      consultationId: consultation4.id,
      patientId: patient4.id,
      doctorId: 1,
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
    });

    await this.createAiSummary({
      consultationId: consultation1.id,
      patientId: patient1.id,
      doctorId: 1,
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
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "doctor"
    };
    this.users.set(id, user);
    return user;
  }

  // Patient methods
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentPatientId++;
    const patient: Patient = { 
      ...insertPatient, 
      id,
      phone: insertPatient.phone || null,
      email: insertPatient.email || null,
      address: insertPatient.address || null,
      createdAt: new Date()
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, patientUpdate: Partial<InsertPatient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updatedPatient = { ...patient, ...patientUpdate };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    return this.patients.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllConsultations(): Promise<ConsultationWithPatient[]> {
    const consultations = Array.from(this.consultations.values());
    const consultationsWithPatient: ConsultationWithPatient[] = [];
    
    for (const consultation of consultations) {
      const patient = await this.getPatient(consultation.patientId);
      if (patient) {
        consultationsWithPatient.push({ ...consultation, patient });
      }
    }
    
    return consultationsWithPatient.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.time.localeCompare(b.time);
    });
  }

  async deleteConsultation(id: number): Promise<boolean> {
    return this.consultations.delete(id);
  }

  async getAiSummaryWithDetails(id: number): Promise<AiSummaryWithDetails | undefined> {
    const summary = this.aiSummaries.get(id);
    if (!summary) return undefined;
    
    const patient = await this.getPatient(summary.patientId);
    const consultation = await this.getConsultation(summary.consultationId);
    
    if (!patient || !consultation) return undefined;
    
    return { ...summary, patient, consultation };
  }

  async updateAiSummary(id: number, summaryUpdate: Partial<InsertAiSummary>): Promise<AiSummary | undefined> {
    const summary = this.aiSummaries.get(id);
    if (!summary) return undefined;
    
    const updatedSummary = { ...summary, ...summaryUpdate };
    this.aiSummaries.set(id, updatedSummary);
    return updatedSummary;
  }

  async deleteAiSummary(id: number): Promise<boolean> {
    return this.aiSummaries.delete(id);
  }

  // Consultation methods
  async getConsultation(id: number): Promise<Consultation | undefined> {
    return this.consultations.get(id);
  }

  async getConsultationsByDate(date: string): Promise<ConsultationWithPatient[]> {
    const consultations = Array.from(this.consultations.values())
      .filter(consultation => consultation.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));

    const consultationsWithPatient: ConsultationWithPatient[] = [];
    for (const consultation of consultations) {
      const patient = await this.getPatient(consultation.patientId);
      if (patient) {
        consultationsWithPatient.push({ ...consultation, patient });
      }
    }
    
    return consultationsWithPatient;
  }

  async getConsultationsByPatient(patientId: number): Promise<Consultation[]> {
    return Array.from(this.consultations.values())
      .filter(consultation => consultation.patientId === patientId);
  }

  async createConsultation(insertConsultation: InsertConsultation): Promise<Consultation> {
    const id = this.currentConsultationId++;
    const consultation: Consultation = { 
      id,
      patientId: insertConsultation.patientId,
      doctorId: insertConsultation.doctorId,
      date: insertConsultation.date,
      time: insertConsultation.time,
      reason: insertConsultation.reason,
      status: insertConsultation.status || "scheduled",
      notes: insertConsultation.notes || null,
      diagnosis: insertConsultation.diagnosis || null,
      treatment: insertConsultation.treatment || null,
      createdAt: new Date()
    };
    this.consultations.set(id, consultation);
    return consultation;
  }

  async updateConsultation(id: number, consultationUpdate: Partial<InsertConsultation>): Promise<Consultation | undefined> {
    const consultation = this.consultations.get(id);
    if (!consultation) return undefined;
    
    const updatedConsultation = { ...consultation, ...consultationUpdate };
    this.consultations.set(id, updatedConsultation);
    return updatedConsultation;
  }

  // AI Summary methods
  async getAiSummary(id: number): Promise<AiSummary | undefined> {
    return this.aiSummaries.get(id);
  }

  async getAiSummariesByPatient(patientId: number): Promise<AiSummaryWithDetails[]> {
    const summaries = Array.from(this.aiSummaries.values())
      .filter(summary => summary.patientId === patientId);

    const summariesWithDetails: AiSummaryWithDetails[] = [];
    for (const summary of summaries) {
      const patient = await this.getPatient(summary.patientId);
      const consultation = await this.getConsultation(summary.consultationId);
      if (patient && consultation) {
        summariesWithDetails.push({ ...summary, patient, consultation });
      }
    }
    
    return summariesWithDetails;
  }

  async getRecentAiSummaries(limit: number = 10): Promise<AiSummaryWithDetails[]> {
    const summaries = Array.from(this.aiSummaries.values())
      .sort((a, b) => new Date(b.generatedAt!).getTime() - new Date(a.generatedAt!).getTime())
      .slice(0, limit);

    const summariesWithDetails: AiSummaryWithDetails[] = [];
    for (const summary of summaries) {
      const patient = await this.getPatient(summary.patientId);
      const consultation = await this.getConsultation(summary.consultationId);
      if (patient && consultation) {
        summariesWithDetails.push({ ...summary, patient, consultation });
      }
    }
    
    return summariesWithDetails;
  }

  async createAiSummary(insertSummary: InsertAiSummary): Promise<AiSummary> {
    const id = this.currentAiSummaryId++;
    const summary: AiSummary = { 
      ...insertSummary, 
      id,
      generatedAt: new Date()
    };
    this.aiSummaries.set(id, summary);
    return summary;
  }

  // Statistics
  async getDashboardStats(): Promise<{
    todayConsultations: number;
    waitingPatients: number;
    completedConsultations: number;
    aiSummaries: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const todayConsultations = Array.from(this.consultations.values())
      .filter(consultation => consultation.date === today);

    return {
      todayConsultations: todayConsultations.length,
      waitingPatients: todayConsultations.filter(c => c.status === 'scheduled').length,
      completedConsultations: todayConsultations.filter(c => c.status === 'completed').length,
      aiSummaries: this.aiSummaries.size,
    };
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db
      .insert(patients)
      .values(insertPatient)
      .returning();
    return patient;
  }

  async updatePatient(id: number, patientUpdate: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [patient] = await db
      .update(patients)
      .set(patientUpdate)
      .where(eq(patients.id, id))
      .returning();
    return patient || undefined;
  }

  async deletePatient(id: number): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id));
    return result.rowCount > 0;
  }

  async getConsultation(id: number): Promise<Consultation | undefined> {
    const [consultation] = await db.select().from(consultations).where(eq(consultations.id, id));
    return consultation || undefined;
  }

  async getAllConsultations(): Promise<ConsultationWithPatient[]> {
    const results = await db
      .select({
        consultation: consultations,
        patient: patients
      })
      .from(consultations)
      .innerJoin(patients, eq(consultations.patientId, patients.id))
      .orderBy(consultations.date, consultations.time);

    return results.map(result => ({
      ...result.consultation,
      patient: result.patient
    }));
  }

  async getConsultationsByDate(date: string): Promise<ConsultationWithPatient[]> {
    const results = await db
      .select({
        consultation: consultations,
        patient: patients
      })
      .from(consultations)
      .innerJoin(patients, eq(consultations.patientId, patients.id))
      .where(eq(consultations.date, date))
      .orderBy(consultations.time);

    return results.map(result => ({
      ...result.consultation,
      patient: result.patient
    }));
  }

  async getConsultationsByPatient(patientId: number): Promise<Consultation[]> {
    return await db.select().from(consultations).where(eq(consultations.patientId, patientId));
  }

  async createConsultation(insertConsultation: InsertConsultation): Promise<Consultation> {
    const [consultation] = await db
      .insert(consultations)
      .values(insertConsultation)
      .returning();
    return consultation;
  }

  async updateConsultation(id: number, consultationUpdate: Partial<InsertConsultation>): Promise<Consultation | undefined> {
    const [consultation] = await db
      .update(consultations)
      .set(consultationUpdate)
      .where(eq(consultations.id, id))
      .returning();
    return consultation || undefined;
  }

  async deleteConsultation(id: number): Promise<boolean> {
    const result = await db.delete(consultations).where(eq(consultations.id, id));
    return result.rowCount > 0;
  }

  async getAiSummary(id: number): Promise<AiSummary | undefined> {
    const [summary] = await db.select().from(aiSummaries).where(eq(aiSummaries.id, id));
    return summary || undefined;
  }

  async getAiSummaryWithDetails(id: number): Promise<AiSummaryWithDetails | undefined> {
    const [result] = await db
      .select({
        summary: aiSummaries,
        patient: patients,
        consultation: consultations
      })
      .from(aiSummaries)
      .innerJoin(patients, eq(aiSummaries.patientId, patients.id))
      .innerJoin(consultations, eq(aiSummaries.consultationId, consultations.id))
      .where(eq(aiSummaries.id, id));

    if (!result) return undefined;

    return {
      ...result.summary,
      patient: result.patient,
      consultation: result.consultation
    };
  }

  async getAiSummariesByPatient(patientId: number): Promise<AiSummaryWithDetails[]> {
    const results = await db
      .select({
        summary: aiSummaries,
        patient: patients,
        consultation: consultations
      })
      .from(aiSummaries)
      .innerJoin(patients, eq(aiSummaries.patientId, patients.id))
      .innerJoin(consultations, eq(aiSummaries.consultationId, consultations.id))
      .where(eq(aiSummaries.patientId, patientId));

    return results.map(result => ({
      ...result.summary,
      patient: result.patient,
      consultation: result.consultation
    }));
  }

  async getRecentAiSummaries(limit: number = 10): Promise<AiSummaryWithDetails[]> {
    const results = await db
      .select({
        summary: aiSummaries,
        patient: patients,
        consultation: consultations
      })
      .from(aiSummaries)
      .innerJoin(patients, eq(aiSummaries.patientId, patients.id))
      .innerJoin(consultations, eq(aiSummaries.consultationId, consultations.id))
      .orderBy(aiSummaries.id)
      .limit(limit);

    return results.map(result => ({
      ...result.summary,
      patient: result.patient,
      consultation: result.consultation
    }));
  }

  async createAiSummary(insertSummary: InsertAiSummary): Promise<AiSummary> {
    const [summary] = await db
      .insert(aiSummaries)
      .values(insertSummary)
      .returning();
    return summary;
  }

  async updateAiSummary(id: number, summaryUpdate: Partial<InsertAiSummary>): Promise<AiSummary | undefined> {
    const [summary] = await db
      .update(aiSummaries)
      .set(summaryUpdate)
      .where(eq(aiSummaries.id, id))
      .returning();
    return summary || undefined;
  }

  async deleteAiSummary(id: number): Promise<boolean> {
    const result = await db.delete(aiSummaries).where(eq(aiSummaries.id, id));
    return result.rowCount > 0;
  }

  async getDashboardStats(): Promise<{
    todayConsultations: number;
    waitingPatients: number;
    completedConsultations: number;
    aiSummaries: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const todayConsultations = await db.select().from(consultations).where(eq(consultations.date, today));
    const totalSummaries = await db.select().from(aiSummaries);

    return {
      todayConsultations: todayConsultations.length,
      waitingPatients: todayConsultations.filter(c => c.status === 'scheduled').length,
      completedConsultations: todayConsultations.filter(c => c.status === 'completed').length,
      aiSummaries: totalSummaries.length,
    };
  }
}

export const storage = new DatabaseStorage();
