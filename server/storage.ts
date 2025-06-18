import { 
  users, patients, consultations, aiSummaries,
  type User, type InsertUser,
  type Patient, type InsertPatient,
  type Consultation, type InsertConsultation, type ConsultationWithPatient,
  type AiSummary, type InsertAiSummary, type AiSummaryWithDetails
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Patient methods
  getPatient(id: number): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;

  // Consultation methods
  getConsultation(id: number): Promise<Consultation | undefined>;
  getConsultationsByDate(date: string): Promise<ConsultationWithPatient[]>;
  getConsultationsByPatient(patientId: number): Promise<Consultation[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultation(id: number, consultation: Partial<InsertConsultation>): Promise<Consultation | undefined>;

  // AI Summary methods
  getAiSummary(id: number): Promise<AiSummary | undefined>;
  getAiSummariesByPatient(patientId: number): Promise<AiSummaryWithDetails[]>;
  getRecentAiSummaries(limit?: number): Promise<AiSummaryWithDetails[]>;
  createAiSummary(summary: InsertAiSummary): Promise<AiSummary>;

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

    // Initialize with sample doctor
    this.createUser({
      username: "doctor",
      password: "password",
      name: "Dr. Marie Dubois",
      role: "doctor"
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
    const user: User = { ...insertUser, id };
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
      ...insertConsultation, 
      id,
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

export const storage = new MemStorage();
