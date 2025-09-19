// Script pour créer des données de test dans la base de données
const https = require('https');

console.log('🔧 Création de données de test');
console.log('==============================');

// Fonction pour créer des données via API
const createData = async (name, url, data) => {
  try {
    console.log(`\n📝 Création: ${name}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ ${name} créé avec succès`);
      return result;
    } else {
      const error = await response.json();
      console.log(`❌ Erreur ${name}:`, error);
      return null;
    }
  } catch (error) {
    console.log(`❌ Erreur réseau ${name}:`, error.message);
    return null;
  }
};

// Créer des données de test
const createTestData = async () => {
  console.log('\n🚀 Démarrage de la création de données de test...\n');

  // 1. Créer des processus
  console.log('📋 Création de processus...');
  const processes = [
    {
      name: 'Processus de Recrutement',
      description: 'Processus complet de recrutement des nouveaux employés',
      category: 'Ressources Humaines',
      status: 'active',
      tags: ['RH', 'Recrutement', 'Onboarding']
    },
    {
      name: 'Gestion des Commandes',
      description: 'Processus de traitement des commandes clients',
      category: 'Ventes',
      status: 'active',
      tags: ['Ventes', 'Commandes', 'Client']
    },
    {
      name: 'Contrôle Qualité',
      description: 'Processus de contrôle qualité des produits',
      category: 'Production',
      status: 'draft',
      tags: ['Qualité', 'Production', 'Contrôle']
    },
    {
      name: 'Formation des Employés',
      description: 'Processus de formation et développement des compétences',
      category: 'Ressources Humaines',
      status: 'active',
      tags: ['RH', 'Formation', 'Développement']
    },
    {
      name: 'Gestion des Stocks',
      description: 'Processus de gestion des stocks et inventaire',
      category: 'Logistique',
      status: 'draft',
      tags: ['Logistique', 'Stocks', 'Inventaire']
    }
  ];

  const createdProcesses = [];
  for (const process of processes) {
    const result = await createData(`Processus: ${process.name}`, 'https://v0-process-management-platform.vercel.app/api/processes', process);
    if (result) createdProcesses.push(result);
  }

  // 2. Créer des documents
  console.log('\n📄 Création de documents...');
  const documents = [
    {
      name: 'Guide_Recrutement_v2.pdf',
      type: 'pdf',
      size: 2048000,
      version: '2.0',
      url: '#'
    },
    {
      name: 'Formulaire_Entretien.docx',
      type: 'docx',
      size: 512000,
      version: '1.3',
      url: '#'
    },
    {
      name: 'Procédure_Qualité.pdf',
      type: 'pdf',
      size: 1536000,
      version: '1.0',
      url: '#'
    },
    {
      name: 'Manuel_Formation.pptx',
      type: 'pptx',
      size: 3072000,
      version: '2.1',
      url: '#'
    },
    {
      name: 'Rapport_Mensuel.xlsx',
      type: 'xlsx',
      size: 256000,
      version: '1.0',
      url: '#'
    }
  ];

  const createdDocuments = [];
  for (const document of documents) {
    const result = await createData(`Document: ${document.name}`, 'https://v0-process-management-platform.vercel.app/api/documents', document);
    if (result) createdDocuments.push(result);
  }

  // 3. Créer des entités
  console.log('\n🏢 Création d\'entités...');
  const entities = [
    {
      name: 'Département RH',
      type: 'department',
      description: 'Gestion des ressources humaines'
    },
    {
      name: 'Équipe Ventes',
      type: 'team',
      description: 'Équipe commerciale'
    },
    {
      name: 'Service Production',
      type: 'department',
      description: 'Service de production'
    },
    {
      name: 'Direction Générale',
      type: 'department',
      description: 'Direction générale de l\'entreprise'
    },
    {
      name: 'Équipe IT',
      type: 'team',
      description: 'Équipe informatique'
    }
  ];

  const createdEntities = [];
  for (const entity of entities) {
    const result = await createData(`Entité: ${entity.name}`, 'https://v0-process-management-platform.vercel.app/api/entities', entity);
    if (result) createdEntities.push(result);
  }

  // 4. Créer des catégories
  console.log('\n🏷️ Création de catégories...');
  const categories = [
    {
      name: 'Ressources Humaines',
      description: 'Processus liés à la gestion des ressources humaines',
      type: 'process',
      color: '#3B82F6'
    },
    {
      name: 'Finance',
      description: 'Processus financiers et comptables',
      type: 'process',
      color: '#10B981'
    },
    {
      name: 'Qualité',
      description: 'Processus de contrôle qualité',
      type: 'process',
      color: '#F59E0B'
    },
    {
      name: 'Procédures',
      description: 'Documents de procédures',
      type: 'document',
      color: '#8B5CF6'
    },
    {
      name: 'Formations',
      description: 'Documents de formation',
      type: 'document',
      color: '#EF4444'
    }
  ];

  const createdCategories = [];
  for (const category of categories) {
    const result = await createData(`Catégorie: ${category.name}`, 'https://v0-process-management-platform.vercel.app/api/categories', category);
    if (result) createdCategories.push(result);
  }

  // 5. Créer des statuts
  console.log('\n📊 Création de statuts...');
  const statuses = [
    {
      name: 'Actif',
      description: 'Processus actif et opérationnel',
      type: 'process',
      color: '#10B981',
      order: 1
    },
    {
      name: 'Brouillon',
      description: 'Processus en cours de création',
      type: 'process',
      color: '#F59E0B',
      order: 2
    },
    {
      name: 'Archivé',
      description: 'Processus archivé',
      type: 'process',
      color: '#6B7280',
      order: 3
    },
    {
      name: 'En Révision',
      description: 'Document en cours de révision',
      type: 'document',
      color: '#3B82F6',
      order: 1
    },
    {
      name: 'Approuvé',
      description: 'Document approuvé',
      type: 'document',
      color: '#10B981',
      order: 2
    }
  ];

  const createdStatuses = [];
  for (const status of statuses) {
    const result = await createData(`Statut: ${status.name}`, 'https://v0-process-management-platform.vercel.app/api/statuses', status);
    if (result) createdStatuses.push(result);
  }

  // 6. Créer des rapports
  console.log('\n📈 Création de rapports...');
  const reports = [
    {
      name: 'Rapport Mensuel RH',
      description: 'Rapport mensuel des activités RH',
      type: 'monthly',
      filters: { department: 'RH', period: '2024-09' },
      data: { employees: 25, newHires: 3, departures: 1 },
      isPublic: false,
      tags: ['RH', 'Mensuel']
    },
    {
      name: 'Analyse des Ventes Q3',
      description: 'Analyse des ventes du troisième trimestre',
      type: 'quarterly',
      filters: { quarter: 'Q3', year: 2024 },
      data: { revenue: 150000, orders: 45, growth: 12 },
      isPublic: true,
      tags: ['Ventes', 'Q3', 'Analyse']
    },
    {
      name: 'Rapport Qualité Production',
      description: 'Rapport de contrôle qualité de la production',
      type: 'quality',
      filters: { department: 'Production', period: '2024-09' },
      data: { defects: 2, qualityScore: 98, improvements: 5 },
      isPublic: false,
      tags: ['Qualité', 'Production']
    }
  ];

  const createdReports = [];
  for (const report of reports) {
    const result = await createData(`Rapport: ${report.name}`, 'https://v0-process-management-platform.vercel.app/api/reports', report);
    if (result) createdReports.push(result);
  }

  // 7. Créer des logs d'accès
  console.log('\n📝 Création de logs d\'accès...');
  const accessLogs = [
    {
      userId: 1,
      userName: 'Admin User',
      action: 'create',
      resource: 'process',
      resourceId: 'proc-001',
      success: true,
      details: 'Création du processus de recrutement'
    },
    {
      userId: 2,
      userName: 'Test User',
      action: 'upload',
      resource: 'document',
      resourceId: 'doc-001',
      success: true,
      details: 'Upload du guide de recrutement'
    },
    {
      userId: 1,
      userName: 'Admin User',
      action: 'read',
      resource: 'analytics',
      resourceId: 'dashboard',
      success: true,
      details: 'Consultation du tableau de bord'
    },
    {
      userId: 3,
      userName: 'Contributor User',
      action: 'update',
      resource: 'process',
      resourceId: 'proc-002',
      success: true,
      details: 'Mise à jour du processus de vente'
    },
    {
      userId: 2,
      userName: 'Test User',
      action: 'delete',
      resource: 'document',
      resourceId: 'doc-003',
      success: false,
      details: 'Tentative de suppression non autorisée'
    }
  ];

  const createdLogs = [];
  for (const log of accessLogs) {
    const result = await createData(`Log: ${log.action} ${log.resource}`, 'https://v0-process-management-platform.vercel.app/api/access-logs', log);
    if (result) createdLogs.push(result);
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ DE LA CRÉATION :');
  console.log('==========================');
  console.log(`✅ Processus créés: ${createdProcesses.length}/${processes.length}`);
  console.log(`✅ Documents créés: ${createdDocuments.length}/${documents.length}`);
  console.log(`✅ Entités créées: ${createdEntities.length}/${entities.length}`);
  console.log(`✅ Catégories créées: ${createdCategories.length}/${categories.length}`);
  console.log(`✅ Statuts créés: ${createdStatuses.length}/${statuses.length}`);
  console.log(`✅ Rapports créés: ${createdReports.length}/${reports.length}`);
  console.log(`✅ Logs créés: ${createdLogs.length}/${accessLogs.length}`);

  console.log('\n🎉 Données de test créées avec succès !');
  console.log('🌐 Vous pouvez maintenant tester votre plateforme à: https://v0-process-management-platform.vercel.app');
};

// Exécuter
createTestData().catch(console.error);
