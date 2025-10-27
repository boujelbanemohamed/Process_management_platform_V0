import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const email = 'boujelbane@gmail.com';
    const plainPassword = 'Leila131182*';
    const role = 'admin';

    // Étape 1: Supprimer l'utilisateur existant pour nettoyer
    const deleteUserQuery = 'DELETE FROM users WHERE email = $1';
    await DatabaseService.query(deleteUserQuery, [email]);
    console.log(`Tentative de suppression de l'ancien utilisateur ${email} terminée.`);

    // Étape 2: Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Étape 3: Insérer le nouvel utilisateur avec la bonne colonne password_hash
    const insertUserQuery = `
      INSERT INTO users (email, password_hash, role, name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role, created_at
    `;
    const newUser = await DatabaseService.query(insertUserQuery, [email, hashedPassword, role, 'Admin User']);

    return NextResponse.json({
      success: true,
      message: 'Utilisateur administrateur recréé avec succès (colonne corrigée).',
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la recréation de l’utilisateur admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
