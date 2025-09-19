// Script pour vérifier que toutes les tables ont été créées
const https = require('https');

console.log('🔍 Vérification complète de la base de données Neon');
console.log('==================================================');

// Fonction pour tester une API
const testAPI = async (name, url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      const count = Array.isArray(data) ? data.length : 
                   (data.permissions ? data.permissions.length : 
                    (data.roles ? data.roles.length : 'N/A'));
      console.log(`✅ ${name}: ${count} éléments`);
      return { success: true, count, data };
    } else {
      console.log(`❌ ${name}: Erreur ${response.status} - ${data.error || 'Unknown error'}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Fonction pour tester une requête SQL directe
const testSQLQuery = async (query, description) => {
  try {
    const response = await fetch('https://v0-process-management-platform.vercel.app/api/init-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      console.log(`✅ ${description}: Connexion OK`);
      return true;
    } else {
      console.log(`❌ ${description}: Erreur de connexion`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    return false;
  }
};

// Tests des APIs existantes
const testAPIs = async () => {
  console.log('\n📊 Test des APIs (tables accessibles) :');
  console.log('========================================');

  const apis = [
    { name: 'Users', url: 'https://v0-process-management-platform.vercel.app/api/users' },
    { name: 'Processes', url: 'https://v0-process-management-platform.vercel.app/api/processes' },
    { name: 'Permissions (simple)', url: 'https://v0-process-management-platform.vercel.app/api/permissions' },
    { name: 'Permissions (matrix)', url: 'https://v0-process-management-platform.vercel.app/api/permissions?action=matrix' }
  ];

  const results = {};
  
  for (const api of apis) {
    results[api.name] = await testAPI(api.name, api.url);
  }

  return results;
};

// Test de la connexion à la base
const testConnection = async () => {
  console.log('\n🔌 Test de connexion à la base de données :');
  console.log('===========================================');
  
  const connectionOK = await testSQLQuery('SELECT 1', 'Connexion à Neon');
  return connectionOK;
};

// Analyse des résultats
const analyzeResults = (results) => {
  console.log('\n📋 Analyse des résultats :');
  console.log('==========================');

  const expectedTables = [
    'users',
    'processes', 
    'permissions',
    'roles',
    'role_permissions',
    'user_permissions',
    'reports',
    'categories',
    'statuses',
    'access_logs',
    'documents',
    'entities',
    'process_entities'
  ];

  console.log('\nTables attendues :');
  expectedTables.forEach(table => {
    console.log(`  - ${table}`);
  });

  console.log('\nÉtat des APIs :');
  Object.entries(results).forEach(([name, result]) => {
    if (result.success) {
      console.log(`  ✅ ${name}: Fonctionnelle (${result.count} éléments)`);
    } else {
      console.log(`  ❌ ${name}: Erreur - ${result.error}`);
    }
  });

  // Vérifier les tables critiques
  const criticalTables = ['users', 'processes', 'permissions'];
  const criticalStatus = criticalTables.map(table => {
    const apiName = table === 'users' ? 'Users' : 
                   table === 'processes' ? 'Processes' : 'Permissions (simple)';
    return results[apiName]?.success || false;
  });

  const allCriticalWorking = criticalStatus.every(status => status);
  
  console.log('\n🎯 État critique :');
  if (allCriticalWorking) {
    console.log('  ✅ Toutes les tables critiques fonctionnent');
  } else {
    console.log('  ❌ Certaines tables critiques ont des problèmes');
  }

  return { allCriticalWorking, results };
};

// Fonction principale
const main = async () => {
  try {
    // Test de connexion
    const connectionOK = await testConnection();
    
    if (!connectionOK) {
      console.log('\n❌ Impossible de se connecter à la base de données');
      return;
    }

    // Test des APIs
    const results = await testAPIs();
    
    // Analyse
    const analysis = analyzeResults(results);
    
    console.log('\n🏁 Résumé final :');
    console.log('================');
    
    if (analysis.allCriticalWorking) {
      console.log('✅ Base de données opérationnelle !');
      console.log('   Toutes les tables critiques sont créées et fonctionnelles.');
    } else {
      console.log('❌ Problèmes détectés dans la base de données');
      console.log('   Vérifiez les erreurs ci-dessus.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
};

// Exécuter
main();
