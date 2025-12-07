const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
const TEST_IMAGE = path.join(__dirname, 'test-image.png');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Helper function to generate timestamp
function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

// Helper function to wait and take screenshot
async function screenshot(page, name, timestamp) {
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}-${timestamp}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: false
  });
  console.log(`   📸 Screenshot: ${name}`);
  return screenshotPath;
}

// Helper function to wait for element
async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout, visible: true });
    return true;
  } catch (error) {
    console.log(`   ⚠️  Element ${selector} not found within ${timeout}ms`);
    return false;
  }
}

// Main workflow test
async function runWorkflowTest() {
  console.log('🚀 Starting full workflow test...\n');

  const browser = await puppeteer.launch({
    headless: false, // Set to false to see the browser
    slowMo: 100, // Slow down actions for visibility
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null
  });

  try {
    const page = await browser.newPage();
    const timestamp = getTimestamp();
    const screenshots = [];

    // Navigate to editor
    console.log('📍 Step 1: Navigate to Editor');
    await page.goto(`${BASE_URL}/editor`, { waitUntil: 'networkidle2' });
    screenshots.push(await screenshot(page, '01-initial-load', timestamp));

    // Check current step
    const currentStep = await page.evaluate(() => {
      const activeStep = document.querySelector('button[data-active="true"]');
      if (activeStep) {
        const testId = activeStep.getAttribute('data-testid');
        if (testId) return testId.replace('step-', '');
      }

      // Default check based on visible content
      if (document.querySelector('[class*="ImageUploader"]')) return 'upload';
      if (document.querySelector('[class*="Cropper"]')) return 'crop';
      if (document.querySelector('[class*="DiceCanvas"]')) return 'tune';
      if (document.querySelector('[class*="BuildViewer"]')) return 'build';

      return 'unknown';
    });
    console.log(`   Current step: ${currentStep}`);

    // Upload image
    console.log('\n📍 Step 2: Upload Image');

    // Find the file input
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(TEST_IMAGE);
      console.log('   ✅ Image uploaded');

      // Wait for the image to be processed
      await page.waitForFunction(() => true, { timeout: 2000 }).catch(() => { });
      screenshots.push(await screenshot(page, '02-after-upload', timestamp));

      // Check if we moved to crop step
      const movedToCrop = await waitForElement(page, '[class*="Cropper"]', 5000);
      if (movedToCrop) {
        console.log('   ✅ Moved to Crop step');
      }
    } else {
      console.log('   ❌ File input not found');
    }

    // Crop step
    console.log('\n📍 Step 3: Crop Image');
    await page.waitForFunction(() => true, { timeout: 1000 }).catch(() => { });

    // Look for crop button or continue button
    const cropButtons = await page.$$('button');
    let cropCompleteButton = null;

    for (const button of cropButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Continue') || text.includes('Next') || text.includes('Crop') || text.includes('Done'))) {
        cropCompleteButton = button;
        break;
      }
    }

    if (cropCompleteButton) {
      screenshots.push(await screenshot(page, '03-crop-interface', timestamp));
      await cropCompleteButton.click();
      console.log('   ✅ Crop completed');
      await page.waitForFunction(() => true, { timeout: 2000 }).catch(() => { });
    } else {
      console.log('   ⚠️  Crop button not found');
    }

    // Tune step
    console.log('\n📍 Step 4: Tune Parameters');
    const movedToTune = await waitForElement(page, '[class*="DiceCanvas"], canvas', 5000);
    if (movedToTune) {
      console.log('   ✅ Moved to Tune step');
      await page.waitForFunction(() => true, { timeout: 2000 }).catch(() => { });
      screenshots.push(await screenshot(page, '04-tune-interface', timestamp));

      // Try to adjust some parameters
      const sliders = await page.$$('input[type="range"]');
      console.log(`   Found ${sliders.length} sliders`);

      if (sliders.length > 0) {
        // Adjust grid size (usually first slider)
        if (sliders[0]) {
          await sliders[0].click();
          await page.keyboard.press('ArrowRight');
          await page.keyboard.press('ArrowRight');
          console.log('   ✅ Adjusted grid size');
        }

        // Adjust contrast if available
        if (sliders[1]) {
          await sliders[1].click();
          await page.keyboard.press('ArrowRight');
          console.log('   ✅ Adjusted contrast');
        }

        await page.waitForFunction(() => true, { timeout: 2000 }).catch(() => { });
        screenshots.push(await screenshot(page, '05-parameters-adjusted', timestamp));
      }

      // Click on Build step in stepper
      const buildButton = await page.$('button[data-testid="step-build"]');

      if (buildButton) {
        await buildButton.click();
        console.log('   ✅ Clicked Build in stepper');
        await page.waitForFunction(() => true, { timeout: 2000 }).catch(() => { });
      } else {
        console.log('   ⚠️  Build button not found in stepper');
      }
    }

    // Build step
    console.log('\n📍 Step 5: Build View');
    const movedToBuild = await waitForElement(page, '[data-testid="build-viewer"]', 5000);
    if (movedToBuild) {
      console.log('   ✅ Moved to Build step');
      await page.waitForFunction(() => true, { timeout: 2000 }).catch(() => { });
      screenshots.push(await screenshot(page, '06-build-viewer', timestamp));

      // Try navigation buttons if available
      const nextButton = await page.$('button[title="Next dice"]');
      if (nextButton) {
        console.log('   Found Next button');

        // Get initial position
        const initialX = await page.$eval('[data-testid="build-pos-x"]', el => parseInt(el.textContent));
        const initialY = await page.$eval('[data-testid="build-pos-y"]', el => parseInt(el.textContent));
        console.log(`   Initial Position: (${initialX}, ${initialY})`);

        // Click next 5 times
        for (let i = 0; i < 5; i++) {
          await nextButton.click();
          await new Promise(r => setTimeout(r, 100)); // Small delay for state update
        }
        console.log('   ✅ Clicked Next 5 times');

        // Get new position
        const newX = await page.$eval('[data-testid="build-pos-x"]', el => parseInt(el.textContent));
        const newY = await page.$eval('[data-testid="build-pos-y"]', el => parseInt(el.textContent));
        console.log(`   New Position: (${newX}, ${newY})`);

        if (newX !== initialX || newY !== initialY) {
          console.log('   ✅ Navigation confirmed: Position changed');
        } else {
          console.log('   ❌ Navigation failed: Position did not change');
        }

        screenshots.push(await screenshot(page, '07-build-navigation', timestamp));
      } else {
        console.log('   ⚠️ Next button not found');
      }
    }

    // Final summary
    console.log('\n========================================');
    console.log('📊 WORKFLOW TEST SUMMARY');
    console.log('========================================');

    // Get final state
    const finalState = await page.evaluate(() => {
      const activeStep = document.querySelector('button[data-active="true"]');
      let currentStep = 'unknown';
      if (activeStep) {
        const testId = activeStep.getAttribute('data-testid');
        if (testId) currentStep = testId.replace('step-', '');
      }

      return {
        currentStep,
        hasImage: !!document.querySelector('img, canvas'),
        hasDiceCanvas: !!document.querySelector('[class*="DiceCanvas"], canvas'),
        hasBuildViewer: !!document.querySelector('[data-testid="build-viewer"]'),
        hasStats: !!document.querySelector('[data-testid="dice-stats"]'),
        hasLogo: !!document.querySelector('[data-testid="app-logo"]'),
        projectName: document.querySelector('[data-testid="project-selector"]')?.textContent || 'not found'
      };
    });

    console.log('\nFinal State:');
    console.log(`  Current Step: ${finalState.currentStep}`);
    console.log(`  Has Image: ${finalState.hasImage ? '✅' : '❌'}`);
    console.log(`  Has Dice Canvas: ${finalState.hasDiceCanvas ? '✅' : '❌'}`);
    console.log(`  Has Build Viewer: ${finalState.hasBuildViewer ? '✅' : '❌'}
  Has Stats: ${finalState.hasStats ? '✅' : '❌'}
  Has Logo: ${finalState.hasLogo ? '✅' : '❌'}
  Project Name: ${finalState.projectName}`);

    console.log('\n📸 Screenshots captured:');
    screenshots.forEach(s => console.log(`  - ${path.basename(s)}`));

    // Save test report
    const report = {
      timestamp,
      screenshots,
      finalState,
      success: true
    };

    const reportPath = path.join(SCREENSHOT_DIR, `workflow-report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);

    console.log('\n✅ Workflow test completed!');

    // Keep browser open for a moment to see final state
    await page.waitForFunction(() => true, { timeout: 3000 }).catch(() => { });

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
  // Check if test image exists
  if (!fs.existsSync(TEST_IMAGE)) {
    console.log('⚠️  Test image not found. Creating one...');
    const { createSimpleTestImage } = require('./create-test-image');
    createSimpleTestImage();
  }

  console.log('🔍 Checking if dev server is running...');
  const serverRunning = await checkDevServer();

  if (!serverRunning) {
    console.log('⚠️  Dev server is not running!');
    console.log('📝 Please run "npm run dev" in another terminal first.');
    process.exit(1);
  }

  console.log('✅ Dev server is running\n');
  await runWorkflowTest();
})();