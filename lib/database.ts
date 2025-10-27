import { neon } from "@neondatabase/serverless"

// Lazy init de la connexion pour éviter l'accès à l'env au build
function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL manquant pour la connexion Neon")
  }
  return neon(url)
}

export class DatabaseService {
  static async query(text: string, params?: any[]) {
    try {
      // Utilise l'API unsafe pour exécuter des requêtes dynamiques avec Neon
      const sql = getSql()
      const result = await (sql as any).unsafe(text, params || [])
      return { rows: result as any[] }
    } catch (error) {
      console.error("Database query error:", error)
      throw error
    }
  }

  // Test database connection
  static async testConnection() {
    try {
      const result = await this.query("SELECT NOW()")
      console.log("Database connected successfully:", result.rows[0])
      return true
    } catch (error) {
      console.error("Database connection failed:", error)
      return false
    }
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // ... (création des autres tables) ...

    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        task_number VARCHAR(20) UNIQUE NOT NULL,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        assignee_id INTEGER,
        assignee_type VARCHAR(50), -- 'user' or 'entity'
        start_date DATE,
        end_date DATE,
        priority VARCHAR(50) DEFAULT 'Moyenne',
        status VARCHAR(50) DEFAULT 'À faire',
        completion_date TIMESTAMP,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log("Database tables initialized successfully")
  } catch (error) {
    console.error("Database initialization failed:", error)
    throw error
  }
}
