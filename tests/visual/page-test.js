const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
const VIEWPORT_SIZES = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Helper function to generate timestamp
function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

// Helper function to wait for element
async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.log(`Element ${selector} not found within ${timeout}ms`);
    return false;
  }
}

// Main test function
async function runVisualTests() {
  console.log('🚀 Starting visual tests...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const timestamp = getTimestamp();
    const testResults = [];

    // Test editor page at different viewport sizes
    for (const [deviceName, viewport] of Object.entries(VIEWPORT_SIZES)) {
      console.log(`📱 Testing ${deviceName} (${viewport.width}x${viewport.height})`);
      
      await page.setViewport(viewport);
      await page.goto(`${BASE_URL}/editor`, { waitUntil: 'networkidle2' });
      
      // Wait for key elements to load
      await waitForElement(page, 'header');
      await waitForElement(page, 'main');
      
      // Take screenshot
      const screenshotPath = path.join(SCREENSHOT_DIR, `editor-${deviceName}-${timestamp}.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      console.log(`   ✅ Screenshot saved: ${screenshotPath}`);

      // Check for specific elements
      const elements = {
        logo: await page.$('.flex-1.flex.justify-center') !== null,
        projectSelector: await page.$('[class*="ProjectSelector"]') !== null,
        stepper: await page.$('[class*="DiceStepper"]') !== null,
        mainContent: await page.$('main') !== null,
        background: await page.evaluate(() => {
          const body = document.querySelector('body');
          const mainDiv = document.querySelector('div[style*="backgroundColor"]');
          return {
            bodyBg: window.getComputedStyle(body).backgroundColor,
            mainBg: mainDiv ? mainDiv.style.backgroundColor : null
          };
        })
      };

      // Get element positions and visibility
      const layoutInfo = await page.evaluate(() => {
        const getElementInfo = (selector) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          return {
            visible: styles.display !== 'none' && styles.visibility !== 'hidden',
            position: { x: rect.x, y: rect.y },
            size: { width: rect.width, height: rect.height },
            zIndex: styles.zIndex
          };
        };

        return {
          header: getElementInfo('header'),
          main: getElementInfo('main'),
          projectSelector: getElementInfo('[class*="ProjectSelector"]'),
          stepper: getElementInfo('[class*="DiceStepper"]')
        };
      });

      testResults.push({
        device: deviceName,
        viewport,
        elements,
        layout: layoutInfo,
        screenshot: screenshotPath
      });

      console.log(`   📊 Elements found:`, elements);
      console.log(`   📐 Layout info:`, JSON.stringify(layoutInfo, null, 2));
      console.log('');
    }

    // Generate test report
    const reportPath = path.join(SCREENSHOT_DIR, `test-report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Test report saved: ${reportPath}`);

    // Print summary
    console.log('\n========================================');
    console.log('📊 TEST SUMMARY');
    console.log('========================================');
    
    for (const result of testResults) {
      console.log(`\n${result.device.toUpperCase()}:`);
      console.log(`  Background: ${result.elements.background.mainBg || 'not found'}`);
      console.log(`  Logo: ${result.elements.logo ? '✅' : '❌'}`);
      console.log(`  Project Selector: ${result.elements.projectSelector ? '✅' : '❌'}`);
      console.log(`  Stepper: ${result.elements.stepper ? '✅' : '❌'}`);
      
      if (result.layout.projectSelector && result.layout.stepper) {
        const selectorX = result.layout.projectSelector.position.x;
        const stepperX = result.layout.stepper.position.x;
        const relativePosition = stepperX > selectorX ? 'right of' : 'left of';
        console.log(`  Stepper position: ${relativePosition} Project Selector`);
      }
    }

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Check if dev server is running
async function checkDevServer() {
  try {
    const testBrowser = await puppeteer.launch({ headless: true });
    const testPage = await testBrowser.newPage();
    await testPage.goto(BASE_URL, { timeout: 5000 });
    await testBrowser.close();
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  console.log('🔍 Checking if dev server is running...');
  const serverRunning = await checkDevServer();
  
  if (!serverRunning) {
    console.log('⚠️  Dev server is not running!');
    console.log('📝 Please run "npm run dev" in another terminal first.');
    process.exit(1);
  }
  
  console.log('✅ Dev server is running\n');
  await runVisualTests();
})();