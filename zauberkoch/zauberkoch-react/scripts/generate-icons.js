const fs = require('fs');
const path = require('path');

// Simple base64 encoded PNG image (1x1 pixel transparent)
const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';

// Create a simple colored PNG for each size
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Simple PNG header for a colored square
function createSimplePNG(size) {
  // This is a simple approach - in production you'd want proper PNG generation
  // For now, we'll just copy the favicon.ico content as a fallback
  const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
  if (fs.existsSync(faviconPath)) {
    return fs.readFileSync(faviconPath);
  }
  
  // Fallback: minimal PNG
  return Buffer.from(transparentPngBase64, 'base64');
}

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  console.log(`Generating ${filename}...`);
  
  try {
    const pngBuffer = createSimplePNG(size);
    fs.writeFileSync(filepath, pngBuffer);
    console.log(`✓ Created ${filename}`);
  } catch (error) {
    console.error(`✗ Failed to create ${filename}:`, error.message);
  }
});

console.log('Icon generation complete!');