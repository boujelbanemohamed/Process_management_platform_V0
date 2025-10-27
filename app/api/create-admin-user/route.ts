import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const email = 'boujelbane@gmail.com';
    const plainPassword = 'Leila131182*';
    const role = 'admin';

    // Vérifier si l'utilisateur existe déjà
    const checkUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUser = await DatabaseService.query(checkUserQuery, [email]);

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'Un utilisateur avec cet email existe déjà.' }, { status: 409 });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Insérer le nouvel utilisateur
    const insertUserQuery = `
      INSERT INTO users (email, password, role, name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role, created_at
    `;
    const newUser = await DatabaseService.query(insertUserQuery, [email, hashedPassword, role, 'Admin User']);

    return NextResponse.json({
      success: true,
      message: 'Utilisateur administrateur créé avec succès.',
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la création de l’utilisateur admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
