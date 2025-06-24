import { 
  users, patients, consultations, aiSummaries,
  type User, type InsertUser,
  type Patient, type InsertPatient,
  type Consultation, type InsertConsultation, type ConsultationWithPatient,
  type AiSummary, type InsertAiSummary, type AiSummaryWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray } from "drizzle-orm";

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
  getPatientsByDoctor(doctorId: number): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;

  // Consultation methods
  getConsultation(id: number): Promise<Consultation | undefined>;
  getAllConsultations(): Promise<ConsultationWithPatient[]>;
  getConsultationsByDoctor(doctorId: number): Promise<ConsultationWithPatient[]>;
  getConsultationsByDate(date: string): Promise<ConsultationWithPatient[]>;
  getConsultationsByPatient(patientId: number): Promise<Consultation[]>;
  getConsultationsByPatientWithDetails(patientId: number): Promise<ConsultationWithPatient[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultation(id: number, consultation: Partial<InsertConsultation>): Promise<Consultation | undefined>;
  deleteConsultation(id: number): Promise<boolean>;

  // AI Summary methods
  getAiSummary(id: number): Promise<AiSummary | undefined>;
  getAiSummaryWithDetails(id: number): Promise<AiSummaryWithDetails | undefined>;
  getAiSummariesByPatient(patientId: number): Promise<AiSummaryWithDetails[]>;
  getRecentAiSummaries(limit?: number): Promise<AiSummaryWithDetails[]>;
  getRecentAiSummariesByDoctor(doctorId: number, limit?: number): Promise<AiSummaryWithDetails[]>;
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
  getDashboardStatsByDoctor(doctorId: number): Promise<{
    todayConsultations: number;
    waitingPatients: number;
    completedConsultations: number;
    aiSummaries: number;
  }>;
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
    await db.delete(users).where(eq(users.id, id));
    // Vérifier si l'utilisateur existe encore après la suppression
    const user = await this.getUser(id);
    return user === undefined;
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients);
  }

  async getPatientsByDoctor(doctorId: number): Promise<Patient[]> {
    // Récupérer les patients qui ont eu au moins une consultation avec ce docteur
    const patientIds = await db
      .selectDistinct({ patientId: consultations.patientId })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId));
    
    if (patientIds.length === 0) {
      return [];
    }
    
    return await db
      .select()
      .from(patients)
      .where(inArray(patients.id, patientIds.map(p => p.patientId)));
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
    await db.delete(patients).where(eq(patients.id, id));
    // Vérifier si le patient existe encore après la suppression
    const patient = await this.getPatient(id);
    return patient === undefined;
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

  async getConsultationsByDoctor(doctorId: number): Promise<ConsultationWithPatient[]> {
    const results = await db
      .select({
        consultation: consultations,
        patient: patients
      })
      .from(consultations)
      .innerJoin(patients, eq(consultations.patientId, patients.id))
      .where(eq(consultations.doctorId, doctorId))
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

  async getConsultationsByPatientWithDetails(patientId: number): Promise<ConsultationWithPatient[]> {
    const results = await db
      .select({
        consultation: consultations,
        patient: patients
      })
      .from(consultations)
      .innerJoin(patients, eq(consultations.patientId, patients.id))
      .where(eq(consultations.patientId, patientId))
      .orderBy(consultations.date, consultations.time);

    return results.map(result => ({
      ...result.consultation,
      patient: result.patient
    }));
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
    await db.delete(consultations).where(eq(consultations.id, id));
    // Vérifier si la consultation existe encore après la suppression
    const consultation = await this.getConsultation(id);
    return consultation === undefined;
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
      .orderBy(desc(aiSummaries.generatedAt))
      .limit(limit);

    return results.map(result => ({
      ...result.summary,
      patient: result.patient,
      consultation: result.consultation
    }));
  }

  async getRecentAiSummariesByDoctor(doctorId: number, limit: number = 10): Promise<AiSummaryWithDetails[]> {
    const results = await db
      .select({
        summary: aiSummaries,
        patient: patients,
        consultation: consultations
      })
      .from(aiSummaries)
      .innerJoin(patients, eq(aiSummaries.patientId, patients.id))
      .innerJoin(consultations, eq(aiSummaries.consultationId, consultations.id))
      .where(eq(aiSummaries.doctorId, doctorId))
      .orderBy(desc(aiSummaries.generatedAt))
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
    await db.delete(aiSummaries).where(eq(aiSummaries.id, id));
    // Vérifier si le résumé AI existe encore après la suppression
    const summary = await this.getAiSummary(id);
    return summary === undefined;
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

  async getDashboardStatsByDoctor(doctorId: number): Promise<{
    todayConsultations: number;
    waitingPatients: number;
    completedConsultations: number;
    aiSummaries: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const todayConsultations = await db
      .select()
      .from(consultations)
      .where(and(eq(consultations.date, today), eq(consultations.doctorId, doctorId)));
    
    const totalSummaries = await db
      .select()
      .from(aiSummaries)
      .where(eq(aiSummaries.doctorId, doctorId));

    return {
      todayConsultations: todayConsultations.length,
      waitingPatients: todayConsultations.filter(c => c.status === 'scheduled').length,
      completedConsultations: todayConsultations.filter(c => c.status === 'completed').length,
      aiSummaries: totalSummaries.length,
    };
  }
}

export const storage = new DatabaseStorage();
