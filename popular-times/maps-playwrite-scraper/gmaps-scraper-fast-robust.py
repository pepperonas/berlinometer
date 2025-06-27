#!/usr/bin/env python3

import asyncio
from playwright.async_api import async_playwright
import re
import json
import os
import csv
from datetime import datetime
import time


async def scrape_live_occupancy(url, location_name_from_csv=None):
	"""
	Scrapt Live-Auslastungsdaten von Google Maps
	"""
	start_time = time.time()
	retries = 0
	max_retries = 3
	
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
				
				# Suche auch nach historischen Daten
				if not live_data:
					historical_elements = await page.query_selector_all('[aria-label*="Um "], [aria-label*="um "]')
					for element in historical_elements[:5]:
						try:
							aria_label = await element.get_attribute('aria-label')
							if aria_label and 'ausgelastet' in aria_label.lower():
								# Extrahiere nur Auslastungsprozent, ersetze historische Zeit
								percent_match = re.search(r'(\d+)\s*%\s*ausgelastet', aria_label, re.IGNORECASE)
								if percent_match:
									current_time = datetime.now().strftime('%H:%M')
									live_data = f"Um {current_time} Uhr zu {percent_match.group(1)} % ausgelastet"
									is_live_data = False
									print(f"📊 Historische Daten mit aktueller Zeit: {live_data}")
									break
						except:
							pass

			# 3. Suche nach aktueller Auslastung im Chart/Diagramm
			if not live_data:
				try:
					# Suche nach dem aktuellen Zeitpunkt im Stoßzeiten-Chart
					print("🔍 Suche aktuelle Auslastung im Diagramm...")
					chart_elements = await page.query_selector_all('[aria-label*="Uhr"]')
					current_hour = datetime.now().hour
					
					for element in chart_elements:
						try:
							aria_label = await element.get_attribute('aria-label')
							if aria_label and f"{current_hour:02d} Uhr" in aria_label:
								# Extrahiere Auslastung für aktuelle Stunde
								percent_match = re.search(r'(\d+)\s*%', aria_label)
								if percent_match:
									current_time = datetime.now().strftime('%H:%M')
									percentage = percent_match.group(1)
									live_data = f"Um {current_time} Uhr zu {percentage} % ausgelastet"
									is_live_data = False
									print(f"📊 Aktuelle Auslastung aus Diagramm: {live_data}")
									break
						except:
							continue
				except:
					pass

			# 4. Regex-basierte Suche (sehr schnell)
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
						current_time = datetime.now().strftime('%H:%M')
						live_data = f"Um {current_time} Uhr zu {percentage} % ausgelastet"
						print(f"📊 Auslastung: {live_data}")

			# 5. Fallback nur wenn nötig
			if not live_data:
				print("🔄 Fallback-Suche...")
				ausgelastet_elements = await page.query_selector_all('[aria-label*="ausgelastet"]')
				for element in ausgelastet_elements[:3]:  # Nur erste 3 prüfen
					try:
						aria_label = await element.get_attribute('aria-label')
						if aria_label and ('derzeit' in aria_label.lower() or 'um ' in aria_label.lower()):
							# Für historische Daten: Uhrzeit durch aktuelle Zeit ersetzen
							if 'um ' in aria_label.lower() and 'derzeit' not in aria_label.lower():
								# Extrahiere nur den Auslastungsprozent, ersetze historische Zeit
								percent_match = re.search(r'(\d+)\s*%\s*ausgelastet', aria_label, re.IGNORECASE)
								if percent_match:
									current_time = datetime.now().strftime('%H:%M')
									live_data = f"Um {current_time} Uhr zu {percent_match.group(1)} % ausgelastet"
								else:
									current_time = datetime.now().strftime('%H:%M')
									live_data = f"Um {current_time} Uhr - Historische Daten verfügbar"
								is_live_data = False
								print(f"📊 Fallback: Historische Daten mit aktueller Zeit: {live_data}")
							else:
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

			processing_time = time.time() - start_time
			print(f"✅ Scraping abgeschlossen für: {location_name or location_name_from_csv or 'Unbekannte Location'} ({processing_time:.2f}s)")
			
			result = {
				'location_name': location_name or location_name_from_csv,
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

		except Exception as e:
			processing_time = time.time() - start_time
			print(f"❌ Fehler bei {url}: {e} ({processing_time:.2f}s)")
			return {
				'location_name': location_name_from_csv,
				'address': None,
				'rating': None,
				'live_occupancy': None,
				'is_live_data': False,
				'url': url,
				'timestamp': datetime.now().isoformat(),
				'error': str(e),
				'statistics': {
					'processing_time_seconds': round(processing_time, 2),
					'retries_needed': retries,
					'success': False
				}
			}

		finally:
			await browser.close()


def load_locations_from_csv():
	"""
	Lädt Location-Daten aus default-locations.csv
	"""
	if not os.path.exists('default-locations.csv'):
		print("❌ default-locations.csv nicht gefunden")
		return None

	try:
		locations = []
		with open('default-locations.csv', 'r', encoding='utf-8') as f:
			csv_reader = csv.reader(f, delimiter=';')
			
			# Header überspringen
			next(csv_reader, None)
			
			for line_num, row in enumerate(csv_reader, 2):  # Start bei 2 wegen Header
				if len(row) >= 2:
					name = row[0].strip().strip('"')
					url = row[1].strip().strip('"')
					
					if name and url and url.startswith('https://'):
						locations.append({
							'name': name,
							'url': url
						})
					else:
						print(f"⚠️  Zeile {line_num}: Ungültige Daten ignoriert: {row}")

		if locations:
			print(f"📄 {len(locations)} Locations aus default-locations.csv geladen")
			return locations
		else:
			print("❌ Keine gültigen Locations in default-locations.csv gefunden")
			return None

	except Exception as e:
		print(f"❌ Fehler beim Lesen von default-locations.csv: {e}")
		return None


def extract_occupancy_numbers(live_occupancy_text):
	"""
	Extrahiert aktuelle und normale Auslastungswerte aus dem Text
	"""
	if not live_occupancy_text:
		return None, None
	
	# Pattern für "Derzeit zu X % ausgelastet; normal sind Y %."
	current_match = re.search(r'derzeit\s+zu\s+(\d+)\s*%\s*ausgelastet', live_occupancy_text, re.IGNORECASE)
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


async def process_locations(locations):
	"""
	Verarbeitet alle Locations und speichert Ergebnisse
	"""
	results = []
	total = len(locations)
	total_start_time = time.time()

	print(f"\n🚀 Starte Scraping von {total} Locations...")
	print("=" * 60)

	for i, location in enumerate(locations, 1):
		name = location['name']
		url = location['url']
		print(f"\n[{i}/{total}] Processing: {name}...")
		result = await scrape_live_occupancy(url, name)
		
		results.append(result)

		# Kurze Pause zwischen Requests
		if i < total:
			print("⏳ Pause zwischen Requests...")
			await asyncio.sleep(5)  # Längere Pause

	# Gesamtstatistiken berechnen
	total_execution_time = time.time() - total_start_time
	successful_requests = [r for r in results if r.get('statistics', {}).get('success', False)]
	failed_requests = [r for r in results if not r.get('statistics', {}).get('success', False)]
	
	processing_times = [r.get('statistics', {}).get('processing_time_seconds', 0) for r in results]
	avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
	total_retries = sum(r.get('statistics', {}).get('retries_needed', 0) for r in results)
	
	# Erstelle finales JSON mit Gesamtstatistiken
	final_data = {
		'metadata': {
			'total_locations': total,
			'successful_requests': len(successful_requests),
			'failed_requests': len(failed_requests),
			'success_rate_percent': round((len(successful_requests) / total) * 100, 1) if total > 0 else 0,
			'total_execution_time_seconds': round(total_execution_time, 2),
			'average_processing_time_seconds': round(avg_processing_time, 2),
			'total_retries_needed': total_retries,
			'scraping_timestamp': datetime.now().isoformat(),
			'locations_per_minute': round((total / (total_execution_time / 60)), 1) if total_execution_time > 0 else 0
		},
		'locations': results
	}

	# Ergebnisse in JSON speichern
	timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
	json_filename = f"occupancy_data_{timestamp}.json"

	with open(json_filename, 'w', encoding='utf-8') as f:
		json.dump(final_data, f, indent=2, ensure_ascii=False)

	print(f"\n💾 Ergebnisse gespeichert in: {json_filename}")

	# Info über HTML Template
	print(f"📊 Für HTML-Report öffne: report-template.html")
	print(f"   Oder direkt mit JSON: report-template.html?json={json_filename}")
	
	# Erweiterte Zusammenfassung
	print(f"\n📈 PERFORMANCE-STATISTIKEN:")
	print("=" * 50)
	print(f"⏱️  Gesamtausführung: {total_execution_time:.1f}s")
	print(f"📊 Erfolgsrate: {len(successful_requests)}/{total} ({(len(successful_requests)/total)*100:.1f}%)")
	print(f"⚡ Durchschnittliche Verarbeitungszeit: {avg_processing_time:.2f}s")
	print(f"🔄 Wiederholungen insgesamt: {total_retries}")
	print(f"🚀 Locations pro Minute: {(total / (total_execution_time / 60)):.1f}")
	if failed_requests:
		print(f"❌ Fehlgeschlagene Locations: {len(failed_requests)}")

	# Zusammenfassung anzeigen
	print("\n📊 LOCATION-ZUSAMMENFASSUNG:")
	print("=" * 40)
	for result in results:
		name = result.get('location_name') or 'Unbekannt'
		occupancy = result.get('live_occupancy') or 'Nicht verfügbar'
		is_live = result.get('is_live_data', False)
		processing_time = result.get('statistics', {}).get('processing_time_seconds', 0)
		live_indicator = " 🔴 LIVE" if is_live else " ⚫ Nicht Live"

		if result.get('error'):
			print(f"❌ {name}: Fehler ({processing_time:.1f}s)")
		else:
			print(f"✅ {name}: {occupancy}{live_indicator} ({processing_time:.1f}s)")



async def main():
	import sys
	
	# Check if URL is provided as command line argument (for server usage)
	if len(sys.argv) > 1:
		url = sys.argv[1]
		# Single URL mode - return JSON for server integration
		result = await scrape_live_occupancy(url)
		# Output JSON to stdout for server to parse
		print(json.dumps(result))
		return
	
	# Default CSV mode
	print("🗺️  Google Maps Live-Auslastung Scraper")
	print("=" * 50)

	locations = load_locations_from_csv()

	if locations:
		await process_locations(locations)
	else:
		print("Keine Locations zu verarbeiten.")


if __name__ == "__main__":
	asyncio.run(main())