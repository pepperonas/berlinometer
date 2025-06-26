#!/usr/bin/env python3

import asyncio
from playwright.async_api import async_playwright
import re
from datetime import datetime

async def debug_scrape(url):
    """
    Debug-Version des Scrapers - speichert Screenshots und HTML
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,  # Sichtbar für Debugging
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()

        try:
            print(f"📍 Lade: {url}")
            await page.goto(url, wait_until='networkidle', timeout=30000)

            # Screenshot nach dem Laden
            await page.screenshot(path='debug_after_load.png')
            print("📸 Screenshot gespeichert: debug_after_load.png")

            # Warte auf Cookie-Banner und schließe ihn
            print("🍪 Warte auf Cookie-Banner...")
            await page.wait_for_timeout(3000)
            
            try:
                # Versuche Cookie-Banner zu schließen
                cookie_buttons = await page.query_selector_all('button')
                for button in cookie_buttons:
                    text = await button.text_content()
                    if text and any(word in text.lower() for word in ['accept', 'akzeptieren', 'alle', 'zustimmen']):
                        await button.click()
                        print(f"✅ Cookie-Button geklickt: {text}")
                        break
                        
                await page.wait_for_timeout(3000)
            except:
                pass

            # Screenshot nach Cookie-Behandlung
            await page.screenshot(path='debug_after_cookies.png')
            print("📸 Screenshot gespeichert: debug_after_cookies.png")

            # Speichere HTML für Analyse
            content = await page.content()
            with open('debug_page_content.html', 'w', encoding='utf-8') as f:
                f.write(content)
            print("💾 HTML gespeichert: debug_page_content.html")

            # Versuche verschiedene Name-Selektoren
            print("\n🔍 Suche Location-Name...")
            name_selectors = [
                'h1',
                '[data-attrid="title"]',
                '.DUwDvf',
                '.fontHeadlineLarge',
                '[role="main"] h1',
                'h1.x3AX1-LfntMc-header-title-title',
                'h1[class*="fontHeadline"]'
            ]
            
            for selector in name_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    for i, element in enumerate(elements):
                        text = await element.text_content()
                        if text and text.strip():
                            print(f"  {selector}[{i}]: '{text.strip()}'")
                except Exception as e:
                    print(f"  {selector}: ERROR - {e}")

            # Warte noch etwas länger
            print("\n⏳ Warte weitere 5 Sekunden...")
            await page.wait_for_timeout(5000)

            # Finaler Screenshot
            await page.screenshot(path='debug_final.png')
            print("📸 Finaler Screenshot: debug_final.png")

            # Titel der Seite
            title = await page.title()
            print(f"\n📖 Seitentitel: {title}")

            # Suche alle h1 Elemente
            h1_elements = await page.query_selector_all('h1')
            print(f"\n📝 Gefundene H1-Elemente: {len(h1_elements)}")
            for i, h1 in enumerate(h1_elements):
                text = await h1.text_content()
                print(f"  H1[{i}]: '{text}'")

            # Warte auf Benutzer-Input um Browser offen zu halten
            input("\n⏸️  Drücke Enter um fortzufahren...")

        except Exception as e:
            print(f"❌ Fehler: {e}")
        finally:
            await browser.close()

async def main():
    # Test mit der ersten URL
    test_url = "https://www.google.de/maps/place/Majestic+-+Caf%C3%A9+%26+Cocktailbar/@52.4836184,13.426421,16z/data=!4m10!1m2!2m1!1sbar!3m6!1s0x47a84f6e51648823:0x6986bef12d8acdb!8m2!3d52.4827079!4d13.431962!15sCgNiYXJzWgYiBGJhcnOSAQNiYXKqATYQASoIIgRiYXJzKAUyHhABIhr1YsOeeuz9pPLCXbmL2X-3_jbHIKEgInT2-zIHEAIiA2JhcuABAA!16s%2Fg%2F11trlr2rt6!5m1!1e4?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D"
    
    await debug_scrape(test_url)

if __name__ == "__main__":
    asyncio.run(main())