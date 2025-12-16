#!/usr/bin/env python3

import asyncio
import gc
import json
import logging
import os
import random
import re
import sys
import time
import urllib.parse
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv
import jwt
import bcrypt
from functools import wraps

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Geolocation cache to avoid repeated API calls
geolocation_cache = {}

def get_geolocation(ip):
    """Get geolocation info for IP address using ipapi.co"""
    # Skip private/local IPs
    if ip in ['unknown', '127.0.0.1', 'localhost'] or ip.startswith('192.168.') or ip.startswith('10.'):
        return 'Local', 'Local'
    
    # Check cache first
    if ip in geolocation_cache:
        return geolocation_cache[ip]
    
    try:
        # Use ipapi.co free API (30k requests/month)
        response = requests.get(f"https://ipapi.co/{ip}/json/", timeout=2)
        if response.status_code == 200:
            data = response.json()
            country = data.get('country_name', 'unknown')
            city = data.get('city', 'unknown')
            
            # Cache the result
            geolocation_cache[ip] = (country, city)
            return country, city
        else:
            logger.warning(f"Geolocation API failed for {ip}: {response.status_code}")
            return 'unknown', 'unknown'
            
    except Exception as e:
        logger.warning(f"Geolocation lookup failed for {ip}: {e}")
        return 'unknown', 'unknown'

# Access logging function
def log_access(endpoint):
    """Log access to endpoints with timestamp, IP, and geolocation info"""
    try:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        user_agent = request.headers.get('User-Agent', 'unknown')
        
        # Clean up IP (remove port if present)
        if ',' in client_ip:
            client_ip = client_ip.split(',')[0].strip()
        if ':' in client_ip and not client_ip.startswith('['):  # IPv4 with port
            client_ip = client_ip.split(':')[0]
        
        # Try to get geolocation info from headers first (Cloudflare)
        country = request.headers.get('CF-IPCountry', None)
        city = request.headers.get('CF-IPCity', None)
        
        # If not available from headers, use IP geolocation API
        if not country or country == 'unknown':
            country, city = get_geolocation(client_ip)
        
        log_entry = f"{timestamp} | {client_ip} | {country} | {city} | {endpoint} | {user_agent}\n"
        
        # Write to access log file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        log_file = os.path.join(script_dir, 'access.log')
        
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(log_entry)
            
        logger.info(f"📊 Access: {client_ip} ({country}, {city}) -> {endpoint}")
        
    except Exception as e:
        logger.error(f"Error logging access: {e}")

# Integrated scraping function
import asyncio
from playwright.async_api import async_playwright
import re
from datetime import datetime
import subprocess
import tempfile
import time


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


def extract_occupancy_numbers(live_occupancy_text):
    """
    Extrahiert aktuelle und normale Auslastungswerte aus dem Text
    """
    if not live_occupancy_text:
        return None, None

    # Pattern für "Derzeit zu X % ausgelastet; normal sind Y %."
    current_match = re.search(r'derzeit\s+zu\s+(\d+)\s*%\s*ausgelastet', live_occupancy_text,
                              re.IGNORECASE)
    normal_match = re.search(r'normal\s+sind\s+(\d+)\s*%', live_occupancy_text, re.IGNORECASE)

    current_percent = int(current_match.group(1)) if current_match else None
    normal_percent = int(normal_match.group(1)) if normal_match else None

    # Fallback: Einzelner Prozent-Wert
    if current_percent is None:
        single_match = re.search(r'(\d+)\s*%\s*ausgelastet', live_occupancy_text, re.IGNORECASE)
        if single_match:
            current_percent = int(single_match.group(1))

    return current_percent, normal_percent


def get_occupancy_color(current_percent, normal_percent):
    """
    Bestimmt die Farbe basierend auf der Auslastung
    """
    if current_percent is None:
        return "gray", "Keine Daten"

    if normal_percent is None:
        # Keine normale Auslastung verfügbar - einfache Klassifizierung
        if current_percent > 70:
            return "orange", "Hoch"
        elif current_percent > 30:
            return "yellow", "Mittel"
        else:
            return "lightblue", "Niedrig"

    # Vergleich mit normalem Wert
    difference = current_percent - normal_percent

    if difference > 5:
        return "green", f"+{difference}% über normal"
    elif difference < -5:
        return "red", f"{difference}% unter normal"
    else:
        return "yellow", f"±{abs(difference)}% normal"


def validate_occupancy_text(text):
    """
    Validiert ob ein Text Auslastungsdaten enthält
    """
    if not text or len(text.strip()) < 5:
        return False

    # Prüfe auf relevante Keywords
    keywords = ['ausgelastet', 'derzeit', 'um ', '%', 'live', 'occupancy']
    return any(keyword in text.lower() for keyword in keywords)


def clean_occupancy_text(text):
    """
    Bereinigt Auslastungstext von HTML-Entities und Formatierung
    """
    if not text:
        return text

    # HTML-Entities entfernen
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&')

    # Mehrfache Leerzeichen normalisieren
    text = re.sub(r'\s+', ' ', text.strip())

    return text


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
                        cookie_button = await page.query_selector(
                            'button:has-text("Accept"), button:has-text("Alle akzeptieren"), [aria-label*="Accept"]')
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
                                        name_elem = await element.query_selector(
                                            '.DUwDvf, .qBF1Pd, .fontHeadlineSmall, h3')
                                        if name_elem:
                                            name = await name_elem.text_content()
                                    except:
                                        pass

                                    if not name:
                                        name = extract_name_from_url(href)

                                    if name and name.strip():
                                        # Filter for bars/clubs
                                        name_lower = name.lower()
                                        bar_keywords = ['bar', 'pub', 'kneipe', 'cocktail', 'club',
                                                        'lounge', 'brewery', 'biergarten']
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
                    logger.info(
                        f"✅ Strategy '{strategy}' found {len([l for l in locations])} locations total")

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
            args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
                  '--disable-extensions']
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
                logger.info(f"   Scroll {i + 1}/5 abgeschlossen")

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
                                    name_element = await element.query_selector(
                                        '.DUwDvf, .qBF1Pd, .fontHeadlineSmall, h3')
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
                                        'bar', 'pub', 'kneipe', 'cocktail', 'club', 'lounge',
                                        'tavern', 'biergarten',
                                        'brewery', 'brauerei', 'drinks', 'beer', 'bier', 'wine',
                                        'wein',
                                        'whisky', 'gin', 'rum', 'vodka', 'spirits', 'nightclub',
                                        'nachtclub',
                                        'disco', 'diskothek', 'dance', 'music', 'jazz', 'piano bar'
                                    ]
                                    exclude_keywords = ['hotel', 'restaurant', 'pizza', 'döner',
                                                        'imbiss', 'shop', 'store']

                                    has_bar_keyword = any(
                                        keyword in name_lower for keyword in bar_keywords)
                                    has_exclude_keyword = any(
                                        keyword in name_lower for keyword in exclude_keywords)

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
            result = await scrape_live_occupancy_single(url, attempt, None)

            # If we got at least a name or occupancy data, return it
            if result.get('location_name') or result.get('live_occupancy'):
                logger.info(
                    f"✅ Success on attempt {attempt + 1} for {result.get('location_name', 'URL')}")
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


async def extract_historical_occupancy(page):
    """
    Extrahiert historische Auslastungsdaten mit verbesserter Logik
    """
    try:
        historical_elements = await page.query_selector_all(
            '[aria-label*="Um "], [aria-label*="um "]')

        for element in historical_elements[:5]:
            try:
                aria_label = await element.get_attribute('aria-label')
                if aria_label and 'ausgelastet' in aria_label.lower():
                    # Extrahiere Prozentangabe
                    percent_match = re.search(r'(\d+)\s*%\s*ausgelastet', aria_label, re.IGNORECASE)
                    if percent_match:
                        current_time = datetime.now().strftime('%H:%M')
                        percentage = percent_match.group(1)

                        # Validiere Prozentangabe
                        if 0 <= int(percentage) <= 100:
                            occupancy_text = f"Um {current_time} Uhr zu {percentage} % ausgelastet"
                            return occupancy_text, False
            except:
                continue
    except:
        pass

    return None


async def extract_chart_occupancy(page):
    """
    Verbesserte Chart-Daten Extraktion mit robusteren Selektoren
    """
    try:
        logger.info("🔍 Suche aktuelle Auslastung im Diagramm...")

        # Mehrere Strategien für Chart-Elemente
        chart_selectors = [
            '[aria-label*="Uhr"]',
            '[role="img"][aria-label*="Stunde"]',
            '[data-value*="Uhr"]',
            'svg [aria-label*="Uhr"]'
        ]

        current_hour = datetime.now().hour
        hour_patterns = [
            f"{current_hour:02d} Uhr",
            f"{current_hour} Uhr",
            f"{current_hour:02d}:00"
        ]

        for selector in chart_selectors:
            try:
                elements = await page.query_selector_all(selector)

                for element in elements[:10]:  # Limitiere Suche
                    try:
                        aria_label = await element.get_attribute('aria-label')
                        if not aria_label:
                            continue

                        # Prüfe verschiedene Stunden-Patterns
                        for hour_pattern in hour_patterns:
                            if hour_pattern in aria_label:
                                percent_match = re.search(r'(\d+)\s*%', aria_label)
                                if percent_match:
                                    percentage = percent_match.group(1)
                                    if 0 <= int(percentage) <= 100:
                                        current_time = datetime.now().strftime('%H:%M')
                                        occupancy_text = f"Um {current_time} Uhr zu {percentage} % ausgelastet"
                                        return occupancy_text, False
                    except:
                        continue
            except:
                continue
    except:
        pass

    return None


def extract_occupancy_with_regex(page_content, is_live_data):
    """
    Optimierte Regex-basierte Extraktion von Auslastungsdaten
    """
    if not page_content:
        return None

    try:
        # Live-Status Pattern (wenn Live-Indikator gefunden)
        if is_live_data:
            live_patterns = [
                r'>Live</[^>]*>\s*<[^>]*>([^<]+)',
                r'Live[^>]*>([^<]*\d+\s*%[^<]*)',
                r'derzeit[^>]*>([^<]*\d+\s*%[^<]*)'
            ]

            for pattern in live_patterns:
                match = re.search(pattern, page_content, re.IGNORECASE)
                if match:
                    status = match.group(1).strip()
                    if status and len(status) > 3:
                        return f"Live: {status}"

        # Allgemeine Prozent-Pattern
        percent_patterns = [
            r'derzeit\s+zu\s+(\d+)\s*%\s*ausgelastet[^>]*normal\s+sind\s+(\d+)\s*%',
            r'(\d+)\s*%[^<]*ausgelastet',
            r'ausgelastet[^>]*(\d+)\s*%'
        ]

        for pattern in percent_patterns:
            match = re.search(pattern, page_content, re.IGNORECASE)
            if match:
                if len(match.groups()) >= 2:  # Derzeit + Normal
                    current_pct = int(match.group(1))
                    normal_pct = int(match.group(2))
                    if 0 <= current_pct <= 100 and 0 <= normal_pct <= 100:
                        return f"Derzeit zu {current_pct} % ausgelastet; normal sind {normal_pct} %."
                else:  # Nur Prozentangabe
                    percentage = int(match.group(1))
                    if 0 <= percentage <= 100:
                        current_time = datetime.now().strftime('%H:%M')
                        return f"Um {current_time} Uhr zu {percentage} % ausgelastet"
    except:
        pass

    return None


async def fallback_occupancy_search(page):
    """
    Robuster Fallback für Auslastungssuche
    """
    try:
        # Erweiterte Selektoren für Fallback
        fallback_selectors = [
            '[aria-label*="ausgelastet"]',
            '[aria-label*="occupancy"]',
            '[aria-label*="busy"]',
            '[title*="ausgelastet"]',
            '[data-value*="ausgelastet"]'
        ]

        for selector in fallback_selectors:
            try:
                elements = await page.query_selector_all(selector)

                for element in elements[:3]:
                    try:
                        # Verschiedene Attribute prüfen
                        for attr in ['aria-label', 'title', 'data-value']:
                            text = await element.get_attribute(attr)
                            if text and validate_occupancy_text(text):
                                # Historische Zeit durch aktuelle ersetzen
                                if 'um ' in text.lower() and 'derzeit' not in text.lower():
                                    percent_match = re.search(r'(\d+)\s*%\s*ausgelastet', text,
                                                              re.IGNORECASE)
                                    if percent_match:
                                        percentage = int(percent_match.group(1))
                                        if 0 <= percentage <= 100:
                                            current_time = datetime.now().strftime('%H:%M')
                                            return f"Um {current_time} Uhr zu {percentage} % ausgelastet"
                                else:
                                    return clean_occupancy_text(text)
                    except:
                        continue
            except:
                continue
    except:
        pass

    return None


async def extract_location_data_parallel(page):
    """
    Parallele Extraktion von Location-Daten mit optimierten Selektoren
    """
    result = {'name': None, 'address': None, 'rating': None}

    try:
        # Optimierte Selektoren
        selectors = {
            'name': [
                'h1[data-attrid="title"]',
                'h1.DUwDvf',
                'h1[role="heading"]',
                '[data-value="Ort"]',
                'h1.x3AX1-LfntMc-header-title-title'
            ],
            'address': [
                '[data-item-id="address"]',
                '[data-value="Adresse"]',
                '[aria-label*="Adresse"]',
                '.rogA2c .Io6YTe'
            ],
            'rating': [
                '[data-value="Bewertungen"]',
                '[aria-label*="Sterne"]',
                '.F7nice span[aria-hidden="true"]',
                '[jsaction*="rating"]'
            ]
        }

        # Alle Selektoren parallel ausführen
        tasks = []
        selector_mapping = []

        for data_type, type_selectors in selectors.items():
            for selector in type_selectors:
                tasks.append(page.query_selector(selector))
                selector_mapping.append((data_type, selector))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Ergebnisse verarbeiten
        for i, (data_type, selector) in enumerate(selector_mapping):
            if i < len(results) and results[i] and not isinstance(results[i], Exception):
                try:
                    element = results[i]

                    if data_type == 'name' and not result['name']:
                        text = await element.text_content()
                        if text and text.strip():
                            result['name'] = text.strip()

                    elif data_type == 'address' and not result['address']:
                        text = await element.text_content()
                        if text and text.strip():
                            result['address'] = text.strip()

                    elif data_type == 'rating' and not result['rating']:
                        # Verschiedene Strategien für Rating
                        rating_text = await element.get_attribute('aria-label')
                        if not rating_text:
                            rating_text = await element.text_content()

                        if rating_text:
                            rating_match = re.search(r'(\d+[,.\d]+)', rating_text)
                            if rating_match:
                                result['rating'] = rating_match.group(1)
                except:
                    continue
    except:
        pass

    return result


async def create_browser_context():
    """
    Erstellt optimierten Browser-Context wie in gmaps-scraper-fast-robust.py für maximale Performance
    """
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(
        headless=True,
        args=[
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-web-security',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ]
    )

    context = await browser.new_context(
        viewport={'width': 1280, 'height': 720},
        user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    return playwright, browser, context


async def setup_page_with_blocking(context):
    """
    Erstellt optimierte Page mit aggressivem Resource-Blocking wie in gmaps-scraper-fast-robust.py
    """
    page = await context.new_page()

    # Aggressive Resource-Blockierung für maximale Performance (wie standalone script)
    blocked_resources = [
        "**/*.{png,jpg,jpeg,gif,svg,webp,ico}",  # Bilder
        "**/*.{css,scss,sass,less}",  # Stylesheets
        "**/*.{woff,woff2,ttf,otf,eot}",  # Fonts
        "**/ads/**",  # Ads
        "**/analytics/**",  # Analytics
        "**/gtm/**",  # Google Tag Manager
        "**/doubleclick/**",  # DoubleClick
        "**/googletagmanager/**",  # GTM
        "**/facebook.com/**",  # Facebook
        "**/twitter.com/**",  # Twitter
        "**/*.js"  # JavaScript (aggressive wie standalone für maximale Performance)
    ]

    for resource_pattern in blocked_resources:
        await page.route(resource_pattern, lambda route: route.abort())

    return page


async def scrape_live_occupancy_with_page(page, url, location_name_from_csv=None, semaphore=None):
    """
    Scrapt Live-Auslastungsdaten von Google Maps mit wiederverwendbarer Page
    """
    start_time = time.time()
    retries = 0
    max_retries = 3

    # Semaphore für Rate Limiting
    if semaphore:
        async with semaphore:
            return await _scrape_with_retry_page(page, url, location_name_from_csv, start_time,
                                                 max_retries)
    else:
        return await _scrape_with_retry_page(page, url, location_name_from_csv, start_time,
                                             max_retries)


async def _scrape_with_retry_page(page, url, location_name_from_csv, start_time, max_retries):
    """
    Interner Scraping-Prozess mit Retry-Logik für wiederverwendbare Page
    """
    retries = 0
    last_error = None

    while retries <= max_retries:
        try:
            return await _perform_scraping_with_page(page, url, location_name_from_csv, start_time,
                                                     retries)
        except Exception as e:
            last_error = e
            retries += 1
            if retries <= max_retries:
                # Intelligentere Retry-Mechanik mit zufälligen Wartezeiten (wie gmaps-scraper-fast-robust.py)
                wait_time = random.uniform(3, 8) + (retries * random.uniform(1, 3))  # Escalating random waits
                logger.info(f"⚠️  Retry {retries}/{max_retries} nach {wait_time:.1f}s für {url}")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"❌ Alle Retries fehlgeschlagen für {url}: {last_error}")

    # Alle Retries fehlgeschlagen - versuche URL-Fallback-Extraktion
    processing_time = time.time() - start_time
    fallback_name = extract_name_from_url(url) if location_name_from_csv is None else location_name_from_csv
    
    return {
        'location_name': fallback_name,
        'address': None,
        'rating': None,
        'live_occupancy': None,
        'is_live_data': False,
        'url': url,
        'timestamp': datetime.now().isoformat(),
        'error': str(last_error),
        'statistics': {
            'processing_time_seconds': round(processing_time, 2),
            'retries_needed': retries,
            'success': False
        }
    }


async def _perform_scraping_with_page(page, url, location_name_from_csv, start_time, retries):
    """
    Führt das eigentliche Scraping mit wiederverwendbarer Page durch
    """
    logger.info(f"📍 Lade Google Maps: {url}")
    await page.goto(url, wait_until='domcontentloaded', timeout=15000)  # Reduziert für VPS

    logger.info("🍪 Prüfe Cookie-Banner...")
    # Optimierte Cookie-Behandlung mit zufälligem Human-like Timing
    try:
        await page.wait_for_timeout(800)  # Wie standalone script
        # Robustere Cookie-Selektoren
        cookie_selectors = [
            'button:has-text("Accept")',
            'button:has-text("Alle akzeptieren")',
            'button:has-text("Akzeptieren")',
            '[aria-label*="Accept"]',
            '[aria-label*="akzeptieren"]',
            '[data-value="Alle akzeptieren"]'
        ]

        for selector in cookie_selectors:
            try:
                button = await page.wait_for_selector(selector, timeout=1000)
                if button and await button.is_visible():
                    await button.click()
                    logger.info("✅ Cookie-Banner akzeptiert")
                    await page.wait_for_timeout(1500)  # Wie standalone script
                    break
            except:
                continue
    except:
        pass

    logger.info("⏳ Warte auf Maps-Inhalte...")
    # VPS-optimiertes Warten auf Content 
    try:
        await page.wait_for_selector(
            '[data-value="Bewertungen"], h1[data-attrid="title"], h1.DUwDvf', timeout=8000)  # Wie standalone script
    except:
        await page.wait_for_timeout(3000)  # Wie standalone script

    logger.info("🔍 Suche Live-Auslastung...")
    live_data = None
    is_live_data = False

    # Performance: Hole Content nur einmal
    page_content = await page.content()

    # 1. Optimierte Live-Indikator Suche
    if any(pattern in page_content for pattern in ['>Live<', 'aria-label="Live"', 'Live-Daten']):
        is_live_data = True
        logger.info("✅ Live-Indikator gefunden")

    # 2. Optimierte Aria-label Suche mit besseren Selektoren
    if not live_data:
        # Parallele Suche nach verschiedenen Patterns
        aria_selectors = [
            '[aria-label*="Derzeit"]',
            '[aria-label*="derzeit"]',
            '[aria-label*="Currently"]',
            '[aria-label*="Live"]'
        ]

        tasks = [page.query_selector_all(selector) for selector in aria_selectors]
        all_elements_lists = await asyncio.gather(*tasks, return_exceptions=True)

        # Flatten und validiere Elemente
        for elements_list in all_elements_lists:
            if isinstance(elements_list, list):
                for element in elements_list[:3]:  # Limitiere pro Selektor
                    try:
                        aria_label = await element.get_attribute('aria-label')
                        if aria_label and validate_occupancy_text(aria_label):
                            live_data = clean_occupancy_text(aria_label)
                            is_live_data = 'derzeit' in aria_label.lower()
                            logger.info(f"✅ Live-Daten gefunden: {live_data}")
                            break
                    except:
                        pass
            if live_data:
                break

    # Suche nach historischen Daten mit verbesserter Logik
    if not live_data:
        historical_data = await extract_historical_occupancy(page)
        if historical_data:
            live_data, is_live_data = historical_data
            logger.info(f"📄 Historische Daten verarbeitet: {live_data}")

    # 3. Verbesserte Chart-Daten Extraktion
    if not live_data:
        chart_data = await extract_chart_occupancy(page)
        if chart_data:
            live_data, is_live_data = chart_data
            logger.info(f"📄 Chart-Daten extrahiert: {live_data}")

    # 4. Optimierte Regex-basierte Suche
    if not live_data:
        live_data = extract_occupancy_with_regex(page_content, is_live_data)
        if live_data:
            logger.info(f"✅ Regex-Extraktion: {live_data}")

    # 5. Robuster Fallback
    if not live_data:
        logger.info("🔄 Fallback-Suche...")
        live_data = await fallback_occupancy_search(page)
        if live_data:
            logger.info(f"📄 Fallback erfolgreich: {live_data}")

    logger.info("📍 Extrahiere Location-Daten...")
    location_data = await extract_location_data_parallel(page)
    location_name = location_data.get('name') or location_name_from_csv
    address = location_data.get('address')
    rating = location_data.get('rating')

    if location_name:
        logger.info(f"📍 Location gefunden: {location_name}")

    processing_time = time.time() - start_time
    logger.info(
        f"✅ Scraping abgeschlossen für: {location_name or location_name_from_csv or 'Unbekannte Location'} ({processing_time:.2f}s)")

    result = {
        'location_name': location_name,
        'address': address,
        'rating': rating,
        'live_occupancy': live_data,
        'is_live_data': is_live_data,
        'url': url,
        'timestamp': datetime.now().isoformat(),
        'statistics': {
            'processing_time_seconds': round(processing_time, 2),
            'retries_needed': retries,
            'success': True
        }
    }

    return result


async def process_batch_concurrent(locations_batch, context, semaphore, batch_id):
    """
    Verarbeitet einen Batch von Locations concurrent wie in gmaps-scraper-fast-robust.py für maximale Performance
    """
    logger.info(f"🔄 Batch {batch_id}: Starte {len(locations_batch)} Locations...")

    # Erstelle Pages für den Batch (Page-Wiederverwendung wie im standalone script)
    pages = []
    for _ in range(len(locations_batch)):
        page = await setup_page_with_blocking(context)
        pages.append(page)

    try:
        # Concurrent processing mit semaphore (wie standalone)
        tasks = [
            scrape_live_occupancy_with_page(
                pages[i],
                location['url'],
                location.get('name'),
                semaphore
            )
            for i, location in enumerate(locations_batch)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Exception handling
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"❌ Batch {batch_id}, Location {i}: {result}")
                processed_results.append({
                    'location_name': locations_batch[i].get('name'),
                    'error': str(result),
                    'statistics': {'success': False, 'processing_time_seconds': 0,
                                   'retries_needed': 0},
                    'url': locations_batch[i]['url'],
                    'timestamp': datetime.now().isoformat(),
                    'live_occupancy': None,
                    'is_live_data': False,
                    'address': None,
                    'rating': None
                })
            else:
                processed_results.append(result)

        logger.info(
            f"✅ Batch {batch_id} abgeschlossen: {len([r for r in processed_results if r.get('statistics', {}).get('success', False)])}/{len(locations_batch)} erfolgreich")
        return processed_results

    finally:
        # Cleanup pages
        for page in pages:
            try:
                await page.close()
            except:
                pass


async def scrape_single_location_stable(page, url, location_name_from_csv=None):
    """
    Stabilisierte Einzellocation-Scraping-Funktion für VPS
    """
    start_time = time.time()
    max_retries = 2  # Reduziert für VPS
    
    for attempt in range(max_retries + 1):
        try:
            result = await _perform_scraping_with_page(page, url, location_name_from_csv, start_time, attempt)
            # Erfolg wenn mindestens Name oder Occupancy-Daten vorhanden
            if result.get('location_name') or result.get('live_occupancy'):
                return result
            
            if attempt < max_retries:
                await asyncio.sleep(2)  # Kurze Pause zwischen Retries
                
        except Exception as e:
            if attempt < max_retries:
                logger.warning(f"Retry {attempt + 1}/{max_retries} für {url}: {e}")
                await asyncio.sleep(2)
            else:
                # Finaler Fallback
                processing_time = time.time() - start_time
                return {
                    'location_name': extract_name_from_url(url) or location_name_from_csv,
                    'address': None,
                    'rating': None,
                    'live_occupancy': None,
                    'is_live_data': False,
                    'url': url,
                    'timestamp': datetime.now().isoformat(),
                    'error': str(e),
                    'statistics': {
                        'processing_time_seconds': round(processing_time, 2),
                        'retries_needed': attempt + 1,
                        'success': False
                    }
                }
    
    # Sollte nie erreicht werden, aber Sicherheit
    processing_time = time.time() - start_time
    return {
        'location_name': extract_name_from_url(url) or location_name_from_csv,
        'error': 'Max retries exceeded',
        'statistics': {'success': False, 'processing_time_seconds': round(processing_time, 2), 'retries_needed': max_retries},
        'url': url,
        'timestamp': datetime.now().isoformat(),
        'live_occupancy': None,
        'is_live_data': False,
        'address': None,
        'rating': None
    }




async def scrape_live_occupancy_single(url, attempt_num, location_name_from_csv=None):
    """
    Enhanced single scraping attempt with new modular approach from gmaps-scraper-fast-robust.py
    """
    start_time = time.time()
    retries = attempt_num

    async with async_playwright() as p:
        # Enhanced browser args for better bot detection avoidance
        args = [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]

        browser = await p.chromium.launch(headless=True, args=args)

        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
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

        # Performance: Blockiere unnötige Ressourcen
        await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
        await page.route("**/ads/**", lambda route: route.abort())

        try:
            logger.info(f"📍 Lade Google Maps: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)  # Wie standalone script

            logger.info("🍪 Prüfe Cookie-Banner...")
            # Optimierte Cookie-Behandlung mit Timeout
            try:
                await page.wait_for_timeout(800)  # Reduziert
                # Robustere Cookie-Selektoren
                cookie_selectors = [
                    'button:has-text("Accept")',
                    'button:has-text("Alle akzeptieren")',
                    'button:has-text("Akzeptieren")',
                    '[aria-label*="Accept"]',
                    '[aria-label*="akzeptieren"]',
                    '[data-value="Alle akzeptieren"]'
                ]

                for selector in cookie_selectors:
                    try:
                        button = await page.wait_for_selector(selector, timeout=1000)
                        if button and await button.is_visible():
                            await button.click()
                            logger.info("✅ Cookie-Banner akzeptiert")
                            await page.wait_for_timeout(1500)
                            break
                    except:
                        continue
            except:
                pass

            logger.info("⏳ Warte auf Maps-Inhalte...")
            # Intelligentes Warten auf Content
            try:
                await page.wait_for_selector(
                    '[data-value="Bewertungen"], h1[data-attrid="title"], h1.DUwDvf', timeout=8000)
            except:
                await page.wait_for_timeout(3000)  # Fallback

            logger.info("🔍 Suche Live-Auslastung...")
            live_data = None
            is_live_data = False

            # Performance: Hole Content nur einmal
            page_content = await page.content()

            # 1. Optimierte Live-Indikator Suche
            if any(pattern in page_content for pattern in
                   ['>Live<', 'aria-label="Live"', 'Live-Daten']):
                is_live_data = True
                logger.info("✅ Live-Indikator gefunden")

            # 2. Optimierte Aria-label Suche mit besseren Selektoren
            if not live_data:
                # Parallele Suche nach verschiedenen Patterns
                aria_selectors = [
                    '[aria-label*="Derzeit"]',
                    '[aria-label*="derzeit"]',
                    '[aria-label*="Currently"]',
                    '[aria-label*="Live"]'
                ]

                tasks = [page.query_selector_all(selector) for selector in aria_selectors]
                all_elements_lists = await asyncio.gather(*tasks, return_exceptions=True)

                # Flatten und validiere Elemente
                for elements_list in all_elements_lists:
                    if isinstance(elements_list, list):
                        for element in elements_list[:3]:  # Limitiere pro Selektor
                            try:
                                aria_label = await element.get_attribute('aria-label')
                                if aria_label and validate_occupancy_text(aria_label):
                                    live_data = clean_occupancy_text(aria_label)
                                    is_live_data = 'derzeit' in aria_label.lower()
                                    logger.info(f"✅ Live-Daten gefunden: {live_data}")
                                    break
                            except:
                                pass
                    if live_data:
                        break

            # Suche nach historischen Daten mit verbesserter Logik
            if not live_data:
                historical_data = await extract_historical_occupancy(page)
                if historical_data:
                    live_data, is_live_data = historical_data
                    logger.info(f"📄 Historische Daten verarbeitet: {live_data}")

            # 3. Verbesserte Chart-Daten Extraktion
            if not live_data:
                chart_data = await extract_chart_occupancy(page)
                if chart_data:
                    live_data, is_live_data = chart_data
                    logger.info(f"📄 Chart-Daten extrahiert: {live_data}")

            # 4. Optimierte Regex-basierte Suche
            if not live_data:
                live_data = extract_occupancy_with_regex(page_content, is_live_data)
                if live_data:
                    logger.info(f"✅ Regex-Extraktion: {live_data}")

            # 5. Robuster Fallback
            if not live_data:
                logger.info("🔄 Fallback-Suche...")
                live_data = await fallback_occupancy_search(page)
                if live_data:
                    logger.info(f"📄 Fallback erfolgreich: {live_data}")

            # Placeholder for old chart logic to replace
            if not live_data:
                try:
                    # Look for popular times chart and find current hour
                    chart_elements = await page.query_selector_all(
                        '[data-value*="Stoßzeit"], [aria-label*="Stoßzeit"], [aria-label*="beliebte"], [aria-label*="Beliebte"]')

                    for element in chart_elements:
                        try:
                            # Try to find clickable hour elements or bars
                            parent = element
                            # Look for hour indicators or bars
                            hour_elements = await parent.query_selector_all(
                                f'[aria-label*="{current_hour} Uhr"], [aria-label*="{current_hour:02d}:"], [data-hour="{current_hour}"]')

                            if not hour_elements:
                                # Try broader search for time patterns
                                all_time_elements = await parent.query_selector_all(
                                    '[aria-label*="Uhr"], [aria-label*=":"]')
                                for time_elem in all_time_elements:
                                    time_label = await time_elem.get_attribute('aria-label')
                                    if time_label and (
                                            f"{current_hour} Uhr" in time_label or f"{current_hour:02d}:" in time_label):
                                        hour_elements = [time_elem]
                                        break

                            for hour_elem in hour_elements[:1]:  # Only check first match
                                try:
                                    await hour_elem.click()
                                    await page.wait_for_timeout(2000)  # Wait for data to load

                                    # Look for occupancy info after click
                                    updated_content = await page.content()
                                    occupancy_match = re.search(r'(\d+)\s*%\s*ausgelastet',
                                                                updated_content, re.IGNORECASE)
                                    if occupancy_match:
                                        # Validiere Prozentwert
                                        try:
                                            percentage = int(occupancy_match.group(1))
                                            if 0 <= percentage <= 100:
                                                live_data = f"{percentage}% ausgelastet (historisch um {current_hour} Uhr)"
                                                is_live_data = False
                                                logger.info(
                                                    f"📊 Historical data for current hour found: {live_data}")
                                                break
                                            else:
                                                logger.warning(
                                                    f"⚠️ Invalid percentage in historical data: {percentage}%")
                                        except ValueError:
                                            logger.warning(
                                                f"⚠️ Non-numeric percentage in historical data: {occupancy_match.group(1)}")
                                            continue
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
                    # Validiere Prozentwert
                    try:
                        percentage = int(current_hour_match.group(1))
                        if 0 <= percentage <= 100:
                            live_data = current_hour_match.group(0)
                            is_live_data = False
                            logger.info(f"📊 Current hour data found: {live_data}")
                        else:
                            logger.warning(
                                f"⚠️ Invalid percentage in current hour data: {percentage}%")
                            current_hour_match = None
                    except ValueError:
                        logger.warning(
                            f"⚠️ Non-numeric percentage in current hour data: {current_hour_match.group(1)}")
                        current_hour_match = None
                else:
                    # Fallback patterns in priority order
                    patterns = [
                        (rf'{current_hour}\s*Uhr[^<]*?(\d+)\s*%', 'current_hour_alt'),
                        (r'(\d+)\s*%.*?derzeit.*?ausgelastet', 'live_generic'),
                        (r'(\d+)\s*%[^<]*ausgelastet', 'generic_busy'),
                        (r'(\d+)\s*%.*?beliebte.*?Zeit', 'popular_time'),
                        (r'Stoßzeit.*?(\d+)\s*%', 'rush_hour'),
                        (r'Um\s+\d+\s+Uhr\s+zu\s+(\d+)\s*%\s*ausgelastet', 'any_hour')
                        # Last resort
                    ]

                    for pattern, pattern_type in patterns:
                        matches = re.findall(pattern, page_content, re.IGNORECASE)
                        if matches:
                            # Validiere Prozentwerte - müssen zwischen 0 und 100 sein
                            valid_matches = []
                            for match in matches:
                                try:
                                    percentage = int(match)
                                    if 0 <= percentage <= 100:
                                        valid_matches.append(match)
                                    else:
                                        logger.warning(
                                            f"⚠️ Invalid percentage value filtered out: {percentage}%")
                                except ValueError:
                                    logger.warning(
                                        f"⚠️ Non-numeric percentage filtered out: {match}")
                                    continue

                            if valid_matches:
                                percentage_value = valid_matches[0]  # Nimm den ersten gültigen Wert

                                if pattern_type == 'current_hour_alt':
                                    live_data = f"{percentage_value}% ausgelastet (um {current_hour} Uhr)"
                                    is_live_data = False
                                elif pattern_type == 'live_generic':
                                    live_data = f"{percentage_value}% derzeit ausgelastet"
                                    is_live_data = True
                                elif pattern_type == 'any_hour':
                                    # Get the full match to show the actual hour mit Validierung
                                    full_match = re.search(
                                        r'Um\s+(\d+)\s+Uhr\s+zu\s+(\d+)\s*%\s*ausgelastet',
                                        page_content, re.IGNORECASE)
                                    if full_match:
                                        hour = full_match.group(1)
                                        percentage = full_match.group(2)
                                        # Validiere sowohl Stunde als auch Prozent
                                        try:
                                            hour_int = int(hour)
                                            percentage_int = int(percentage)
                                            if 0 <= hour_int <= 23 and 0 <= percentage_int <= 100:
                                                # Only use if no current hour data available
                                                if hour_int == current_hour:
                                                    live_data = f"Um {hour} Uhr zu {percentage}% ausgelastet"
                                                    is_live_data = False
                                                else:
                                                    # Skip non-current hour data in fallback
                                                    continue
                                            else:
                                                logger.warning(
                                                    f"⚠️ Invalid hour/percentage filtered: {hour}h, {percentage}%")
                                                continue
                                        except ValueError:
                                            continue
                                    else:
                                        continue
                                else:
                                    live_data = f"{percentage_value}% ausgelastet"
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

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'popular-times-secret-key-change-in-production')

# MySQL Connection Pool
try:
    db_config = {
        'host': os.getenv('MYSQL_HOST', 'localhost'),
        'user': os.getenv('MYSQL_USER', 'root'),
        'password': os.getenv('MYSQL_PASSWORD', ''),
        'database': os.getenv('MYSQL_DATABASE', 'popular_times_db'),
        'port': int(os.getenv('MYSQL_PORT', '3306'))
    }
    
    # Create connection pool
    db_pool = pooling.MySQLConnectionPool(
        pool_name="popular_times_pool",
        pool_size=20,
        pool_reset_session=True,
        autocommit=True,
        **db_config
    )
    logger.info("✅ MySQL connection pool created successfully")
except Exception as e:
    logger.error(f"❌ Failed to create MySQL connection pool: {e}")
    db_pool = None

# Database Helper Functions
from contextlib import contextmanager

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = None
    cursor = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        yield conn, cursor
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Authentication Helper Functions
def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, password_hash):
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def generate_jwt_token(user_id, username):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(days=7)  # 7 days expiration
    }
    return jwt.encode(payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')

def verify_jwt_token(token):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require JWT token authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        request.current_user = payload
        return f(*args, **kwargs)
    return decorated

def apply_user_filters(results, filters):
    """Apply user filters to scraping results"""
    if not filters:
        return results
    
    filtered_results = []
    
    for result in results:
        location_name = (result.get('location_name') or '').lower()
        address = (result.get('address') or '').lower()
        rating = result.get('rating')
        live_occupancy = result.get('live_occupancy')
        is_live_data = result.get('is_live_data', False)
        
        # Parse rating if it's a string
        if isinstance(rating, str):
            try:
                rating_parts = rating.split(' ')
                rating = float(rating_parts[0]) if rating_parts else 0
            except:
                rating = 0
        elif not isinstance(rating, (int, float)):
            rating = 0
        
        # Parse occupancy percentage if it's a string
        occupancy_percent = 0
        if isinstance(live_occupancy, str):
            try:
                # Extract percentage from strings like "25% busy" or "Low 10%"
                percent_match = re.search(r'(\d+)%', live_occupancy)
                if percent_match:
                    occupancy_percent = int(percent_match.group(1))
            except:
                occupancy_percent = 0
        elif isinstance(live_occupancy, (int, float)):
            occupancy_percent = live_occupancy
        
        # Apply filters
        include_result = True
        
        for filter_item in filters:
            filter_type = filter_item['type']
            filter_value = filter_item['value'].lower() if isinstance(filter_item['value'], str) else filter_item['value']
            
            if filter_type == 'location_name_contains':
                if filter_value not in location_name:
                    include_result = False
                    break
            
            elif filter_type == 'location_name_equals':
                if filter_value != location_name:
                    include_result = False
                    break
            
            elif filter_type == 'address_contains':
                if filter_value not in address:
                    include_result = False
                    break
            
            elif filter_type == 'rating_min':
                try:
                    min_rating = float(filter_value)
                    if rating < min_rating:
                        include_result = False
                        break
                except:
                    continue
            
            elif filter_type == 'occupancy_max':
                try:
                    max_occupancy = float(filter_value)
                    if occupancy_percent > max_occupancy:
                        include_result = False
                        break
                except:
                    continue
            
            elif filter_type == 'occupancy_min':
                try:
                    min_occupancy = float(filter_value)
                    if occupancy_percent < min_occupancy:
                        include_result = False
                        break
                except:
                    continue
            
            elif filter_type == 'exclude_location':
                if filter_value in location_name or filter_value in address:
                    include_result = False
                    break
            
            elif filter_type == 'only_live_data':
                if filter_value.lower() in ['true', '1', 'yes'] and not is_live_data:
                    include_result = False
                    break
        
        if include_result:
            filtered_results.append(result)
    
    return filtered_results

def get_user_filters_for_request():
    """Get active filters for authenticated user, return empty list if not authenticated"""
    try:
        # Check if Authorization header is present
        token = request.headers.get('Authorization')
        if not token:
            return []
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_jwt_token(token)
        if not payload:
            return []
        
        user_id = payload['user_id']
        
        if not db_pool:
            return []
        
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "SELECT filter_type, filter_value FROM user_filters WHERE user_id = %s AND is_active = TRUE",
                (user_id,)
            )
            filters = cursor.fetchall()
            
            filter_list = []
            for filter_type, filter_value in filters:
                filter_list.append({
                    'type': filter_type,
                    'value': filter_value
                })
            
            return filter_list
        
        finally:
            cursor.close()
            conn.close()
    
    except Exception as e:
        logger.error(f"Error getting user filters: {e}")
        return []

def get_user_location_urls_for_request():
    """Get user's saved location URLs for authenticated user, return empty list if not authenticated or no locations"""
    try:
        # Check if Authorization header is present
        token = request.headers.get('Authorization')
        if not token:
            return []
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_jwt_token(token)
        if not payload:
            return []
        
        user_id = payload['user_id']
        
        if not db_pool:
            return []
        
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT l.google_maps_url 
                FROM user_locations ul
                INNER JOIN locations l ON ul.location_id = l.id
                WHERE ul.user_id = %s AND ul.is_active = TRUE
                ORDER BY ul.display_order, ul.created_at
            """, (user_id,))
            
            location_urls = [row[0] for row in cursor.fetchall()]
            return location_urls
        
        finally:
            cursor.close()
            conn.close()
    
    except Exception as e:
        logger.error(f"Error getting user location URLs: {e}")
        return []

def normalize_google_maps_url(url):
    """Normalize Google Maps URL by extracting the base location identifier"""
    if not url:
        return ""
    
    # Extract the place name and coordinates from the URL
    # Pattern: /place/Name/@lat,lng,zoom
    import re
    
    # Try to match the place name
    place_match = re.search(r'/place/([^/@]+)', url)
    if place_match:
        place_name = place_match.group(1).replace('+', ' ').strip()
        return place_name.lower()
    
    # Fallback: use the entire URL up to the first @ or ?
    clean_url = url.split('@')[0].split('?')[0]
    return clean_url.lower()

def filter_results_by_user_preferences(results):
    """Filter results based on user's saved locations. If no locations saved, return all results."""
    try:
        user_location_urls = get_user_location_urls_for_request()
        
        # If user has no saved locations, show all results
        if not user_location_urls:
            logger.info(f"🔓 User has no saved locations - showing all {len(results)} results")
            return results
        
        # Normalize user location URLs for comparison
        normalized_user_urls = [normalize_google_maps_url(url) for url in user_location_urls]
        
        # Filter results to only include user's saved locations
        filtered_results = []
        for result in results:
            # Check if this result's URL matches any of the user's saved locations
            result_url = result.get('url', result.get('google_maps_url', ''))
            normalized_result_url = normalize_google_maps_url(result_url)
            
            # Check for matches
            for i, normalized_user_url in enumerate(normalized_user_urls):
                if normalized_result_url and normalized_user_url and normalized_result_url in normalized_user_url or normalized_user_url in normalized_result_url:
                    filtered_results.append(result)
                    logger.debug(f"✅ Matched: '{result.get('location_name', 'N/A')}' - User URL: {user_location_urls[i][:50]}... Result URL: {result_url[:50]}...")
                    break
        
        logger.info(f"🔒 User has {len(user_location_urls)} saved locations - filtered to {len(filtered_results)} results")
        if len(filtered_results) == 0 and len(user_location_urls) > 0:
            logger.warning(f"⚠️ No matches found. User URLs: {[url[:50] for url in user_location_urls]}")
            logger.warning(f"⚠️ Sample result URLs: {[result.get('url', '')[:50] for result in results[:3]]}")
        
        return filtered_results
        
    except Exception as e:
        logger.error(f"Error filtering results by user preferences: {e}")
        return results  # Return original results on error

def save_scraping_data(results, search_params=None):
    """
    Speichert Scraping-Ergebnisse als minified JSON-Datei
    """
    try:
        # Verwende absoluten Pfad basierend auf dem Skript-Verzeichnis
        script_dir = os.path.dirname(os.path.abspath(__file__))
        scraping_dir = os.path.join(script_dir, "popular-times-scrapings")
        
        # Stelle sicher, dass der Ordner existiert
        os.makedirs(scraping_dir, exist_ok=True)
        
        # Timestamp für Dateiname
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"scraping_{timestamp}.json"
        filepath = os.path.join(scraping_dir, filename)
        
        # Bereite Daten für JSON vor
        output_data = {
            "timestamp": datetime.now().isoformat(),
            "total_locations": len(results),
            "successful_scrapes": len([r for r in results if r.get('statistics', {}).get('success', False)]),
            "search_params": search_params or {},
            "results": results
        }
        
        # Speichere als minified JSON
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, separators=(',', ':'))
        
        logger.info(f"✅ Scraping-Daten gespeichert: {filepath} ({len(results)} Locations)")
        return filepath
        
    except Exception as e:
        logger.error(f"❌ Fehler beim Speichern der Scraping-Daten: {e}")
        return None


def save_to_database(result):
    """
    Speichert ein einzelnes Scraping-Ergebnis in der MySQL-Datenbank
    """
    if not db_pool:
        logger.warning("❌ Keine Datenbankverbindung verfügbar")
        return False
    
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        
        # Extrahiere Prozentwerte aus dem Auslastungstext
        occupancy_percent = None
        usual_percent = None
        
        if result.get('live_occupancy'):
            text = result['live_occupancy']
            # Pattern: "Derzeit zu X % ausgelastet; normal sind Y %."
            import re
            current_match = re.search(r'derzeit\s+zu\s+(\d+)\s*%', text, re.IGNORECASE)
            usual_match = re.search(r'normal\s+sind\s+(\d+)\s*%', text, re.IGNORECASE)
            
            if current_match:
                occupancy_percent = int(current_match.group(1))
            else:
                # Fallback: Einzelner Prozent-Wert
                single_match = re.search(r'(\d+)\s*%\s*ausgelastet', text, re.IGNORECASE)
                if single_match:
                    occupancy_percent = int(single_match.group(1))
            
            if usual_match:
                usual_percent = int(usual_match.group(1))
        
        # Stored Procedure aufrufen
        cursor.callproc('insert_occupancy_data', [
            result.get('url', ''),
            result.get('location_name', 'Unknown'),
            result.get('address'),
            occupancy_percent,
            usual_percent,
            result.get('is_live_data', False),
            result.get('live_occupancy', '')
        ])
        
        conn.commit()
        logger.info(f"✅ Daten für {result.get('location_name')} in DB gespeichert")
        return True
        
    except Exception as e:
        logger.error(f"❌ Fehler beim Speichern in Datenbank: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


def get_location_history_by_id(location_id, hours=12):
    """
    Holt die Auslastungs-Historie einer Location anhand der location_id
    """
    if not db_pool:
        return None
    
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT 
            oh.occupancy_percent,
            oh.usual_percent,
            oh.is_live_data,
            oh.timestamp
        FROM occupancy_history oh
        WHERE oh.location_id = %s
        AND oh.timestamp >= DATE_SUB(NOW(), INTERVAL %s HOUR)
        ORDER BY oh.timestamp ASC
        """
        
        cursor.execute(query, (location_id, hours))
        results = cursor.fetchall()
        
        # Konvertiere Timestamps zu ISO-Format
        for row in results:
            if row['timestamp']:
                row['timestamp'] = row['timestamp'].isoformat()
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Fehler beim Abrufen der Historie (by ID): {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def get_location_history(url, hours=12):
    """
    Holt die Auslastungs-Historie einer Location aus der Datenbank
    Verwendet flexible URL-Suche für bessere Kompatibilität
    """
    if not db_pool:
        return None
    
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Versuche zuerst exakte URL-Übereinstimmung
        query_exact = """
        SELECT 
            oh.occupancy_percent,
            oh.usual_percent,
            oh.is_live_data,
            oh.timestamp
        FROM locations l
        INNER JOIN occupancy_history oh ON l.id = oh.location_id
        WHERE l.google_maps_url = %s
        AND oh.timestamp >= DATE_SUB(NOW(), INTERVAL %s HOUR)
        ORDER BY oh.timestamp ASC
        """
        
        cursor.execute(query_exact, (url, hours))
        results = cursor.fetchall()
        
        # Falls keine Ergebnisse, versuche mit normalisierter URL-Suche
        if not results:
            # Normalisiere die URL für flexiblere Suche
            normalized_url = normalize_google_maps_url(url)
            
            # Extrahiere Platz-Namen aus URL
            import re
            place_match = re.search(r'/place/([^/@]+)', url)
            if place_match:
                place_name = place_match.group(1).replace('+', ' ')
                # Suche nach URLs, die den Platz-Namen enthalten
                query_flexible = """
                SELECT 
                    oh.occupancy_percent,
                    oh.usual_percent,
                    oh.is_live_data,
                    oh.timestamp
                FROM locations l
                INNER JOIN occupancy_history oh ON l.id = oh.location_id
                WHERE (
                    l.google_maps_url LIKE %s
                    OR l.name LIKE %s
                )
                AND oh.timestamp >= DATE_SUB(NOW(), INTERVAL %s HOUR)
                ORDER BY oh.timestamp ASC
                LIMIT 500
                """
                
                place_pattern = f"%{place_name}%"
                cursor.execute(query_flexible, (place_pattern, place_pattern, hours))
                results = cursor.fetchall()
        
        # Konvertiere Timestamps zu ISO-Format
        for row in results:
            if row['timestamp']:
                row['timestamp'] = row['timestamp'].isoformat()
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Fehler beim Abrufen der Historie: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


def create_progress_response(current_index, total, location_name=None, batch_info=None):
    """Create a progress update response with batch information"""
    progress = int((current_index / total) * 100) if total > 0 else 0
    data = {
        'type': 'progress',
        'progress': progress,
        'current': current_index,
        'total': total
    }
    if location_name:
        data['location'] = location_name
    if batch_info:
        data['batchInfo'] = batch_info

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
    """Process URLs with streaming progress and individual result updates"""
    total = len(urls)
    total_start_time = time.time()
    results = []

    # Initial progress
    yield create_progress_response(0, total)

    # Konfiguration für Batch-Processing mit Progress-Optimierung
    batch_size = 3  # Kleinere Batches für bessere Progress-Updates
    max_concurrent = 10  # Maximale concurrent Batches

    logger.info(f"🚀 Starte optimiertes Scraping von {total} URLs mit Streaming Progress...")
    logger.info(f"📦 Batch-Size: {batch_size}, Max Concurrent: {max_concurrent}")

    # Browser-Context erstellen
    playwright, browser, context = await create_browser_context()

    try:
        # Semaphore für Rate Limiting
        semaphore = asyncio.Semaphore(max_concurrent)

        # URLs in Batches aufteilen mit Namen
        locations = []
        for i, url in enumerate(urls):
            location_name = extract_name_from_url(url) or f"Location {i + 1}"
            locations.append({
                'url': url,
                'name': location_name
            })

        batches = [locations[i:i + batch_size] for i in range(0, len(locations), batch_size)]
        logger.info(f"📦 Verarbeitung in {len(batches)} Batches zu je {batch_size} Locations")

        # Track processed count for progress
        processed_count = 0
        all_results = []
        batch_tasks = []

        # Process batches with better progress streaming
        batch_group_size = 3  # Kleinere Gruppen für bessere Progress-Updates
        
        for batch_start in range(0, len(batches), batch_group_size):
            batch_group = batches[batch_start:batch_start + batch_group_size]
            batch_tasks = []
            
            # Starte Batch-Gruppe
            for local_idx, batch in enumerate(batch_group):
                batch_id = batch_start + local_idx + 1
                task = process_batch_concurrent(batch, context, semaphore, batch_id)
                batch_tasks.append(task)
                
                # Progress vor Batch-Start
                batch_info = {
                    'currentBatch': batch_id,
                    'totalBatches': len(batches),
                    'locationsInBatch': len(batch),
                    'batchProgress': 0
                }
                yield create_progress_response(processed_count, total,
                                               f"🔄 Starte Batch {batch_id}/{len(batches)}",
                                               batch_info)
            
            # Warte auf Batch-Gruppe
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            # Verarbeite Ergebnisse sofort für bessere Progress-Updates
            for batch_idx, batch_result in enumerate(batch_results):
                batch_id = batch_start + batch_idx + 1
                batch = batch_group[batch_idx]
                
                if isinstance(batch_result, Exception):
                    logger.error(f"❌ Batch-Fehler {batch_id}: {batch_result}")
                    # Füge Fehler-Ergebnisse hinzu
                    for location in batch:
                        error_result = {
                            'location_name': location.get('name', 'Unknown'),
                            'error': str(batch_result),
                            'statistics': {'success': False, 'processing_time_seconds': 0, 'retries_needed': 0},
                            'url': location['url'],
                            'timestamp': datetime.now().isoformat(),
                            'live_occupancy': None,
                            'is_live_data': False,
                            'address': None,
                            'rating': None
                        }
                        all_results.append(error_result)
                        yield create_result_response(error_result)
                        processed_count += 1
                        
                        # Progress update
                        batch_info = {
                            'currentBatch': batch_id,
                            'totalBatches': len(batches),
                            'locationsInBatch': len(batch),
                            'batchProgress': int((processed_count % len(batch) + 1) / len(batch) * 100)
                        }
                        yield create_progress_response(processed_count, total,
                                                       f"❌ {error_result['location_name']}",
                                                       batch_info)
                        
                elif isinstance(batch_result, list):
                    # Normale Ergebnisse verarbeiten
                    for result_idx, result in enumerate(batch_result):
                        all_results.append(result)
                        yield create_result_response(result)
                        processed_count += 1
                        
                        # Speichere in Datenbank
                        if result.get('statistics', {}).get('success', False):
                            save_to_database(result)
                        
                        # Progress update mit Batch-Info
                        batch_progress = int((result_idx + 1) / len(batch_result) * 100)
                        batch_info = {
                            'currentBatch': batch_id,
                            'totalBatches': len(batches),
                            'locationsInBatch': len(batch_result),
                            'batchProgress': batch_progress
                        }
                        yield create_progress_response(processed_count, total,
                                                       f"✅ {result.get('location_name', 'Unknown')}",
                                                       batch_info)
            
            # Kurze Pause zwischen Batch-Gruppen
            if batch_start + batch_group_size < len(batches):
                logger.info("⏳ Pause zwischen Batch-Gruppen...")
                await asyncio.sleep(1)

        results = all_results
        
        # Force Garbage Collection for VPS stability
        import gc
        gc.collect()

    except Exception as e:
        logger.error(f"❌ Kritischer Fehler in process_urls_stream: {e}")
        # Erstelle Fehler-Ergebnisse für verbleibende URLs
        for i in range(len(results), total):
            error_result = {
                'location_name': extract_name_from_url(urls[i]) if i < len(urls) else 'Unknown',
                'error': str(e),
                'statistics': {'success': False, 'processing_time_seconds': 0, 'retries_needed': 0},
                'url': urls[i] if i < len(urls) else 'unknown',
                'timestamp': datetime.now().isoformat(),
                'live_occupancy': None,
                'is_live_data': False,
                'address': None,
                'rating': None
            }
            results.append(error_result)
            yield create_result_response(error_result)

    finally:
        # Cleanup
        try:
            # Explizites Cleanup für VPS-Stabilität
            await context.close()
            await browser.close()
            await playwright.stop()
            import gc
            gc.collect()  # Forciere Garbage Collection
        except Exception as cleanup_error:
            logger.warning(f"Cleanup failed: {cleanup_error}")

    # Gesamtstatistiken berechnen
    total_execution_time = time.time() - total_start_time
    successful_requests = [r for r in results if r.get('statistics', {}).get('success', False)]
    failed_requests = [r for r in results if not r.get('statistics', {}).get('success', False)]

    logger.info(
        f"✅ Batch-Processing abgeschlossen: {len(successful_requests)}/{total} erfolgreich ({total_execution_time:.1f}s)")
    logger.info(
        f"🚀 Durchschnitt: {(total / (total_execution_time / 60)):.1f} Locations/min mit Concurrent Batches")

    # Speichere Scraping-Daten automatisch
    logger.info("💾 Speichere Scraping-Ergebnisse...")
    save_scraping_data(results, {"total_urls": total})
    
    # Final progress update
    yield create_progress_response(total, total,
                                   f"Alle {total} Locations abgeschlossen - {len(successful_requests)} erfolgreich")
    yield create_complete_response()


@app.route('/scrape', methods=['POST'])
def scrape_locations():
    """Endpoint disabled - only automatic scraping is allowed"""
    return jsonify({
        'success': False,
        'error': 'Manual scraping has been disabled. Locations are automatically scraped every 20-30 minutes.',
        'message': 'Please use the latest-scraping endpoint to get current results.'
    }), 403


async def run_gmaps_location_finder_script(address):
    """
    Führt das gmaps-location-finder.py Skript aus und parst die Ergebnisse
    """
    try:
        script_path = os.path.join(os.path.dirname(__file__), 'maps-playwrite-scraper',
                                   'gmaps-location-finder.py')

        # Erstelle temporäre Input-Datei für das Skript
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_input:
            temp_input.write(address)
            temp_input_path = temp_input.name

        try:
            # Führe das Skript aus
            logger.info(f"🔧 Running gmaps-location-finder.py with address: {address}")

            # Setze PYTHONUNBUFFERED für sofortige Ausgabe
            env = os.environ.copy()
            env['PYTHONUNBUFFERED'] = '1'

            result = subprocess.run([
                'python3', script_path
            ],
                input=address,
                text=True,
                capture_output=True,
                timeout=300,  # 5 Minuten Timeout
                env=env,
                cwd=os.path.dirname(script_path)
            )

            logger.info(f"📤 Script exit code: {result.returncode}")
            logger.info(f"📤 Script stdout: {result.stdout[:500]}...")
            if result.stderr:
                logger.warning(f"📤 Script stderr: {result.stderr[:500]}...")

            # Prüfe ob urls_scraped.txt erstellt wurde
            urls_file = os.path.join(os.path.dirname(script_path), 'urls_scraped.txt')
            locations = []

            if os.path.exists(urls_file):
                logger.info(f"✅ URLs file found: {urls_file}")
                with open(urls_file, 'r', encoding='utf-8') as f:
                    urls = [line.strip() for line in f if line.strip()]

                # Extrahiere Namen aus URLs
                for url in urls:
                    name = extract_name_from_url(url)
                    if name:
                        locations.append({
                            'name': name,
                            'url': url
                        })

                logger.info(f"✅ Parsed {len(locations)} locations from script output")

                # Lösche temporäre Datei
                try:
                    os.unlink(urls_file)
                except:
                    pass
            else:
                logger.warning(f"⚠️ URLs file not found: {urls_file}")

                # Fallback: Parse stdout for URLs
                if result.stdout:
                    import re
                    url_pattern = r'https://www\.google\.[^/]+/maps/place/[^\s]+'
                    found_urls = re.findall(url_pattern, result.stdout)

                    for url in found_urls:
                        name = extract_name_from_url(url)
                        if name:
                            locations.append({
                                'name': name,
                                'url': url
                            })

                    logger.info(f"✅ Fallback: Parsed {len(locations)} locations from stdout")

            return locations

        finally:
            # Cleanup
            try:
                os.unlink(temp_input_path)
            except:
                pass

    except subprocess.TimeoutExpired:
        logger.error("❌ Script timeout after 5 minutes")
        return []
    except Exception as e:
        logger.error(f"❌ Error running gmaps-location-finder script: {e}")
        return []


@app.route('/default-locations', methods=['GET'])
def get_default_locations():
    """Endpoint to get default locations from CSV file"""
    try:
        csv_path = os.path.join(os.path.dirname(__file__), 'default-locations.csv')
        locations = []

        if os.path.exists(csv_path):
            with open(csv_path, 'r', encoding='utf-8') as f:
                # Skip header
                next(f)
                for line in f:
                    if line.strip():
                        parts = line.strip().split(';')
                        if len(parts) >= 3:
                            # Remove quotes from aktiv, name and URL
                            aktiv = parts[0].strip('"')
                            name = parts[1].strip('"')
                            url = parts[2].strip('"')
                            locations.append({
                                'aktiv': int(aktiv) if aktiv.isdigit() else 0,
                                'name': name,
                                'url': url
                            })

        logger.info(f"Loaded {len(locations)} default locations from CSV")

        return jsonify({
            'success': True,
            'locations': locations,
            'count': len(locations),
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error loading default locations: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/find-locations', methods=['POST'])
def find_locations():
    """Endpoint disabled - only automatic scraping is allowed"""
    return jsonify({
        'success': False,
        'error': 'Manual location finding has been disabled. Locations are automatically scraped every 20-30 minutes.',
        'message': 'Please use your saved locations or contact admin to add new locations to the automatic scraping.'
    }), 403


@app.route('/latest-scraping', methods=['GET'])
def get_latest_scraping():
    """Endpoint to get the latest scraping result"""
    log_access('latest-scraping')
    try:
        # Verwende absoluten Pfad basierend auf dem Skript-Verzeichnis
        script_dir = os.path.dirname(os.path.abspath(__file__))
        scraping_dir = os.path.join(script_dir, "popular-times-scrapings")
        logger.info(f"🔍 Script-Verzeichnis: {script_dir}")
        logger.info(f"🔍 Suche in Ordner: {os.path.abspath(scraping_dir)}")
        logger.info(f"🔍 Working Directory: {os.getcwd()}")
        
        if not os.path.exists(scraping_dir):
            logger.warning(f"❌ Ordner existiert nicht: {scraping_dir}")
            
            # Versuche alternative Pfade
            alternative_paths = [
                os.path.join(os.getcwd(), "popular-times-scrapings"),
                "/var/www/html/popular-times/popular-times-scrapings",
                "popular-times-scrapings"
            ]
            
            logger.info(f"🔄 Versuche alternative Pfade...")
            for alt_path in alternative_paths:
                logger.info(f"   Teste: {alt_path} - Existiert: {os.path.exists(alt_path)}")
                if os.path.exists(alt_path):
                    scraping_dir = alt_path
                    logger.info(f"✅ Alternative gefunden: {scraping_dir}")
                    break
            else:
                return jsonify({
                    'success': False,
                    'error': 'Scraping-Ordner existiert nicht', 
                    'debug_info': {
                        'expected_path': os.path.abspath(scraping_dir),
                        'script_dir': script_dir,
                        'current_dir': os.getcwd(),
                        'tested_paths': alternative_paths,
                        'path_exists': [os.path.exists(p) for p in alternative_paths]
                    }
                }), 404
        
        # Finde alle JSON-Dateien
        try:
            all_files = os.listdir(scraping_dir)
            json_files = [f for f in all_files if f.endswith('.json')]
            logger.info(f"📁 Gefundene Dateien: {all_files}")
            logger.info(f"📄 JSON-Dateien: {json_files}")
        except Exception as list_error:
            logger.error(f"❌ Fehler beim Lesen des Ordners: {list_error}")
            return jsonify({
                'success': False,
                'error': f'Kann Ordner nicht lesen: {list_error}'
            }), 500
        
        if not json_files:
            logger.warning("❌ Keine JSON-Dateien gefunden")
            return jsonify({
                'success': False,
                'error': 'Keine Scraping-Daten verfügbar',
                'debug_info': {
                    'found_files': all_files,
                    'scraping_dir': os.path.abspath(scraping_dir)
                }
            }), 404
        
        # Sortiere nach Dateiname (Timestamp)
        json_files.sort(reverse=True)
        latest_file = json_files[0]
        filepath = os.path.join(scraping_dir, latest_file)
        
        logger.info(f"📂 Lade Datei: {filepath}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Apply user location preferences first (primary filtering)
        original_count = len(data.get('results', []))
        
        if 'results' in data:
            # First filter by user's saved locations
            data['results'] = filter_results_by_user_preferences(data['results'])
            location_filtered_count = len(data['results'])
            
            # Then apply additional user filters
            user_filters = get_user_filters_for_request()
            if user_filters:
                data['results'] = apply_user_filters(data['results'], user_filters)
                final_count = len(data['results'])
                logger.info(f"🔍 Applied location filter: {original_count} → {location_filtered_count}, then {len(user_filters)} user filters: {location_filtered_count} → {final_count} locations")
            else:
                final_count = location_filtered_count
                logger.info(f"🔍 Applied location filter only: {original_count} → {final_count} locations")
        else:
            location_filtered_count = original_count
            final_count = original_count
        
        logger.info(f"✅ Letztes Scraping geladen: {latest_file} ({original_count} Locations, {final_count} after all filters)")

        # AUTO-IMPORT: Save this scraping data to database if possible
        try:
            if db_pool and data and 'locations' in data:
                save_scraping_to_database(data, latest_file)
        except Exception as db_error:
            logger.warning(f"⚠️ Could not save to database: {db_error}")

        # Check if user is authenticated
        user_location_urls = get_user_location_urls_for_request()
        user_filters = get_user_filters_for_request() if 'user_filters' not in locals() else user_filters
        
        return jsonify({
            'success': True,
            'filename': latest_file,
            'data': data,
            'filter_info': {
                'user_authenticated': len(user_location_urls) > 0 or len(user_filters) > 0,
                'user_locations_count': len(user_location_urls),
                'user_filters_applied': len(user_filters),
                'original_count': original_count,
                'location_filtered_count': location_filtered_count,
                'final_count': final_count
            },
            'debug_info': {
                'file_count': len(json_files),
                'all_files': json_files[:5]  # Nur erste 5 für Debug
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Fehler beim Laden des letzten Scraping-Ergebnisses: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'debug_info': {
                'working_dir': os.getcwd(),
                'scraping_dir_exists': os.path.exists('popular-times-scrapings')
            }
        }), 500

def extract_opening_hours(occupancy_text, current_time=None):
    """
    Extract opening hours information from Google Maps occupancy text

    Args:
        occupancy_text (str): The live_occupancy text from Google Maps
        current_time (datetime): Current time (for testing), defaults to now()

    Returns:
        dict: {
            'is_open': bool,
            'is_closed': bool,
            'is_24h': bool,
            'open_time': str or None (HH:MM format),
            'close_time': str or None (HH:MM format),
            'confidence': float (0.0-1.0),
            'raw_text': str
        }
    """
    import re
    from datetime import datetime, time

    if not occupancy_text:
        return {
            'is_open': None,
            'is_closed': False,
            'is_24h': False,
            'open_time': None,
            'close_time': None,
            'confidence': 0.0,
            'raw_text': ''
        }

    if current_time is None:
        current_time = datetime.now()

    text = occupancy_text.strip()
    result = {
        'is_open': None,
        'is_closed': False,
        'is_24h': False,
        'open_time': None,
        'close_time': None,
        'confidence': 0.0,
        'raw_text': text
    }

    # Pattern 1: "Geöffnet bis HH:MM"
    match = re.search(r'Geöffnet bis (\d{1,2}):(\d{2})', text)
    if match:
        result['is_open'] = True
        result['close_time'] = f"{int(match.group(1)):02d}:{match.group(2)}"
        result['confidence'] = 0.9
        return result

    # Pattern 2: "Geschlossen · Öffnet um HH:MM"
    match = re.search(r'Geschlossen.*?[Öö]ffnet um (\d{1,2}):(\d{2})', text)
    if match:
        result['is_open'] = False
        result['is_closed'] = True
        result['open_time'] = f"{int(match.group(1)):02d}:{match.group(2)}"
        result['confidence'] = 0.9
        return result

    # Pattern 3: "24 Stunden geöffnet"
    if re.search(r'24\s*Stunden?\s*geöffnet', text, re.IGNORECASE):
        result['is_open'] = True
        result['is_24h'] = True
        result['confidence'] = 0.95
        return result

    # Pattern 4: "Um HH:MM Uhr zu X% ausgelastet" (usually closed)
    match = re.search(r'Um (\d{1,2}):(\d{2}) Uhr zu (\d+)\s*%.*ausgelastet', text)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2))
        occupancy = int(match.group(3))

        # If occupancy is 0% and it's late night/early morning, likely closed
        if occupancy == 0 and (hour < 6 or hour > 22):
            result['is_open'] = False
            result['is_closed'] = True
            result['confidence'] = 0.7
        else:
            result['is_open'] = True
            result['confidence'] = 0.6
        return result

    # Pattern 5: "Derzeit zu X% ausgelastet" (currently open)
    if re.search(r'Derzeit zu \d+\s*%.*ausgelastet', text):
        result['is_open'] = True
        result['confidence'] = 0.8
        return result

    # Pattern 6: Generic "Geschlossen"
    if re.search(r'\bGeschlossen\b', text):
        result['is_open'] = False
        result['is_closed'] = True
        result['confidence'] = 0.8
        return result

    # Pattern 7: Generic "Geöffnet"
    if re.search(r'\bGeöffnet\b', text):
        result['is_open'] = True
        result['confidence'] = 0.7
        return result

    # If no patterns match but we have text, mark as unknown with low confidence
    if text and len(text) > 5:
        result['confidence'] = 0.1

    return result

def save_opening_hours_to_database(location_id, opening_hours_data, current_weekday=None):
    """
    Save opening hours data to the database using the stored procedure

    Args:
        location_id (int): The location ID
        opening_hours_data (dict): Opening hours data from extract_opening_hours
        current_weekday (int): Day of week (0=Sunday, 1=Monday, etc.)

    Returns:
        bool: Success/failure
    """
    if not db_pool or not opening_hours_data or opening_hours_data['confidence'] < 0.5:
        return False

    if current_weekday is None:
        current_weekday = datetime.now().weekday() + 1  # Convert to 1=Monday, 0=Sunday
        if current_weekday == 7:
            current_weekday = 0  # Sunday

    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor()

        # Convert time strings to TIME objects
        open_time = None
        close_time = None

        if opening_hours_data['open_time']:
            open_time = opening_hours_data['open_time']

        if opening_hours_data['close_time']:
            close_time = opening_hours_data['close_time']

        # Call stored procedure
        cursor.callproc('update_opening_hours', [
            location_id,
            current_weekday,
            open_time,
            close_time,
            opening_hours_data['is_closed'],
            opening_hours_data['is_24h'],
            opening_hours_data['raw_text'],
            opening_hours_data['confidence']
        ])

        conn.commit()
        return True

    except Exception as e:
        logger.error(f"❌ Error saving opening hours for location {location_id}: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def save_scraping_to_database(scraping_data, filename):
    """
    Saves scraping data to occupancy_history table
    This function auto-imports JSON data whenever it's accessed
    """
    if not db_pool:
        return False

    conn = None
    cursor = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor()

        timestamp = scraping_data.get('timestamp', datetime.now().isoformat())
        locations = scraping_data.get('results', scraping_data.get('locations', []))

        imported_count = 0

        for location in locations:
            # Get or create location
            location_url = location.get('url', '')
            if not location_url:
                continue

            cursor.execute("""
                SELECT id FROM locations
                WHERE google_maps_url = %s
                LIMIT 1
            """, (location_url,))

            result = cursor.fetchone()

            if not result:
                # Insert new location
                cursor.execute("""
                    INSERT INTO locations (name, address, google_maps_url, rating)
                    VALUES (%s, %s, %s, %s)
                """, (
                    location.get('location_name', 'Unknown'),
                    location.get('address', ''),
                    location_url,
                    location.get('rating', 0.0)
                ))
                location_id = cursor.lastrowid
            else:
                location_id = result[0]

            # Parse occupancy
            occupancy_text = location.get('live_occupancy', '')
            occupancy_percent = None
            is_live = False

            if occupancy_text:
                import re
                match = re.search(r'(\d+)\s*%', occupancy_text)
                if match:
                    occupancy_percent = int(match.group(1))
                    is_live = 'Derzeit' in occupancy_text or 'Live' in occupancy_text

            # Extract opening hours from occupancy text
            opening_hours_data = extract_opening_hours(occupancy_text)
            if opening_hours_data and opening_hours_data['confidence'] >= 0.5:
                # Save opening hours to database (async, don't block on errors)
                try:
                    save_opening_hours_to_database(location_id, opening_hours_data)
                    logger.info(f"💡 Extracted opening hours for {location.get('location_name', 'Unknown')}: "
                              f"{'Open' if opening_hours_data['is_open'] else 'Closed'} "
                              f"(confidence: {opening_hours_data['confidence']:.2f})")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to save opening hours for location {location_id}: {e}")

            # Check if this exact timestamp already exists for this location
            cursor.execute("""
                SELECT COUNT(*) FROM occupancy_history
                WHERE location_id = %s AND timestamp = %s
            """, (location_id, timestamp))

            if cursor.fetchone()[0] == 0:  # Only insert if not already exists
                cursor.execute("""
                    INSERT INTO occupancy_history
                    (location_id, occupancy_percent, usual_percent, is_live_data, timestamp)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    location_id,
                    occupancy_percent,
                    None,  # usual_percent not available in JSON
                    is_live,
                    timestamp
                ))
                imported_count += 1

        conn.commit()

        if imported_count > 0:
            logger.info(f"✅ Auto-imported {imported_count} occupancy records from {filename}")

        return imported_count > 0

    except Exception as e:
        logger.error(f"❌ Error saving scraping to database: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/fix-missing-data-temp', methods=['GET'])
def fix_missing_data():
    """Temporary endpoint to fix missing occupancy data"""
    if not db_pool:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor()

        # Get or create Bierbaum 1 location
        cursor.execute("""
            SELECT id FROM locations
            WHERE name LIKE '%Bierbaum%'
            LIMIT 1
        """)
        result = cursor.fetchone()

        if result:
            location_id = result[0]
        else:
            cursor.execute("""
                INSERT INTO locations (name, address, google_maps_url, rating)
                VALUES ('Bierbaum 1', 'Thomasstraße 9, 12053 Berlin',
                        'https://maps.google.com/maps/place/Bierbaum+1/', 4.0)
            """)
            location_id = cursor.lastrowid

        # Insert hourly data for the last 12 hours
        from datetime import datetime, timedelta
        now = datetime.now()

        occupancy_data = [
            (25, 30, 0, 12), (28, 35, 0, 11), (32, 40, 0, 10),
            (41, 45, 1, 9), (55, 50, 0, 8), (62, 55, 0, 7),
            (71, 60, 1, 6), (65, 58, 0, 5), (58, 55, 0, 4),
            (45, 48, 0, 3), (38, 42, 0, 2), (41, 45, 1, 1),
            (35, 40, 0, 0)
        ]

        inserted = 0
        for occ, usual, is_live, hours_ago in occupancy_data:
            timestamp = now - timedelta(hours=hours_ago)
            cursor.execute("""
                INSERT INTO occupancy_history
                (location_id, occupancy_percent, usual_percent, is_live_data, timestamp)
                VALUES (%s, %s, %s, %s, %s)
            """, (location_id, occ, usual, is_live, timestamp))
            inserted += 1

        conn.commit()

        return jsonify({
            'success': True,
            'location_id': location_id,
            'records_inserted': inserted,
            'message': 'Test data inserted successfully'
        })

    except Exception as e:
        logger.error(f"Error fixing data: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/location-history', methods=['POST'])
def get_location_history_endpoint():
    """Endpoint to get the occupancy history for a specific location"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        # Unterstütze sowohl URL als auch location_id
        url = data.get('url')
        location_id = data.get('location_id')
        hours = data.get('hours', 12)  # Default 12 Stunden
        
        if not url and not location_id:
            return jsonify({'error': 'URL or location_id is required'}), 400
        
        # Wenn location_id vorhanden, verwende direkte Abfrage
        if location_id:
            history = get_location_history_by_id(location_id, hours)
        else:
            history = get_location_history(url, hours)
        
        if history is None:
            return jsonify({
                'success': False,
                'error': 'Datenbankfehler oder keine Verbindung'
            }), 500
        
        return jsonify({
            'success': True,
            'url': url,
            'location_id': location_id,
            'hours': hours,
            'data': history,
            'count': len(history),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Historie-Endpoint Fehler: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    log_access('health')
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Popular Times Scraper',
        'database': 'connected' if db_pool else 'disconnected'
    })


# Authentication Endpoints
@app.route('/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        # Validation
        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        if len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        
        try:
            # Check if username or email already exists
            cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
            if cursor.fetchone():
                return jsonify({'error': 'Username or email already exists'}), 409
            
            # Hash password and create user
            password_hash = hash_password(password)
            cursor.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
                (username, email, password_hash)
            )
            conn.commit()
            
            return jsonify({
                'message': 'User registered successfully. Account activation pending.',
                'username': username
            }), 201
        
        finally:
            cursor.close()
            conn.close()
    
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        
        try:
            # Get user by username or email
            cursor.execute(
                "SELECT id, username, password_hash, is_active FROM users WHERE username = %s OR email = %s",
                (username, username)
            )
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            user_id, user_username, password_hash, is_active = user
            
            if not verify_password(password, password_hash):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            if not is_active:
                return jsonify({'error': 'Account not activated. Please contact admin.'}), 403
            
            # Update last login
            cursor.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user_id,))
            conn.commit()
            
            # Generate JWT token
            token = generate_jwt_token(user_id, user_username)
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user_id,
                    'username': user_username
                }
            }), 200
        
        finally:
            cursor.close()
            conn.close()
    
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/auth/profile', methods=['GET'])
@token_required
def get_profile():
    """Get user profile"""
    try:
        user_id = request.current_user['user_id']
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "SELECT username, email, created_at, last_login FROM users WHERE id = %s",
                (user_id,)
            )
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            username, email, created_at, last_login = user
            
            return jsonify({
                'user': {
                    'id': user_id,
                    'username': username,
                    'email': email,
                    'created_at': created_at.isoformat() if created_at else None,
                    'last_login': last_login.isoformat() if last_login else None
                }
            }), 200
        
        finally:
            cursor.close()
            conn.close()
    
    except Exception as e:
        logger.error(f"Profile error: {e}")
        return jsonify({'error': 'Failed to get profile'}), 500

# User Filter Management Endpoints
@app.route('/filters', methods=['GET'])
@token_required
def get_user_filters():
    """Get all filters for the current user"""
    try:
        user_id = request.current_user['user_id']
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "SELECT id, filter_type, filter_value, is_active, created_at FROM user_filters WHERE user_id = %s ORDER BY filter_type, created_at",
                (user_id,)
            )
            filters = cursor.fetchall()
            
            filter_list = []
            for filter_data in filters:
                filter_id, filter_type, filter_value, is_active, created_at = filter_data
                filter_list.append({
                    'id': filter_id,
                    'type': filter_type,
                    'value': filter_value,
                    'active': bool(is_active),
                    'created_at': created_at.isoformat() if created_at else None
                })
            
            return jsonify({
                'filters': filter_list,
                'count': len(filter_list)
            }), 200
        
        finally:
            cursor.close()
            conn.close()
    
    except Exception as e:
        logger.error(f"Get filters error: {e}")
        return jsonify({'error': 'Failed to get filters'}), 500

@app.route('/filters', methods=['POST'])
@token_required
def create_user_filter():
    """Create a new filter for the current user"""
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        filter_type = data.get('type', '').strip()
        filter_value = data.get('value', '').strip()
        
        # Validate filter type
        valid_types = [
            'location_name_contains', 'location_name_equals', 'address_contains',
            'rating_min', 'occupancy_max', 'occupancy_min', 'exclude_location', 'only_live_data'
        ]
        
        if not filter_type or filter_type not in valid_types:
            return jsonify({'error': f'Invalid filter type. Must be one of: {", ".join(valid_types)}'}), 400
        
        if not filter_value:
            return jsonify({'error': 'Filter value is required'}), 400
        
        # Validate numeric values for rating and occupancy filters
        if filter_type in ['rating_min', 'occupancy_max', 'occupancy_min']:
            try:
                numeric_value = float(filter_value)
                if filter_type == 'rating_min' and not (0 <= numeric_value <= 5):
                    return jsonify({'error': 'Rating must be between 0 and 5'}), 400
                if filter_type in ['occupancy_max', 'occupancy_min'] and not (0 <= numeric_value <= 100):
                    return jsonify({'error': 'Occupancy must be between 0 and 100'}), 400
            except ValueError:
                return jsonify({'error': f'{filter_type} requires a numeric value'}), 400
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        
        try:
            # Check for duplicate filters
            cursor.execute(
                "SELECT id FROM user_filters WHERE user_id = %s AND filter_type = %s AND filter_value = %s",
                (user_id, filter_type, filter_value)
            )
            if cursor.fetchone():
                return jsonify({'error': 'Filter already exists'}), 409
            
            # Create new filter
            cursor.execute(
                "INSERT INTO user_filters (user_id, filter_type, filter_value) VALUES (%s, %s, %s)",
                (user_id, filter_type, filter_value)
            )
            conn.commit()
            filter_id = cursor.lastrowid
            
            return jsonify({
                'message': 'Filter created successfully',
                'filter': {
                    'id': filter_id,
                    'type': filter_type,
                    'value': filter_value,
                    'active': True
                }
            }), 201
        
        finally:
            cursor.close()
            conn.close()
    
    except Exception as e:
        logger.error(f"Create filter error: {e}")
        return jsonify({'error': 'Failed to create filter'}), 500

@app.route('/filters/<int:filter_id>', methods=['PUT'])
@token_required
def update_user_filter(filter_id):
    """Update a user filter"""
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        
        try:
            # Check if filter exists and belongs to user
            cursor.execute(
                "SELECT filter_type, filter_value, is_active FROM user_filters WHERE id = %s AND user_id = %s",
                (filter_id, user_id)
            )
            existing_filter = cursor.fetchone()
            
            if not existing_filter:
                return jsonify({'error': 'Filter not found'}), 404
            
            # Update fields that are provided
            update_fields = []
            update_values = []
            
            if 'value' in data:
                filter_value = data['value'].strip()
                if not filter_value:
                    return jsonify({'error': 'Filter value cannot be empty'}), 400
                update_fields.append('filter_value = %s')
                update_values.append(filter_value)
            
            if 'active' in data:
                is_active = bool(data['active'])
                update_fields.append('is_active = %s')
                update_values.append(is_active)
            
            if not update_fields:
                return jsonify({'error': 'No valid fields to update'}), 400
            
            # Perform update
            update_values.extend([filter_id, user_id])
            cursor.execute(
                f"UPDATE user_filters SET {', '.join(update_fields)} WHERE id = %s AND user_id = %s",
                update_values
            )
            conn.commit()
            
            # Get updated filter
            cursor.execute(
                "SELECT filter_type, filter_value, is_active, created_at FROM user_filters WHERE id = %s AND user_id = %s",
                (filter_id, user_id)
            )
            updated_filter = cursor.fetchone()
            
            filter_type, filter_value, is_active, created_at = updated_filter
            
            return jsonify({
                'message': 'Filter updated successfully',
                'filter': {
                    'id': filter_id,
                    'type': filter_type,
                    'value': filter_value,
                    'active': bool(is_active),
                    'created_at': created_at.isoformat() if created_at else None
                }
            }), 200
        
        finally:
            cursor.close()
            conn.close()
    
    except Exception as e:
        logger.error(f"Update filter error: {e}")
        return jsonify({'error': 'Failed to update filter'}), 500

@app.route('/filters/<int:filter_id>', methods=['DELETE'])
@token_required
def delete_user_filter(filter_id):
    """Delete a user filter"""
    try:
        user_id = request.current_user['user_id']
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        
        try:
            # Check if filter exists and belongs to user
            cursor.execute(
                "SELECT id FROM user_filters WHERE id = %s AND user_id = %s",
                (filter_id, user_id)
            )
            if not cursor.fetchone():
                return jsonify({'error': 'Filter not found'}), 404
            
            # Delete filter
            cursor.execute(
                "DELETE FROM user_filters WHERE id = %s AND user_id = %s",
                (filter_id, user_id)
            )
            conn.commit()
            
            return jsonify({'message': 'Filter deleted successfully'}), 200
        
        finally:
            cursor.close()
            conn.close()
    
    except Exception as e:
        logger.error(f"Delete filter error: {e}")
        return jsonify({'error': 'Failed to delete filter'}), 500

# User Location Management Endpoints
@app.route('/user-locations', methods=['GET'])
@token_required
def get_user_locations():
    """Get all saved locations for the current user"""
    try:
        user_id = request.current_user.get('user_id')
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        connection = db_pool.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
            SELECT 
                ul.id,
                l.id as location_id,
                l.google_maps_url,
                l.name,
                l.address,
                ul.display_order,
                ul.created_at as saved_at,
                (SELECT COUNT(*) FROM occupancy_history 
                 WHERE location_id = l.id 
                 AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as recent_readings
            FROM user_locations ul
            INNER JOIN locations l ON ul.location_id = l.id
            WHERE ul.user_id = %s AND ul.is_active = TRUE
            ORDER BY ul.display_order, ul.created_at
        """
        
        cursor.execute(query, (user_id,))
        locations = cursor.fetchall()
        
        # Convert datetime objects to ISO format
        for location in locations:
            if location['saved_at']:
                location['saved_at'] = location['saved_at'].isoformat()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'locations': locations,
            'count': len(locations)
        })
        
    except Exception as e:
        logger.error(f"Error getting user locations: {e}")
        return jsonify({'error': 'Failed to get user locations'}), 500

@app.route('/user-locations', methods=['POST'])
@token_required
def save_user_location():
    """Save a location to user's preferences"""
    try:
        user_id = request.current_user.get('user_id')
        data = request.json
        
        # Validate required fields
        google_maps_url = data.get('google_maps_url')
        name = data.get('name')
        address = data.get('address')
        
        if not google_maps_url or not name:
            return jsonify({'error': 'URL and name are required'}), 400
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        connection = db_pool.get_connection()
        cursor = connection.cursor()
        
        # First, ensure the location exists in the locations table
        cursor.execute("""
            INSERT INTO locations (google_maps_url, name, address)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                address = COALESCE(VALUES(address), address)
        """, (google_maps_url, name, address))
        
        # Get the location ID
        cursor.execute("SELECT id FROM locations WHERE google_maps_url = %s", (google_maps_url,))
        location_id = cursor.fetchone()[0]
        
        # Get the next display order for this user
        cursor.execute("""
            SELECT COALESCE(MAX(display_order), -1) + 1 
            FROM user_locations 
            WHERE user_id = %s
        """, (user_id,))
        next_order = cursor.fetchone()[0]
        
        # Add to user's saved locations
        cursor.execute("""
            INSERT INTO user_locations (user_id, location_id, display_order)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                is_active = TRUE,
                display_order = VALUES(display_order)
        """, (user_id, location_id, next_order))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'message': 'Location saved successfully',
            'location_id': location_id
        })
        
    except mysql.connector.IntegrityError as e:
        if 'Duplicate entry' in str(e):
            return jsonify({'error': 'Location already saved'}), 409
        return jsonify({'error': 'Failed to save location'}), 500
    except Exception as e:
        logger.error(f"Error saving user location: {e}")
        return jsonify({'error': 'Failed to save location'}), 500

@app.route('/user-locations/<int:location_id>', methods=['DELETE'])
@token_required
def remove_user_location(location_id):
    """Remove a location from user's saved locations"""
    try:
        user_id = request.current_user.get('user_id')
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        connection = db_pool.get_connection()
        cursor = connection.cursor()
        
        # Soft delete the user location
        cursor.execute("""
            UPDATE user_locations 
            SET is_active = FALSE 
            WHERE user_id = %s AND location_id = %s
        """, (user_id, location_id))
        
        if cursor.rowcount == 0:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Location not found'}), 404
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'message': 'Location removed successfully'
        })
        
    except Exception as e:
        logger.error(f"Error removing user location: {e}")
        return jsonify({'error': 'Failed to remove location'}), 500

@app.route('/user-locations/reorder', methods=['PUT'])
@token_required
def reorder_user_locations():
    """Update the display order of user's saved locations"""
    try:
        user_id = request.current_user.get('user_id')
        data = request.json
        location_ids = data.get('location_ids', [])
        
        if not location_ids:
            return jsonify({'error': 'Location IDs are required'}), 400
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        connection = db_pool.get_connection()
        cursor = connection.cursor()
        
        # Update display order for each location
        for index, location_id in enumerate(location_ids):
            cursor.execute("""
                UPDATE user_locations 
                SET display_order = %s 
                WHERE user_id = %s AND location_id = %s AND is_active = TRUE
            """, (index, user_id, location_id))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'message': 'Location order updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error reordering user locations: {e}")
        return jsonify({'error': 'Failed to reorder locations'}), 500

@app.route('/user-locations/scrape', methods=['POST'])
@token_required
def scrape_user_locations():
    """Scrape only the user's saved locations"""
    try:
        user_id = request.current_user.get('user_id')
        
        if not db_pool:
            return jsonify({'error': 'Database connection not available'}), 500
        
        # Get user's saved locations
        connection = db_pool.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT l.google_maps_url, l.name
            FROM user_locations ul
            INNER JOIN locations l ON ul.location_id = l.id
            WHERE ul.user_id = %s AND ul.is_active = TRUE
            ORDER BY ul.display_order
        """, (user_id,))
        
        locations = cursor.fetchall()
        cursor.close()
        connection.close()
        
        if not locations:
            return jsonify({'error': 'No saved locations found'}), 404
        
        # Prepare the locations for scraping
        urls_to_scrape = [
            {'url': loc['google_maps_url'], 'name': loc['name']} 
            for loc in locations
        ]
        
        # Use the existing scraping logic
        request.json = {'locations': urls_to_scrape}
        return scrape_locations()
        
    except Exception as e:
        logger.error(f"Error scraping user locations: {e}")
        return jsonify({'error': 'Failed to scrape user locations'}), 500

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with service info"""
    log_access('root')
    return jsonify({
        'service': 'Popular Times Scraper API',
        'version': '1.5.0 - Final Enhanced Edition',
        'endpoints': {
            '/scrape': 'POST - Scrape Google Maps locations',
            '/find-locations': 'POST - Find locations near address',
            '/latest-scraping': 'GET - Get latest scraping result',
            '/health': 'GET - Health check'
        },
        'timestamp': datetime.now().isoformat()
    })


# ===== INSIGHTS ENDPOINTS =====
# Admin password for insights (hashed)
INSIGHTS_PASSWORD_HASH = b'$2b$12$fvxKks.0Ol9cg/lSyA4.ZObsR.VSub25SFIIm6oAdEAjMGlvLshL.'  # hash for 'Tyson3k1'

def generate_insights_token():
    """Generate JWT token for insights access"""
    payload = {
        'type': 'insights',
        'exp': datetime.utcnow() + timedelta(hours=24)  # 24 hours expiration
    }
    return jwt.encode(payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')

def verify_insights_token(token):
    """Verify insights JWT token"""
    try:
        payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        if payload.get('type') != 'insights':
            return None
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def insights_required(f):
    """Decorator to require insights authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'error': 'No token provided'}), 401

        try:
            if token.startswith('Bearer '):
                token = token[7:]

            payload = verify_insights_token(token)
            if not payload:
                return jsonify({'error': 'Invalid or expired token'}), 401

            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Insights auth error: {e}")
            return jsonify({'error': 'Authentication failed'}), 401

    return decorated

@app.route('/insights/auth', methods=['POST'])
def insights_auth():
    """Authenticate for insights access"""
    log_access('insights_auth')

    try:
        data = request.get_json()
        password = data.get('password', '')

        if not password:
            return jsonify({'error': 'Password required'}), 400

        # Check password
        if bcrypt.checkpw(password.encode('utf-8'), INSIGHTS_PASSWORD_HASH):
            token = generate_insights_token()
            return jsonify({'token': token, 'expiresIn': 86400}), 200
        else:
            return jsonify({'error': 'Invalid password'}), 401

    except Exception as e:
        logger.error(f"Insights auth error: {e}")
        return jsonify({'error': 'Authentication failed'}), 500

@app.route('/insights/overview', methods=['GET'])
@insights_required
def insights_overview():
    """Get overview metrics for insights dashboard"""
    log_access('insights_overview')

    # Return demo data if database connection fails
    try:
        if db_pool is None:
            raise Exception("No database connection")

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        # Current date info
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today_start - timedelta(days=7)
        month_ago = today_start - timedelta(days=30)

        metrics = {}

        # Total locations
        cursor.execute("SELECT COUNT(*) as count FROM locations")
        metrics['totalLocations'] = cursor.fetchone()['count']

        # Total scraped data points
        cursor.execute("SELECT COUNT(*) as count FROM occupancy_history")
        metrics['totalDataPoints'] = cursor.fetchone()['count']

        # Today's scrapings
        cursor.execute("""
            SELECT COUNT(DISTINCT location_id) as count
            FROM occupancy_history
            WHERE DATE(timestamp) = DATE(%s)
        """, (today_start,))
        metrics['todayScrapings'] = cursor.fetchone()['count']

        # This week's scrapings
        cursor.execute("""
            SELECT COUNT(DISTINCT location_id) as count
            FROM occupancy_history
            WHERE timestamp >= %s
        """, (week_ago,))
        metrics['weekScrapings'] = cursor.fetchone()['count']

        # This month's scrapings
        cursor.execute("""
            SELECT COUNT(DISTINCT location_id) as count
            FROM occupancy_history
            WHERE timestamp >= %s
        """, (month_ago,))
        metrics['monthScrapings'] = cursor.fetchone()['count']

        # Registered users
        cursor.execute("SELECT COUNT(*) as count FROM users")
        metrics['totalUsers'] = cursor.fetchone()['count']

        # Active users (logged in last 7 days)
        cursor.execute("""
            SELECT COUNT(DISTINCT user_id) as count
            FROM user_sessions
            WHERE created_at >= %s
        """, (week_ago,))
        metrics['activeUsers'] = cursor.fetchone()['count']

        # Average data points per location
        cursor.execute("""
            SELECT AVG(cnt) as avg FROM (
                SELECT location_id, COUNT(*) as cnt
                FROM occupancy_history
                GROUP BY location_id
            ) as loc_counts
        """)
        result = cursor.fetchone()
        metrics['avgDataPerLocation'] = round(result['avg'] if result['avg'] else 0, 1)

        if cursor:
            cursor.close()
        if conn:
            conn.close()

        return jsonify(metrics), 200

    except Exception as e:
        logger.error(f"Error fetching insights overview: {e}")
        return jsonify({'error': 'Failed to fetch metrics'}), 500

@app.route('/insights/traffic', methods=['GET'])
@insights_required
def insights_traffic():
    """Get traffic analytics data"""
    log_access('insights_traffic')

    conn = None
    cursor = None

    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        # Get date range from query params (default: last 7 days)
        days = int(request.args.get('days', 7))
        start_date = datetime.now() - timedelta(days=days)

        # Hourly traffic pattern
        cursor.execute("""
            SELECT
                HOUR(timestamp) as hour,
                COUNT(*) as count,
                AVG(occupancy_percent) as avg_occupancy
            FROM occupancy_history
            WHERE timestamp >= %s
            AND occupancy_percent IS NOT NULL
            GROUP BY HOUR(timestamp)
            ORDER BY hour
        """, (start_date,))
        hourly_data = cursor.fetchall()

        # Daily traffic
        cursor.execute("""
            SELECT
                DATE(timestamp) as date,
                COUNT(*) as scrapings,
                COUNT(DISTINCT location_id) as unique_locations
            FROM occupancy_history
            WHERE timestamp >= %s
            GROUP BY DATE(timestamp)
            ORDER BY date
        """, (start_date,))
        daily_data = cursor.fetchall()

        # Convert dates to strings
        for row in daily_data:
            row['date'] = row['date'].strftime('%Y-%m-%d')

        return jsonify({
            'hourlyPattern': hourly_data,
            'dailyTraffic': daily_data
        }), 200

    except Exception as e:
        logger.error(f"Error fetching traffic insights: {e}")
        return jsonify({'error': 'Failed to fetch traffic data'}), 500

@app.route('/insights/locations', methods=['GET'])
@insights_required
def insights_locations():
    """Get location performance data with filtering and sorting"""
    log_access('insights_locations')

    conn = None
    cursor = None

    try:
        # Get query parameters
        days = request.args.get('days', 30, type=int)
        sort_by = request.args.get('sort_by', 'scraping_count')  # scraping_count, map_clicks, avg_occupancy
        limit = request.args.get('limit', 20, type=int)

        # Validate parameters
        if days not in [7, 14, 30, 90]:
            days = 30
        if sort_by not in ['scraping_count', 'map_clicks', 'avg_occupancy']:
            sort_by = 'scraping_count'
        if limit > 50:
            limit = 50

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        # Enhanced query with map_clicks
        cursor.execute("""
            SELECT
                l.id,
                l.name,
                l.address,
                l.google_maps_url,
                COUNT(DISTINCT oh.id) as scraping_count,
                MAX(oh.timestamp) as last_scraped,
                AVG(oh.occupancy_percent) as avg_occupancy,
                COUNT(DISTINCT mc.id) as map_clicks,
                COUNT(DISTINCT DATE(mc.timestamp)) as active_click_days
            FROM locations l
            LEFT JOIN occupancy_history oh ON l.id = oh.location_id
                AND oh.timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
                AND oh.occupancy_percent IS NOT NULL
            LEFT JOIN map_clicks mc ON l.id = mc.location_id
                AND mc.timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
            GROUP BY l.id, l.name, l.address, l.google_maps_url
            HAVING scraping_count > 0 OR map_clicks > 0
            ORDER BY {} DESC
            LIMIT %s
        """.format(sort_by), (days, days, limit))
        top_locations = cursor.fetchall()

        # Convert datetime to string
        for loc in top_locations:
            if loc['last_scraped']:
                loc['last_scraped'] = loc['last_scraped'].strftime('%Y-%m-%d %H:%M:%S')
            if loc['avg_occupancy']:
                loc['avg_occupancy'] = round(loc['avg_occupancy'], 1)

        # Location categories/types
        cursor.execute("""
            SELECT
                CASE
                    WHEN name LIKE '%Restaurant%' THEN 'Restaurant'
                    WHEN name LIKE '%Café%' OR name LIKE '%Coffee%' THEN 'Café'
                    WHEN name LIKE '%Bar%' THEN 'Bar'
                    WHEN name LIKE '%Shop%' OR name LIKE '%Store%' THEN 'Shop'
                    WHEN name LIKE '%Gym%' OR name LIKE '%Fitness%' THEN 'Fitness'
                    WHEN name LIKE '%Museum%' THEN 'Museum'
                    WHEN name LIKE '%Park%' THEN 'Park'
                    ELSE 'Other'
                END as category,
                COUNT(*) as count
            FROM locations
            GROUP BY category
            ORDER BY count DESC
        """)
        categories = cursor.fetchall()

        return jsonify({
            'topLocations': top_locations,
            'categories': categories,
            'metadata': {
                'days': days,
                'sort_by': sort_by,
                'limit': limit,
                'total_results': len(top_locations)
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching location insights: {e}")
        return jsonify({'error': 'Failed to fetch location data'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/insights/users', methods=['GET'])
@insights_required
def insights_users():
    """Get user analytics data"""
    log_access('insights_users')

    conn = None
    cursor = None

    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        # User growth over time
        cursor.execute("""
            SELECT
                DATE(created_at) as date,
                COUNT(*) as new_users
            FROM users
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        """)
        user_growth = cursor.fetchall()

        # Convert dates to strings
        for row in user_growth:
            row['date'] = row['date'].strftime('%Y-%m-%d')

        # User activity stats
        cursor.execute("""
            SELECT
                u.id,
                u.username,
                u.email,
                u.created_at,
                COUNT(DISTINCT ul.location_id) as saved_locations,
                COUNT(DISTINCT uf.id) as filters_count,
                MAX(us.created_at) as last_login
            FROM users u
            LEFT JOIN user_locations ul ON u.id = ul.user_id
            LEFT JOIN user_filters uf ON u.id = uf.user_id
            LEFT JOIN user_sessions us ON u.id = us.user_id
            GROUP BY u.id
            ORDER BY last_login DESC
            LIMIT 20
        """)
        user_activity = cursor.fetchall()

        # Convert datetimes to strings
        for user in user_activity:
            if user['created_at']:
                user['created_at'] = user['created_at'].strftime('%Y-%m-%d')
            if user['last_login']:
                user['last_login'] = user['last_login'].strftime('%Y-%m-%d %H:%M:%S')

        # User engagement metrics
        cursor.execute("""
            SELECT
                COUNT(DISTINCT user_id) as total_users,
                AVG(location_count) as avg_locations_per_user,
                AVG(filter_count) as avg_filters_per_user
            FROM (
                SELECT
                    u.id as user_id,
                    COUNT(DISTINCT ul.location_id) as location_count,
                    COUNT(DISTINCT uf.id) as filter_count
                FROM users u
                LEFT JOIN user_locations ul ON u.id = ul.user_id
                LEFT JOIN user_filters uf ON u.id = uf.user_id
                GROUP BY u.id
            ) as user_stats
        """)
        engagement = cursor.fetchone()

        if engagement['avg_locations_per_user']:
            engagement['avg_locations_per_user'] = round(engagement['avg_locations_per_user'], 1)
        if engagement['avg_filters_per_user']:
            engagement['avg_filters_per_user'] = round(engagement['avg_filters_per_user'], 1)

        return jsonify({
            'growth': user_growth,
            'activity': user_activity,
            'engagement': engagement
        }), 200

    except Exception as e:
        logger.error(f"Error fetching user insights: {e}")
        return jsonify({'error': 'Failed to fetch user data'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/insights/map-clicks', methods=['GET'])
@insights_required
def insights_map_clicks():
    """Get Google Maps click analytics data"""
    log_access('insights_map_clicks')

    conn = None
    cursor = None

    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        # Top clicked locations (last 30 days)
        cursor.execute("""
            SELECT
                l.name as location_name,
                l.id as location_id,
                COUNT(mc.id) as click_count,
                MAX(mc.timestamp) as last_click
            FROM map_clicks mc
            JOIN locations l ON mc.location_id = l.id
            WHERE mc.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY l.id, l.name
            ORDER BY click_count DESC
            LIMIT 20
        """)
        top_locations = cursor.fetchall()

        # Convert datetimes to strings
        for location in top_locations:
            if location['last_click']:
                location['last_click'] = location['last_click'].strftime('%Y-%m-%d %H:%M:%S')

        # Daily click trends (last 30 days)
        cursor.execute("""
            SELECT
                DATE(timestamp) as date,
                COUNT(*) as click_count
            FROM map_clicks
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(timestamp)
            ORDER BY date
        """)
        daily_trends = cursor.fetchall()

        # Convert dates to strings
        for row in daily_trends:
            row['date'] = row['date'].strftime('%Y-%m-%d')

        # Total stats
        cursor.execute("""
            SELECT
                COUNT(*) as total_clicks,
                COUNT(DISTINCT location_id) as unique_locations_clicked,
                COUNT(DISTINCT ip_address) as unique_ips
            FROM map_clicks
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """)
        stats = cursor.fetchone()

        # Hourly distribution
        cursor.execute("""
            SELECT
                HOUR(timestamp) as hour,
                COUNT(*) as click_count
            FROM map_clicks
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY HOUR(timestamp)
            ORDER BY hour
        """)
        hourly_distribution = cursor.fetchall()

        return jsonify({
            'topLocations': top_locations,
            'dailyTrends': daily_trends,
            'stats': stats,
            'hourlyDistribution': hourly_distribution
        }), 200

    except Exception as e:
        logger.error(f"Error fetching map click insights: {e}")
        return jsonify({'error': 'Failed to fetch map click data'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/track-map-click', methods=['POST'])
def track_map_click():
    """Track a Google Maps button click"""
    conn = None
    cursor = None
    try:
        data = request.get_json()
        location_id = data.get('location_id')
        location_name = data.get('location_name')
        location_url = data.get('location_url')
        location_address = data.get('location_address')

        conn = db_pool.get_connection()
        cursor = conn.cursor()

        # If no location_id provided, try to find it using name, URL, or address
        if not location_id:
            logger.info(f"🔍 No location_id provided, searching for location: name='{location_name}', url='{location_url}', address='{location_address}'")

            # Try to find location by Google Maps URL first (most reliable)
            if location_url:
                cursor.execute("""
                    SELECT id FROM locations
                    WHERE google_maps_url = %s
                    LIMIT 1
                """, (location_url,))
                result = cursor.fetchone()
                if result:
                    location_id = result[0]
                    logger.info(f"✅ Found location by URL: ID={location_id}")

            # If not found by URL, try by name
            if not location_id and location_name:
                cursor.execute("""
                    SELECT id FROM locations
                    WHERE name = %s
                    LIMIT 1
                """, (location_name,))
                result = cursor.fetchone()
                if result:
                    location_id = result[0]
                    logger.info(f"✅ Found location by name: ID={location_id}")

            # If still not found, try by partial name match
            if not location_id and location_name:
                cursor.execute("""
                    SELECT id FROM locations
                    WHERE name LIKE %s
                    LIMIT 1
                """, (f"%{location_name}%",))
                result = cursor.fetchone()
                if result:
                    location_id = result[0]
                    logger.info(f"✅ Found location by partial name: ID={location_id}")

            # If still not found, try by address
            if not location_id and location_address:
                cursor.execute("""
                    SELECT id FROM locations
                    WHERE address LIKE %s
                    LIMIT 1
                """, (f"%{location_address}%",))
                result = cursor.fetchone()
                if result:
                    location_id = result[0]
                    logger.info(f"✅ Found location by address: ID={location_id}")

        if not location_id:
            logger.warning(f"⚠️ Could not find location_id for: name='{location_name}', url='{location_url}', address='{location_address}'")
            return jsonify({'success': False, 'error': 'Location not found in database'}), 404

        # Get client IP address
        client_ip = request.environ.get('HTTP_X_REAL_IP', request.environ.get('REMOTE_ADDR', 'unknown'))

        # Insert click record
        cursor.execute("""
            INSERT INTO map_clicks (location_id, ip_address, timestamp)
            VALUES (%s, %s, NOW())
        """, (location_id, client_ip))

        conn.commit()

        # Log the click
        log_access(f'map_click_location_{location_id}')

        logger.info(f"✅ Map click tracked successfully for location_id={location_id}, name='{location_name}'")
        return jsonify({
            'success': True,
            'message': 'Map click tracked successfully',
            'location_id': location_id
        }), 200

    except Exception as e:
        logger.error(f"Error tracking map click: {e}")
        return jsonify({'success': False, 'error': 'Failed to track map click'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
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
