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

async def scrape_live_occupancy(url):
    """
    Robuste Version des Google Maps Scrapers
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox', 
                '--disable-dev-shm-usage', 
                '--disable-gpu', 
                '--disable-extensions',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-blink-features=AutomationControlled',
                '--no-first-run',
                '--disable-default-apps'
            ]
        )
        
        # Erweiterte Browser-Kontext Konfiguration
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='de-DE',
            timezone_id='Europe/Berlin',
            geolocation={'latitude': 52.5200, 'longitude': 13.4050},  # Berlin
            permissions=['geolocation']
        )
        
        page = await context.new_page()

        # Erweiterte Resource-Blockierung für bessere Performance
        await page.route("**/*.{png,jpg,jpeg,gif,svg,webp,ico,woff,woff2,ttf,eot}", lambda route: route.abort())
        await page.route("**/ads/**", lambda route: route.abort())
        await page.route("**/analytics/**", lambda route: route.abort())

        try:
            # Fallback-Name aus URL extrahieren
            url_name = extract_name_from_url(url)
            logger.info(f"📍 URL-Name extrahiert: {url_name}")

            logger.info(f"📍 Lade Google Maps: {url}")
            
            # Gehe zur Seite mit erweiterten Optionen
            await page.goto(url, wait_until='domcontentloaded', timeout=45000)
            
            # Längere Wartezeit für das initiale Laden
            await page.wait_for_timeout(3000)

            logger.info("🍪 Erweiterte Cookie-Banner Behandlung...")
            # Umfassende Cookie-Banner Behandlung
            cookie_handled = False
            try:
                # Warte auf mögliche Cookie-Banner
                await page.wait_for_timeout(2000)
                
                # Verschiedene Cookie-Strategien
                cookie_strategies = [
                    # Direkte Button-Texte
                    'button:has-text("Alle akzeptieren")',
                    'button:has-text("Accept all")',
                    'button:has-text("Akzeptieren")',
                    'button:has-text("OK")',
                    'button:has-text("Agree")',
                    
                    # Aria-Labels
                    '[aria-label*="Accept"]',
                    '[aria-label*="akzeptieren"]',
                    '[aria-label*="Alle"]',
                    
                    # Data-Attribute
                    '[data-value="Accept"]',
                    '[data-value="Akzeptieren"]',
                    
                    # Allgemeine Button-Selektoren in Cookie-Containern
                    'form[action*="consent"] button',
                    'div[role="dialog"] button',
                    '.gb_g button',  # Google's consent button class
                ]
                
                for strategy in cookie_strategies:
                    try:
                        buttons = await page.query_selector_all(strategy)
                        for button in buttons[:3]:  # Maximal 3 Buttons pro Strategy
                            if await button.is_visible():
                                await button.click()
                                logger.info(f"✅ Cookie-Button geklickt: {strategy}")
                                cookie_handled = True
                                await page.wait_for_timeout(2000)
                                break
                        if cookie_handled:
                            break
                    except Exception as e:
                        continue
                
                # Wenn immer noch kein Cookie-Banner behandelt, versuche ESC
                if not cookie_handled:
                    await page.keyboard.press('Escape')
                    await page.wait_for_timeout(1000)
                    
            except Exception as e:
                logger.warning(f"Cookie-Banner Behandlung fehlgeschlagen: {e}")

            # Warte auf vollständiges Laden der Karte
            logger.info("⏳ Warte auf vollständiges Laden...")
            await page.wait_for_timeout(8000)

            # Versuche auf spezifische Google Maps Elemente zu warten
            try:
                await page.wait_for_selector('[role="main"]', timeout=10000)
            except:
                pass

            logger.info("🔍 Beginne Datenextraktion...")
            
            # 1. Location-Name mit erweiterten Strategien
            location_name = None
            
            # Strategie 1: Erweiterte CSS-Selektoren
            name_selectors = [
                'h1[data-attrid="title"]',
                'h1.DUwDvf',
                'h1.fontHeadlineLarge', 
                'h1[class*="fontHeadline"]',
                '[data-value="Ort"]',
                '[data-attrid="title"]',
                'h1[jstcache]',
                '.x3AX1-LfntMc-header-title-title',
                '[role="main"] h1',
                'div[data-attrid="title"]',
                # Fallback: Jeder h1 im main content
                '[role="main"] h1',
                'main h1',
                'h1'
            ]
            
            for selector in name_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    for element in elements:
                        text = await element.text_content()
                        if text and text.strip() and len(text.strip()) > 2:
                            # Prüfe ob es ein echter Name ist (nicht nur Ziffern oder sehr kurz)
                            clean_text = text.strip()
                            if not clean_text.isdigit() and len(clean_text) > 2:
                                location_name = clean_text
                                logger.info(f"📍 Location gefunden mit {selector}: {location_name}")
                                break
                    if location_name:
                        break
                except Exception as e:
                    continue
            
            # Strategie 2: Page Title als Fallback
            if not location_name:
                try:
                    title = await page.title()
                    if title and " - Google Maps" in title:
                        potential_name = title.replace(" - Google Maps", "").strip()
                        if len(potential_name) > 2:
                            location_name = potential_name
                            logger.info(f"📍 Location aus Titel: {location_name}")
                except:
                    pass
            
            # Strategie 3: URL-Name als letzter Fallback
            if not location_name and url_name:
                location_name = url_name
                logger.info(f"📍 Location aus URL: {location_name}")

            # 2. Adresse mit erweiterten Selektoren
            address = None
            address_selectors = [
                '[data-item-id="address"]',
                'button[data-item-id="address"]',
                '[data-value="Adresse"]',
                '.rogA2c',
                '.Io6YTe',  # Weitere Google Maps Klassen
                '.AeaXub',
                '[aria-label*="Adresse"]',
                '[aria-label*="Address"]',
                'div[data-attrid*="address"]'
            ]
            
            for selector in address_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    for element in elements:
                        text = await element.text_content()
                        if text and text.strip() and len(text.strip()) > 5:
                            # Prüfe ob es eine echte Adresse ist
                            if any(char.isdigit() for char in text) or 'str' in text.lower():
                                address = text.strip()
                                logger.info(f"📍 Adresse gefunden: {address}")
                                break
                    if address:
                        break
                except:
                    continue

            # 3. Rating mit erweiterten Pattern
            rating = None
            rating_selectors = [
                '[data-value="Bewertungen"]',
                'span.ceNzKf',
                '.fontBodyMedium span[aria-label*="Stern"]',
                '.gm2-body-2 span[aria-label*="Stern"]',
                'span[aria-label*="von 5"]',
                'span[aria-label*="stars"]',
                'div[data-attrid*="rating"]'
            ]
            
            for selector in rating_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    for element in elements:
                        # Versuche aus aria-label
                        aria_label = await element.get_attribute('aria-label')
                        if aria_label:
                            rating_match = re.search(r'(\d+[,\.]\d+)', aria_label)
                            if rating_match:
                                rating = rating_match.group(1)
                                logger.info(f"⭐ Rating aus aria-label: {rating}")
                                break
                        
                        # Versuche aus Text
                        text = await element.text_content()
                        if text:
                            rating_match = re.search(r'(\d+[,\.]\d+)', text)
                            if rating_match:
                                rating = rating_match.group(1)
                                logger.info(f"⭐ Rating aus Text: {rating}")
                                break
                    if rating:
                        break
                except:
                    continue

            # 4. Live-Auslastung mit umfassenderen Methoden
            logger.info("🔍 Suche Live-Auslastung...")
            live_data = None
            is_live_data = False

            # Hole aktuellen Seiteninhalt
            page_content = await page.content()

            # Strategie 1: Live-Indikator suchen
            live_indicators = ['Live</span>', '>Live<', 'Live</div>', 'data-live="true"']
            for indicator in live_indicators:
                if indicator in page_content:
                    is_live_data = True
                    logger.info(f"✅ Live-Indikator gefunden: {indicator}")
                    break

            # Strategie 2: Erweiterte Element-Suche
            occupancy_selectors = [
                '[aria-label*="Derzeit"]',
                '[aria-label*="derzeit"]', 
                '[aria-label*="Currently"]',
                '[aria-label*="ausgelastet"]',
                '[aria-label*="busy"]',
                'div[aria-label*="%"]',
                '.section-popular-times-live-value',
                '.live-value',
                '[data-value*="ausgelastet"]'
            ]
            
            for selector in occupancy_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    for element in elements:
                        aria_label = await element.get_attribute('aria-label')
                        if aria_label:
                            # Prüfe auf deutsche und englische Pattern
                            if any(keyword in aria_label.lower() for keyword in ['derzeit', 'currently', 'ausgelastet', 'busy', '%']):
                                live_data = aria_label.replace('&nbsp;', ' ').strip()
                                if 'derzeit' in aria_label.lower() or 'currently' in aria_label.lower():
                                    is_live_data = True
                                logger.info(f"✅ Auslastung gefunden: {live_data}")
                                break
                    if live_data:
                        break
                except:
                    continue

            # Strategie 3: Regex-Patterns im Seiteninhalt
            if not live_data:
                patterns = [
                    r'aria-label="[^"]*?(\d+%[^"]*ausgelastet)[^"]*?"',
                    r'aria-label="[^"]*?(Derzeit[^"]*?ausgelastet)[^"]*?"',
                    r'>(\d+%[^<]*ausgelastet)<',
                    r'aria-label="[^"]*?(\d+%[^"]*busy)[^"]*?"',
                    r'>Currently[^<]*?(\d+%[^<]*busy)<'
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, page_content, re.IGNORECASE)
                    if matches:
                        live_data = matches[0].strip()
                        if 'derzeit' in live_data.lower() or 'currently' in live_data.lower():
                            is_live_data = True
                        logger.info(f"📊 Pattern-Auslastung: {live_data}")
                        break

            # Strategie 4: Allgemeine Prozent-Suche (nur als letzter Fallback)
            if not live_data:
                percent_matches = re.findall(r'(\d+%)', page_content)
                if percent_matches:
                    # Filtere unrealistische Werte
                    realistic_percents = [p for p in percent_matches if int(p.replace('%', '')) <= 100]
                    if realistic_percents:
                        live_data = f"Mögliche Auslastung: {realistic_percents[0]}"
                        logger.info(f"📊 Fallback-Prozent: {live_data}")

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
                'location_name': extract_name_from_url(url),  # Wenigstens URL-Name als Fallback
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
                await asyncio.sleep(6)  # Längere Pause für Stabilität
                
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
        
        logger.info(f"Starting robust scraping for {len(valid_urls)} URLs")
        
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
        'version': '1.1.0 - Robust Edition',
        'endpoints': {
            '/scrape': 'POST - Scrape Google Maps locations',
            '/health': 'GET - Health check'
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Popular Times Scraper Server (Robust Edition) on port 5044...")
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