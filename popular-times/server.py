#!/usr/bin/env python3

import asyncio
import gc
import json
import logging
import os
import random
import sys
import time
import urllib.parse
from datetime import datetime
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

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

    # Konfiguration für Batch-Processing (wie standalone script)
    batch_size = 5  # Locations pro Batch (balance zwischen Speed und Stabilität)
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

        # Process batches concurrently (wie standalone script)
        for batch_id, batch in enumerate(batches, 1):
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

            # Starte nicht zu viele Batches gleichzeitig (wie standalone)
            if len(batch_tasks) >= max_concurrent or batch_id == len(batches):
                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)

                for batch_result in batch_results:
                    if isinstance(batch_result, Exception):
                        logger.error(f"❌ Batch-Fehler: {batch_result}")
                    elif isinstance(batch_result, list):
                        for result in batch_result:
                            all_results.append(result)
                            yield create_result_response(result)
                            processed_count += 1
                            
                            # Update progress
                            yield create_progress_response(processed_count, total,
                                                           f"✅ {result.get('location_name', 'Unknown')}")

                batch_tasks = []

                # Kurze Pause zwischen Batch-Gruppen (wie standalone)
                if batch_id < len(batches):
                    logger.info("⏳ Pause zwischen Batch-Gruppen...")
                    await asyncio.sleep(2)

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

    # Final progress update
    yield create_progress_response(total, total,
                                   f"Alle {total} Locations abgeschlossen - {len(successful_requests)} erfolgreich")
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

        logger.info(f"🚀 Starting CONCURRENT BATCH scraping for {len(valid_urls)} URLs")
        logger.info(
            f"⚡ Performance-Features: Batch-Processing (3er-Batches), Concurrent Execution (max 2 parallel)")
        logger.info(
            f"🔧 Enhanced: Resource blocking, Browser context reuse, Exponential backoff retries")

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
                            # Force flush for immediate transmission
                            sys.stdout.flush()
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
            mimetype='text/plain',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',  # Disable nginx buffering
            }
        )

    except Exception as e:
        logger.error(f"Scrape endpoint error: {e}")
        return jsonify({'error': str(e)}), 500


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
                        if len(parts) >= 2:
                            # Remove quotes from name and URL
                            name = parts[0].strip('"')
                            url = parts[1].strip('"')
                            locations.append({
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
    """Endpoint to find locations near an address using gmaps-location-finder.py script"""
    try:
        data = request.get_json()

        if not data or 'address' not in data:
            return jsonify({'error': 'Address is required'}), 400

        address = data['address']

        if not isinstance(address, str) or not address.strip():
            return jsonify({'error': 'Valid address string is required'}), 400

        logger.info(f"Finding locations near: {address}")

        # Use the external gmaps-location-finder.py script
        logger.info("Using external gmaps-location-finder.py script")

        # Run the external script
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            locations = loop.run_until_complete(run_gmaps_location_finder_script(address.strip()))
            urls = [location['url'] for location in locations]

            logger.info(f"Found {len(locations)} locations from gmaps-location-finder.py script")

            if len(locations) == 0:
                logger.warning("No locations found, falling back to integrated finder")
                # Fallback zur integrierten Funktion
                locations = loop.run_until_complete(
                    find_locations_near_address_enhanced(address.strip()))
                urls = [location['url'] for location in locations]
                logger.info(f"Fallback found {len(locations)} locations")

            return jsonify({
                'success': True,
                'address': address,
                'count': len(locations),
                'locations': locations,
                'urls': urls,
                'timestamp': datetime.now().isoformat(),
                'source': 'gmaps-location-finder.py' if len(locations) > 0 else 'fallback'
            })

        finally:
            loop.close()

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
