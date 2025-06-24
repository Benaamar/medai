-- Medical AI Companion - Export complet
-- Généré le: 24/06/2025 01:52:16

-- Création des tables
DROP TABLE IF EXISTS "ai_summaries" CASCADE;
DROP TABLE IF EXISTS "consultations" CASCADE;
DROP TABLE IF EXISTS "patients" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'doctor'
);

-- Insertion des données
INSERT INTO "users" ("username", "password", "name", "role") VALUES ('admin', 'admin123', 'Dr. Admin', 'doctor');
INSERT INTO "users" ("username", "password", "name", "role") VALUES ('ben', '$2a$10$7IVx4NaaA17etPGfvnO5puEgWxeUS2Xt7OkSZ7JLKZCOPzUDsquWu', 'benaamar mossaab', 'doctor');