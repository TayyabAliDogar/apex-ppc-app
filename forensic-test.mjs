// Forensic test to find the exact error
console.log('🔍 FORENSIC TEST: Starting module import chain...');

// Test each import individually
async function testImport(modulePath, name) {
  try {
    console.log(`\n📦 Testing: ${name} (${modulePath})`);
    await import(modulePath);
    console.log(`✅ SUCCESS: ${name} imported`);
    return true;
  } catch (err) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Stack: ${err.stack}`);
    return false;
  }
}

// Test imports in order
(async () => {
  console.log('\n=== PHASE 1: Core Dependencies ===');
  await testImport('react', 'React');
  await testImport('react-dom/client', 'ReactDOM');
  await testImport('framer-motion', 'Framer Motion');

  console.log('\n=== PHASE 2: Utility Libraries ===');
  await testImport('dexie', 'Dexie');
  await testImport('lz-string', 'LZ-String');

  console.log('\n=== PHASE 3: Local Modules ===');
  await testImport('./src/lib/api-key-manager.js', 'API Key Manager');
  await testImport('./src/lib/tab-sync.js', 'Tab Sync');
  await testImport('./src/lib/backup-manager.js', 'Backup Manager');
  await testImport('./src/lib/db.js', 'Database');
  await testImport('./src/lib/gemini.js', 'Gemini API');

  console.log('\n=== PHASE 4: Store ===');
  await testImport('./src/store/useStore.js', 'Store');

  console.log('\n=== PHASE 5: Components ===');
  await testImport('./src/components/ui/Button.jsx', 'Button Component');
  await testImport('./src/components/ui/Card.jsx', 'Card Component');
  await testImport('./src/components/ListingEditor.jsx', 'ListingEditor Component');

  console.log('\n=== PHASE 6: Main App ===');
  const appSuccess = await testImport('./src/App.jsx', 'App Component');

  if (appSuccess) {
    console.log('\n=== PHASE 7: Main Entry Point ===');
    await testImport('./src/main.jsx', 'Main Entry');
  }

  console.log('\n\n🎯 FORENSIC TEST COMPLETE');
  console.log('Check the errors above to find the ROOT CAUSE');
})();
