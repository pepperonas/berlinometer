#!/usr/bin/env python3

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import asyncio
import json
import sys
import os
import time
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# EXACT COPY of the working MacBook script - integrated into Flask
import asyncio
from playwright.async_api import async_playwright
import re
from datetime import datetime

async def scrape_live_occupancy(url):
    """
    Scrapt Live-Auslastungsdaten von Google Maps - EXACT COPY from working MacBook script
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions']
        )
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = await context.new_page()

        # Performance: Blockiere unnötige Ressourcen
        await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
        await page.route("**/ads/**", lambda route: route.abort())

        try:
            logger.info(f"📍 Lade Google Maps: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)  # Schneller laden

            logger.info("🍪 Prüfe Cookie-Banner...")
            # Performance: Schnelle Cookie-Behandlung
            cookie_handled = False
            try:
                # Versuche alle Cookie-Selektoren parallel
                await page.wait_for_timeout(1000)  # Kurz warten
                cookie_buttons = await page.query_selector_all(
                    'button:has-text("Accept"), button:has-text("Alle akzeptieren"), [aria-label*="Accept"], [aria-label*="akzeptieren"]')

                for button in cookie_buttons:
                    try:
                        if await button.is_visible():
                            await button.click()
                            logger.info("✅ Cookie-Banner akzeptiert")
                            cookie_handled = True
                            break
                    except:
                        continue

                if cookie_handled:
                    await page.wait_for_timeout(2000)  # Reduziert von 5000ms
            except:
                pass

            logger.info("⏳ Warte auf Maps-Inhalte...")
            await page.wait_for_timeout(5000)  # Reduziert von 10000ms

            logger.info("🔍 Suche Live-Auslastung...")
            live_data = None
            is_live_data = False

            # Performance: Hole Content nur einmal
            page_content = await page.content()

            # 1. Schnelle Text-Suche nach Live-Indikator
            if '>Live<' in page_content:
                is_live_data = True
                logger.info("✅ Live-Indikator gefunden")

            # 2. Aria-label Suche optimiert - nur relevante Elemente
            if not live_data:
                derzeit_elements = await page.query_selector_all('[aria-label*="Derzeit"], [aria-label*="derzeit"]')
                for element in derzeit_elements[:5]:  # Limitiere auf erste 5
                    try:
                        aria_label = await element.get_attribute('aria-label')
                        if aria_label:
                            live_data = aria_label.replace('&nbsp;', ' ')
                            is_live_data = True
                            logger.info(f"✅ Live-Daten gefunden: {live_data}")
                            break
                    except:
                        pass

            # 3. Regex-basierte Suche (sehr schnell)
            if not live_data:
                # Live-Status Pattern
                live_match = re.search(r'>Live</[^>]*>\s*<[^>]*>([^<]+)', page_content, re.IGNORECASE)
                if live_match and is_live_data:
                    status = live_match.group(1).strip()
                    live_data = f"Live: {status}"
                    logger.info(f"✅ Live-Status: {live_data}")

                # Prozent-Pattern
                elif not live_data:
                    percent_match = re.search(r'(\d+)%[^<]*ausgelastet', page_content, re.IGNORECASE)
                    if percent_match:
                        percentage = percent_match.group(1)
                        live_data = f"{percentage}% ausgelastet"
                        logger.info(f"📊 Auslastung: {live_data}")

            # 4. Fallback nur wenn nötig
            if not live_data:
                logger.info("🔄 Fallback-Suche...")
                ausgelastet_elements = await page.query_selector_all('[aria-label*="ausgelastet"]')
                for element in ausgelastet_elements[:3]:  # Nur erste 3 prüfen
                    try:
                        aria_label = await element.get_attribute('aria-label')
                        if aria_label and ('derzeit' in aria_label.lower() or 'um ' in aria_label.lower()):
                            live_data = aria_label.replace('&nbsp;', ' ')
                            if 'derzeit' in aria_label.lower():
                                is_live_data = True
                            break
                    except:
                        pass

            logger.info("📍 Extrahiere Location-Daten...")
            # Performance: Parallele Suche nach allen Daten
            location_name = None
            address = None
            rating = None

            # Alle Selektoren parallel abfragen - EXACT COPY
            tasks = []
            name_selectors = ['h1[data-attrid="title"]', 'h1.DUwDvf', '[data-value="Ort"]']

            for selector in name_selectors:
                tasks.append(page.query_selector(selector))

            # Address und Rating Selektoren hinzufügen
            tasks.append(page.query_selector('[data-item-id="address"]'))
            tasks.append(page.query_selector('[data-value="Bewertungen"]'))

            # Alle parallel ausführen
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Name extrahieren (erste 3 Results)
            for i, result in enumerate(results[:3]):
                if result and not isinstance(result, Exception):
                    try:
                        text = await result.text_content()
                        if text and text.strip():
                            location_name = text.strip()
                            logger.info(f"📍 Location gefunden: {location_name}")
                            break
                    except:
                        pass

            # Address extrahieren (Index 3)
            if len(results) > 3 and results[3] and not isinstance(results[3], Exception):
                try:
                    address = await results[3].text_content()
                    if address and address.strip():
                        address = address.strip()
                        logger.info(f"📍 Address gefunden: {address}")
                except:
                    pass

            # Rating extrahieren (Index 4)
            if len(results) > 4 and results[4] and not isinstance(results[4], Exception):
                try:
                    rating_text = await results[4].get_attribute('aria-label')
                    if rating_text:
                        rating_match = re.search(r'(\d+[,\.]\d+)', rating_text)
                        if rating_match:
                            rating = rating_match.group(1)
                            logger.info(f"⭐ Rating gefunden: {rating}")
                except:
                    pass

            logger.info(f"✅ Scraping abgeschlossen für: {location_name or 'Unbekannte Location'}")
            result = {
                'location_name': location_name,
                'address': address,
                'rating': rating,
                'live_occupancy': live_data,
                'is_live_data': is_live_data,
                'url': url,
                'timestamp': datetime.now().isoformat()
            }

            return result

        except Exception as e:
            logger.error(f"❌ Fehler bei {url}: {e}")
            return {
                'location_name': None,
                'address': None,
                'rating': None,
                'live_occupancy': None,
                'is_live_data': False,
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }

        finally:
            await browser.close()

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
            
            # Scrape the location - EXACT same timing as MacBook script
            result = await scrape_live_occupancy(url)
            results.append(result)
            
            # Send the result
            yield create_result_response(result)
            
            # Update progress
            yield create_progress_response(i + 1, total)
            
            # Add delay between requests - EXACT same as MacBook script
            if i < total - 1:
                await asyncio.sleep(5)  # Längere Pause - same as MacBook
                
        except Exception as e:
            logger.error(f"Error processing {url}: {e}")
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
        
        logger.info(f"Starting scraping for {len(valid_urls)} URLs using EXACT MacBook code")
        
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
                    logger.error(f"Stream processing error: {e}")
                    yield create_error_response(str(e))
                finally:
                    loop.close()
                    
            except Exception as e:
                logger.error(f"Generate stream error: {e}")
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
        logger.error(f"Scrape endpoint error: {e}")
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
        'version': '1.4.0 - MacBook Mirror Edition',
        'endpoints': {
            '/scrape': 'POST - Scrape Google Maps locations',
            '/health': 'GET - Health check'
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Popular Times Scraper Server (MacBook Mirror Edition) on port 5044...")
    logger.info("📡 API Endpoints:")
    logger.info("   POST /scrape - Scrape Google Maps locations")
    logger.info("   GET /health - Health check")
    logger.info("   GET / - Service info")
    logger.info("=" * 50)
    
    app.run(
        host='0.0.0.0',
        port=5044,
        debug=False,
        threaded=True
    )