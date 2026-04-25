"import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Launching browser to test app...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
  });

  // Capture errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error(`[BROWSER ERROR] ${error.message}`);
    console.error(`[STACK] ${error.stack}`);
  });

  try {
    // Rule 2.17.2: Port Locking - Use port 5189
    console.log('📡 Navigating to http://localhost:5189...\n');
    await page.goto('http://localhost:5189', { waitUntil: 'networkidle', timeout: 10000 });

    // Wait a bit for React to mount
    await page.waitForTimeout(2000);

    // Check if root div has content
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasContent: root && root.innerHTML.length > 0,
        innerHTML: root ? root.innerHTML.substring(0, 200) : 'ROOT NOT FOUND'
      };
    });

    console.log('\n=== RESULTS ===');
    console.log(`Root has content: ${rootContent.hasContent}`);
    console.log(`Root innerHTML preview: ${rootContent.innerHTML}`);
    console.log(`\nTotal console messages: ${consoleMessages.length}`);
    console.log(`Total errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    } else if (rootContent.hasContent) {
      console.log('\n✅ SUCCESS: App loaded without errors!');
    } else {
      console.log('\n⚠️ WARNING: No errors but root is empty');
    }

  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
