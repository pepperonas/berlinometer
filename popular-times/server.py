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
import subprocess
import tempfile

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

async def find_locations_near_address_enhanced(address):
    """
    Enhanced version with better bot detection avoidance
    """
    locations = []
    
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
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        )
        context = await browser.new_context(
            viewport={'width': 1366, 'height': 768},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='de-DE',
            timezone_id='Europe/Berlin'
        )
        
        # Add extra headers to appear more human
        await context.set_extra_http_headers({
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Upgrade-Insecure-Requests': '1'
        })
        
        page = await context.new_page()
        
        # Spoof navigator properties
        await page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['de-DE', 'de', 'en'],
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
        """)
        
        try:
            # Alternative search strategies
            search_strategies = [
                f"bars near {address}",
                f"clubs near {address}",
                f"kneipen {address}",
                f"cocktailbar {address}"
            ]
            
            for strategy in search_strategies:
                logger.info(f"🔍 Trying search strategy: {strategy}")
                
                maps_url = f"https://www.google.com/maps/search/{urllib.parse.quote(strategy)}?hl=de"
                logger.info(f"🌐 URL: {maps_url}")
                
                await page.goto(maps_url, wait_until='networkidle', timeout=30000)
                
                # Random human-like delay
                await page.wait_for_timeout(random.randint(3000, 6000))
                
                # Handle cookies more aggressively
                cookie_handled = False
                for i in range(3):
                    try:
                        cookie_button = await page.query_selector('button:has-text("Accept"), button:has-text("Alle akzeptieren"), [aria-label*="Accept"]')
                        if cookie_button and await cookie_button.is_visible():
                            await cookie_button.click()
                            cookie_handled = True
                            logger.info("✅ Cookie banner handled")
                            break
                    except:
                        pass
                    await page.wait_for_timeout(1000)
                
                # Wait for results to load
                await page.wait_for_timeout(8000)
                
                # Try multiple result extraction methods
                result_selectors = [
                    'a[href*="/maps/place/"]',
                    '[data-result-index]',
                    '.hfpxzc',
                    'div[role="article"]'
                ]
                
                found_any = False
                for selector in result_selectors:
                    try:
                        elements = await page.query_selector_all(selector)
                        logger.info(f"   Selector '{selector}': {len(elements)} elements")
                        
                        for element in elements[:10]:
                            try:
                                # Get URL
                                href = None
                                if 'href' in selector:
                                    href = await element.get_attribute('href')
                                else:
                                    link = await element.query_selector('a[href*="/maps/place/"]')
                                    if link:
                                        href = await link.get_attribute('href')
                                
                                if href and '/maps/place/' in href:
                                    # Get name
                                    name = None
                                    try:
                                        name_elem = await element.query_selector('.DUwDvf, .qBF1Pd, .fontHeadlineSmall, h3')
                                        if name_elem:
                                            name = await name_elem.text_content()
                                    except:
                                        pass
                                    
                                    if not name:
                                        name = extract_name_from_url(href)
                                    
                                    if name and name.strip():
                                        # Filter for bars/clubs
                                        name_lower = name.lower()
                                        bar_keywords = ['bar', 'pub', 'kneipe', 'cocktail', 'club', 'lounge', 'brewery', 'biergarten']
                                        exclude_keywords = ['hotel', 'restaurant', 'shop', 'store']
                                        
                                        has_bar = any(k in name_lower for k in bar_keywords)
                                        has_exclude = any(k in name_lower for k in exclude_keywords)
                                        
                                        if has_bar and not has_exclude:
                                            location = {
                                                'name': name.strip(),
                                                'url': href
                                            }
                                            
                                            # Avoid duplicates
                                            if not any(loc['url'] == href for loc in locations):
                                                locations.append(location)
                                                found_any = True
                                                logger.info(f"   ✅ Found: {name.strip()}")
                                        
                            except Exception as e:
                                logger.debug(f"   Error processing element: {e}")
                                continue
                                
                    except Exception as e:
                        logger.debug(f"   Selector {selector} failed: {e}")
                        continue
                
                if found_any:
                    logger.info(f"✅ Strategy '{strategy}' found {len([l for l in locations])} locations total")
                
                # If we found some results, don't try more strategies
                if len(locations) >= 3:
                    break
                    
                # Random delay before next strategy
                await page.wait_for_timeout(random.randint(2000, 4000))
            
            logger.info(f"✅ Total locations found: {len(locations)}")
            return locations
            
        except Exception as e:
            logger.error(f"❌ Enhanced location finder error: {e}")
            return []
        finally:
            await browser.close()

async def find_locations_near_address(address):
    """
    Vereinfachte Version des Location-Finders für die Integration in die API
    Sucht im Umkreis von 8km nach Bars, Clubs und Kneipen
    """
    locations = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions']
        )
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            locale='de-DE'
        )
        page = await context.new_page()
        
        # Performance: Blockiere unnötige Ressourcen - DEAKTIVIERT für bessere Ergebnisse
        # await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
        # await page.route("**/ads/**", lambda route: route.abort())
        
        try:
            # Erste Suchanfrage - am spezifischsten
            search_query = f"bars clubs kneipen cocktailbar biergarten near {address}"
            maps_url = f"https://www.google.com/maps/search/{urllib.parse.quote(search_query)}?authuser=0&hl=de&entry=ttu"
            
            logger.info(f"🔍 Suche nach Locations in der Nähe von: {address}")
            logger.info(f"🌐 URL: {maps_url}")
            
            await page.goto(maps_url, wait_until='domcontentloaded', timeout=30000)
            
            # Cookie-Banner behandeln
            await page.wait_for_timeout(2000)
            cookie_strategies = [
                'button:has-text("Accept")',
                'button:has-text("Alle akzeptieren")',
                '[aria-label*="Accept"]'
            ]
            
            for strategy in cookie_strategies:
                try:
                    buttons = await page.query_selector_all(strategy)
                    for button in buttons[:2]:
                        if await button.is_visible():
                            await button.click()
                            await page.wait_for_timeout(2000)
                            break
                except:
                    continue
            
            # Warte auf Suchergebnisse
            await page.wait_for_timeout(8000)  # Längere Wartezeit
            
            # Debug-Screenshot für Problemanalyse
            await page.screenshot(path='/tmp/location_search_debug.png', full_page=True)
            logger.info("📸 Debug-Screenshot erstellt: /tmp/location_search_debug.png")
            
            # Warte explizit auf Ergebnisse-Container
            try:
                await page.wait_for_selector('[role="main"]', timeout=15000)
                logger.info("✅ Main container gefunden")
            except:
                logger.warning("⚠️ Konnte main container nicht finden")
                # Versuche alternative Selektoren
                try:
                    await page.wait_for_selector('.m6QErb', timeout=5000)
                    logger.info("✅ Alternative container gefunden")
                except:
                    logger.warning("⚠️ Auch keine alternativen Container gefunden")
            
            # Scroll um mehr Ergebnisse zu laden
            logger.info("📜 Starte Scrolling für mehr Ergebnisse...")
            for i in range(5):  # Mehr Scrolls für mehr Ergebnisse
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                await page.wait_for_timeout(3000)  # Längere Pause zwischen Scrolls
                logger.info(f"   Scroll {i+1}/5 abgeschlossen")
            
            # Erweiterte Selektoren für bessere Ergebnisse
            result_selectors = [
                'a[href*="/maps/place/"]',
                '[data-result-index] a',
                '.hfpxzc',
                '.Nv2PK a',
                '[jsaction*="pane.resultSection"] a',
                'div[role="article"] a',
                'a[data-value="Website"]'
            ]
            
            found_links = set()
            for selector in result_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    logger.info(f"Gefunden mit Selector '{selector}': {len(elements)} Elemente")
                    for element in elements[:25]:  # Erhöhe Limit auf 25 Ergebnisse
                        try:
                            href = await element.get_attribute('href')
                            if href and '/maps/place/' in href and href not in found_links:
                                # Name extrahieren
                                name = None
                                try:
                                    name_element = await element.query_selector('.DUwDvf, .qBF1Pd, .fontHeadlineSmall, h3')
                                    if name_element:
                                        name = await name_element.text_content()
                                except:
                                    pass
                                
                                if not name:
                                    name = extract_name_from_url(href)
                                
                                if name and name.strip():
                                    # Erweiterte Bar/Club-Filterung für bessere Ergebnisse
                                    name_lower = name.lower()
                                    bar_keywords = [
                                        'bar', 'pub', 'kneipe', 'cocktail', 'club', 'lounge', 'tavern', 'biergarten',
                                        'brewery', 'brauerei', 'drinks', 'beer', 'bier', 'wine', 'wein',
                                        'whisky', 'gin', 'rum', 'vodka', 'spirits', 'nightclub', 'nachtclub',
                                        'disco', 'diskothek', 'dance', 'music', 'jazz', 'piano bar'
                                    ]
                                    exclude_keywords = ['hotel', 'restaurant', 'pizza', 'döner', 'imbiss', 'shop', 'store']
                                    
                                    has_bar_keyword = any(keyword in name_lower for keyword in bar_keywords)
                                    has_exclude_keyword = any(keyword in name_lower for keyword in exclude_keywords)
                                    
                                    if has_bar_keyword and not has_exclude_keyword:
                                        locations.append({
                                            'name': name.strip(),
                                            'url': href
                                        })
                                        found_links.add(href)
                                        logger.info(f"📍 Location gefunden: {name.strip()}")
                        except:
                            continue
                except:
                    continue
            
            logger.info(f"✅ {len(locations)} Locations gefunden")
            return locations
            
        except Exception as e:
            logger.error(f"❌ Fehler bei der Location-Suche: {e}")
            return []
        finally:
            await browser.close()

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

            # Occupancy data search - Enhanced for historical + current time
            current_hour = datetime.now().hour
            
            if not live_data:
                # Priority 1: Live/Current occupancy selectors
                live_selectors = [
                    '[aria-label*="Derzeit"]',
                    '[aria-label*="derzeit"]',
                    '[aria-label*="Live"]',
                    '[aria-label*="live"]'
                ]
                
                for selector in live_selectors:
                    try:
                        elements = await page.query_selector_all(selector)
                        for element in elements[:5]:
                            aria_label = await element.get_attribute('aria-label')
                            if aria_label:
                                # Skip historical time patterns that contain "Um X Uhr"
                                if re.search(r'Um\s+\d+\s+Uhr', aria_label, re.IGNORECASE):
                                    continue
                                    
                                live_data = aria_label.replace('&nbsp;', ' ')
                                if 'derzeit' in aria_label.lower() or 'live' in aria_label.lower():
                                    is_live_data = True
                                else:
                                    is_live_data = False
                                logger.info(f"✅ Live occupancy found: {live_data}")
                                break
                        if live_data:
                            break
                    except:
                        continue

            # Priority 2: Historical data for current hour
            if not live_data:
                try:
                    # Look for popular times chart and find current hour
                    chart_elements = await page.query_selector_all('[data-value*="Stoßzeit"], [aria-label*="Stoßzeit"], [aria-label*="beliebte"], [aria-label*="Beliebte"]')
                    
                    for element in chart_elements:
                        try:
                            # Try to find clickable hour elements or bars
                            parent = element
                            # Look for hour indicators or bars
                            hour_elements = await parent.query_selector_all(f'[aria-label*="{current_hour} Uhr"], [aria-label*="{current_hour:02d}:"], [data-hour="{current_hour}"]')
                            
                            if not hour_elements:
                                # Try broader search for time patterns
                                all_time_elements = await parent.query_selector_all('[aria-label*="Uhr"], [aria-label*=":"]')
                                for time_elem in all_time_elements:
                                    time_label = await time_elem.get_attribute('aria-label')
                                    if time_label and (f"{current_hour} Uhr" in time_label or f"{current_hour:02d}:" in time_label):
                                        hour_elements = [time_elem]
                                        break
                            
                            for hour_elem in hour_elements[:1]:  # Only check first match
                                try:
                                    await hour_elem.click()
                                    await page.wait_for_timeout(2000)  # Wait for data to load
                                    
                                    # Look for occupancy info after click
                                    updated_content = await page.content()
                                    occupancy_match = re.search(r'(\d+)\s*%\s*ausgelastet', updated_content, re.IGNORECASE)
                                    if occupancy_match:
                                        live_data = f"{occupancy_match.group(1)}% ausgelastet (historisch um {current_hour} Uhr)"
                                        is_live_data = False
                                        logger.info(f"📊 Historical data for current hour found: {live_data}")
                                        break
                                except:
                                    continue
                                    
                            if live_data:
                                break
                        except:
                            continue
                            
                        if live_data:
                            break
                except Exception as e:
                    logger.warning(f"Historical data search failed: {e}")

            # Priority 3: Regex fallback patterns
            if not live_data:
                # First, try to find data specifically for current hour
                current_hour_pattern = rf'Um\s+{current_hour}\s+Uhr\s+zu\s+(\d+)\s*%\s*ausgelastet'
                current_hour_match = re.search(current_hour_pattern, page_content, re.IGNORECASE)
                
                if current_hour_match:
                    live_data = current_hour_match.group(0)
                    is_live_data = False
                    logger.info(f"📊 Current hour data found: {live_data}")
                else:
                    # Fallback patterns in priority order
                    patterns = [
                        (rf'{current_hour}\s*Uhr[^<]*?(\d+)\s*%', 'current_hour_alt'),
                        (r'(\d+)\s*%.*?derzeit.*?ausgelastet', 'live_generic'),
                        (r'(\d+)\s*%[^<]*ausgelastet', 'generic_busy'),
                        (r'(\d+)\s*%.*?beliebte.*?Zeit', 'popular_time'),
                        (r'Stoßzeit.*?(\d+)\s*%', 'rush_hour'),
                        (r'Um\s+\d+\s+Uhr\s+zu\s+(\d+)\s*%\s*ausgelastet', 'any_hour')  # Last resort
                    ]
                    
                    for pattern, pattern_type in patterns:
                        matches = re.findall(pattern, page_content, re.IGNORECASE)
                        if matches:
                            if pattern_type == 'current_hour_alt':
                                live_data = f"{matches[0]}% ausgelastet (um {current_hour} Uhr)"
                                is_live_data = False
                            elif pattern_type == 'live_generic':
                                live_data = f"{matches[0]}% derzeit ausgelastet"
                                is_live_data = True
                            elif pattern_type == 'any_hour':
                                # Get the full match to show the actual hour
                                full_match = re.search(r'Um\s+(\d+)\s+Uhr\s+zu\s+(\d+)\s*%\s*ausgelastet', page_content, re.IGNORECASE)
                                if full_match:
                                    hour = full_match.group(1)
                                    percentage = full_match.group(2)
                                    # Only use if no current hour data available
                                    if int(hour) == current_hour:
                                        live_data = f"Um {hour} Uhr zu {percentage}% ausgelastet"
                                        is_live_data = False
                                    else:
                                        # Skip non-current hour data in fallback
                                        continue
                                else:
                                    continue
                            else:
                                live_data = f"{matches[0]}% ausgelastet"
                                is_live_data = False
                            
                            logger.info(f"📊 Pattern match ({pattern_type}): {live_data}")
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

@app.route('/find-locations', methods=['POST'])
def find_locations():
    """Endpoint to find locations near an address"""
    try:
        data = request.get_json()
        
        if not data or 'address' not in data:
            return jsonify({'error': 'Address is required'}), 400
        
        address = data['address']
        
        if not isinstance(address, str) or not address.strip():
            return jsonify({'error': 'Valid address string is required'}), 400
        
        logger.info(f"Finding locations near: {address}")
        
        # Use the real Google Maps location finder
        logger.info("Using real Google Maps location finder")
        
        # Run the async location finder with enhanced settings
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            locations = loop.run_until_complete(find_locations_near_address_enhanced(address.strip()))
            urls = [location['url'] for location in locations]
            
            logger.info(f"Found {len(locations)} real locations from Google Maps")
            
            return jsonify({
                'success': True,
                'address': address,
                'count': len(locations),
                'locations': locations,
                'urls': urls,
                'timestamp': datetime.now().isoformat()
            })
            
        finally:
            loop.close()
        
        # Original attempt - keep for future debugging (disabled)
        # try:
        #     loop = asyncio.new_event_loop()
        #     asyncio.set_event_loop(loop)
        #     locations = loop.run_until_complete(find_locations_near_address(address.strip()))
        #     urls = [location['url'] for location in locations]
        #     return jsonify({...})
        # finally:
        #     loop.close()
        
    except Exception as e:
        logger.error(f"Location finder error: {e}")
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
            '/find-locations': 'POST - Find locations near address',
            '/health': 'GET - Health check'
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Popular Times Scraper Server (Final Enhanced Edition) on port 5044...")
    logger.info("📡 Features: Multi-retry, Random delays, Adaptive timeouts, URL fallbacks")
    logger.info("📡 API Endpoints:")
    logger.info("   POST /scrape - Scrape Google Maps locations")
    logger.info("   POST /find-locations - Find locations near address")
    logger.info("   GET /health - Health check")
    logger.info("   GET / - Service info")
    logger.info("=" * 50)
    
    app.run(
        host='0.0.0.0',
        port=5044,
        debug=False,
        threaded=True
    )