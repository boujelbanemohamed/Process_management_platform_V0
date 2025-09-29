import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // Vérifier si la table existe, sinon la créer
    await sql`
      CREATE TABLE IF NOT EXISTS mode_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Récupérer les paramètres
    const settings = await sql`
      SELECT setting_key, setting_value FROM mode_settings
    `;

    // Convertir en objet
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.setting_key] = JSON.parse(setting.setting_value);
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      settings: settingsObj
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Vérifier si la table existe, sinon la créer
    await sql`
      CREATE TABLE IF NOT EXISTS mode_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Sauvegarder chaque paramètre
    for (const [key, value] of Object.entries(body)) {
      await sql`
        INSERT INTO mode_settings (setting_key, setting_value, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}, CURRENT_TIMESTAMP)
        ON CONFLICT (setting_key) 
        DO UPDATE SET 
          setting_value = EXCLUDED.setting_value,
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Paramètres sauvegardés avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des paramètres' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Supprimer tous les paramètres
    await sql`DELETE FROM mode_settings`;

    return NextResponse.json({
      success: true,
      message: 'Paramètres supprimés avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des paramètres' },
      { status: 500 }
    );
  }
}
