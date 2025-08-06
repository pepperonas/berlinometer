#!/usr/bin/env node

/**
 * Instagram Cookie Extractor
 * 
 * This script helps extract Instagram cookies from your browser
 * for use with yt-dlp to download Instagram content.
 * 
 * Usage:
 * 1. Login to Instagram in your browser
 * 2. Export cookies using a browser extension (e.g., "Get cookies.txt")
 * 3. Save the cookies to instagram-cookies.txt
 * 4. The server will use these cookies for authenticated downloads
 */

const fs = require('fs');
const path = require('path');

// Cookie file path
const COOKIE_FILE = path.join(__dirname, 'instagram-cookies.txt');

/**
 * Check if cookie file exists
 */
function checkCookieFile() {
    if (fs.existsSync(COOKIE_FILE)) {
        const stats = fs.statSync(COOKIE_FILE);
        const lastModified = new Date(stats.mtime);
        const daysSinceModified = (Date.now() - lastModified) / (1000 * 60 * 60 * 24);
        
        console.log('✅ Cookie file found:', COOKIE_FILE);
        console.log(`📅 Last updated: ${lastModified.toLocaleString()}`);
        
        if (daysSinceModified > 30) {
            console.log('⚠️  Warning: Cookies are older than 30 days and may have expired');
        }
        
        return true;
    } else {
        console.log('❌ Cookie file not found:', COOKIE_FILE);
        console.log('\nTo create a cookie file:');
        console.log('1. Install a browser extension like "Get cookies.txt" or "EditThisCookie"');
        console.log('2. Login to Instagram.com');
        console.log('3. Export cookies in Netscape format');
        console.log('4. Save as instagram-cookies.txt in this directory');
        return false;
    }
}

/**
 * Validate cookie file format
 */
function validateCookieFile() {
    if (!fs.existsSync(COOKIE_FILE)) {
        return false;
    }
    
    const content = fs.readFileSync(COOKIE_FILE, 'utf8');
    const lines = content.split('\n');
    
    // Check for Netscape cookie format
    if (!lines[0].includes('Netscape HTTP Cookie File') && !lines[0].includes('#')) {
        console.log('⚠️  Warning: Cookie file may not be in Netscape format');
    }
    
    // Check for Instagram cookies
    const instagramCookies = lines.filter(line => 
        line.includes('.instagram.com') && !line.startsWith('#')
    );
    
    if (instagramCookies.length === 0) {
        console.log('❌ No Instagram cookies found in file');
        return false;
    }
    
    // Check for essential cookies
    const essentialCookies = ['sessionid', 'csrftoken'];
    const foundCookies = [];
    
    essentialCookies.forEach(cookieName => {
        if (instagramCookies.some(line => line.includes(cookieName))) {
            foundCookies.push(cookieName);
        }
    });
    
    console.log(`✅ Found ${instagramCookies.length} Instagram cookies`);
    console.log(`✅ Essential cookies found: ${foundCookies.join(', ')}`);
    
    if (foundCookies.length < essentialCookies.length) {
        console.log('⚠️  Warning: Some essential cookies may be missing');
    }
    
    return true;
}

/**
 * Instructions for manual cookie extraction
 */
function printInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 INSTAGRAM COOKIE EXTRACTION INSTRUCTIONS');
    console.log('='.repeat(60));
    console.log('\nMethod 1: Using "Get cookies.txt" Extension');
    console.log('--------------------------------------------');
    console.log('1. Install "Get cookies.txt" extension:');
    console.log('   Chrome: https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid');
    console.log('   Firefox: https://addons.mozilla.org/en-US/firefox/addon/get-cookies-txt/');
    console.log('2. Go to https://www.instagram.com and login');
    console.log('3. Click the extension icon');
    console.log('4. Click "Export" or "To clipboard"');
    console.log('5. Save the content as "instagram-cookies.txt" in:');
    console.log(`   ${__dirname}`);
    
    console.log('\nMethod 2: Using Browser Developer Tools');
    console.log('----------------------------------------');
    console.log('1. Open Instagram.com and login');
    console.log('2. Open Developer Tools (F12)');
    console.log('3. Go to Application/Storage tab');
    console.log('4. Find Cookies → instagram.com');
    console.log('5. Export sessionid and csrftoken values');
    
    console.log('\nMethod 3: Using yt-dlp browser extraction');
    console.log('------------------------------------------');
    console.log('Run: yt-dlp --cookies-from-browser chrome https://instagram.com/p/[POST_ID]/');
    console.log('(Replace chrome with firefox, safari, edge, etc.)');
    
    console.log('\n' + '='.repeat(60) + '\n');
}

// Main execution
console.log('🍪 Instagram Cookie Manager\n');

if (process.argv[2] === '--help' || process.argv[2] === '-h') {
    printInstructions();
} else if (checkCookieFile()) {
    validateCookieFile();
    console.log('\n✅ Ready to use cookies for authenticated downloads');
} else {
    printInstructions();
}

module.exports = {
    COOKIE_FILE,
    checkCookieFile,
    validateCookieFile
};