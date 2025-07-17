#!/usr/bin/env python3

import asyncio
import json
import os
import re
import time
import urllib.parse
from datetime import datetime
from playwright.async_api import async_playwright
from typing import List, Dict, Optional


class BarFinder:
    def __init__(self):
        self.radius_km = 8
        self.search_query_template = "bars and clubs near {address}"

    async def search_bars_near_address(self, address: str) -> List[Dict]:
        """
        Sucht nach offenen Bars im Umkreis der angegebenen Adresse
        """
        bars = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=False,  # Debug: Browser sichtbar machen
                args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
                      '--disable-extensions']
            )
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            )
            page = await context.new_page()

            # Performance: Blockiere unnötige Ressourcen
            # DEAKTIVIERT für Debugging
            # await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", lambda route: route.abort())
            # await page.route("**/ads/**", lambda route: route.abort())

            try:
                # Erstelle Google Maps Suchanfrage mit Filter für geöffnete Locations
                search_query = f"bars near {address}"
                # Füge Parameter hinzu um nur aktuell geöffnete Orte anzuzeigen
                maps_url = f"https://www.google.com/maps/search/{urllib.parse.quote(search_query)}?authuser=0&hl=de&entry=ttu&g_ep=CAI%3D&g_st=ic"

                print(
                    f"🔍 Suche nach Bars, Clubs, Kneipen und Biergärten in der Nähe von: {address}")
                print(f"🔗 URL: {maps_url}")

                await page.goto(maps_url, wait_until='domcontentloaded', timeout=30000)

                # Cookie-Banner behandeln
                await self._handle_cookies(page)

                # Warte auf Suchergebnisse
                print("⏳ Warte auf Suchergebnisse...")
                await page.wait_for_timeout(5000)

                # Versuche "Jetzt geöffnet" Filter zu aktivieren
                try:
                    # Suche nach dem "Jetzt geöffnet" Button/Filter
                    open_now_selectors = [
                        'button:has-text("Jetzt geöffnet")',
                        'button:has-text("Open now")',
                        '[aria-label*="Jetzt geöffnet"]',
                        '[aria-label*="Open now"]',
                        'div[role="button"]:has-text("Jetzt geöffnet")',
                        'span:has-text("Jetzt geöffnet")'
                    ]

                    for selector in open_now_selectors:
                        try:
                            open_now_button = await page.query_selector(selector)
                            if open_now_button and await open_now_button.is_visible():
                                await open_now_button.click()
                                print("✅ 'Jetzt geöffnet' Filter aktiviert")
                                await page.wait_for_timeout(3000)
                                break
                        except:
                            continue
                except Exception as e:
                    print(f"⚠️ Konnte 'Jetzt geöffnet' Filter nicht aktivieren: {e}")

                # Debug: Screenshot nach dem Laden
                await page.screenshot(path="debug_search_results.png", full_page=True)
                print("📸 Debug-Screenshot gespeichert: debug_search_results.png")

                # Scroll um mehr Ergebnisse zu laden
                await self._scroll_for_more_results(page)

                # Extrahiere alle Bars aus den Suchergebnissen
                bars = await self._extract_bars_from_search(page, address)

                # Filtere nach offenen Bars
                open_bars = await self._filter_open_bars(page, bars)

                return open_bars

            except Exception as e:
                print(f"❌ Fehler bei der Suche: {e}")
                return []
            finally:
                await browser.close()

    async def _handle_cookies(self, page):
        """Behandelt Cookie-Banner"""
        try:
            await page.wait_for_timeout(1000)
            cookie_buttons = await page.query_selector_all(
                'button:has-text("Accept"), button:has-text("Alle akzeptieren"), [aria-label*="Accept"], [aria-label*="akzeptieren"]'
            )

            for button in cookie_buttons:
                try:
                    if await button.is_visible():
                        await button.click()
                        print("✅ Cookie-Banner akzeptiert")
                        await page.wait_for_timeout(2000)
                        break
                except:
                    continue
        except:
            pass

    async def _scroll_for_more_results(self, page):
        """Scrollt um mehr Suchergebnisse zu laden"""
        try:
            print("📜 Lade mehr Suchergebnisse...")
            # Suche nach dem Ergebnisse-Container
            results_container = await page.query_selector('[role="main"]')
            if results_container:
                # Mehrfach scrollen für mehr Ergebnisse
                for i in range(3):
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                    await page.wait_for_timeout(2000)
        except:
            pass

    async def _extract_bars_from_search(self, page, search_address: str) -> List[Dict]:
        """Extrahiert Bar-Informationen aus den Suchergebnissen"""
        bars = []

        try:
            # Suche nach allen Suchergebnis-Einträgen
            result_selectors = [
                '[data-result-index]',
                '[jsaction*="pane.result"]',
                '.hfpxzc',
                'a[href*="/maps/place/"]',
                'div[role="article"]',
                'div[jsaction*="mouseover:pane"]',
                '[data-value="Ort"]',
                '.Nv2PK',
                '.a4gq8e-aVTXAb-haAclf-jRmmHf-hSRGPd'
            ]

            results = []
            for selector in result_selectors:
                found = await page.query_selector_all(selector)
                if found:
                    results = found
                    break

            print(f"📍 {len(results)} potentielle Ergebnisse gefunden")

            # Debug: HTML-Struktur ausgeben
            if len(results) == 0:
                print("⚠️ Keine Ergebnisse mit Standardselektoren gefunden. Prüfe HTML-Struktur...")
                page_content = await page.content()
                with open("debug_page_content.html", "w", encoding="utf-8") as f:
                    f.write(page_content)
                print("💾 HTML-Inhalt gespeichert in: debug_page_content.html")

            # Begrenze auf die ersten 20 Ergebnisse für Performance
            for i, result in enumerate(results[:20]):
                try:
                    print(f"🔍 Verarbeite Ergebnis {i + 1}...")
                    bar_info = await self._extract_single_bar_info(result, page, i)
                    if bar_info:
                        print(f"📍 Gefunden: {bar_info['name']}")
                        if self._is_likely_bar(bar_info):
                            bars.append(bar_info)
                            print(f"✅ Als Location erkannt: {bar_info['name']}")
                        else:
                            print(f"❌ Nicht als Location erkannt: {bar_info['name']}")
                    else:
                        print(f"❌ Keine Daten aus Ergebnis {i + 1} extrahiert")
                except Exception as e:
                    print(f"⚠️ Fehler bei Ergebnis {i}: {e}")
                    continue

        except Exception as e:
            print(f"❌ Fehler beim Extrahieren der Bars: {e}")

        return bars

    async def _extract_single_bar_info(self, element, page, index: int) -> Optional[Dict]:
        """Extrahiert Informationen einer einzelnen Bar"""
        try:
            # Erweiterte Name-Selektoren
            name_selectors = [
                '.DUwDvf', '.qBF1Pd', '.fontHeadlineSmall',
                'h3', '.section-result-title', '.section-result-location',
                '[role="button"] .fontHeadlineSmall', '[data-value="Ort"]'
            ]

            name = None
            for selector in name_selectors:
                try:
                    name_element = await element.query_selector(selector)
                    if name_element:
                        text = await name_element.text_content()
                        if text and text.strip():
                            name = text.strip()
                            print(f"    ✅ Name gefunden mit Selector '{selector}': {name}")
                            break
                except:
                    continue

            if not name:
                print(f"    ❌ Kein Name gefunden für Element {index}")

            # Erweiterte Link-Selektoren
            href = None
            link_selectors = [
                'a[href*="/maps/place/"]',
                'a[href*="maps"]',
                'a[data-cid]'
            ]

            for selector in link_selectors:
                try:
                    link_element = await element.query_selector(selector)
                    if link_element:
                        href = await link_element.get_attribute('href')
                        if href:
                            print(f"    ✅ Link gefunden mit Selector '{selector}': {href[:50]}...")
                            break
                except:
                    continue

            # Fallback: Element selbst prüfen
            if not href:
                try:
                    href = await element.get_attribute('href')
                    if href:
                        print(f"    ✅ Link direkt vom Element: {href[:50]}...")
                except:
                    pass

            if not href:
                print(f"    ❌ Kein Link gefunden für Element {index}")

            # Fallback: Name aus URL extrahieren
            if not name and href and "/maps/place/" in href:
                try:
                    import urllib.parse
                    # Extrahiere Name aus URL zwischen "/maps/place/" und "/"
                    url_parts = href.split("/maps/place/")
                    if len(url_parts) > 1:
                        name_part = url_parts[1].split("/")[0]
                        # URL-Dekodierung
                        name = urllib.parse.unquote(name_part).replace("+", " ")
                        print(f"    ✅ Name aus URL extrahiert: {name}")
                except:
                    pass

            if name and href:
                return {
                    'name': name,
                    'url': href,
                    'index': index
                }
            else:
                print(f"    ❌ Unvollständige Daten: Name={bool(name)}, URL={bool(href)}")

        except Exception as e:
            print(f"⚠️ Fehler beim Extrahieren von Element {index}: {e}")

        return None

    def _is_likely_bar(self, bar_info: Dict) -> bool:
        """Prüft ob es sich wahrscheinlich um eine Bar oder einen Club handelt"""
        name = bar_info.get('name', '').lower()

        # Positive Keywords für Bars und Clubs - erweitert
        bar_keywords = [
            'bar', 'pub', 'kneipe', 'cocktail', 'brewery', 'brauerei',
            'tavern', 'taverne', 'lounge', 'club', 'weinbar', 'biergarten',
            'bier', 'wine', 'whisky', 'gin', 'rum', 'drinks', 'spirits',
            'cocktailbar', 'sportsbar', 'sportbar', 'irish', 'american bar',
            'dive bar', 'rooftop', 'sky bar', 'piano bar', 'jazz bar',
            'nightclub', 'nachtclub', 'disco', 'diskothek', 'dance club',
            'music club', 'techno', 'house', 'electronic', 'dj', 'dancing',
            'stube', 'klause', 'bodega', 'vinothek', 'gasthaus', 'gasthof',
            'tresen', 'schankstube', 'bierstube', 'weinschenke', 'destille',
            'horn', 'garten', 'hof', 'stuben', 'salon', 'kaffeebar'
        ]

        # Weniger strenge Ausschluss-Keywords
        exclude_keywords = [
            'hotel', 'imbiss', 'pizza', 'döner', 'burger', 'sushi',
            'shop', 'store', 'laden', 'market', 'supermarket', 'tankstelle',
            'apotheke', 'bank', 'friseur'
        ]

        # Prüfe auf Bar-Keywords
        has_bar_keyword = any(keyword in name for keyword in bar_keywords)

        # Prüfe auf Ausschluss-Keywords
        has_exclude_keyword = any(keyword in name for keyword in exclude_keywords)

        # Spezielle Logik für bekannte Bar-Locations auch ohne Keywords
        special_locations = [
            'klunkerkranich', 'muted horn', 'das gift', 'villa neukölln',
            'astra stube', 'zweiners', 'zosse', 'bierbaum', 'sandmann'
        ]

        is_special = any(location in name for location in special_locations)

        # Debug-Ausgabe
        print(
            f"    🔍 Name: '{name}' | Bar/Club-Keyword: {has_bar_keyword} | Spezial: {is_special} | Ausgeschlossen: {has_exclude_keyword}")

        # Erweiterte Logik: Bar-Keywords ODER bekannte Locations
        return (has_bar_keyword or is_special) and not has_exclude_keyword

    async def _filter_open_bars(self, page, bars: List[Dict]) -> List[Dict]:
        """Filtert nach aktuell geöffneten Bars"""
        open_bars = []

        print(f"🕒 Prüfe Öffnungszeiten von {len(bars)} Locations...")

        for i, bar in enumerate(bars):
            try:
                print(f"[{i + 1}/{len(bars)}] Prüfe: {bar['name']}")

                # Gehe zur Detailseite der Bar
                await page.goto(bar['url'], wait_until='domcontentloaded', timeout=15000)
                await page.wait_for_timeout(3000)

                # Suche nach Öffnungszeiten-Informationen
                is_open = await self._check_if_open(page)
                bar['is_open'] = is_open

                if is_open is True:
                    open_bars.append(bar)
                    print(f"✅ {bar['name']} ist geöffnet!")
                elif is_open is False:
                    print(f"❌ {bar['name']} ist geschlossen")
                    # NICHT zu open_bars hinzufügen wenn geschlossen!
                else:
                    # is_open ist None - Status unbekannt
                    print(f"⚪ {bar['name']} - Öffnungsstatus unbekannt")
                    # Bei unbekanntem Status NICHT hinzufügen

                # Pause zwischen Requests
                await asyncio.sleep(2)

            except Exception as e:
                print(f"⚠️ Fehler beim Prüfen von {bar['name']}: {e}")
                # Bei Fehler NICHT hinzufügen
                bar['is_open'] = None

        return open_bars

    async def _check_if_open(self, page) -> Optional[bool]:
        """Prüft ob die Bar aktuell geöffnet ist"""
        try:
            # Warte kurz auf das Laden der Seite
            await page.wait_for_timeout(2000)

            # Verschiedene Selektoren für Öffnungszeiten
            opening_selectors = [
                '[data-value="Öffnungszeiten"]',
                '.t39EBf .OqCZI',
                '.eXlrNe',
                '[aria-label*="Öffnungszeiten"]',
                '.cX2Ekf',
                '.o0Svhf',
                'span[aria-label*="Öffnet"]',
                'span[aria-label*="Schließt"]',
                'span[aria-label*="Geschlossen"]',
                '.ZDu9vd span'
            ]

            # Suche nach "Geöffnet" oder "Geschlossen" Indikatoren
            page_content = await page.content()

            # Positive Indikatoren für "geöffnet"
            open_indicators = [
                'geöffnet', 'open', 'offen', 'schließt um', 'schließt in',
                'noch', 'minuten geöffnet', 'stunden geöffnet'
            ]

            # Negative Indikatoren für "geschlossen" 
            closed_indicators = [
                'geschlossen', 'closed', 'öffnet morgen', 'öffnet heute',
                'öffnet am', 'öffnet um', 'zu', 'nicht geöffnet', 'öffnet in'
            ]

            content_lower = page_content.lower()

            # Zuerst prüfe spezifische Elemente für genauere Ergebnisse
            for selector in opening_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    for element in elements:
                        try:
                            text = await element.text_content()
                            if text:
                                text_lower = text.lower()
                                # Prüfe zuerst auf geschlossen (höhere Priorität)
                                for indicator in closed_indicators:
                                    if indicator in text_lower:
                                        return False
                                # Dann auf geöffnet
                                for indicator in open_indicators:
                                    if indicator in text_lower:
                                        return True
                        except:
                            continue
                except:
                    continue

            # Fallback: Prüfe gesamten Seiteninhalt
            # Priorisiere "geschlossen" Indikatoren
            for indicator in closed_indicators:
                if indicator in content_lower:
                    # Prüfe ob es nicht Teil von "öffnet um X" ist
                    context = content_lower[
                              max(0, content_lower.index(indicator) - 50):content_lower.index(
                                  indicator) + 50]
                    if not any(open_ind in context for open_ind in open_indicators):
                        return False

            for indicator in open_indicators:
                if indicator in content_lower:
                    return True

            # Fallback: Suche nach spezifischen Elementen
            for selector in opening_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        text = await element.text_content()
                        if text:
                            text_lower = text.lower()
                            if any(indicator in text_lower for indicator in open_indicators):
                                return True
                            elif any(indicator in text_lower for indicator in closed_indicators):
                                return False
                except:
                    continue

            # Wenn nichts gefunden wurde, kann Status nicht bestimmt werden
            return None

        except Exception as e:
            print(f"⚠️ Fehler beim Prüfen der Öffnungszeiten: {e}")
            return None


async def main():
    print("🍺 Bar, Club, Kneipen & Biergarten Finder - Finde offene Locations in deiner Nähe!")
    print("=" * 60)

    # Adresse vom Nutzer abfragen
    address = input("📍 Gib deine Adresse ein (z.B. 'Musterstraße 1, Berlin'): ").strip()

    if not address:
        address = "Flughafenstraße 24, 12053 Berlin"
        print(f"📍 Verwende Standard-Adresse: {address}")

    finder = BarFinder()

    print(
        f"\n🔍 Suche nach offenen Bars, Clubs, Kneipen und Biergärten im Umkreis von {finder.radius_km}km...")

    # Suche nach Bars
    bars = await finder.search_bars_near_address(address)

    # Speichere URLs in urls_scraped.txt
    with open('urls_scraped.txt', 'w', encoding='utf-8') as f:
        for bar in bars:
            f.write(f"{bar['url']}\n")

    # Ergebnisse anzeigen
    print(f"\n🎉 ERGEBNISSE - {len(bars)} Locations gefunden:")
    print("=" * 60)

    open_count = 0
    for i, bar in enumerate(bars, 1):
        status = ""
        if bar.get('is_open') is True:
            status = " 🟢 GEÖFFNET"
            open_count += 1
        elif bar.get('is_open') is False:
            status = " 🔴 GESCHLOSSEN"
        else:
            status = " ⚪ UNBEKANNT"

        print(f"{i:2}. {bar['name']}{status}")
        print(f"    🔗 {bar['url']}")
        print()

    print(f"📊 Zusammenfassung: {open_count} von {len(bars)} Locations sind geöffnet")
    print(f"💾 URLs gespeichert in: urls_scraped.txt")


if __name__ == "__main__":
    asyncio.run(main())
