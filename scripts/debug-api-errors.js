// Script de débogage détaillé des erreurs API
const https = require('https');

console.log('🔍 Débogage détaillé des erreurs API');
console.log('====================================');

// Fonction pour tester avec détails d'erreur
const debugAPI = async (name, method, url, body = null) => {
  try {
    console.log(`\n🔍 Test: ${method} ${name}`);
    console.log(`URL: ${url}`);
    if (body) {
      console.log(`Body: ${JSON.stringify(body, null, 2)}`);
    }

    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const responseText = await response.text();
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log(`Response:`, JSON.stringify(data, null, 2));
    } catch (e) {
      console.log(`Raw Response:`, responseText);
    }
    
    return { 
      success: response.ok, 
      status: response.status, 
      data, 
      responseText 
    };
  } catch (error) {
    console.log(`❌ Erreur réseau: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Test détaillé des APIs problématiques
const debugProblematicAPIs = async () => {
  console.log('\n📊 Débogage des APIs problématiques :');
  console.log('=====================================');

  // 1. Test Processes POST
  console.log('\n🔧 1. DEBUGGING PROCESSES POST:');
  await debugAPI('Processes POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/processes', {
    name: `Debug Process ${Date.now()}`,
    description: 'Test de débogage',
    category: 'debug',
    status: 'draft',
    tags: ['debug', 'test']
  });

  // 2. Test Reports POST
  console.log('\n🔧 2. DEBUGGING REPORTS POST:');
  await debugAPI('Reports POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/reports', {
    name: `Debug Report ${Date.now()}`,
    description: 'Test de débogage',
    type: 'debug',
    filters: { test: true },
    data: { debug: 'data' },
    isPublic: false,
    tags: ['debug']
  });

  // 3. Test Process-Entities POST
  console.log('\n🔧 3. DEBUGGING PROCESS-ENTITIES POST:');
  await debugAPI('Process-Entities POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/process-entities', {
    processId: 1,
    entityId: 1
  });

  // 4. Vérifier les données existantes
  console.log('\n🔧 4. VÉRIFICATION DES DONNÉES EXISTANTES:');
  
  console.log('\n📋 Vérification des utilisateurs:');
  await debugAPI('Users GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/users');
  
  console.log('\n📋 Vérification des processus:');
  await debugAPI('Processes GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/processes');
  
  console.log('\n📋 Vérification des entités:');
  await debugAPI('Entities GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/entities');
};

// Test de création d'un utilisateur de test
const createTestUser = async () => {
  console.log('\n👤 Création d\'un utilisateur de test:');
  console.log('=====================================');
  
  const testUser = {
    name: 'Test User Debug',
    email: `debug-test-${Date.now()}@example.com`,
    role: 'admin',
    password: 'testpass123'
  };
  
  await debugAPI('Create Test User', 'POST', 'https://v0-process-management-platform.vercel.app/api/users', testUser);
};

// Test de création d'une entité de test
const createTestEntity = async () => {
  console.log('\n🏢 Création d\'une entité de test:');
  console.log('==================================');
  
  const testEntity = {
    name: `Test Entity Debug ${Date.now()}`,
    type: 'department',
    description: 'Entité de test pour débogage'
  };
  
  await debugAPI('Create Test Entity', 'POST', 'https://v0-process-management-platform.vercel.app/api/entities', testEntity);
};

// Fonction principale
const main = async () => {
  try {
    console.log('🚀 Démarrage du débogage détaillé...\n');
    
    // Créer des données de test
    await createTestUser();
    await createTestEntity();
    
    // Déboguer les APIs problématiques
    await debugProblematicAPIs();
    
    console.log('\n🏁 DÉBOGAGE TERMINÉ');
    console.log('==================');
    
  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error.message);
  }
};

// Exécuter
main();
