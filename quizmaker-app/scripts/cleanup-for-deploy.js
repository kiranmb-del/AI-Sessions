#!/usr/bin/env node
/**
 * Cleanup script for Cloudflare Pages deployment
 * Removes large cache files that exceed the 25MB limit
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up cache files for Cloudflare Pages deployment...');

const cacheDir = path.join(process.cwd(), '.next', 'cache');

if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ Removed .next/cache directory');
} else {
  console.log('ℹ️  No cache directory found');
}

// Also remove trace files if they exist
const traceFile = path.join(process.cwd(), '.next', 'trace');
if (fs.existsSync(traceFile)) {
  fs.rmSync(traceFile, { recursive: true, force: true });
  console.log('✅ Removed .next/trace');
}

console.log('✨ Cleanup complete! Ready for deployment.');

