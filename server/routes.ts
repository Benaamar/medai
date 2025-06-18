import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMedicalSummary } from "./services/openai";
import { insertPatientSchema, insertConsultationSchema, insertAiSummarySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Patients routes
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  // Consultations routes
  app.get("/api/consultations/today", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const consultations = await storage.getConsultationsByDate(today);
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's consultations" });
    }
  });

  app.get("/api/consultations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const consultation = await storage.getConsultation(id);
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }
      res.json(consultation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch consultation" });
    }
  });

  app.post("/api/consultations", async (req, res) => {
    try {
      const consultationData = insertConsultationSchema.parse(req.body);
      const consultation = await storage.createConsultation(consultationData);
      res.status(201).json(consultation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid consultation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create consultation" });
    }
  });

  app.patch("/api/consultations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const consultation = await storage.updateConsultation(id, updates);
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }
      res.json(consultation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update consultation" });
    }
  });

  // AI Summaries routes
  app.get("/api/ai-summaries/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const summaries = await storage.getRecentAiSummaries(limit);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent AI summaries" });
    }
  });

  app.post("/api/ai-summaries/generate", async (req, res) => {
    try {
      const { consultationId, summaryType } = req.body;
      
      if (!consultationId || !summaryType) {
        return res.status(400).json({ message: "consultationId and summaryType are required" });
      }

      const consultation = await storage.getConsultation(consultationId);
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }

      const patient = await storage.getPatient(consultation.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const consultationWithPatient = { ...consultation, patient };
      
      // Generate AI summary
      const aiResponse = await generateMedicalSummary({
        consultation: consultationWithPatient,
        summaryType
      });

      // Save the summary
      const summaryData = {
        consultationId,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        type: summaryType,
        content: aiResponse.content
      };

      const summary = await storage.createAiSummary(summaryData);
      res.status(201).json({ summary, content: aiResponse.content });
    } catch (error) {
      console.error("Error generating AI summary:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate AI summary"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
