import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSql();
    
    console.log('🔄 Ajout de la colonne entity_ids...');

    // Ajouter la colonne entity_ids
    await sql`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS entity_ids BIGINT[]
    `;
    console.log('✅ Colonne entity_ids ajoutée');

    // Vérifier que la colonne existe
    const columns = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'entity_ids'
    `;
    
    console.log('📋 Colonne entity_ids trouvée:', columns);

    return NextResponse.json({
      success: true,
      message: 'Colonne entity_ids ajoutée avec succès',
      column: columns[0] || null
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de entity_ids:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de l\'ajout de entity_ids',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
