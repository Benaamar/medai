import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMedicalSummary } from "./services/openai";
import { insertPatientSchema, insertConsultationSchema, insertAiSummarySchema, insertUserSchema } from "@shared/schema";
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

  app.patch("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const patient = await storage.updatePatient(id, updates);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePatient(id);
      if (!success) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient" });
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

  app.delete("/api/consultations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteConsultation(id);
      if (!success) {
        return res.status(404).json({ message: "Consultation not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete consultation" });
    }
  });

  app.get("/api/consultations", async (req, res) => {
    try {
      const { date, patientId } = req.query;
      let consultations;
      
      if (date) {
        consultations = await storage.getConsultationsByDate(date as string);
      } else if (patientId) {
        consultations = await storage.getConsultationsByPatient(parseInt(patientId as string));
      } else {
        consultations = await storage.getAllConsultations();
      }
      
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch consultations" });
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

  app.get("/api/ai-summaries", async (req, res) => {
    try {
      const { patientId, limit } = req.query;
      let summaries;
      
      if (patientId) {
        summaries = await storage.getAiSummariesByPatient(parseInt(patientId as string));
      } else {
        const summaryLimit = limit ? parseInt(limit as string) : 50;
        summaries = await storage.getRecentAiSummaries(summaryLimit);
      }
      
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI summaries" });
    }
  });

  app.get("/api/ai-summaries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const summary = await storage.getAiSummaryWithDetails(id);
      if (!summary) {
        return res.status(404).json({ message: "AI summary not found" });
      }
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI summary" });
    }
  });

  app.patch("/api/ai-summaries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const summary = await storage.updateAiSummary(id, updates);
      if (!summary) {
        return res.status(404).json({ message: "AI summary not found" });
      }
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to update AI summary" });
    }
  });

  app.delete("/api/ai-summaries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAiSummary(id);
      if (!success) {
        return res.status(404).json({ message: "AI summary not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete AI summary" });
    }
  });

  // Users CRUD routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
