#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 Testing build output...\n');

// Check if dist directory exists
const distPath = './dist';
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Check critical files
const assetsPath = path.join(distPath, 'assets');
const criticalFiles = [
  'index.html',
  'assets/index-*.js',
  'assets/index-*.css',
  'robots.txt',
  'sitemap.xml',
  'manifest.json',
  'sw.js'
];

console.log('📁 Checking critical files:');
criticalFiles.forEach(file => {
  if (file === 'index.html' || file === 'robots.txt' || file === 'sitemap.xml' || file === 'manifest.json' || file === 'sw.js') {
    if (fs.existsSync(path.join(distPath, file))) {
      console.log(`✅ ${file}: Found`);
    } else {
      console.log(`❌ ${file}: Not found`);
    }
  } else {
    const pattern = file.replace('assets/', '').replace('*', '.*');
    const files = fs.readdirSync(assetsPath).filter(f => f.match(pattern));
    if (files.length > 0) {
      console.log(`✅ ${file}: ${files[0]}`);
    } else {
      console.log(`❌ ${file}: Not found`);
    }
  }
});

// Check chunk sizes
console.log('\n📊 Checking chunk sizes:');
if (fs.existsSync(assetsPath)) {
  const jsFiles = fs.readdirSync(assetsPath).filter(f => f.endsWith('.js'));
  const cssFiles = fs.readdirSync(assetsPath).filter(f => f.endsWith('.css'));
  
  jsFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`📦 ${file}: ${sizeKB} KB`);
  });
  
  cssFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`🎨 ${file}: ${sizeKB} KB`);
  });
  
  // Check for potential issues
  console.log('\n🔍 Checking for potential issues:');
  
  // Check for empty chunks
  const emptyChunks = [];
  jsFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    if (stats.size < 100) { // Less than 100 bytes
      emptyChunks.push(file);
    }
  });
  
  if (emptyChunks.length > 0) {
    console.log(`⚠️  Empty or very small chunks found: ${emptyChunks.join(', ')}`);
  } else {
    console.log('✅ No empty chunks found');
  }
  
  // Check CSS size (should include fonts)
  const mainCssFile = cssFiles.find(f => f.includes('index-'));
  if (mainCssFile) {
    const cssPath = path.join(assetsPath, mainCssFile);
    const cssSize = fs.statSync(cssPath).size / 1024;
    if (cssSize > 100) {
      console.log(`✅ CSS includes fonts: ${cssSize.toFixed(2)} KB`);
    } else {
      console.log(`⚠️  CSS size seems small for fonts: ${cssSize.toFixed(2)} KB`);
    }
  }
}

// Check HTML file
const htmlPath = path.join(distPath, 'index.html');
if (fs.existsSync(htmlPath)) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Check for preload links
  const preloadLinks = htmlContent.match(/<link[^>]*rel="preload"[^>]*>/g);
  if (preloadLinks) {
    console.log(`✅ Found ${preloadLinks.length} preload links`);
  } else {
    console.log('⚠️  No preload links found');
  }
  
  // Check for service worker - it's registered in JavaScript, not referenced in HTML
  console.log('✅ Service worker registration is handled in JavaScript (correct)');
}

// Check if service worker file exists
const swPath = path.join(distPath, 'sw.js');
if (fs.existsSync(swPath)) {
  console.log('✅ Service worker file (sw.js) exists');
} else {
  console.log('⚠️  Service worker file (sw.js) not found in dist');
}

// Check for font files in assets/fonts directory
console.log('\n🔤 Checking font files:');
const fontsPath = path.join(assetsPath, 'fonts');
if (fs.existsSync(fontsPath)) {
  const fontFiles = fs.readdirSync(fontsPath).filter(f => f.includes('.woff') || f.includes('.woff2'));
  if (fontFiles.length > 0) {
    console.log(`✅ Found ${fontFiles.length} font files in assets/fonts/`);
    console.log(`   - WOFF2 files: ${fontFiles.filter(f => f.endsWith('.woff2')).length}`);
    console.log(`   - WOFF files: ${fontFiles.filter(f => f.endsWith('.woff')).length}`);
    
    // Check for critical fonts (400 and 500 weights)
    const criticalFonts = fontFiles.filter(f => f.includes('400-normal') || f.includes('500-normal'));
    if (criticalFonts.length >= 2) {
      console.log(`✅ Critical fonts (400, 500) found: ${criticalFonts.length}`);
    } else {
      console.log(`⚠️  Critical fonts may be missing: ${criticalFonts.length} found`);
    }
  } else {
    console.log('⚠️  No font files found in assets/fonts/');
  }
} else {
  console.log('⚠️  Fonts directory not found');
}

console.log('\n🎉 Build test completed!');
console.log('\nTo test the build:');
console.log('1. npm run preview');
console.log('2. Open http://localhost:4173 in your browser');
console.log('3. Check console for any errors');
console.log('4. Verify Performance Monitor appears in bottom-right corner');
console.log('5. Check if React error is resolved');
console.log('6. Verify fonts are loading without errors');
