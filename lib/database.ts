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

    // Create permissions system tables
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        resource VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(resource, action)
      )
    `)

    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, permission_id)
      )
    `)

    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        granted BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, permission_id)
      )
    `)

    // Insert default permissions one by one
    const permissions = [
      ['users.read', 'Lire les informations des utilisateurs', 'users', 'read'],
      ['users.create', 'Créer de nouveaux utilisateurs', 'users', 'create'],
      ['users.update', 'Modifier les informations des utilisateurs', 'users', 'update'],
      ['users.delete', 'Supprimer des utilisateurs', 'users', 'delete'],
      ['processes.read', 'Lire les processus', 'processes', 'read'],
      ['processes.create', 'Créer de nouveaux processus', 'processes', 'create'],
      ['processes.update', 'Modifier les processus', 'processes', 'update'],
      ['processes.delete', 'Supprimer des processus', 'processes', 'delete'],
      ['documents.read', 'Lire les documents', 'documents', 'read'],
      ['documents.create', 'Créer de nouveaux documents', 'documents', 'create'],
      ['documents.update', 'Modifier les documents', 'documents', 'update'],
      ['documents.delete', 'Supprimer des documents', 'documents', 'delete'],
      ['settings.read', 'Accéder aux paramètres', 'settings', 'read'],
      ['settings.update', 'Modifier les paramètres', 'settings', 'update'],
      ['analytics.read', 'Voir les analyses', 'analytics', 'read'],
      ['reports.generate', 'Générer des rapports', 'reports', 'generate']
    ]

    for (const [name, description, resource, action] of permissions) {
      await DatabaseService.query(`
        INSERT INTO permissions (name, description, resource, action) 
        VALUES (${name}, ${description}, ${resource}, ${action})
        ON CONFLICT (resource, action) DO NOTHING
      `)
    }

    // Insert default roles one by one
    const roles = [
      ['admin', 'Administrateur avec tous les droits', true],
      ['contributor', 'Contributeur avec droits de création et modification', true],
      ['reader', 'Lecteur avec droits de lecture uniquement', true]
    ]

    for (const [name, description, isSystem] of roles) {
      await DatabaseService.query(`
        INSERT INTO roles (name, description, is_system) 
        VALUES (${name}, ${description}, ${isSystem})
        ON CONFLICT (name) DO NOTHING
      `)
    }

    // Assign permissions to roles
    // Admin gets all permissions
    await DatabaseService.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'admin'
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `)

    // Contributor gets read, create, update permissions (no delete)
    await DatabaseService.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'contributor'
      AND p.action IN ('read', 'create', 'update')
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `)

    // Reader gets only read permissions
    await DatabaseService.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'reader'
      AND p.action = 'read'
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `)

    console.log("Database tables and permissions system initialized successfully")
  } catch (error) {
    console.error("Database initialization failed:", error)
    throw error
  }
}
