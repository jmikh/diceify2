#!/usr/bin/env node
/**
 * Generate PNG favicons from SVG for Google Search compatibility
 * This creates a simple dice favicon with proper sizes
 */

const fs = require('fs');
const path = require('path');

// Create a simple function to generate PNG data for a dice favicon
function createDiceFaviconPNG(size) {
  // We'll create a simple Canvas-based approach using a data URL
  // Since we can't use external libraries, we'll create the PNG manually

  // For now, let's check if we have sharp installed
  try {
    const sharp = require('sharp');
    return generateWithSharp(size);
  } catch (e) {
    console.log('Sharp not installed, trying alternative method...');
    return null;
  }
}

async function generateWithSharp(size) {
  const sharp = require('sharp');

  // Read the SVG file
  const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/favicon.svg'));

  // Convert SVG to PNG at the specified size
  const pngBuffer = await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toBuffer();

  return pngBuffer;
}

async function generateFavicons() {
  const sizes = [48, 96, 192, 32];

  console.log('Generating PNG favicons...\n');

  for (const size of sizes) {
    try {
      const pngData = await createDiceFaviconPNG(size);

      if (pngData) {
        const outputPath = path.join(__dirname, `../public/favicon-${size}x${size}.png`);
        fs.writeFileSync(outputPath, pngData);
        console.log(`✓ Generated favicon-${size}x${size}.png`);
      }
    } catch (error) {
      console.error(`✗ Failed to generate ${size}x${size}: ${error.message}`);
    }
  }
}

// Check if sharp is available
try {
  require('sharp');
  generateFavicons().then(() => {
    console.log('\n✅ Favicons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Update layout.tsx to reference the new PNG files');
    console.log('2. Deploy your changes');
    console.log('3. Request re-indexing in Google Search Console');
    console.log('4. Wait 1-3 weeks for Google to update');
  }).catch(console.error);
} catch (e) {
  console.log('Sharp library not found. Installing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install sharp', { stdio: 'inherit' });
    console.log('Sharp installed. Please run this script again.');
  } catch (installError) {
    console.error('Failed to install sharp:', installError.message);
    console.log('\nPlease install sharp manually: npm install sharp');
  }
}