// Script pour créer des processus de test
const https = require('https');

async function createProcesses() {
  console.log('🔧 Création de processus de test...');
  
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

  let successCount = 0;
  
  for (const process of processes) {
    try {
      console.log(`📝 Création: ${process.name}`);
      
      const response = await fetch('https://v0-process-management-platform.vercel.app/api/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(process)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${process.name} créé avec succès (ID: ${result.id})`);
        successCount++;
      } else {
        const error = await response.json();
        console.log(`❌ Erreur ${process.name}:`, error);
      }
    } catch (error) {
      console.log(`❌ Erreur réseau ${process.name}:`, error.message);
    }
  }
  
  console.log(`\n📊 Résumé: ${successCount}/${processes.length} processus créés`);
}

createProcesses();
