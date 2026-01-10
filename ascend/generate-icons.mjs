import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

// SVG source with proper sizing for high-quality output
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1024" height="1024">
  <defs>
    <linearGradient id="ascendGradient" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:#1e1b4b"/>
      <stop offset="50%" style="stop-color:#4f46e5"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#ascendGradient)"/>
  
  <!-- Upward chevron/arrow forming abstract "A" -->
  <path 
    d="M256 100 L400 340 L340 340 L256 200 L172 340 L112 340 Z" 
    fill="white"
    opacity="0.95"
  />
  
  <!-- Horizontal bar to complete the "A" -->
  <rect 
    x="175" 
    y="280" 
    width="162" 
    height="40" 
    rx="8"
    fill="white"
    opacity="0.9"
  />
</svg>`;

// All icon sizes needed
const sizes = {
  // PWA icons
  pwa: [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ],
  // iOS App Store icons
  ios: [
    { name: 'icon-1024.png', size: 1024 },  // App Store
    { name: 'icon-180.png', size: 180 },    // iPhone @3x
    { name: 'icon-167.png', size: 167 },    // iPad Pro @2x
    { name: 'icon-152.png', size: 152 },    // iPad @2x
    { name: 'icon-120.png', size: 120 },    // iPhone @2x
    { name: 'icon-87.png', size: 87 },      // Settings @3x
    { name: 'icon-80.png', size: 80 },      // Spotlight @2x
    { name: 'icon-76.png', size: 76 },      // iPad @1x
    { name: 'icon-60.png', size: 60 },      // iPhone @1x
    { name: 'icon-58.png', size: 58 },      // Settings @2x
    { name: 'icon-40.png', size: 40 },      // Spotlight @1x
    { name: 'icon-29.png', size: 29 },      // Settings @1x
    { name: 'icon-20.png', size: 20 },      // Notification @1x
  ]
};

async function generateIcons() {
  const publicDir = './public';
  const iosDir = './ios-app-icons';
  
  // Create iOS icons directory
  await mkdir(iosDir, { recursive: true });
  
  // Generate base 1024x1024 from SVG
  const svgBuffer = Buffer.from(svgIcon);
  const baseImage = await sharp(svgBuffer, { density: 300 })
    .resize(1024, 1024)
    .png()
    .toBuffer();
  
  console.log('Generated base 1024x1024 image');
  
  // Generate PWA icons
  for (const icon of sizes.pwa) {
    const outputPath = join(publicDir, icon.name);
    await sharp(baseImage)
      .resize(icon.size, icon.size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${icon.name}`);
  }
  
  // Generate iOS icons
  for (const icon of sizes.ios) {
    const outputPath = join(iosDir, icon.name);
    await sharp(baseImage)
      .resize(icon.size, icon.size)
      .png()
      .toFile(outputPath);
    console.log(`Generated iOS ${icon.name}`);
  }
  
  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
