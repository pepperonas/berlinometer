#!/usr/bin/env python3

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import asyncio
import json
import sys
import os
import time
from datetime import datetime

# Import the scraping function from the existing scraper
sys.path.append(os.path.join(os.path.dirname(__file__), 'maps-playwrite-scraper'))
from gmaps_scraper_fast_robust import scrape_live_occupancy

app = Flask(__name__)
CORS(app)

def create_progress_response(current_index, total, location_name=None):
    """Create a progress update response"""
    progress = int((current_index / total) * 100) if total > 0 else 0
    data = {
        'type': 'progress',
        'progress': progress,
        'current': current_index,
        'total': total
    }
    if location_name:
        data['location'] = location_name
    
    return json.dumps(data) + '\n'

def create_result_response(result_data):
    """Create a result response"""
    return json.dumps({
        'type': 'result',
        'data': result_data
    }) + '\n'

def create_complete_response():
    """Create a completion response"""
    return json.dumps({
        'type': 'complete',
        'timestamp': datetime.now().isoformat()
    }) + '\n'

def create_error_response(error_message):
    """Create an error response"""
    return json.dumps({
        'type': 'error',
        'error': error_message,
        'timestamp': datetime.now().isoformat()
    }) + '\n'

async def process_urls_stream(urls):
    """Process URLs and yield streaming responses"""
    total = len(urls)
    results = []
    
    yield create_progress_response(0, total)
    
    for i, url in enumerate(urls):
        try:
            # Send progress update with current location
            yield create_progress_response(i, total, f"Processing location {i+1}/{total}")
            
            # Scrape the location
            result = await scrape_live_occupancy(url)
            results.append(result)
            
            # Send the result
            yield create_result_response(result)
            
            # Update progress
            yield create_progress_response(i + 1, total)
            
            # Add delay between requests to be respectful
            if i < total - 1:
                await asyncio.sleep(3)
                
        except Exception as e:
            error_result = {
                'location_name': None,
                'address': None,
                'rating': None,
                'live_occupancy': None,
                'is_live_data': False,
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
            results.append(error_result)
            yield create_result_response(error_result)
    
    # Send completion signal
    yield create_complete_response()

@app.route('/scrape', methods=['POST'])
def scrape_locations():
    """Endpoint to scrape Google Maps locations with streaming progress"""
    try:
        data = request.get_json()
        
        if not data or 'urls' not in data:
            return jsonify({'error': 'URLs array is required'}), 400
        
        urls = data['urls']
        
        if not isinstance(urls, list) or len(urls) == 0:
            return jsonify({'error': 'URLs must be a non-empty array'}), 400
        
        # Validate URLs
        valid_urls = []
        for url in urls:
            if isinstance(url, str) and url.strip().startswith('https://'):
                valid_urls.append(url.strip())
        
        if len(valid_urls) == 0:
            return jsonify({'error': 'No valid URLs provided'}), 400
        
        def generate_stream():
            try:
                # Run the async function in the event loop
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                async def run_processing():
                    async for response in process_urls_stream(valid_urls):
                        yield response
                
                # Run the async generator
                async_gen = run_processing()
                
                try:
                    while True:
                        try:
                            response = loop.run_until_complete(async_gen.__anext__())
                            yield response
                        except StopAsyncIteration:
                            break
                except Exception as e:
                    yield create_error_response(str(e))
                finally:
                    loop.close()
                    
            except Exception as e:
                yield create_error_response(str(e))
        
        return Response(
            generate_stream(),
            mimetype='application/json',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Popular Times Scraper'
    })

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with service info"""
    return jsonify({
        'service': 'Popular Times Scraper API',
        'version': '1.0.0',
        'endpoints': {
            '/scrape': 'POST - Scrape Google Maps locations',
            '/health': 'GET - Health check'
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 Starting Popular Times Scraper Server on port 5044...")
    print("📡 API Endpoints:")
    print("   POST /scrape - Scrape Google Maps locations")
    print("   GET /health - Health check")
    print("   GET / - Service info")
    print("=" * 50)
    
    app.run(
        host='0.0.0.0',
        port=5044,
        debug=False,
        threaded=True
    )