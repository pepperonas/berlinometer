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

# Integrated scraping function
import asyncio
from playwright.async_api import async_playwright
import re
from datetime import datetime

async def scrape_live_occupancy(url):
    """
    Scrapt Live-Auslastungsdaten von Google Maps - Verbesserte Version
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-web-security']
        )
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = await context.new_page()

        # Performance: Blockiere unnötige Ressourcen
        await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
        await page.route("**/ads/**", lambda route: route.abort())

        try:
            logger.info(f"📍 Lade Google Maps: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)

            logger.info("🍪 Prüfe Cookie-Banner...")
            # Erweiterte Cookie-Behandlung
            try:
                await page.wait_for_timeout(2000)
                
                # Verschiedene Cookie-Button Selektoren
                cookie_selectors = [
                    'button:has-text("Accept")',
                    'button:has-text("Alle akzeptieren")',
                    'button:has-text("Accept all")',
                    'button:has-text("Akzeptieren")',
                    '[aria-label*="Accept"]',
                    '[aria-label*="akzeptieren"]',
                    '[data-value="Accept"]',
                    'button[jsname]'
                ]
                
                for selector in cookie_selectors:
                    try:
                        buttons = await page.query_selector_all(selector)
                        for button in buttons:
                            if await button.is_visible():
                                await button.click()
                                logger.info("✅ Cookie-Banner akzeptiert")
                                await page.wait_for_timeout(2000)
                                break
                    except:
                        continue
            except:
                pass

            logger.info("⏳ Warte auf Maps-Inhalte...")
            await page.wait_for_timeout(7000)  # Länger warten für vollständiges Laden

            logger.info("🔍 Suche Location-Name...")
            location_name = None
            
            # Erweiterte Name-Suche
            name_selectors = [
                'h1[data-attrid="title"]',
                'h1.DUwDvf',
                'h1.fontHeadlineLarge',
                '[data-value="Ort"]',
                'h1[class*="fontHeadline"]',
                'h1',
                '[role="main"] h1',
                '.place-name',
                '[data-attrid="title"]'
            ]
            
            for selector in name_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        text = await element.text_content()
                        if text and text.strip() and len(text.strip()) > 2:
                            location_name = text.strip()
                            logger.info(f"📍 Location gefunden: {location_name}")
                            break
                except:
                    continue
            
            # Fallback: Aus dem Seitentitel extrahieren
            if not location_name:
                try:
                    title = await page.title()
                    if title and " - Google Maps" in title:
                        location_name = title.replace(" - Google Maps", "").strip()
                        logger.info(f"📍 Location aus Titel: {location_name}")
                except:
                    pass

            logger.info("🔍 Suche Adresse...")
            address = None
            
            # Erweiterte Adress-Suche
            address_selectors = [
                '[data-item-id="address"]',
                '[data-value="Adresse"]',
                'button[data-item-id="address"]',
                '[aria-label*="Adresse"]',
                '.rogA2c',  # Häufige Google Maps Klasse für Adressen
                '[data-attrid="kc:/location/location:address"]'
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

            logger.info("⭐ Suche Rating...")
            rating = None
            
            # Erweiterte Rating-Suche
            rating_selectors = [
                '[data-value="Bewertungen"]',
                'span.ceNzKf',  # Google Maps Rating Klasse
                '[aria-label*="Sterne"]',
                '[aria-label*="stars"]',
                'span[aria-label*="von 5"]'
            ]
            
            for selector in rating_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        aria_label = await element.get_attribute('aria-label')
                        text = await element.text_content()
                        
                        # Versuche Rating aus aria-label zu extrahieren
                        if aria_label:
                            rating_match = re.search(r'(\d+[,\.]\d+)', aria_label)
                            if rating_match:
                                rating = rating_match.group(1)
                                logger.info(f"⭐ Rating gefunden: {rating}")
                                break
                        
                        # Versuche Rating aus Text zu extrahieren
                        if text:
                            rating_match = re.search(r'(\d+[,\.]\d+)', text)
                            if rating_match:
                                rating = rating_match.group(1)
                                logger.info(f"⭐ Rating gefunden: {rating}")
                                break
                except:
                    continue

            logger.info("🔍 Suche Live-Auslastung...")
            live_data = None
            is_live_data = False

            # Hole kompletten Seiteninhalt für Pattern-Suche
            page_content = await page.content()

            # 1. Suche nach Live-Indikator
            if '>Live<' in page_content or 'Live</span>' in page_content:
                is_live_data = True
                logger.info("✅ Live-Indikator gefunden")

            # 2. Erweiterte Aria-label Suche
            occupancy_selectors = [
                '[aria-label*="Derzeit"]',
                '[aria-label*="derzeit"]',
                '[aria-label*="Currently"]',
                '[aria-label*="ausgelastet"]',
                '[aria-label*="busy"]',
                '[aria-label*="Auslastung"]',
                'div[aria-label*="%"]'
            ]
            
            for selector in occupancy_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    for element in elements:
                        aria_label = await element.get_attribute('aria-label')
                        if aria_label and ('derzeit' in aria_label.lower() or 'currently' in aria_label.lower() or '%' in aria_label):
                            live_data = aria_label.replace('&nbsp;', ' ').strip()
                            if 'derzeit' in aria_label.lower() or 'currently' in aria_label.lower():
                                is_live_data = True
                            logger.info(f"✅ Auslastung gefunden: {live_data}")
                            break
                    if live_data:
                        break
                except:
                    continue

            # 3. Regex-basierte Suche im Seiteninhalt
            if not live_data:
                patterns = [
                    r'(\d+)%[^<]*ausgelastet',
                    r'(\d+)%[^<]*busy',
                    r'Derzeit[^<]*?(\d+%[^<]*ausgelastet)',
                    r'>Live</[^>]*>\s*<[^>]*>([^<]+)',
                    r'aria-label="[^"]*(\d+%[^"]*ausgelastet)[^"]*"',
                    r'Currently[^<]*?(\d+%[^<]*busy)'
                ]
                
                for pattern in patterns:
                    match = re.search(pattern, page_content, re.IGNORECASE)
                    if match:
                        if len(match.groups()) > 0:
                            live_data = match.group(1).strip()
                        else:
                            live_data = match.group(0).strip()
                        
                        if 'derzeit' in live_data.lower() or 'currently' in live_data.lower():
                            is_live_data = True
                        
                        logger.info(f"📊 Pattern-Auslastung: {live_data}")
                        break

            # 4. Fallback: Suche nach beliebigen Prozent-Angaben
            if not live_data:
                percent_patterns = [
                    r'(\d+%)',
                    r'(\d+\s*%)',
                    r'(\d+\s*Prozent)',
                ]
                
                for pattern in percent_patterns:
                    matches = re.findall(pattern, page_content, re.IGNORECASE)
                    if matches:
                        # Nehme das erste gefundene Prozent
                        live_data = f"Mögliche Auslastung: {matches[0]}"
                        logger.info(f"📊 Fallback-Prozent: {live_data}")
                        break

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
            
            # Scrape the location
            result = await scrape_live_occupancy(url)
            results.append(result)
            
            # Send the result
            yield create_result_response(result)
            
            # Update progress
            yield create_progress_response(i + 1, total)
            
            # Add delay between requests to be respectful
            if i < total - 1:
                await asyncio.sleep(5)  # Längere Pause
                
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
        
        logger.info(f"Starting scraping for {len(valid_urls)} URLs")
        
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
        'version': '1.0.1',
        'endpoints': {
            '/scrape': 'POST - Scrape Google Maps locations',
            '/health': 'GET - Health check'
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Popular Times Scraper Server on port 5044...")
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