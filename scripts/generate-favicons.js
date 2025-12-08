const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../public/icon.svg');
const publicDir = path.join(__dirname, '../public');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'favicon-64x64.png', size: 64 },
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 }
];

async function generate() {
  if (!fs.existsSync(source)) {
    console.error('Source file not found:', source);
    process.exit(1);
  }

  console.log('Generating favicons from:', source);

  for (const item of sizes) {
    const dest = path.join(publicDir, item.name);
    await sharp(source)
      .resize(item.size, item.size)
      .toFile(dest);
    console.log(`Generated ${item.name}`);
  }

  // Handle favicon.ico (copy 32x32 as .ico - not perfect but functional for simple replacement)
  // Note: A true .ico container is complex, but modern browsers often handle png-in-ico 
  // or we just rely on the png links in layout.tsx.
  // However, to ensure the file exists and has the right visual:
  // We'll generate a 32x32 png buffer and write it to favicon.ico
  const icoDest = path.join(publicDir, 'favicon.ico');
  await sharp(source)
    .resize(32, 32)
    .png() // Ensure it is png format
    .toFile(icoDest);
  console.log('Generated favicon.ico (as 32x32 png)');
}

generate().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});