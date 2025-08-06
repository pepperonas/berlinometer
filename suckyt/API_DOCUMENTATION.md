# Suckinsta API Documentation

## Overview
The Suckinsta API allows external applications to download Instagram videos programmatically. The API requires authentication via API keys and implements rate limiting for security.

## Base URL
```
https://mrx3k1.de/api
```

## Authentication

### For External Applications
Include your API key in one of these headers:
- `X-API-Key: your_api_key_here`
- `Authorization: Bearer your_api_key_here`

### For Frontend Application
The official Suckinsta frontend at https://mrx3k1.de/suckinsta/ is automatically authenticated.

## Available API Keys

For testing and development, use these pre-configured keys:

| Key | Purpose | Rate Limit |
|-----|---------|------------|
| `sk_live_51234567890abcdef1234567890abcdef` | Production | 10 req/min |
| `sk_test_abcdef1234567890abcdef1234567890` | Testing | 10 req/min |
| `sk_mrx3k1_dev_1234567890abcdefghijklmnop` | Development | 10 req/min |

## Endpoints

### 1. Health Check
Check if the API is running.

**Endpoint:** `GET /api/health`  
**Authentication:** None required  
**Response:**
```json
{
  "status": "OK",
  "service": "Suckinsta API",
  "message": "Instagram Video Downloader API is running",
  "version": "2.0.0",
  "timestamp": "2025-08-06T12:00:00.000Z",
  "endpoints": {
    "health": "GET /api/health",
    "docs": "GET /api/docs",
    "download": "POST /api/download"
  }
}
```

### 2. API Documentation
Get complete API documentation.

**Endpoint:** `GET /api/docs`  
**Authentication:** None required  
**Response:** Complete API documentation with examples

### 3. Download Video
Download an Instagram video, reel, or IGTV content.

**Endpoint:** `POST /api/download`  
**Authentication:** Required (API Key)  
**Request Body:**
```json
{
  "url": "https://www.instagram.com/p/ABC123/"
}
```

**Success Response:**
- Status: 200 OK
- Content-Type: video/mp4
- Body: Video file binary data

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | - | Invalid or missing URL |
| 401 | MISSING_API_KEY | API key not provided |
| 401 | INVALID_API_KEY | API key is not valid |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | - | Download failed |

## Rate Limiting

- **External API Keys:** 10 requests per minute per key
- **Frontend Users:** 30 requests per minute
- Rate limit window: 60 seconds
- When limit exceeded, response includes `retryAfter` in seconds

## Code Examples

### cURL
```bash
curl -X POST https://mrx3k1.de/api/download \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_test_abcdef1234567890abcdef1234567890" \
  -d '{"url": "https://www.instagram.com/p/ABC123/"}' \
  --output video.mp4
```

### JavaScript (Node.js)
```javascript
const fetch = require('node-fetch');
const fs = require('fs');

async function downloadVideo(url) {
  const response = await fetch('https://mrx3k1.de/api/download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'sk_test_abcdef1234567890abcdef1234567890'
    },
    body: JSON.stringify({ url })
  });

  if (response.ok) {
    const buffer = await response.buffer();
    fs.writeFileSync('video.mp4', buffer);
    console.log('Video downloaded successfully!');
  } else {
    const error = await response.json();
    console.error('Error:', error.message);
  }
}

downloadVideo('https://www.instagram.com/p/ABC123/');
```

### Python
```python
import requests

def download_video(instagram_url):
    response = requests.post(
        'https://mrx3k1.de/api/download',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': 'sk_test_abcdef1234567890abcdef1234567890'
        },
        json={'url': instagram_url}
    )
    
    if response.status_code == 200:
        with open('video.mp4', 'wb') as f:
            f.write(response.content)
        print('Video downloaded successfully!')
    else:
        print('Error:', response.json())

download_video('https://www.instagram.com/p/ABC123/')
```

### PHP
```php
<?php
$url = 'https://mrx3k1.de/api/download';
$data = array('url' => 'https://www.instagram.com/p/ABC123/');
$headers = array(
    'Content-Type: application/json',
    'X-API-Key: sk_test_abcdef1234567890abcdef1234567890'
);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($status == 200) {
    file_put_contents('video.mp4', $response);
    echo 'Video downloaded successfully!';
} else {
    $error = json_decode($response, true);
    echo 'Error: ' . $error['message'];
}
?>
```

## Error Handling

Always check the response status code:
- **2xx**: Success
- **4xx**: Client error (check your request)
- **5xx**: Server error (try again later)

Error responses include:
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

## Important Notes

1. **Instagram Authentication**: The API uses cookies for Instagram authentication to access videos that require login
2. **Video Formats**: Videos are returned in MP4 format when possible
3. **Timeout**: Download requests may take up to 5 minutes for large videos
4. **CORS**: The API allows all origins for maximum compatibility

## Support

For issues or questions about the API, please contact the administrator at mrx3k1.de.