import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMedicalSummary, processAiChatMessage, processGeneralChatMessage } from "./services/anthropic";
import { transcribeAudio } from "./services/openai";
import { insertPatientSchema, insertConsultationSchema, insertAiSummarySchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import axios from "axios";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";

const JWT_SECRET = process.env.JWT_SECRET || "secret-key";

// Configuration de multer pour les uploads de fichiers audio
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les fichiers audio
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers audio sont acceptés'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Test endpoint for chat
  app.post("/api/test", (req, res) => {
    try {
      const { message } = req.body;
      console.log("Test endpoint received:", message);
      
      res.json({
        success: true,
        message: "Test endpoint working correctly",
        receivedMessage: message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in test endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Test endpoint error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authMiddleware, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStatsByDoctor(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Patients routes
  app.get("/api/patients", authMiddleware, async (req: any, res) => {
    try {
      const patients = await storage.getPatientsByDoctor(req.user.id);
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

  app.post("/api/consultations", authMiddleware, async (req: any, res) => {
    try {
      const consultationData = {
        ...req.body,
        doctorId: req.user.id // Forcer l'ID du docteur connecté
      };
      const validatedData = insertConsultationSchema.parse(consultationData);
      const consultation = await storage.createConsultation(validatedData);
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

  app.get("/api/consultations", authMiddleware, async (req: any, res) => {
    try {
      const { date, patientId } = req.query;
      let consultations;
      
      if (date) {
        consultations = await storage.getConsultationsByDate(date as string);
        // Filtrer par docteur
        consultations = consultations.filter(c => c.doctorId === req.user.id);
      } else if (patientId) {
        consultations = await storage.getConsultationsByPatient(parseInt(patientId as string));
        // Filtrer par docteur
        consultations = consultations.filter(c => c.doctorId === req.user.id);
      } else {
        consultations = await storage.getConsultationsByDoctor(req.user.id);
      }
      
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch consultations" });
    }
  });

  // AI Summaries routes
  app.get("/api/ai-summaries/recent", authMiddleware, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const summaries = await storage.getRecentAiSummariesByDoctor(req.user.id, limit);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent AI summaries" });
    }
  });

  // Get AI summaries by patient ID
  app.get("/api/ai-summaries", authMiddleware, async (req: any, res) => {
    try {
      const { patientId } = req.query;
      
      if (patientId) {
        const summaries = await storage.getAiSummariesByPatient(parseInt(patientId as string));
        // Filtrer par docteur
        const filteredSummaries = summaries.filter(s => s.doctorId === req.user.id);
        res.json(filteredSummaries);
      } else {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const summaries = await storage.getRecentAiSummariesByDoctor(req.user.id, limit);
        res.json(summaries);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI summaries" });
    }
  });

  app.get("/api/ai-summaries/:id", authMiddleware, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const summary = await storage.getAiSummaryWithDetails(id);
      if (!summary) {
        return res.status(404).json({ message: "AI summary not found" });
      }
      
      // Vérifier que le résumé appartient au docteur connecté
      if (summary.doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI summary" });
    }
  });

  app.patch("/api/ai-summaries/:id", authMiddleware, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const summary = await storage.getAiSummary(id);
      if (!summary) {
        return res.status(404).json({ message: "AI summary not found" });
      }
      
      // Vérifier que le résumé appartient au docteur connecté
      if (summary.doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updates = req.body;
      const updatedSummary = await storage.updateAiSummary(id, updates);
      res.json(updatedSummary);
    } catch (error) {
      res.status(500).json({ message: "Failed to update AI summary" });
    }
  });

  app.delete("/api/ai-summaries/:id", authMiddleware, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const summary = await storage.getAiSummary(id);
      if (!summary) {
        return res.status(404).json({ message: "AI summary not found" });
      }
      
      // Vérifier que le résumé appartient au docteur connecté
      if (summary.doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteAiSummary(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete AI summary" });
    }
  });

  // Chat with AI assistant
  app.post("/api/ai-assistant/chat", authMiddleware, async (req: any, res) => {
    try {
      const { consultationId, message, messageHistory } = req.body;
      
      if (!consultationId || !message) {
        return res.status(400).json({ message: "consultationId and message are required" });
      }

      const consultation = await storage.getConsultation(consultationId);
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }

      // Vérifier que la consultation appartient au docteur connecté
      if (consultation.doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatient(consultation.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Get previous consultations for context
      const previousConsultations = await storage.getConsultationsByPatientWithDetails(patient.id);
      
      // Get previous AI summaries for context
      const previousSummaries = await storage.getAiSummariesByPatient(patient.id);
      // Filtrer par docteur
      const filteredSummaries = previousSummaries.filter(s => s.doctorId === req.user.id);
      
      // Process the chat message with Anthropic
      const consultationWithPatient = { ...consultation, patient };
      
      // Generate AI response using Anthropic (Claude)
      console.log('🚀 Traitement du message chat avec Anthropic...');
      
      // Prepare conversation history for the AI
      const conversationContext = {
        consultation: consultationWithPatient,
        previousConsultations: previousConsultations.filter(c => c.id !== consultationId),
        previousSummaries,
        messageHistory: messageHistory || []
      };
      
      // Call Anthropic service for chat response
      const aiResponse = await processAiChatMessage({
        message,
        context: conversationContext
      });
      
      console.log('✅ Réponse générée avec succès');

      res.json({ 
        response: aiResponse.content,
        success: true,
        metadata: {
          patientId: patient.id,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("💥 Erreur lors du traitement du message chat:", error);
      res.status(500).json({ 
        message: "Une erreur est survenue lors du traitement de votre message",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // Mock chat endpoint for testing without using Anthropic API
  app.post("/api/ai-assistant/chat-mock", async (req, res) => {
    try {
      const { consultationId, message, messageHistory } = req.body;
      
      if (!consultationId || !message) {
        return res.status(400).json({ message: "consultationId and message are required" });
      }

      const consultation = await storage.getConsultation(consultationId);
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }

      const patient = await storage.getPatient(consultation.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      console.log('🚀 Traitement du message chat avec mock...');
      
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Générer une réponse mock en fonction du message
      let mockResponse = "";
      const patientName = `${patient.firstName} ${patient.lastName}`;
      
      if (message.toLowerCase().includes("bonjour")) {
        mockResponse = `**Bonjour Docteur** 👋\n\nJe suis votre assistant IA médical. Je suis prêt à vous aider avec le dossier de ${patientName}.\n\nQue puis-je faire pour vous aujourd'hui ?`;
      } else if (message.toLowerCase().includes("synthèse") || message.toLowerCase().includes("résumé")) {
        mockResponse = `**Synthèse médicale pour ${patientName}** 📋\n\n**Motif de consultation :** ${consultation.reason || "Non spécifié"}\n\n**Éléments cliniques :** ${consultation.notes || "Aucune note"}\n\n**Diagnostic actuel :** ${consultation.diagnosis || "Non établi"}\n\n**Recommandations :** Synthèse structurée SOAP avec focus sur l'évolution clinique.`;
      } else if (message.toLowerCase().includes("prescription") || message.toLowerCase().includes("traitement")) {
        mockResponse = `**Prescription thérapeutique pour ${patientName}** 💊\n\n**Suggestions thérapeutiques :**\n• Traitement symptomatique adapté\n• Posologie standard selon poids\n• Durée recommandée: 7 jours\n\n**Prêt à prescrire :**\n✅ Ordonnance complète sécurisée\n✅ Posologies adaptées\n✅ Contre-indications vérifiées`;
      } else if (message.toLowerCase().includes("diagnostic")) {
        mockResponse = `**Analyse diagnostique pour ${patientName}** 🔍\n\n**Hypothèses diagnostiques :**\n1. ${consultation.diagnosis || "Diagnostic différentiel à établir"}\n2. Alternative à considérer selon évolution\n\n**Démarche diagnostique recommandée :**\n✅ Examen clinique ciblé\n✅ Examens paracliniques orientés\n✅ Réévaluation selon évolution`;
      } else {
        mockResponse = `J'ai bien analysé votre message concernant ${patientName}.\n\n**Que souhaitez-vous faire maintenant ?**\n\n✅ Générer une synthèse médicale\n✅ Proposer une prescription adaptée\n✅ Suggérer un diagnostic différentiel\n✅ Recommander des examens complémentaires`;
      }
      
      console.log('✅ Réponse mock générée avec succès');

      res.json({ 
        response: mockResponse,
        success: true,
        metadata: {
          patientId: patient.id,
          timestamp: new Date().toISOString(),
          isMock: true
        }
      });
    } catch (error) {
      console.error("💥 Erreur lors du traitement du message chat mock:", error);
      res.status(500).json({ 
        message: "Une erreur est survenue lors du traitement de votre message",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // General chat with AI assistant (for floating chat)
  app.post("/api/ai-assistant/general-chat", async (req, res) => {
    try {
      const { message, messageHistory } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "message is required" });
      }

      // Generate AI response using Anthropic (Claude) for general medical assistance
      console.log('🚀 Traitement du message chat général avec Anthropic...');
      
      // Call Anthropic service for general chat response
      const aiResponse = await processGeneralChatMessage({
        message,
        messageHistory: messageHistory || []
      });
      
      console.log('✅ Réponse générale générée avec succès');

      res.json({ 
        response: aiResponse.content,
        success: true,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Erreur lors du traitement du message chat général:", error);
      res.status(500).json({ 
        message: "Erreur lors du traitement du message",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  // Speech-to-text route for voice transcription
  app.post("/api/speech-to-text", upload.single('audio'), async (req, res) => {
    try {
      console.log('🎤 Requête de transcription reçue');
      
      // Vérifier si nous avons un fichier audio
      if (!req.file) {
        console.error('❌ Aucun fichier audio fourni');
        return res.status(400).json({ message: "Aucun fichier audio fourni" });
      }

      console.log('📁 Fichier audio reçu:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Utiliser le service OpenAI pour transcrire l'audio
      console.log('🚀 Début de la transcription avec OpenAI Whisper...');
      const transcriptionResult = await transcribeAudio(req.file.buffer);
      console.log('✅ Transcription réussie:', transcriptionResult.text);

      res.json({ 
        text: transcriptionResult.text,
        language: transcriptionResult.language,
        success: true,
        message: "Transcription réussie"
      });
    } catch (error) {
      console.error("💥 Erreur lors de la transcription:", error);
      
      // Gestion des erreurs spécifiques
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return res.status(500).json({ 
            message: "Erreur de configuration API",
            error: "Clé API OpenAI non configurée ou invalide"
          });
        }
        
        if (error.message.includes('file format')) {
          return res.status(400).json({ 
            message: "Format de fichier non supporté",
            error: "Veuillez utiliser un fichier audio valide (WAV, MP3, etc.)"
          });
        }
      }
      
      res.status(500).json({ 
        message: "Erreur lors de la transcription audio",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  app.post("/api/ai-summaries/generate", authMiddleware, async (req: any, res) => {
    try {
      const { consultationId, summaryType } = req.body;
      
      console.log('📥 Requête reçue:', {
        body: req.body,
        headers: {
          'content-type': req.headers['content-type']
        }
      });
      
      if (!consultationId || !summaryType) {
        console.error('❌ Données manquantes:', { consultationId, summaryType });
        return res.status(400).json({ message: "consultationId and summaryType are required" });
      }

      const consultation = await storage.getConsultation(consultationId);
      if (!consultation) {
        console.error('❌ Consultation non trouvée:', consultationId);
        return res.status(404).json({ message: "Consultation not found" });
      }

      // Vérifier que la consultation appartient au docteur connecté
      if (consultation.doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatient(consultation.patientId);
      if (!patient) {
        console.error('❌ Patient non trouvé:', consultation.patientId);
        return res.status(404).json({ message: "Patient not found" });
      }

      const consultationWithPatient = { ...consultation, patient };
      console.log('✅ Données récupérées:', {
        consultationId,
        patientId: patient.id,
        summaryType
      });
      
      // Generate AI summary using Anthropic (Claude)
      console.log('🚀 Génération de la synthèse avec Anthropic...');
      const aiResponse = await generateMedicalSummary({
        consultation: consultationWithPatient,
        summaryType
      });
      console.log('✅ Synthèse générée avec succès');

      // Save the summary
      const summaryData = {
        consultationId,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        type: summaryType,
        content: aiResponse.content
      };

      console.log('💾 Sauvegarde de la synthèse...');
      const summary = await storage.createAiSummary(summaryData);
      console.log('✅ Synthèse sauvegardée avec succès');

      // Écrire le certificat sur le disque pour archivage
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const dir = path.join(process.cwd(), "documents", "patients", patient.id.toString());
        await fs.mkdir(dir, { recursive: true });
        const fileName = `certificate_${summary.id}.txt`;
        await fs.writeFile(path.join(dir, fileName), aiResponse.content, "utf8");
      } catch (fileErr) {
        console.error("Erreur lors de l'écriture du fichier certificat:", fileErr);
      }

      res.status(201).json({ 
        summary, 
        content: aiResponse.content,
        success: true,
        metadata: {
          type: summaryType,
          patientId: patient.id,
          dateGeneration: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("💥 Erreur lors de la génération de la synthèse IA:", error);
      
      // Gestion des erreurs spécifiques
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Response Error Details:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
          
          // Erreur 400: Bad Request
          if (error.response.status === 400) {
            return res.status(500).json({ 
              message: `Erreur lors de la génération de la synthèse: Paramètres de requête API invalides`,
              details: error.response.data.error?.message || "Format de requête incorrect"
            });
          }
          
          // Erreur 401: Unauthorized
          if (error.response.status === 401) {
            return res.status(500).json({ 
              message: `Erreur lors de la génération de la synthèse: Clé API invalide ou expirée`,
              details: "Vérifiez votre configuration d'API Anthropic"
            });
          }
          
          // Erreur 429: Too Many Requests
          if (error.response.status === 429) {
            return res.status(500).json({ 
              message: `Erreur lors de la génération de la synthèse: Limite de taux dépassée`,
              details: "Trop de requêtes vers l'API Anthropic, veuillez réessayer plus tard"
            });
          }
        } else if (error.request) {
          // La requête a été faite mais aucune réponse n'a été reçue
          console.error('Request Error Details:', {
            message: error.message,
            code: error.code
          });
          
          return res.status(500).json({ 
            message: `Erreur lors de la génération de la synthèse: Pas de réponse de l'API`,
            details: "Vérifiez votre connexion internet ou si l'API Anthropic est accessible"
          });
        }
      }
      
      // Erreur générique
      res.status(500).json({ 
        message: `Erreur lors de la génération de la synthèse: ${error instanceof Error ? error.message : "Une erreur inconnue est survenue"}`,
        timestamp: new Date().toISOString()
      });
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

  // Auth routes ----------------------------------------------------

  // Inscription
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password, name, role } = req.body;
      if (!username || !password || !name) {
        return res.status(400).json({ message: "username, password et name sont requis" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Ce nom d'utilisateur est déjà pris" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const newUser = await storage.createUser({ username, password: hashed, name, role: role || "doctor" });

      const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role } });
    } catch (error) {
      console.error("Erreur signup:", error);
      res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
    }
  });

  // Connexion
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "username et password sont requis" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Identifiants incorrects" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Identifiants incorrects" });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
    } catch (error) {
      console.error("Erreur login:", error);
      res.status(500).json({ message: "Erreur serveur lors de la connexion" });
    }
  });

  // Middleware simple pour extraire l'utilisateur depuis le JWT
  function authMiddleware(req: any, res: any, next: any) {
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token manquant" });
    }
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ message: "Token invalide" });
    }
  }

  app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
      res.json({ id: user.id, username: user.username, name: user.name, role: user.role });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/certificates", async (req, res) => {
    try {
      const { patientId, content, consultationId, doctorId } = req.body;
      if (!patientId || !content) {
        return res.status(400).json({ message: "patientId et content sont requis" });
      }

      // vérifier patient existe
      const patient = await storage.getPatient(parseInt(patientId));
      if (!patient) return res.status(404).json({ message: "Patient introuvable" });

      // utiliser doctorId sinon défaut 1
      const doctor = doctorId ?? 1;

      // Si pas de consultationId fourni, créer une consultation factice (invisible) pour permettre la contrainte NOT NULL
      let consultId = consultationId;
      if (!consultId) {
        const now = new Date();
        const newConsult = await storage.createConsultation({
          patientId: parseInt(patientId),
          doctorId: doctor,
          date: now.toISOString().split("T")[0],
          time: now.toTimeString().slice(0, 5),
          reason: "Certificat médical",
          status: "completed",
        });
        consultId = newConsult.id;
      }

      const summary = await storage.createAiSummary({
        consultationId: consultId,
        patientId: parseInt(patientId),
        doctorId: doctor,
        type: "certificate",
        content,
      });

      // Sauvegarde du fichier texte dans documents/patients/{patientId}
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const dir = path.join(process.cwd(), "documents", "patients", patientId.toString());
        await fs.mkdir(dir, { recursive: true });
        const fileName = `certificate_${summary.id}.txt`;
        await fs.writeFile(path.join(dir, fileName), content, "utf8");
      } catch (fileErr) {
        console.error("Erreur écriture fichier certificat:", fileErr);
      }

      res.status(201).json(summary);
    } catch (error) {
      console.error("Erreur création certificat:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Appointments routes (alias de consultations "scheduled")
  app.get("/api/appointments/upcoming", authMiddleware, async (req: any, res) => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0,5); // HH:MM
      const results = await storage.getConsultationsByDoctor(req.user.id);
      const upcoming = results.filter(c => {
        if (c.status !== "scheduled") return false;
        if (c.date > todayStr) return true;
        if (c.date < todayStr) return false;
        // same day
        return c.time >= currentTime;
      });
      res.json(upcoming);
    } catch (error) {
      console.error("Erreur fetch appointments:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/appointments", authMiddleware, async (req: any, res) => {
    try {
      const data = req.body;
      if (!data.patientId || !data.date || !data.time || !data.reason) {
        return res.status(400).json({ message: "patientId, date, time et reason requis" });
      }
      const appointment = await storage.createConsultation({
        patientId: data.patientId,
        doctorId: req.user.id, // Utiliser l'ID du docteur connecté
        date: data.date,
        time: data.time,
        reason: data.reason,
        status: "scheduled",
        notes: data.notes ?? "",
        diagnosis: "",
        treatment: "",
      });
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Erreur création appointment:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ---------------- Certificates CRUD ----------------
  app.get("/api/certificates", async (_req, res) => {
    try {
      const certs = (await storage.getRecentAiSummaries(1000)).filter(s => s.type === "certificate");
      res.json(certs);
    } catch (e) {
      console.error("Erreur fetch certificates", e);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/certificates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateAiSummary(id, req.body);
      if (!updated) return res.status(404).json({ message: "Certificat non trouvé" });
      res.json(updated);
    } catch (e) {
      console.error("Erreur update certificate", e);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/certificates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAiSummary(id);
      if (!success) return res.status(404).json({ message: "Certificat non trouvé" });
      res.status(204).send();
    } catch (e) {
      console.error("Erreur delete certificate", e);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
