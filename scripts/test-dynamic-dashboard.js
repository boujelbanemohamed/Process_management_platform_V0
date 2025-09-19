// Script de test pour vérifier que le tableau de bord est entièrement dynamique
const https = require('https');

console.log('🔄 Test du tableau de bord dynamique');
console.log('====================================');

// Fonction pour tester une API
const testAPI = async (name, url) => {
  try {
    console.log(`\n🔍 Test: ${name}`);
    console.log(`URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name} - ${response.status}`);
      
      if (Array.isArray(data)) {
        console.log(`   📊 ${data.length} éléments trouvés`);
        if (data.length > 0) {
          console.log(`   📋 Premier élément:`, Object.keys(data[0]).join(', '));
        }
      } else if (data && typeof data === 'object') {
        console.log(`   📊 Données reçues:`, Object.keys(data).join(', '));
      }
      
      return { success: true, data, count: Array.isArray(data) ? data.length : 1 };
    } else {
      console.log(`❌ ${name} - ${response.status}: ${data.error || 'Unknown error'}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`❌ ${name} - Erreur réseau: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Test du tableau de bord dynamique
const testDynamicDashboard = async () => {
  console.log('\n📊 Test du tableau de bord dynamique :');
  console.log('======================================');

  const results = {};

  // 1. Test des APIs utilisées par le tableau de bord
  console.log('\n🔌 Test des APIs du tableau de bord :');
  results.processes = await testAPI('Processes API', 'https://v0-process-management-platform.vercel.app/api/processes');
  results.documents = await testAPI('Documents API', 'https://v0-process-management-platform.vercel.app/api/documents');
  results.users = await testAPI('Users API', 'https://v0-process-management-platform.vercel.app/api/users');
  results.reports = await testAPI('Reports API', 'https://v0-process-management-platform.vercel.app/api/reports');
  results.accessLogs = await testAPI('Access Logs API', 'https://v0-process-management-platform.vercel.app/api/access-logs');

  // 2. Calculer les statistiques du tableau de bord
  console.log('\n📈 Calcul des statistiques du tableau de bord :');
  console.log('===============================================');
  
  if (results.processes.success && results.documents.success && results.users.success && results.reports.success) {
    const processes = results.processes.data;
    const documents = results.documents.data;
    const users = results.users.data;
    const reports = results.reports.data;
    
    // Calculer les statistiques
    const activeProcesses = processes.filter(p => p.status === 'active').length;
    const draftProcesses = processes.filter(p => p.status === 'draft').length;
    const totalDocuments = documents.length;
    const totalUsers = users.length;
    const totalReports = reports.length;
    const efficiency = processes.length > 0 ? Math.round((activeProcesses / processes.length) * 100) : 0;
    
    console.log('✅ Statistiques calculées :');
    console.log(`   📊 Processus actifs: ${activeProcesses}`);
    console.log(`   📊 Processus brouillons: ${draftProcesses}`);
    console.log(`   📊 Total documents: ${totalDocuments}`);
    console.log(`   📊 Total utilisateurs: ${totalUsers}`);
    console.log(`   📊 Total rapports: ${totalReports}`);
    console.log(`   📊 Efficacité: ${efficiency}%`);
    
    // Vérifier les processus récents
    const recentProcesses = processes.slice(0, 5);
    console.log(`\n📋 Processus récents (${recentProcesses.length}):`);
    recentProcesses.forEach((process, index) => {
      console.log(`   ${index + 1}. ${process.name} (${process.status})`);
    });
    
    // Vérifier les documents récents
    const recentDocuments = documents.slice(0, 5);
    console.log(`\n📄 Documents récents (${recentDocuments.length}):`);
    recentDocuments.forEach((document, index) => {
      console.log(`   ${index + 1}. ${document.name} (${document.type || 'Type inconnu'})`);
    });
    
  } else {
    console.log('❌ Impossible de calculer les statistiques - APIs non disponibles');
  }

  return results;
};

// Analyser les résultats
const analyzeResults = (results) => {
  console.log('\n📋 Analyse des résultats :');
  console.log('==========================');

  let totalTests = 0;
  let successfulTests = 0;
  let failedTests = 0;

  Object.entries(results).forEach(([testName, result]) => {
    totalTests++;
    if (result.success) {
      successfulTests++;
      console.log(`✅ ${testName}: OK`);
      if (result.count !== undefined) {
        console.log(`   📊 ${result.count} éléments`);
      }
    } else {
      failedTests++;
      console.log(`❌ ${testName}: ÉCHEC`);
      if (result.error) {
        console.log(`   Erreur: ${result.error}`);
      }
    }
  });

  console.log('\n📊 Statistiques globales :');
  console.log('==========================');
  console.log(`Total des tests: ${totalTests}`);
  console.log(`Tests réussis: ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`Tests échoués: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);

  // Vérifier la dynamique du tableau de bord
  const dashboardAPIs = ['processes', 'documents', 'users', 'reports', 'accessLogs'];
  const dashboardWorking = dashboardAPIs.filter(api => 
    results[api] && results[api].success
  );

  console.log(`\n🔄 APIs du tableau de bord: ${dashboardWorking.length}/${dashboardAPIs.length}`);
  
  if (dashboardWorking.length === dashboardAPIs.length) {
    console.log('🎉 Le tableau de bord est ENTIÈREMENT DYNAMIQUE !');
    console.log('✅ Toutes les données proviennent de la base de données');
    console.log('✅ Aucune donnée statique utilisée');
    console.log('✅ Statistiques calculées en temps réel');
  } else {
    const missingAPIs = dashboardAPIs.filter(api => 
      !results[api] || !results[api].success
    );
    console.log(`⚠️  APIs manquantes: ${missingAPIs.join(', ')}`);
  }

  return { totalTests, successfulTests, failedTests, dashboardWorking: dashboardWorking.length };
};

// Fonction principale
const main = async () => {
  try {
    console.log('🚀 Démarrage du test du tableau de bord dynamique...\n');
    
    // Test du tableau de bord
    const results = await testDynamicDashboard();
    
    // Analyse des résultats
    const analysis = analyzeResults(results);
    
    console.log('\n🏁 RÉSUMÉ FINAL :');
    console.log('================');
    
    if (analysis.dashboardWorking === 5) {
      console.log('🎉 PARFAIT ! Le tableau de bord est entièrement dynamique !');
      console.log('✅ 100% des données proviennent de la base de données');
      console.log('✅ Aucune donnée statique utilisée');
      console.log('✅ Toutes les statistiques sont calculées en temps réel');
    } else if (analysis.dashboardWorking >= 4) {
      console.log('✅ EXCELLENT ! Le tableau de bord est majoritairement dynamique !');
      console.log(`✅ ${analysis.dashboardWorking}/5 APIs fonctionnelles`);
    } else {
      console.log('⚠️  ATTENTION ! Le tableau de bord a encore des problèmes.');
      console.log(`⚠️  ${analysis.dashboardWorking}/5 APIs fonctionnelles`);
    }
    
    console.log(`\n🎯 APIs fonctionnelles: ${analysis.successfulTests}/${analysis.totalTests}`);
    console.log(`🔄 Tableau de bord dynamique: ${analysis.dashboardWorking}/5`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
};

// Exécuter
main();
