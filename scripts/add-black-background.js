const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../public/favicon-192x192.png');
const tempOutput = path.join(__dirname, '../public/favicon-192x192-black.png');

async function addBackground() {
    if (!fs.existsSync(source)) {
        console.error('Source file not found:', source);
        process.exit(1);
    }

    console.log('Adding black background to:', source);

    // Create a black image of the same size
    const metadata = await sharp(source).metadata();

    await sharp({
        create: {
            width: metadata.width,
            height: metadata.height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 }
        }
    })
        .composite([{ input: source }])
        .png()
        .toFile(tempOutput);

    // Replace the original
    fs.renameSync(tempOutput, source);
    console.log('Updated favicon-192x192.png with black background');
}

addBackground().catch(err => {
    console.error('Error adding background:', err);
    process.exit(1);
});
