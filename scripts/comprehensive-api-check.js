// Script de vérification complète de toutes les APIs
const https = require('https');

console.log('🔍 Vérification complète de toutes les APIs');
console.log('==========================================');

// Fonction pour tester une route avec gestion d'erreur détaillée
const testAPI = async (name, method, url, body = null, expectedStatus = 200) => {
  try {
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
    const data = await response.json();
    
    const isSuccess = response.status === expectedStatus;
    const status = isSuccess ? '✅' : '❌';
    
    console.log(`${status} ${method} ${name} - ${response.status} (attendu: ${expectedStatus})`);
    
    if (!isSuccess) {
      console.log(`   Erreur: ${data.error || 'Unknown error'}`);
      if (data.details) {
        console.log(`   Détails: ${data.details}`);
      }
    } else if (Array.isArray(data)) {
      console.log(`   📊 ${data.length} éléments trouvés`);
    } else if (data.success !== undefined) {
      console.log(`   📊 Succès: ${data.success}`);
    } else {
      console.log(`   📊 Données reçues`);
    }
    
    return { 
      success: isSuccess, 
      status: response.status, 
      data, 
      expectedStatus,
      method,
      name 
    };
  } catch (error) {
    console.log(`❌ ${method} ${name} - Erreur réseau: ${error.message}`);
    return { success: false, error: error.message, method, name };
  }
};

// Test complet de toutes les APIs
const testAllAPIs = async () => {
  console.log('\n📊 Test complet des APIs :');
  console.log('==========================');

  const results = {};

  // 1. API Users
  console.log('\n👥 API Users:');
  results.users = {
    get: await testAPI('Users GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/users'),
    post: await testAPI('Users POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/users', {
      name: 'Test User API Check',
      email: `test-api-check-${Date.now()}@example.com`,
      role: 'reader',
      password: 'testpass123'
    }, 201)
  };

  // 2. API Processes
  console.log('\n📋 API Processes:');
  results.processes = {
    get: await testAPI('Processes GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/processes'),
    post: await testAPI('Processes POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/processes', {
      name: `Test Process API Check ${Date.now()}`,
      description: 'Test de création de processus',
      category: 'Test',
      status: 'draft',
      tags: ['test', 'api-check']
    }, 201)
  };

  // 3. API Documents
  console.log('\n📄 API Documents:');
  results.documents = {
    get: await testAPI('Documents GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/documents'),
    post: await testAPI('Documents POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/documents', {
      name: `Test Document API Check ${Date.now()}.pdf`,
      type: 'pdf',
      size: 1024000,
      version: '1.0',
      url: '#'
    }, 201)
  };

  // 4. API Entities
  console.log('\n🏢 API Entities:');
  results.entities = {
    get: await testAPI('Entities GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/entities'),
    post: await testAPI('Entities POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/entities', {
      name: `Test Entity API Check ${Date.now()}`,
      type: 'department',
      description: 'Test de création d\'entité'
    }, 201)
  };

  // 5. API Categories
  console.log('\n🏷️ API Categories:');
  results.categories = {
    get: await testAPI('Categories GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/categories'),
    post: await testAPI('Categories POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/categories', {
      name: `Test Category API Check ${Date.now()}`,
      description: 'Test de création de catégorie',
      type: 'process',
      color: '#FF5733'
    }, 201)
  };

  // 6. API Statuses
  console.log('\n📊 API Statuses:');
  results.statuses = {
    get: await testAPI('Statuses GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/statuses'),
    post: await testAPI('Statuses POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/statuses', {
      name: `Test Status API Check ${Date.now()}`,
      description: 'Test de création de statut',
      type: 'process',
      color: '#00FF00',
      order: 99
    }, 201)
  };

  // 7. API Reports
  console.log('\n📈 API Reports:');
  results.reports = {
    get: await testAPI('Reports GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/reports'),
    post: await testAPI('Reports POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/reports', {
      name: `Test Report API Check ${Date.now()}`,
      description: 'Test de création de rapport',
      type: 'processes',
      filters: { category: 'test' },
      data: { test: 'data' },
      isPublic: false,
      tags: ['test']
    }, 201)
  };

  // 8. API Access Logs
  console.log('\n📝 API Access Logs:');
  results.accessLogs = {
    get: await testAPI('Access Logs GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/access-logs'),
    post: await testAPI('Access Logs POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/access-logs', {
      userId: 1,
      userName: 'Test User',
      action: 'test',
      resource: 'test',
      resourceId: `test-${Date.now()}`,
      success: true,
      details: 'Test de création de log'
    }, 201)
  };

  // 9. API Process-Entities
  console.log('\n🔗 API Process-Entities:');
  results.processEntities = {
    get: await testAPI('Process-Entities GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/process-entities'),
    post: await testAPI('Process-Entities POST', 'POST', 'https://v0-process-management-platform.vercel.app/api/process-entities', {
      processId: 1,
      entityId: 1
    }, 201)
  };

  // 10. API Permissions
  console.log('\n🔐 API Permissions:');
  results.permissions = {
    get: await testAPI('Permissions GET', 'GET', 'https://v0-process-management-platform.vercel.app/api/permissions'),
    matrix: await testAPI('Permissions Matrix', 'GET', 'https://v0-process-management-platform.vercel.app/api/permissions?action=matrix')
  };

  return results;
};

// Analyser les résultats
const analyzeResults = (results) => {
  console.log('\n📋 Analyse détaillée des résultats :');
  console.log('====================================');

  let totalTests = 0;
  let successfulTests = 0;
  let failedTests = 0;

  Object.entries(results).forEach(([apiName, apiResults]) => {
    console.log(`\n🔍 ${apiName.toUpperCase()}:`);
    
    Object.entries(apiResults).forEach(([operation, result]) => {
      totalTests++;
      if (result.success) {
        successfulTests++;
        console.log(`  ✅ ${operation}: OK`);
      } else {
        failedTests++;
        console.log(`  ❌ ${operation}: ÉCHEC`);
        if (result.error) {
          console.log(`     Erreur: ${result.error}`);
        }
      }
    });
  });

  console.log('\n📊 Statistiques globales :');
  console.log('==========================');
  console.log(`Total des tests: ${totalTests}`);
  console.log(`Tests réussis: ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`Tests échoués: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);

  // Vérifier les APIs critiques
  const criticalAPIs = ['users', 'processes', 'documents', 'entities', 'categories', 'statuses'];
  const criticalWorking = criticalAPIs.filter(api => 
    results[api] && results[api].get && results[api].get.success
  );

  console.log(`\n🎯 APIs critiques fonctionnelles: ${criticalWorking.length}/${criticalAPIs.length}`);
  
  if (criticalWorking.length === criticalAPIs.length) {
    console.log('🎉 Toutes les APIs critiques fonctionnent parfaitement !');
  } else {
    const missingCritical = criticalAPIs.filter(api => 
      !results[api] || !results[api].get || !results[api].get.success
    );
    console.log(`⚠️  APIs critiques avec problèmes: ${missingCritical.join(', ')}`);
  }

  return { totalTests, successfulTests, failedTests, criticalWorking: criticalWorking.length };
};

// Test de performance
const testPerformance = async () => {
  console.log('\n⚡ Test de performance :');
  console.log('========================');

  const apis = [
    'https://v0-process-management-platform.vercel.app/api/users',
    'https://v0-process-management-platform.vercel.app/api/processes',
    'https://v0-process-management-platform.vercel.app/api/documents',
    'https://v0-process-management-platform.vercel.app/api/entities',
    'https://v0-process-management-platform.vercel.app/api/categories',
    'https://v0-process-management-platform.vercel.app/api/statuses',
    'https://v0-process-management-platform.vercel.app/api/reports',
    'https://v0-process-management-platform.vercel.app/api/access-logs',
    'https://v0-process-management-platform.vercel.app/api/permissions'
  ];

  const performanceResults = [];

  for (const api of apis) {
    const startTime = Date.now();
    try {
      const response = await fetch(api);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      performanceResults.push({
        api: api.split('/').pop(),
        duration: duration,
        status: response.status,
        success: response.ok
      });
      
      const status = response.ok ? '✅' : '❌';
      console.log(`${status} ${api.split('/').pop()}: ${duration}ms (${response.status})`);
    } catch (error) {
      console.log(`❌ ${api.split('/').pop()}: Erreur - ${error.message}`);
    }
  }

  const avgDuration = performanceResults.reduce((sum, result) => sum + result.duration, 0) / performanceResults.length;
  console.log(`\n📊 Temps de réponse moyen: ${avgDuration.toFixed(0)}ms`);
  
  return performanceResults;
};

// Fonction principale
const main = async () => {
  try {
    console.log('🚀 Démarrage de la vérification complète...\n');
    
    // Test des APIs
    const results = await testAllAPIs();
    
    // Analyse des résultats
    const analysis = analyzeResults(results);
    
    // Test de performance
    const performance = await testPerformance();
    
    console.log('\n🏁 RÉSUMÉ FINAL :');
    console.log('================');
    
    if (analysis.failedTests === 0) {
      console.log('🎉 PARFAIT ! Toutes les APIs fonctionnent parfaitement !');
      console.log('✅ 100% de réussite sur tous les tests');
    } else if (analysis.failedTests <= 2) {
      console.log('✅ EXCELLENT ! Presque toutes les APIs fonctionnent parfaitement !');
      console.log(`✅ ${analysis.successfulTests}/${analysis.totalTests} tests réussis`);
    } else if (analysis.failedTests <= 5) {
      console.log('⚠️  BON ! La plupart des APIs fonctionnent, quelques améliorations possibles.');
      console.log(`✅ ${analysis.successfulTests}/${analysis.totalTests} tests réussis`);
    } else {
      console.log('❌ ATTENTION ! Plusieurs APIs ont des problèmes.');
      console.log(`❌ ${analysis.failedTests}/${analysis.totalTests} tests échoués`);
    }
    
    console.log(`\n🎯 APIs critiques: ${analysis.criticalWorking}/6`);
    console.log(`⚡ Performance: ${performance.length} APIs testées`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
};

// Exécuter
main();
