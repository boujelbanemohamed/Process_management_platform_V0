// Script pour tester toutes les nouvelles APIs
const https = require('https');

console.log('🔍 Test de toutes les nouvelles APIs');
console.log('===================================');

// Fonction pour tester une API
const testAPI = async (name, url, method = 'GET') => {
  try {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      const count = Array.isArray(data) ? data.length : 'N/A';
      console.log(`✅ ${name}: ${count} éléments (${response.status})`);
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

// Tester toutes les APIs
const testAllAPIs = async () => {
  const apis = [
    { name: 'Users', url: 'https://v0-process-management-platform.vercel.app/api/users' },
    { name: 'Processes', url: 'https://v0-process-management-platform.vercel.app/api/processes' },
    { name: 'Permissions', url: 'https://v0-process-management-platform.vercel.app/api/permissions' },
    { name: 'Documents', url: 'https://v0-process-management-platform.vercel.app/api/documents' },
    { name: 'Entities', url: 'https://v0-process-management-platform.vercel.app/api/entities' },
    { name: 'Categories', url: 'https://v0-process-management-platform.vercel.app/api/categories' },
    { name: 'Statuses', url: 'https://v0-process-management-platform.vercel.app/api/statuses' },
    { name: 'Reports', url: 'https://v0-process-management-platform.vercel.app/api/reports' },
    { name: 'Access Logs', url: 'https://v0-process-management-platform.vercel.app/api/access-logs' },
    { name: 'Process-Entities', url: 'https://v0-process-management-platform.vercel.app/api/process-entities' }
  ];

  console.log('\n📊 Test des APIs :');
  console.log('==================');

  const results = {};
  
  for (const api of apis) {
    results[api.name] = await testAPI(api.name, api.url);
  }

  return results;
};

// Analyser les résultats
const analyzeResults = (results) => {
  console.log('\n📋 Analyse des résultats :');
  console.log('==========================');

  const workingAPIs = Object.entries(results).filter(([_, result]) => result.success);
  const brokenAPIs = Object.entries(results).filter(([_, result]) => !result.success);

  console.log(`\n✅ APIs fonctionnelles: ${workingAPIs.length}/${Object.keys(results).length}`);
  workingAPIs.forEach(([name, result]) => {
    console.log(`  - ${name}: ${result.count} éléments`);
  });

  if (brokenAPIs.length > 0) {
    console.log(`\n❌ APIs avec problèmes: ${brokenAPIs.length}`);
    brokenAPIs.forEach(([name, result]) => {
      console.log(`  - ${name}: ${result.error}`);
    });
  }

  // Vérifier les APIs critiques
  const criticalAPIs = ['Users', 'Processes', 'Permissions', 'Documents', 'Entities', 'Categories', 'Statuses'];
  const criticalWorking = criticalAPIs.filter(api => results[api]?.success);
  
  console.log(`\n🎯 APIs critiques: ${criticalWorking.length}/${criticalAPIs.length}`);
  
  if (criticalWorking.length === criticalAPIs.length) {
    console.log('🎉 Toutes les APIs critiques fonctionnent !');
  } else {
    const missingCritical = criticalAPIs.filter(api => !results[api]?.success);
    console.log(`⚠️  APIs critiques manquantes: ${missingCritical.join(', ')}`);
  }

  return { workingAPIs, brokenAPIs, criticalWorking };
};

// Fonction principale
const main = async () => {
  try {
    console.log('🚀 Démarrage des tests...\n');
    
    const results = await testAllAPIs();
    const analysis = analyzeResults(results);
    
    console.log('\n🏁 Résumé final :');
    console.log('================');
    
    if (analysis.criticalWorking.length === 7) {
      console.log('✅ SUCCÈS ! Toutes les APIs critiques sont opérationnelles !');
      console.log('🎯 Le système est maintenant complet et fonctionnel.');
    } else {
      console.log('⚠️  ATTENTION ! Certaines APIs critiques ne fonctionnent pas.');
      console.log('🔧 Vérifiez les erreurs ci-dessus.');
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
};

// Exécuter
main();
