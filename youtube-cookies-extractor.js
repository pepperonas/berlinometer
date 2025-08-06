#!/usr/bin/env node

/**
 * YouTube Cookie Extractor
 * 
 * This script helps extract YouTube cookies from your browser
 * for use with yt-dlp to download YouTube content.
 * 
 * Usage:
 * 1. Login to YouTube in your browser
 * 2. Export cookies using a browser extension (e.g., "Get cookies.txt")
 * 3. Save the cookies to youtube-cookies.txt
 * 4. The server will use these cookies for authenticated downloads
 */

const fs = require('fs');
const path = require('path');

// Cookie file path
const COOKIE_FILE = path.join(__dirname, 'youtube-cookies.txt');

/**
 * Instructions for manual cookie extraction
 */
function printInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 YOUTUBE COOKIE EXTRACTION INSTRUCTIONS');
    console.log('='.repeat(60));
    console.log('\nMethod 1: Using "Get cookies.txt" Extension');
    console.log('--------------------------------------------');
    console.log('1. Install "Get cookies.txt" extension:');
    console.log('   Chrome: https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid');
    console.log('   Firefox: https://addons.mozilla.org/en-US/firefox/addon/get-cookies-txt/');
    console.log('2. Go to https://www.youtube.com and login');
    console.log('3. Click the extension icon');
    console.log('4. Click "Export" or "To clipboard"');
    console.log('5. Save the content as "youtube-cookies.txt" in the backend directory');
    
    console.log('\nMethod 2: Using yt-dlp browser extraction');
    console.log('------------------------------------------');
    console.log('Run: yt-dlp --cookies-from-browser chrome --print-to-file cookies youtube-cookies.txt https://youtube.com');
    console.log('(Replace chrome with firefox, safari, edge, etc.)');
    
    console.log('\n' + '='.repeat(60) + '\n');
}

// Main execution
console.log('🍪 YouTube Cookie Manager\n');
printInstructions();