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
import urllib.parse

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Integrated scraping function
import asyncio
from playwright.async_api import async_playwright
import re
from datetime import datetime

def extract_name_from_url(url):
    """Extrahiert den Namen aus der Google Maps URL als Fallback"""
    try:
        # Dekodiere URL
        decoded_url = urllib.parse.unquote(url)
        
        # Suche nach /place/Name/
        place_match = re.search(r'/place/([^/@]+)', decoded_url)
        if place_match:
            name = place_match.group(1)
            # Ersetze + durch Leerzeichen und bereinige
            name = name.replace('+', ' ').replace('-', ' ')
            # Entferne %C3%A9 etc. - häufige URL-Kodierungen
            name = re.sub(r'%[0-9A-F]{2}', '', name)
            return name.strip()
    except:
        pass
    return None

async def scrape_live_occupancy_robust(url, retry_count=0):
    """
    Ultra-robuste Version des Google Maps Scrapers mit Retry-Mechanismus
    """
    max_retries = 2
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox', 
                '--disable-dev-shm-usage', 
                '--disable-gpu', 
                '--disable-extensions',
                '--disable-web-security',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor'
            ]
        )
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            locale='de-DE',
            timezone_id='Europe/Berlin'
        )
        page = await context.new_page()

        # Performance: Blockiere unnötige Ressourcen
        await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
        await page.route("**/ads/**", lambda route: route.abort())

        try:
            url_name = extract_name_from_url(url)
            logger.info(f"📍 URL-Name: {url_name}")
            
            logger.info(f"📍 Lade Google Maps (Versuch {retry_count + 1}): {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=45000)

            # EXTENDED Cookie handling
            logger.info("🍪 Erweiterte Cookie-Banner Behandlung...")
            try:
                await page.wait_for_timeout(2000)
                
                # Multiple cookie strategies
                cookie_strategies = [
                    'button:has-text("Accept")',
                    'button:has-text("Alle akzeptieren")',
                    'button:has-text("Akzeptieren")',
                    'button:has-text("OK")',
                    '[aria-label*="Accept"]',
                    '[aria-label*="akzeptieren"]',
                    'form button[type="submit"]',
                    '.gb_g button'  # Google consent button
                ]
                
                for strategy in cookie_strategies:
                    try:
                        buttons = await page.query_selector_all(strategy)
                        for button in buttons[:2]:
                            if await button.is_visible():
                                await button.click()
                                logger.info(f"✅ Cookie-Button geklickt: {strategy}")
                                await page.wait_for_timeout(3000)
                                break
                    except:
                        continue
                        
                # Fallback: ESC key
                await page.keyboard.press('Escape')
                await page.wait_for_timeout(1000)
                        
            except Exception as e:
                logger.warning(f"Cookie-Behandlung fehlgeschlagen: {e}")

            # LONGER wait for content to load
            logger.info("⏳ Warte längere Zeit auf Maps-Inhalte...")
            await page.wait_for_timeout(8000)  # Increased from 5000ms
            
            # Try to wait for specific elements
            try:
                await page.wait_for_selector('[role="main"]', timeout=10000)
                logger.info("✅ Main content loaded")
            except:
                logger.warning("Main content selector not found")

            logger.info("🔍 Suche Live-Auslastung...")
            live_data = None
            is_live_data = False

            # Get page content
            page_content = await page.content()

            # 1. Live indicator search
            if '>Live<' in page_content or 'Live</span>' in page_content:
                is_live_data = True
                logger.info("✅ Live-Indikator gefunden")

            # 2. Aria-label search - ENHANCED
            if not live_data:
                selectors = [
                    '[aria-label*="Derzeit"]',
                    '[aria-label*="derzeit"]',
                    '[aria-label*="Currently"]',
                    '[aria-label*="ausgelastet"]'
                ]
                
                for selector in selectors:
                    try:
                        elements = await page.query_selector_all(selector)
                        for element in elements[:5]:
                            aria_label = await element.get_attribute('aria-label')
                            if aria_label:
                                live_data = aria_label.replace('&nbsp;', ' ')
                                if 'derzeit' in aria_label.lower():
                                    is_live_data = True
                                logger.info(f"✅ Live-Daten gefunden: {live_data}")
                                break
                        if live_data:
                            break
                    except:
                        continue

            # 3. Regex patterns in content
            if not live_data:
                patterns = [
                    r'(\d+)%[^<]*ausgelastet',
                    r'Derzeit[^<]*?(\d+%[^<]*ausgelastet)',
                    r'aria-label="[^"]*?(Derzeit[^"]*?ausgelastet)[^"]*?"'
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, page_content, re.IGNORECASE)
                    if matches:
                        live_data = matches[0]
                        if 'derzeit' in live_data.lower():
                            is_live_data = True
                        logger.info(f"✅ Pattern-Auslastung: {live_data}")
                        break

            # 4. Fallback search
            if not live_data:
                logger.info("🔄 Fallback-Suche...")
                try:
                    ausgelastet_elements = await page.query_selector_all('[aria-label*="ausgelastet"]')
                    for element in ausgelastet_elements[:3]:
                        aria_label = await element.get_attribute('aria-label')
                        if aria_label and ('derzeit' in aria_label.lower() or 'um ' in aria_label.lower()):
                            live_data = aria_label.replace('&nbsp;', ' ')
                            if 'derzeit' in aria_label.lower():
                                is_live_data = True
                            logger.info(f"✅ Fallback-Daten gefunden: {live_data}")
                            break
                except:
                    pass

            logger.info("📍 Extrahiere Location-Daten mit erweiterten Selektoren...")
            location_name = None
            address = None
            rating = None

            # ENHANCED name extraction with more selectors
            name_selectors = [
                'h1[data-attrid="title"]',
                'h1.DUwDvf', 
                '[data-value="Ort"]',
                'h1.fontHeadlineLarge',
                'h1[class*="fontHeadline"]',
                '[data-attrid="title"]',
                'h1',
                '[role="main"] h1'
            ]
            
            # Try each selector individually with more detailed logging
            for selector in name_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    logger.info(f"Selector {selector}: {len(elements)} elements found")
                    for i, element in enumerate(elements):
                        text = await element.text_content()
                        if text and text.strip() and len(text.strip()) > 2:
                            location_name = text.strip()
                            logger.info(f"📍 Location gefunden mit {selector}[{i}]: {location_name}")
                            break
                    if location_name:
                        break
                except Exception as e:
                    logger.warning(f"Error with selector {selector}: {e}")

            # Address extraction with enhanced selectors
            address_selectors = [
                '[data-item-id="address"]',
                'button[data-item-id="address"]',
                '[data-value="Adresse"]',
                '.rogA2c',
                '[aria-label*="Adresse"]'
            ]
            
            for selector in address_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        text = await element.text_content()
                        if text and text.strip():
                            address = text.strip()
                            logger.info(f"📍 Adresse gefunden: {address}")
                            break
                except:
                    continue

            # Rating extraction
            rating_selectors = [
                '[data-value="Bewertungen"]',
                'span.ceNzKf',
                '[aria-label*="Stern"]'
            ]
            
            for selector in rating_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        rating_text = await element.get_attribute('aria-label')
                        if rating_text:
                            rating_match = re.search(r'(\d+[,\.]\d+)', rating_text)
                            if rating_match:
                                rating = rating_match.group(1)
                                logger.info(f"⭐ Rating gefunden: {rating}")
                                break
                except:
                    continue

            # Use URL name as fallback if no location name found
            if not location_name and url_name:
                location_name = url_name
                logger.info(f"📍 Using URL name as fallback: {location_name}")

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

            # If no data found and retries available, try again
            if not location_name and not live_data and retry_count < max_retries:
                logger.info(f"⚠️ No data found, retrying... ({retry_count + 1}/{max_retries})")
                await browser.close()
                await asyncio.sleep(3)  # Wait before retry
                return await scrape_live_occupancy_robust(url, retry_count + 1)

            return result

        except Exception as e:
            logger.error(f"❌ Fehler bei {url}: {e}")
            
            # Retry on error if retries available
            if retry_count < max_retries:
                logger.info(f"⚠️ Error occurred, retrying... ({retry_count + 1}/{max_retries})")
                await browser.close()
                await asyncio.sleep(5)
                return await scrape_live_occupancy_robust(url, retry_count + 1)
            
            return {
                'location_name': extract_name_from_url(url),
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
            
            # Scrape the location with robust retry mechanism
            result = await scrape_live_occupancy_robust(url)
            results.append(result)
            
            # Send the result
            yield create_result_response(result)
            
            # Update progress
            yield create_progress_response(i + 1, total)
            
            # Longer delay between requests for better success rate
            if i < total - 1:
                await asyncio.sleep(7)  # Increased delay
                
        except Exception as e:
            logger.error(f"Error processing {url}: {e}")
            error_result = {
                'location_name': extract_name_from_url(url),
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
        
        logger.info(f"Starting ULTRA-ROBUST scraping for {len(valid_urls)} URLs")
        
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
        'version': '1.3.0 - Ultra-Robust Edition',
        'endpoints': {
            '/scrape': 'POST - Scrape Google Maps locations',
            '/health': 'GET - Health check'
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Popular Times Scraper Server (Ultra-Robust Edition) on port 5044...")
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