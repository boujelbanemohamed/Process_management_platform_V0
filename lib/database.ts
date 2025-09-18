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
    // Create users table
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'reader',
        password_hash TEXT,
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Ensure password_hash column exists in case of older deployments
    await DatabaseService.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `)

    // Create processes table
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS processes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tags TEXT[]
      )
    `)

    // Create documents table
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        size BIGINT,
        version VARCHAR(20),
        uploaded_by INTEGER REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        process_id INTEGER REFERENCES processes(id),
        url VARCHAR(500)
      )
    `)

    // Create entities table
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS entities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create process_entities junction table
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS process_entities (
        process_id INTEGER REFERENCES processes(id) ON DELETE CASCADE,
        entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
        PRIMARY KEY (process_id, entity_id)
      )
    `)

    console.log("Database tables initialized successfully")
  } catch (error) {
    console.error("Database initialization failed:", error)
    throw error
  }
}
