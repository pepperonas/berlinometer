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
import random

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
        decoded_url = urllib.parse.unquote(url)
        place_match = re.search(r'/place/([^/@]+)', decoded_url)
        if place_match:
            name = place_match.group(1)
            name = name.replace('+', ' ').replace('-', ' ')
            name = re.sub(r'%[0-9A-F]{2}', '', name)
            return name.strip()
    except:
        pass
    return None

async def scrape_live_occupancy_with_retries(url, max_retries=3):
    """
    Robust scraper with multiple retry strategies
    """
    for attempt in range(max_retries):
        try:
            result = await scrape_live_occupancy_single(url, attempt)
            
            # If we got at least a name or occupancy data, return it
            if result.get('location_name') or result.get('live_occupancy'):
                logger.info(f"✅ Success on attempt {attempt + 1} for {result.get('location_name', 'URL')}")
                return result
            
            # If no data and more retries available, try again
            if attempt < max_retries - 1:
                wait_time = random.uniform(3, 8)  # Random wait between retries
                logger.info(f"⚠️ Attempt {attempt + 1} failed, retrying in {wait_time:.1f}s...")
                await asyncio.sleep(wait_time)
                
        except Exception as e:
            logger.error(f"❌ Attempt {attempt + 1} failed with error: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(random.uniform(5, 10))
    
    # All attempts failed, return URL name as fallback
    url_name = extract_name_from_url(url)
    logger.warning(f"⚠️ All attempts failed, using URL fallback: {url_name}")
    
    return {
        'location_name': url_name,
        'address': None,
        'rating': None,
        'live_occupancy': None,
        'is_live_data': False,
        'url': url,
        'timestamp': datetime.now().isoformat(),
        'note': 'Extracted from URL - scraping failed'
    }

async def scrape_live_occupancy_single(url, attempt_num):
    """
    Single scraping attempt with attempt-specific optimizations
    """
    async with async_playwright() as p:
        # Vary browser config per attempt
        args = ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions']
        
        if attempt_num > 0:
            # More aggressive args for retries
            args.extend([
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-blink-features=AutomationControlled'
            ])
        
        browser = await p.chromium.launch(headless=True, args=args)
        
        # Vary viewport and user agent slightly per attempt
        viewports = [
            {'width': 1280, 'height': 720},
            {'width': 1366, 'height': 768},
            {'width': 1920, 'height': 1080}
        ]
        
        user_agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        
        context = await browser.new_context(
            viewport=viewports[attempt_num % len(viewports)],
            user_agent=user_agents[attempt_num % len(user_agents)],
            locale='de-DE'
        )
        page = await context.new_page()

        # Performance: Blockiere unnötige Ressourcen
        await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
        await page.route("**/ads/**", lambda route: route.abort())

        try:
            logger.info(f"📍 Attempt {attempt_num + 1}: Loading {url}")
            
            # Vary timeout per attempt
            timeout = 30000 + (attempt_num * 10000)  # 30s, 40s, 50s
            await page.goto(url, wait_until='domcontentloaded', timeout=timeout)

            # Extended cookie handling with more time for retries
            logger.info("🍪 Cookie handling...")
            cookie_wait = 1000 + (attempt_num * 1000)  # 1s, 2s, 3s
            await page.wait_for_timeout(cookie_wait)
            
            cookie_strategies = [
                'button:has-text("Accept")',
                'button:has-text("Alle akzeptieren")',
                'button:has-text("Akzeptieren")',
                '[aria-label*="Accept"]',
                '[aria-label*="akzeptieren"]'
            ]
            
            for strategy in cookie_strategies:
                try:
                    buttons = await page.query_selector_all(strategy)
                    for button in buttons[:2]:
                        if await button.is_visible():
                            await button.click()
                            logger.info(f"✅ Cookie clicked: {strategy}")
                            await page.wait_for_timeout(2000)
                            break
                except:
                    continue

            # Longer wait for content, especially for retries
            content_wait = 5000 + (attempt_num * 2000)  # 5s, 7s, 9s
            logger.info(f"⏳ Waiting {content_wait/1000}s for content...")
            await page.wait_for_timeout(content_wait)

            # Try to wait for specific elements
            try:
                await page.wait_for_selector('[role="main"]', timeout=5000)
            except:
                # If main not found, wait a bit more
                await page.wait_for_timeout(3000)

            logger.info("🔍 Extracting data...")
            live_data = None
            is_live_data = False
            page_content = await page.content()

            # Live indicator search
            if '>Live<' in page_content or 'Live</span>' in page_content:
                is_live_data = True
                logger.info("✅ Live indicator found")

            # Occupancy data search
            if not live_data:
                selectors = [
                    '[aria-label*="Derzeit"]',
                    '[aria-label*="derzeit"]',
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
                                logger.info(f"✅ Occupancy found: {live_data}")
                                break
                        if live_data:
                            break
                    except:
                        continue

            # Regex fallback
            if not live_data:
                patterns = [
                    r'(\d+)%[^<]*ausgelastet',
                    r'Um \d+ Uhr zu (\d+) % ausgelastet'
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, page_content, re.IGNORECASE)
                    if matches:
                        if 'Um' in pattern:
                            # Extract full "Um X Uhr..." text
                            full_match = re.search(r'Um \d+ Uhr zu \d+ % ausgelastet\.?', page_content, re.IGNORECASE)
                            if full_match:
                                live_data = full_match.group(0)
                        else:
                            live_data = f"{matches[0]}% ausgelastet"
                        logger.info(f"📊 Pattern match: {live_data}")
                        break

            # Location name extraction with enhanced selectors
            location_name = None
            name_selectors = [
                'h1[data-attrid="title"]',
                'h1.DUwDvf',
                '[data-value="Ort"]',
                'h1.fontHeadlineLarge',
                'h1',
                '[role="main"] h1'
            ]
            
            for selector in name_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    for element in elements:
                        text = await element.text_content()
                        if text and text.strip() and len(text.strip()) > 2:
                            location_name = text.strip()
                            logger.info(f"📍 Name found: {location_name}")
                            break
                    if location_name:
                        break
                except:
                    continue

            # Address extraction
            address = None
            address_selectors = [
                '[data-item-id="address"]',
                'button[data-item-id="address"]',
                '[data-value="Adresse"]'
            ]
            
            for selector in address_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        text = await element.text_content()
                        if text and text.strip():
                            address = text.strip()
                            logger.info(f"📍 Address found: {address}")
                            break
                except:
                    continue

            # Rating extraction
            rating = None
            try:
                rating_element = await page.query_selector('[data-value="Bewertungen"]')
                if rating_element:
                    rating_text = await rating_element.get_attribute('aria-label')
                    if rating_text:
                        rating_match = re.search(r'(\d+[,\.]\d+)', rating_text)
                        if rating_match:
                            rating = rating_match.group(1)
                            logger.info(f"⭐ Rating found: {rating}")
            except:
                pass

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
            logger.error(f"❌ Error in attempt {attempt_num + 1}: {e}")
            raise e

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
            # Send progress update
            yield create_progress_response(i, total, f"Processing location {i+1}/{total}")
            
            # Scrape with enhanced retry mechanism
            result = await scrape_live_occupancy_with_retries(url)
            results.append(result)
            
            # Send the result
            yield create_result_response(result)
            
            # Update progress
            yield create_progress_response(i + 1, total)
            
            # Variable delay between requests
            if i < total - 1:
                delay = random.uniform(4, 8)  # Random 4-8 second delay
                await asyncio.sleep(delay)
                
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
        
        logger.info(f"Starting FINAL enhanced scraping for {len(valid_urls)} URLs")
        
        def generate_stream():
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                async def run_processing():
                    async for response in process_urls_stream(valid_urls):
                        yield response
                
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
        'version': '1.5.0 - Final Enhanced Edition',
        'endpoints': {
            '/scrape': 'POST - Scrape Google Maps locations',
            '/health': 'GET - Health check'
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Popular Times Scraper Server (Final Enhanced Edition) on port 5044...")
    logger.info("📡 Features: Multi-retry, Random delays, Adaptive timeouts, URL fallbacks")
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