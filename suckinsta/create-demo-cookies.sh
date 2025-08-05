#!/bin/bash

# Demo-Script zur Erstellung einer Beispiel-Cookie-Datei
# WICHTIG: Dies sind Dummy-Cookies und funktionieren nicht!
# Echte Cookies müssen von einem angemeldeten Browser extrahiert werden.

COOKIE_FILE="/var/www/html/instagram-dl/backend/instagram-cookies.txt"

cat > "$COOKIE_FILE" << 'EOF'
# Netscape HTTP Cookie File
# This is a demo cookie file - REPLACE WITH REAL COOKIES!
# 
# To get real cookies:
# 1. Install "Get cookies.txt" browser extension
# 2. Go to instagram.com and login
# 3. Export cookies using the extension
# 4. Replace this file with the exported cookies
#
# Format: domain flag path secure expiration name value
.instagram.com	TRUE	/	TRUE	1756789200	sessionid	DEMO_SESSION_ID_REPLACE_WITH_REAL
.instagram.com	TRUE	/	FALSE	1756789200	csrftoken	DEMO_CSRF_TOKEN_REPLACE_WITH_REAL
.instagram.com	TRUE	/	FALSE	1756789200	ds_user_id	DEMO_USER_ID_REPLACE_WITH_REAL
EOF

echo "Demo cookie file created at: $COOKIE_FILE"
echo "⚠️  WARNING: These are dummy cookies and will NOT work!"
echo "🔧 You need to replace them with real cookies from your browser."
echo ""
echo "To test the cookie system:"
echo "1. Get real Instagram cookies using a browser extension"
echo "2. Replace the content of $COOKIE_FILE"
echo "3. Run: pm2 restart instagram-dl-backend"
echo "4. Check logs: pm2 logs instagram-dl-backend"