import { NextResponse } from "next/server"
import { DatabaseService, initializeDatabase } from "@/lib/database"

export async function POST() {
  try {
    await initializeDatabase()
    return NextResponse.json({ success: true, message: "Database initialized successfully" })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json({ success: false, error: "Failed to initialize database" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Test de l'existence des tables
    const tables = ['projects', 'project_entities', 'project_members', 'users', 'entities'];
    const results: any = {};
    
    for (const table of tables) {
      try {
        const query = `SELECT COUNT(*) as count FROM ${table}`;
        const result = await DatabaseService.query(query);
        results[table] = { exists: true, count: result.rows[0].count };
      } catch (error) {
        results[table] = { 
          exists: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        };
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      tables: results,
      message: 'Test des tables terminé'
    });
  } catch (error) {
    console.error('Erreur test tables:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors du test des tables'
      },
      { status: 500 }
    );
  }
}
