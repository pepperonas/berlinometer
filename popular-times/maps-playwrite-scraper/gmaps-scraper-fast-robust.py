#!/usr/bin/env python3

import asyncio
from playwright.async_api import async_playwright
import re
import json
import os
from datetime import datetime
import time


async def scrape_live_occupancy(url):
	"""
	Scrapt Live-Auslastungsdaten von Google Maps
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
			print(f"📍 Lade Google Maps: {url}")
			await page.goto(url, wait_until='domcontentloaded', timeout=30000)  # Schneller laden

			print("🍪 Prüfe Cookie-Banner...")
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
							print("✅ Cookie-Banner akzeptiert")
							cookie_handled = True
							break
					except:
						continue

				if cookie_handled:
					await page.wait_for_timeout(2000)  # Reduziert von 5000ms
			except:
				pass

			print("⏳ Warte auf Maps-Inhalte...")
			await page.wait_for_timeout(5000)  # Reduziert von 10000ms

			print("🔍 Suche Live-Auslastung...")
			live_data = None
			is_live_data = False

			# Performance: Hole Content nur einmal
			page_content = await page.content()

			# 1. Schnelle Text-Suche nach Live-Indikator
			if '>Live<' in page_content:
				is_live_data = True
				print("✅ Live-Indikator gefunden")

			# 2. Aria-label Suche optimiert - nur relevante Elemente
			if not live_data:
				derzeit_elements = await page.query_selector_all('[aria-label*="Derzeit"], [aria-label*="derzeit"]')
				for element in derzeit_elements[:5]:  # Limitiere auf erste 5
					try:
						aria_label = await element.get_attribute('aria-label')
						if aria_label:
							live_data = aria_label.replace('&nbsp;', ' ')
							is_live_data = True
							print(f"✅ Live-Daten gefunden: {live_data}")
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
					print(f"✅ Live-Status: {live_data}")

				# Prozent-Pattern
				elif not live_data:
					percent_match = re.search(r'(\d+)%[^<]*ausgelastet', page_content, re.IGNORECASE)
					if percent_match:
						percentage = percent_match.group(1)
						live_data = f"{percentage}% ausgelastet"
						print(f"📊 Auslastung: {live_data}")

			# 4. Fallback nur wenn nötig
			if not live_data:
				print("🔄 Fallback-Suche...")
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

			print("📍 Extrahiere Location-Daten...")
			# Performance: Parallele Suche nach allen Daten
			location_name = None
			address = None
			rating = None

			# Alle Selektoren parallel abfragen
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
							print(f"📍 Location gefunden: {location_name}")
							break
					except:
						pass

			# Address extrahieren (Index 3)
			if len(results) > 3 and results[3] and not isinstance(results[3], Exception):
				try:
					address = await results[3].text_content()
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
				except:
					pass

			print(f"✅ Scraping abgeschlossen für: {location_name or 'Unbekannte Location'}")
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
			print(f"❌ Fehler bei {url}: {e}")
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


def load_urls_from_file():
	"""
	Lädt URLs aus urls.txt Datei
	"""
	if not os.path.exists('urls.txt'):
		return None

	try:
		with open('urls.txt', 'r', encoding='utf-8') as f:
			urls = []
			for line_num, line in enumerate(f, 1):
				line = line.strip()
				if line and not line.startswith('#'):  # Ignoriere leere Zeilen und Kommentare
					if line.startswith('https://'):
						urls.append(line)
					else:
						print(f"⚠️  Zeile {line_num}: Ungültige URL ignoriert: {line}")

			if urls:
				print(f"📄 {len(urls)} URLs aus urls.txt geladen")
				return urls
			else:
				print("❌ Keine gültigen URLs in urls.txt gefunden")
				return None

	except Exception as e:
		print(f"❌ Fehler beim Lesen von urls.txt: {e}")
		return None


def collect_urls():
	"""
	Sammelt URLs - erst aus Datei, dann manuell
	"""
	# Erst versuchen URLs aus Datei zu laden
	urls = load_urls_from_file()
	if urls:
		return urls

	# Fallback: Manuelle Eingabe
	print("📄 urls.txt nicht gefunden - manuelle Eingabe:")
	urls = []
	print("🔗 Gib die Google Maps URLs ein (eine pro Zeile):")
	print("   Zum Starten 'go' oder 'start' eingeben")
	print("   Zum Beenden 'quit' oder 'exit' eingeben")
	print("-" * 50)

	while True:
		user_input = input("URL: ").strip()

		if user_input.lower() in ['go', 'start']:
			if urls:
				return urls
			else:
				print("❌ Keine URLs eingegeben!")
				continue

		if user_input.lower() in ['quit', 'exit']:
			print("👋 Programm beendet")
			return None

		if user_input.startswith('https://'):
			urls.append(user_input)
			print(f"✅ URL hinzugefügt ({len(urls)} gesamt)")
		elif user_input:
			print("❌ Ungültige URL (muss mit https:// beginnen)")


async def process_locations(urls):
	"""
	Verarbeitet alle URLs und speichert Ergebnisse
	"""
	results = []
	total = len(urls)

	print(f"\n🚀 Starte Scraping von {total} Locations...")
	print("=" * 60)

	for i, url in enumerate(urls, 1):
		print(f"\n[{i}/{total}] Processing Location {i}...")
		result = await scrape_live_occupancy(url)
		results.append(result)

		# Kurze Pause zwischen Requests
		if i < total:
			print("⏳ Pause zwischen Requests...")
			await asyncio.sleep(5)  # Längere Pause

	# Ergebnisse in JSON speichern
	filename = f"occupancy_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

	with open(filename, 'w', encoding='utf-8') as f:
		json.dump(results, f, indent=2, ensure_ascii=False)

	print(f"\n💾 Ergebnisse gespeichert in: {filename}")

	# Zusammenfassung anzeigen
	print("\n📊 ZUSAMMENFASSUNG:")
	print("=" * 40)
	for result in results:
		name = result.get('location_name') or 'Unbekannt'
		occupancy = result.get('live_occupancy') or 'Nicht verfügbar'
		is_live = result.get('is_live_data', False)
		live_indicator = " 🔴 LIVE" if is_live else " ⚫ Nicht Live"

		if result.get('error'):
			print(f"❌ {name}: Fehler")
		else:
			print(f"✅ {name}: {occupancy}{live_indicator}")


async def main():
	print("🗺️  Google Maps Live-Auslastung Scraper")
	print("=" * 50)

	urls = collect_urls()

	if urls:
		await process_locations(urls)
	else:
		print("Keine URLs zu verarbeiten.")


if __name__ == "__main__":
	asyncio.run(main())