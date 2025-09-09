const fs = require('fs');
const path = require('path');

// Create a simple test image using Canvas (part of Puppeteer)
async function createTestImage() {
  const { createCanvas } = require('canvas');
  
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Create a gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(0.5, '#764ba2');
  gradient.addColorStop(1, '#f093fb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add some circles for visual interest
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.arc(200, 150, 80, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(600, 450, 100, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(400, 300, 120, 0, Math.PI * 2);
  ctx.fill();
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  const imagePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(imagePath, buffer);
  
  console.log(`Test image created at: ${imagePath}`);
  return imagePath;
}

// Alternative: Create a simple image without canvas dependency
function createSimpleTestImage() {
  // Create a minimal valid PNG file (1x1 pixel, black)
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width = 1
    0x00, 0x00, 0x00, 0x01, // height = 1
    0x08, 0x02, // bit depth = 8, color type = 2 (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02,
    0x00, 0x01, // compressed data
    0x49, 0xB4, 0xE8, 0xB7, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  const imagePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(imagePath, minimalPNG);
  console.log(`Simple test image created at: ${imagePath}`);
  return imagePath;
}

// Export the function
module.exports = { createSimpleTestImage };

// Run if called directly
if (require.main === module) {
  createSimpleTestImage();
}