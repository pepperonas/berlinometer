#!/usr/bin/env python3
import sys

suckyt_config = '''
    # Suckyt Frontend
    location /suckyt/ {
        alias /var/www/html/suckyt/;
        try_files $uri $uri/ /suckyt/index.html;
        index index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        
        # Performance optimization
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    }

    # Suckyt API
    location /suckyt/api/ {
        proxy_pass http://localhost:5081/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for downloads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Debug logs
        access_log /var/log/nginx/suckyt-api-access.log;
        error_log /var/log/nginx/suckyt-api-error.log;
    }
'''

# Read the current config
with open('/etc/nginx/sites-available/default', 'r') as f:
    lines = f.readlines()

# Find the line with "ZipZap Frontend"
insert_line = None
for i, line in enumerate(lines):
    if "# ZipZap Frontend" in line:
        insert_line = i
        break

if insert_line is None:
    print("Could not find ZipZap Frontend line")
    sys.exit(1)

# Insert the suckyt config before ZipZap
lines.insert(insert_line, suckyt_config + '\n')

# Write back to file
with open('/etc/nginx/sites-available/default', 'w') as f:
    f.writelines(lines)

print("Suckyt configuration added successfully")