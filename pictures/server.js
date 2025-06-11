const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5050;
const resDir = path.join(__dirname, 'res');
const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log(`Request: ${req.method} ${req.url}`);
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if ((req.url === '/api/images' || req.url === '/api/images/') && req.method === 'GET') {
        try {
            if (!fs.existsSync(resDir)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'res directory not found' }));
                return;
            }
            
            const files = fs.readdirSync(resDir);
            const images = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return supportedFormats.includes(ext);
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ images }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    } else if (req.url === '/' || req.url === '/index.html') {
        // Serve index.html
        const indexPath = path.join(__dirname, 'index.html');
        fs.readFile(indexPath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url.startsWith('/res/')) {
        // Serve images from res folder
        const imagePath = path.join(__dirname, req.url);
        fs.readFile(imagePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Image not found');
                return;
            }
            const ext = path.extname(imagePath).toLowerCase();
            let contentType = 'image/jpeg';
            if (ext === '.png') contentType = 'image/png';
            else if (ext === '.gif') contentType = 'image/gif';
            else if (ext === '.webp') contentType = 'image/webp';
            else if (ext === '.svg') contentType = 'image/svg+xml';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});