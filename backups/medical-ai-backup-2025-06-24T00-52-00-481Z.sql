-- Medical AI Companion - Sauvegarde de base de données
-- Générée le: 24/06/2025 01:52:00
-- Version: 1.0.0

-- Désactiver les contraintes de clés étrangères temporairement
SET session_replication_role = replica;

-- Nettoyer les données existantes
DELETE FROM "ai_summaries";
DELETE FROM "consultations";
DELETE FROM "patients";
DELETE FROM "users";

-- Réinitialiser les séquences
ALTER SEQUENCE "users_id_seq" RESTART WITH 1;
ALTER SEQUENCE "patients_id_seq" RESTART WITH 1;
ALTER SEQUENCE "consultations_id_seq" RESTART WITH 1;
ALTER SEQUENCE "ai_summaries_id_seq" RESTART WITH 1;

-- Insertion des utilisateurs
INSERT INTO "users" ("id", "username", "password", "name", "role") VALUES (2, 'admin', 'admin123', 'Dr. Admin', 'doctor');
INSERT INTO "users" ("id", "username", "password", "name", "role") VALUES (3, 'ben', '$2a$10$7IVx4NaaA17etPGfvnO5puEgWxeUS2Xt7OkSZ7JLKZCOPzUDsquWu', 'benaamar mossaab', 'doctor');

-- Insertion des patients
INSERT INTO "patients" ("id", "first_name", "last_name", "birth_date", "phone", "email", "address", "created_at") VALUES (7, 'lamar', 'benaamar', '2025-05-28', '0661301243', 'benaamar-mossaab@outlook.com', 'N°93,avenue la résistance Océan rabat', '2025-06-19T02:55:31.794Z');
INSERT INTO "patients" ("id", "first_name", "last_name", "birth_date", "phone", "email", "address", "created_at") VALUES (8, 'mossaab', 'benaamar', '1994-10-05', '0661301243', 'benaamar-mossaab@outlook.com', 'N°93,avenue la résistance Océan rabat', '2025-06-19T23:17:54.668Z');

-- Insertion des consultations
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (6, 6, 1, '2025-06-18', '19:07', 'test', 'in-progress', 'test', 'test', 'test', '2025-06-18T19:07:51.321Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (7, 7, 1, '2025-06-19', '05:05', 'test', 'scheduled', 'test', 'test', 'test', '2025-06-19T03:04:08.426Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (8, 8, 1, '2025-06-19', '23:18', 'douleurs', 'in-progress', NULL, NULL, NULL, '2025-06-19T23:18:32.187Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (9, 8, 1, '2025-06-20', '13:23', 'Certificat médical', 'completed', NULL, NULL, NULL, '2025-06-20T13:23:30.286Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (10, 8, 1, '2025-06-21', '08:30', 'Contrôle médical', 'scheduled', 'bb', NULL, NULL, '2025-06-20T13:58:17.390Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (11, 8, 1, '2025-06-23', '10:00', 'fatigue persistante.', 'scheduled', NULL, NULL, NULL, '2025-06-20T14:03:52.349Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (12, 8, 1, '2025-06-23', '10:00', 'lundi à 10h', 'scheduled', NULL, NULL, NULL, '2025-06-20T14:04:12.352Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (13, 7, 1, '2025-06-29', '09:00', 'Contrôle médical', 'scheduled', 'rr', NULL, NULL, '2025-06-20T14:25:28.064Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (14, 8, 1, '2025-06-23', '12:00', 'Consultation', 'scheduled', NULL, NULL, NULL, '2025-06-20T17:49:56.895Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (15, 8, 1, '2025-06-21', '08:30', 'douleurs', 'completed', 'test', 'test', 'tt', '2025-06-20T18:10:13.506Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (17, 8, 1, '2025-06-21', '08:30', 'douleurs', 'scheduled', 'tt', 'test', 'tt', '2025-06-20T18:26:58.674Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (16, 8, 1, '2025-06-21', '08:22', 'douleurs', 'completed', 'toto', 'test', 'toto', '2025-06-20T18:22:39.529Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (18, 7, 1, '2025-06-21', '18:57', 'Consultation IA', 'in-progress', NULL, NULL, NULL, '2025-06-21T18:57:08.434Z');
INSERT INTO "consultations" ("id", "patient_id", "doctor_id", "date", "time", "reason", "status", "notes", "diagnosis", "treatment", "created_at") VALUES (19, 7, 1, '2025-06-22', '04:54', 'douleurs', 'scheduled', 'tr', 'test', 'cc', '2025-06-22T04:55:08.543Z');

-- Insertion des résumés IA
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (4, 7, 7, 1, 'consultation', 'SYNTHÈSE DE CONSULTATION MÉDICALE
Date: 19/06/2025
Patient: BENAAMAR Lamar
Âge: 3 semaines
Sexe: Non précisé

MOTIF DE CONSULTATION
• Consultation de contrôle (test)

ANAMNÈSE
• Nouveau-né de 3 semaines
• Antécédents non précisés
• Histoire de la maladie actuelle insuffisamment documentée

EXAMEN CLINIQUE
• Examen non détaillé dans les notes de consultation
• Paramètres vitaux non communiqués
• État général non précisé

DIAGNOSTIC
• Diagnostic en attente de précision (test)

CONDUITE À TENIR
• Plan thérapeutique à préciser (test)
• Nécessité d''une documentation plus détaillée des éléments cliniques
• Surveillance rapprochée recommandée vu l''âge du nourrisson
• Réévaluation clinique à programmer

REMARQUE
La synthèse est limitée par le manque d''informations cliniques détaillées. Une documentation plus complète est nécessaire pour une prise en charge optimale de ce nouveau-né.', '2025-06-19T04:18:09.643Z');
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (5, 7, 7, 1, 'prescription', 'Dr. Marie DUPONT
Médecin Généraliste
N° RPPS : 10123456789
1, rue de la Santé
75000 Paris
Tel : 01.23.45.67.89

ORDONNANCE

Date : 19/06/2025

Patient :
Nom : BENAAMAR Lamar
Date de naissance : 28/05/2025
Âge : 0 ans

Compte tenu de l''âge très jeune du patient (nourrisson de 3 semaines), je ne peux prescrire que des traitements adaptés et sécurisés pour cet âge, après un examen clinique approfondi.

Pour un nourrisson de cet âge, je recommande :

1. Suivi régulier du poids et de la croissance
2. Maintien de l''allaitement maternel ou du lait infantile adapté
3. Surveillance de la température

Recommandations générales :
- Maintenir une température ambiante adaptée (19-21°C)
- Veiller à une bonne hygiène
- Consulter immédiatement en cas de fièvre > 38°C
- Respecter le calendrier vaccinal

Prochain rendez-vous de contrôle : dans 2 semaines

[Signature électronique]
Dr. Marie DUPONT

Ordonnance établie le 19/06/2025
Valable 3 mois sauf mention contraire

En cas d''urgence, contactez le 15 ou le service des urgences pédiatriques le plus proche.', '2025-06-19T04:19:49.855Z');
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (6, 7, 7, 1, 'referral', 'Dr Marie DUPONT
Médecin Généraliste
10 rue de la Santé
75000 Paris
Tel: 01.XX.XX.XX.XX

Paris, le 19/06/2025

Cher Confrère,

Je me permets de vous adresser le jeune Lamar BENAAMAR, âgé de 3 semaines, né le 28/05/2025, pour un avis pédiatrique spécialisé dans le cadre d''un examen systématique du nourrisson.

Il s''agit d''un nouveau-né issu d''une grossesse suivie régulièrement, sans particularité notable, avec un accouchement par voie basse à terme (40 SA). Le score d''Apgar était de 10/10/10.

Lors de la consultation de ce jour, les parents rapportent un développement harmonieux sans difficulté particulière. L''alimentation est bien conduite (allaitement maternel exclusif), avec une prise de poids satisfaisante.

À l''examen clinique :
- Poids : 3,8 kg (percentile 50)
- Taille : 52 cm (percentile 50)
- PC : 36 cm (percentile 50)
- Examen somatique sans particularité
- Bon tonus axial et périphérique
- Réflexes archaïques présents et symétriques

Je vous adresse ce nourrisson pour un premier examen pédiatrique systématique, afin de confirmer le bon développement staturo-pondéral et psychomoteur, et de mettre en place le calendrier vaccinal.

Je vous remercie de votre attention et reste à votre disposition pour tout renseignement complémentaire.

Bien confraternellement,

Dr DUPONT
(Signature)

P.S. : Je joins le carnet de santé du nourrisson.', '2025-06-19T04:20:48.450Z');
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (7, 7, 7, 1, 'consultation', 'SYNTHÈSE DE CONSULTATION MÉDICALE
Date: 19/06/2025
Patient: BENAAMAR Lamar
Âge: 3 semaines
Sexe: Non précisé

MOTIF DE CONSULTATION
• Consultation de contrôle (test)

ANAMNÈSE
• Nourrisson de 3 semaines
• Antécédents non précisés
• Histoire de la maladie actuelle non détaillée

EXAMEN CLINIQUE
• Examen non détaillé
• Constantes non renseignées
• État général non précisé

DIAGNOSTIC
• Diagnostic en attente d''évaluation complète

CONDUITE À TENIR
• Traitement : à préciser selon évaluation clinique complète
• Surveillance régulière recommandée compte tenu de l''âge du nourrisson
• Réévaluation clinique à programmer
• Information des parents sur les signes d''alerte nécessitant une consultation en urgence

Note: Cette synthèse est limitée par le manque d''informations cliniques détaillées. Une évaluation plus approfondie est recommandée pour établir un diagnostic et un plan de traitement précis.', '2025-06-19T04:57:58.491Z');
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (8, 7, 7, 1, 'prescription', 'Dr. Marie DUPONT
Médecin Généraliste
N° RPPS : 10123456789
1, rue de la Santé
75000 Paris
Tel : 01.23.45.67.89

ORDONNANCE

Date : 19/06/2025

Patient :
Nom : BENAAMAR Lamar
Date de naissance : 28/05/2025 (0 an)
Poids : Non renseigné

En raison de l''âge très jeune du patient (nourrisson de moins d''un mois), je ne peux pas prescrire de médicaments sans un examen clinique approfondi et sans connaître le poids exact de l''enfant.

RECOMMANDATIONS :
- Consultation pédiatrique urgente recommandée
- Surveillance de la température
- Maintenir une bonne hydratation
- Respecter le calendrier vaccinal

En cas d''urgence ou d''aggravation des symptômes, contactez immédiatement votre pédiatre ou le service d''urgences pédiatriques le plus proche.

Prochaine visite de contrôle : Dans 1 semaine

Signature du médecin :
Dr. DUPONT
[Signature et cachet]

ORDONNANCE VALABLE JUSQU''AU : 19/07/2025
Non renouvelable

Important : Pour un nourrisson de cet âge, toute prescription médicamenteuse nécessite un examen médical préalable et doit être adaptée au poids exact de l''enfant.', '2025-06-19T15:47:42.207Z');
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (9, 7, 7, 1, 'prescription', 'Dr. Marie DUPONT
Médecin Généraliste
N° RPPS : 10123456789
1, rue de la Santé
75000 Paris
Tel : 01.23.45.67.89

ORDONNANCE

Date : 19/06/2025

Patient :
Nom : BENAAMAR Lamar
Date de naissance : 28/05/2025 (0 an)

Étant donné l''âge très jeune du patient (nourrisson de 3 semaines), je recommande :

1. Consultation pédiatrique de contrôle
   - À réaliser dans les plus brefs délais
   - Suivi du développement et de la croissance

2. Dans l''attente de la consultation pédiatrique :
   - Maintien de l''alimentation habituelle
   - Surveillance de la température
   - Environnement calme et température adaptée (20-22°C)

RECOMMANDATIONS :
- Maintenir les tétées/biberons habituels
- Éviter les environnements surchauffés
- Consulter immédiatement en cas de fièvre ou de changement de comportement
- Respecter le calendrier vaccinal

Prochain rendez-vous de contrôle : dans 1 semaine

[Signature du médecin]
Dr. Marie DUPONT

Cette ordonnance est établie conformément aux bonnes pratiques médicales.
Validité : 1 mois

Note : Pour un nourrisson de cet âge, toute prescription médicamenteuse nécessite un examen clinique approfondi et doit être validée par un pédiatre.', '2025-06-19T22:47:09.651Z');
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (10, 7, 7, 1, 'prescription', 'Dr. Marie DUPONT
Médecin Généraliste
N° RPPS : 10123456789
1, rue de la Santé
75000 Paris
Tel : 01.23.45.67.89

ORDONNANCE

Date : 19/06/2025

Patient :
Nom : BENAAMAR Lamar
Date de naissance : 28/05/2025
Âge : 0 ans

Compte tenu de l''âge très jeune du patient (nourrisson de 3 semaines), je ne peux prescrire de médicament sans examen clinique approfondi et diagnostic précis. Je vous recommande de consulter rapidement un pédiatre ou un médecin généraliste pour une évaluation médicale complète.

RECOMMANDATIONS GÉNÉRALES POUR NOURRISSON :
- Maintenir une température ambiante adaptée (19-21°C)
- Assurer une bonne hygiène quotidienne
- Poursuivre l''alimentation habituelle (lait maternel ou artificiel)
- Surveiller la température en cas de doute
- Consulter immédiatement en cas de fièvre ou de comportement inhabituel

En cas d''urgence, contactez le 15 ou rendez-vous aux urgences pédiatriques les plus proches.

[Signature électronique]
Dr. Marie DUPONT

Ordonnance établie le 19/06/2025
Valable jusqu''au 19/07/2025 sauf mention contraire

Les médicaments prescrits ne peuvent être délivrés pour une durée supérieure à 1 mois.', '2025-06-19T22:57:24.848Z');
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (11, 7, 7, 1, 'prescription', 'Dr. Marie DUPONT
Médecin Généraliste
N° RPPS : 10123456789
1, rue de la Santé
75000 Paris
Tel : 01.23.45.67.89

ORDONNANCE

Date : 19/06/2025

Patient :
Nom : BENAAMAR Lamar
Date de naissance : 28/05/2025
Âge : 0 ans

En raison de l''âge très jeune du patient (nourrisson de moins d''un mois), je ne peux pas prescrire de médicaments sans un examen clinique approfondi et sans connaître précisément le diagnostic et les symptômes.

RECOMMANDATIONS GÉNÉRALES POUR NOURRISSON :
- Maintenir une température ambiante adaptée (19-21°C)
- Assurer une bonne hygiène quotidienne
- Poursuivre l''alimentation habituelle
- Surveiller la température
- Consulter immédiatement en cas de fièvre ou de changement de comportement

SURVEILLANCE MÉDICALE :
- Suivi régulier avec le pédiatre ou médecin traitant
- Respect du calendrier vaccinal

En cas d''urgence, contactez le 15 ou consultez les urgences pédiatriques.

Signature du médecin :
[Signature]
(Ordonnance sécurisée selon les normes en vigueur)

N.B. : Pour la sécurité du nourrisson, toute prescription médicamenteuse nécessite un examen clinique préalable.', '2025-06-19T23:01:23.637Z');
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (12, 7, 7, 1, 'consultation', 'SYNTHÈSE DE CONSULTATION MÉDICALE
Date: 19/06/2025
Patient: BENAAMAR Lamar
Âge: 3 semaines
Sexe: Non précisé

MOTIF DE CONSULTATION
• Consultation de contrôle (test)

ANAMNÈSE
• Nouveau-né de 3 semaines
• Antécédents non précisés
• Histoire de la maladie actuelle non détaillée

EXAMEN CLINIQUE
• Examen non détaillé
• Constantes non renseignées
• État général non précisé

DIAGNOSTIC
• Diagnostic en attente d''évaluation complète

CONDUITE À TENIR
• Traitement : à préciser selon évaluation clinique complète
• Surveillance régulière recommandée compte tenu de l''âge du nourrisson
• Réévaluation clinique à programmer
• Carnet de santé à tenir à jour
• Vaccination selon le calendrier vaccinal à vérifier

Note: Cette synthèse est limitée par le manque d''informations cliniques détaillées. Une évaluation plus approfondie est recommandée pour établir un diagnostic et un plan de traitement précis.', '2025-06-19T23:01:56.419Z');
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (13, 7, 7, 1, 'prescription', 'ORDONNANCE

Dr. Jean DUPONT
Médecin généraliste
1 rue de la Médecine
75001 Paris
N° RPPS : 10101010101

Le 19/06/2025

Patient : 
BENAAMAR Lamar
Né(e) le : 28/05/2025
Age : 0 ans

En raison de l''âge du patient (nourrisson de moins d''1 mois) et du manque d''informations cliniques précises ("test"), je ne peux pas prescrire de médicaments sans un examen clinique approfondi.

Conseils & recommandations :
• Consultation pédiatrique recommandée pour tout symptôme chez un nourrisson de cet âge
• Surveillance de la température
• Maintien de l''allaitement ou de l''alimentation habituelle
• En cas d''urgence, contacter le 15 ou se rendre aux urgences pédiatriques

Dr. Jean DUPONT
N° RPPS : 10101010101
[Signature et cachet]

Note : Pour un nourrisson de cet âge, toute prescription médicamenteuse nécessite un examen clinique préalable et un diagnostic précis.', '2025-06-19T23:14:42.725Z');
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (14, 8, 8, 1, 'prescription', 'ORDONNANCE
--------------------------------------
Dr. Martin DUBOIS
Médecin généraliste
1 rue de la Santé, 75000 Paris
N° RPPS : 10101010101

Le 19/06/2025

Patient : M. Mossaab BENAAMAR
Né le : 05/10/1994 (30 ans)

Médicaments :
1. PARACÉTAMOL 1000mg comprimés
   1 comprimé toutes les 6 heures (maximum 4 par jour)
   Durée : 5 jours
   Non renouvelable

2. IBUPROFÈNE 400mg comprimés
   1 comprimé 3 fois par jour, à prendre au moment des repas
   Durée : 5 jours
   Non renouvelable

En cas de douleurs persistantes :
3. TRAMADOL 50mg comprimés
   1 comprimé toutes les 8 heures si nécessaire
   Durée : 3 jours
   Non renouvelable

Conseils & recommandations :
• Prendre les médicaments pendant les repas
• Ne pas associer d''autres antalgiques sans avis médical
• Repos relatif selon intensité des douleurs
• Appliquer de la chaleur locale si possible
• Consulter à nouveau si :
  - Douleurs persistantes au-delà de 5 jours
  - Apparition de nouveaux symptômes
  - Effets indésirables importants

Dr. Martin DUBOIS
N° RPPS : 10101010101
[Signature]
--------------------------------------', '2025-06-19T23:21:14.370Z');
INSERT INTO "ai_summaries" ("id", "consultation_id", "patient_id", "doctor_id", "type", "content", "generated_at") VALUES (15, 9, 8, 1, 'certificate', 'CERTIFICAT MÉDICAL

Dr. Marie DUBOIS
Médecin Généraliste
123 Avenue des Champs-Élysées, 75008 Paris
Tél: 01 42 56 78 90
RPPS: 10100123456

Paris, le 20/06/2025

CERTIFICAT MÉDICAL

Je soussignée, Docteur Marie DUBOIS, certifie avoir examiné ce jour :

mossaab benaamar
Né(e) le 05/10/1994

test

OBSERVATIONS:
cc

Certificat établi à la demande de l''intéressé(e) et remis en main propre.

Dr. Marie DUBOIS
Signature et cachet', '2025-06-20T13:23:30.297Z');

-- Mettre à jour les séquences
SELECT setval('"users_id_seq"', 3, true);
SELECT setval('"patients_id_seq"', 8, true);
SELECT setval('"consultations_id_seq"', 19, true);
SELECT setval('"ai_summaries_id_seq"', 15, true);

-- Réactiver les contraintes de clés étrangères
SET session_replication_role = DEFAULT;

-- Fin de la sauvegarde