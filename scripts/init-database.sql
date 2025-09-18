-- Initialize database schema and sample data for the process management platform

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'reader',
  password_hash TEXT,
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

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
);

CREATE TABLE IF NOT EXISTS entities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS process_entities (
  process_id INTEGER REFERENCES processes(id) ON DELETE CASCADE,
  entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (process_id, entity_id)
);

-- Insert sample users
INSERT INTO users (name, email, role, avatar) VALUES
('Admin User', 'admin@company.com', 'admin', '/professional-avatar.png'),
('John Contributor', 'john@company.com', 'contributor', '/professional-avatar.png'),
('Jane Reader', 'jane@company.com', 'reader', '/professional-avatar.png')
ON CONFLICT (email) DO NOTHING;

-- Insert sample processes
INSERT INTO processes (name, description, category, status, created_by, tags) VALUES
('Processus de Recrutement', 'Processus complet de recrutement des nouveaux employés', 'Ressources Humaines', 'active', 1, ARRAY['RH', 'Recrutement', 'Onboarding']),
('Gestion des Commandes', 'Processus de traitement des commandes clients', 'Ventes', 'active', 2, ARRAY['Ventes', 'Commandes', 'Client']),
('Contrôle Qualité', 'Processus de contrôle qualité des produits', 'Production', 'draft', 1, ARRAY['Qualité', 'Production', 'Contrôle'])
ON CONFLICT DO NOTHING;

-- Insert sample documents
INSERT INTO documents (name, type, size, version, uploaded_by, process_id, url) VALUES
('Guide_Recrutement_v2.pdf', 'pdf', 2048000, '2.0', 1, 1, '#'),
('Formulaire_Entretien.docx', 'docx', 512000, '1.3', 2, 1, '#')
ON CONFLICT DO NOTHING;

-- Insert sample entities
INSERT INTO entities (name, type, description) VALUES
('Département RH', 'department', 'Gestion des ressources humaines'),
('Équipe Ventes', 'team', 'Équipe commerciale')
ON CONFLICT DO NOTHING;

-- Link processes to entities
INSERT INTO process_entities (process_id, entity_id) VALUES
(1, 1),
(2, 2)
ON CONFLICT DO NOTHING;
