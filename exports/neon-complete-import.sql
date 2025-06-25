-- Medical AI Companion - Import complet pour Neon PostgreSQL
-- Généré le: 24/06/2025
-- Ce fichier contient: SCHÉMA + DONNÉES

-- Configuration PostgreSQL
SET client_encoding = 'UTF8';
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Suppression des tables existantes (si elles existent)
DROP TABLE IF EXISTS "ai_summaries" CASCADE;
DROP TABLE IF EXISTS "consultations" CASCADE;
DROP TABLE IF EXISTS "patients" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- ========================================
-- CRÉATION DU SCHÉMA COMPLET
-- ========================================

-- Table users
CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'doctor'
);

-- Table patients
CREATE TABLE "patients" (
    "id" SERIAL PRIMARY KEY,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "birth_date" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- Table consultations
CREATE TABLE "consultations" (
    "id" SERIAL PRIMARY KEY,
    "patient_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- Table ai_summaries
CREATE TABLE "ai_summaries" (
    "id" SERIAL PRIMARY KEY,
    "consultation_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "generated_at" TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- CONTRAINTES ET INDEX
-- ========================================

-- Contraintes de clés étrangères
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patient_id_fkey" 
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id");
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctor_id_fkey" 
    FOREIGN KEY ("doctor_id") REFERENCES "users"("id");
ALTER TABLE "ai_summaries" ADD CONSTRAINT "ai_summaries_consultation_id_fkey" 
    FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id");
ALTER TABLE "ai_summaries" ADD CONSTRAINT "ai_summaries_patient_id_fkey" 
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id");
ALTER TABLE "ai_summaries" ADD CONSTRAINT "ai_summaries_doctor_id_fkey" 
    FOREIGN KEY ("doctor_id") REFERENCES "users"("id");

-- Index pour les performances
CREATE INDEX "idx_consultations_patient_id" ON "consultations"("patient_id");
CREATE INDEX "idx_consultations_doctor_id" ON "consultations"("doctor_id");
CREATE INDEX "idx_consultations_date" ON "consultations"("date");
CREATE INDEX "idx_ai_summaries_consultation_id" ON "ai_summaries"("consultation_id");
CREATE INDEX "idx_ai_summaries_patient_id" ON "ai_summaries"("patient_id");

-- ========================================
-- INSERTION DES DONNÉES
-- ========================================

-- Insertion des utilisateurs
INSERT INTO "users" ("username", "password", "name", "role") VALUES 
('admin', 'admin123', 'Dr. Admin', 'doctor'),
('ben', '$2a$10$7IVx4NaaA17etPGfvnO5puEgWxeUS2Xt7OkSZ7JLKZCOPzUDsquWu', 'benaamar mossaab', 'doctor');

-- Insertion des patients
INSERT INTO "patients" ("first_name", "last_name", "birth_date", "phone", "email", "address", "created_at") VALUES 
('lamar', 'benaamar', '2025-05-28', '0661301243', 'benaamar-mossaab@outlook.com', 'N°93,avenue la résistance Océan rabat', '2025-06-19T02:55:31.794Z'),
('mossaab', 'benaamar', '1994-10-05', '0661301243', 'benaamar-mossaab@outlook.com', 'N°93,avenue la résistance Océan rabat', '2025-06-19T23:17:54.668Z');

-- Insertion des consultations
INSERT INTO "consultations" ("patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES 
(1, 1, '2025-06-19', '05:05', 'test', 'scheduled', 'test', 'test', 'test', '2025-06-19T03:04:08.426Z'),
(2, 1, '2025-06-19', '23:18', 'douleurs', 'in-progress', '', '', '', '2025-06-19T23:18:32.187Z'),
(2, 1, '2025-06-20', '13:23', 'Certificat médical', 'completed', NULL, NULL, NULL, '2025-06-20T13:23:30.286Z'),
(2, 1, '2025-06-21', '08:30', 'Contrôle médical', 'scheduled', 'bb', '', '', '2025-06-20T13:58:17.390Z'),
(2, 1, '2025-06-23', '10:00', 'fatigue persistante.', 'scheduled', '', '', '', '2025-06-20T14:03:52.349Z'),
(2, 1, '2025-06-21', '08:30', 'douleurs', 'completed', 'test', 'test', 'tt', '2025-06-20T18:10:13.506Z'),
(1, 1, '2025-06-21', '18:57', 'Consultation IA', 'in-progress', NULL, NULL, NULL, '2025-06-21T18:57:08.434Z');

-- Insertion des résumés IA (échantillon)
INSERT INTO "ai_summaries" ("consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES 
(1, 1, 1, 'consultation', 'SYNTHÈSE DE CONSULTATION MÉDICALE
Date: 19/06/2025
Patient: BENAAMAR Lamar
Âge: 3 semaines

MOTIF DE CONSULTATION
• Consultation de contrôle (test)

DIAGNOSTIC
• Diagnostic en attente d''évaluation complète

CONDUITE À TENIR
• Surveillance régulière recommandée
• Réévaluation clinique à programmer', '2025-06-19T04:18:09.643Z'),

(2, 2, 1, 'prescription', 'ORDONNANCE
Dr. Martin DUBOIS
Médecin généraliste

Patient : M. Mossaab BENAAMAR
Né le : 05/10/1994 (30 ans)

Médicaments :
1. PARACÉTAMOL 1000mg comprimés
   1 comprimé toutes les 6 heures
   Durée : 5 jours

Conseils & recommandations :
• Prendre les médicaments pendant les repas
• Repos relatif selon intensité des douleurs', '2025-06-19T23:21:14.370Z');

-- Fin de l'import
COMMIT; 