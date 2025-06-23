import { db } from './db';
import { users } from '@shared/schema';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    // Vérifier si des utilisateurs existent déjà
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length > 0) {
      console.log('Des utilisateurs existent déjà dans la base de données.');
      console.log(`Nombre d'utilisateurs: ${existingUsers.length}`);
      existingUsers.forEach(user => {
        console.log(`- ${user.username} (${user.name}) - Rôle: ${user.role}`);
      });
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Créer un utilisateur administrateur
    const [admin] = await db
      .insert(users)
      .values({
        username: "admin",
        password: hashedPassword,
        name: "Dr. Admin",
        role: "doctor"
      })
      .returning();

    console.log('Utilisateur administrateur créé avec succès:');
    console.log(`ID: ${admin.id}`);
    console.log(`Nom d'utilisateur: ${admin.username}`);
    console.log(`Nom: ${admin.name}`);
    console.log(`Rôle: ${admin.role}`);
    console.log('\nVous pouvez maintenant vous connecter avec:');
    console.log('Nom d\'utilisateur: admin');
    console.log('Mot de passe: admin123');
    console.log('\nIMPORTANT: Changez ce mot de passe après la première connexion!');
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur administrateur:', error);
  } finally {
    // Fermer la connexion à la base de données
    process.exit(0);
  }
}

// Exécuter la fonction
createAdminUser(); 