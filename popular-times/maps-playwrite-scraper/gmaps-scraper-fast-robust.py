#!/usr/bin/env python3

import asyncio
import csv
import json
import os
import random
import re
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from playwright.async_api import async_playwright


async def scrape_live_occupancy(page, url, location_name_from_csv=None, semaphore=None):
	"""
	Scrapt Live-Auslastungsdaten von Google Maps mit wiederverwendbarer Page
	"""
	start_time = time.time()
	retries = 0
	max_retries = 3

	# Semaphore für Rate Limiting
	if semaphore:
		async with semaphore:
			return await _scrape_with_retry(page, url, location_name_from_csv, start_time, max_retries)
	else:
		return await _scrape_with_retry(page, url, location_name_from_csv, start_time, max_retries)


async def _scrape_with_retry(page, url, location_name_from_csv, start_time, max_retries):
	"""
	Interner Scraping-Prozess mit Retry-Logik
	"""
	retries = 0
	last_error = None

	while retries <= max_retries:
		try:
			return await _perform_scraping(page, url, location_name_from_csv, start_time, retries)
		except Exception as e:
			last_error = e
			retries += 1
			if retries <= max_retries:
				# Exponential backoff mit Jitter
				backoff_time = (2 ** retries) + random.uniform(0, 1)
				print(f"⚠️  Retry {retries}/{max_retries} nach {backoff_time:.1f}s für {url}")
				await asyncio.sleep(backoff_time)
			else:
				print(f"❌ Alle Retries fehlgeschlagen für {url}: {last_error}")

	# Alle Retries fehlgeschlagen
	processing_time = time.time() - start_time
	return {
		'location_name': location_name_from_csv,
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


async def _perform_scraping(page, url, location_name_from_csv, start_time, retries):
	"""
	Führt das eigentliche Scraping durch
	"""

	print(f"📍 Lade Google Maps: {url}")
	await page.goto(url, wait_until='domcontentloaded', timeout=30000)

	print("🍪 Prüfe Cookie-Banner...")
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
					print("✅ Cookie-Banner akzeptiert")
					await page.wait_for_timeout(1500)
					break
			except:
				continue
	except:
		pass

	print("⏳ Warte auf Maps-Inhalte...")
	# Intelligentes Warten auf Content
	try:
		await page.wait_for_selector('[data-value="Bewertungen"], h1[data-attrid="title"], h1.DUwDvf', timeout=8000)
	except:
		await page.wait_for_timeout(3000)  # Fallback

	print("🔍 Suche Live-Auslastung...")
	live_data = None
	is_live_data = False

	# Performance: Hole Content nur einmal
	page_content = await page.content()

	# 1. Optimierte Live-Indikator Suche
	if any(pattern in page_content for pattern in ['>Live<', 'aria-label="Live"', 'Live-Daten']):
		is_live_data = True
		print("✅ Live-Indikator gefunden")

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
							print(f"✅ Live-Daten gefunden: {live_data}")
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
			print(f"📊 Historische Daten verarbeitet: {live_data}")

	# 3. Verbesserte Chart-Daten Extraktion
	if not live_data:
		chart_data = await extract_chart_occupancy(page)
		if chart_data:
			live_data, is_live_data = chart_data
			print(f"📊 Chart-Daten extrahiert: {live_data}")

	# 4. Optimierte Regex-basierte Suche
	if not live_data:
		live_data = extract_occupancy_with_regex(page_content, is_live_data)
		if live_data:
			print(f"✅ Regex-Extraktion: {live_data}")

	# 5. Robuster Fallback
	if not live_data:
		print("🔄 Fallback-Suche...")
		live_data = await fallback_occupancy_search(page)
		if live_data:
			print(f"📊 Fallback erfolgreich: {live_data}")

	print("📍 Extrahiere Location-Daten...")
	location_data = await extract_location_data_parallel(page)
	location_name = location_data.get('name') or location_name_from_csv
	address = location_data.get('address')
	rating = location_data.get('rating')

	if location_name:
		print(f"📍 Location gefunden: {location_name}")

	processing_time = time.time() - start_time
	print(
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


def validate_occupancy_text(text: str) -> bool:
	"""
	Validiert ob ein Text Auslastungsdaten enthält
	"""
	if not text or len(text.strip()) < 5:
		return False

	# Prüfe auf relevante Keywords
	keywords = ['ausgelastet', 'derzeit', 'um ', '%', 'live', 'occupancy']
	return any(keyword in text.lower() for keyword in keywords)


def clean_occupancy_text(text: str) -> str:
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


async def extract_historical_occupancy(page) -> Optional[Tuple[str, bool]]:
	"""
	Extrahiert historische Auslastungsdaten mit verbesserter Logik
	"""
	try:
		historical_elements = await page.query_selector_all('[aria-label*="Um "], [aria-label*="um "]')

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


async def extract_chart_occupancy(page) -> Optional[Tuple[str, bool]]:
	"""
	Verbesserte Chart-Daten Extraktion mit robusteren Selektoren
	"""
	try:
		print("🔍 Suche aktuelle Auslastung im Diagramm...")

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


def extract_occupancy_with_regex(page_content: str, is_live_data: bool) -> Optional[str]:
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


async def fallback_occupancy_search(page) -> Optional[str]:
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
									percent_match = re.search(r'(\d+)\s*%\s*ausgelastet', text, re.IGNORECASE)
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


async def extract_location_data_parallel(page) -> Dict[str, Optional[str]]:
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


def load_locations_from_csv():
	"""
	Lädt Location-Daten aus ../default-locations.csv mit neuer 3-Spalten-Struktur
	"""
	# Pfad zur CSV-Datei im übergeordneten Verzeichnis
	csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'default-locations.csv')
	
	if not os.path.exists(csv_path):
		print(f"❌ default-locations.csv nicht gefunden unter: {csv_path}")
		return None

	try:
		locations = []
		with open(csv_path, 'r', encoding='utf-8') as f:
			csv_reader = csv.reader(f, delimiter=';')

			# Header überspringen
			next(csv_reader, None)

			for line_num, row in enumerate(csv_reader, 2):  # Start bei 2 wegen Header
				if len(row) >= 3:
					aktiv = row[0].strip().strip('"')
					name = row[1].strip().strip('"')
					url = row[2].strip().strip('"')

					# Nur aktive Locations (Aktiv = "1") laden
					if aktiv == "1" and name and url and url.startswith('https://'):
						locations.append({
							'name': name,
							'url': url
						})
					elif aktiv != "1" and aktiv != "0":
						print(f"⚠️  Zeile {line_num}: Ungültiger Aktiv-Status '{aktiv}', erwartet '1' oder '0': {row}")
				else:
					print(f"⚠️  Zeile {line_num}: Nicht genügend Spalten (erwartet 3): {row}")

		if locations:
			print(f"📄 {len(locations)} aktive Locations aus default-locations.csv geladen")
			return locations
		else:
			print("❌ Keine aktiven Locations in default-locations.csv gefunden")
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


async def create_browser_context():
	"""
	Erstellt optimierten Browser-Context für Wiederverwendung
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
	Erstellt optimierte Page mit erweiterten Resource-Blocking
	"""
	page = await context.new_page()

	# Erweiterte Resource-Blockierung
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
		"**/*.js"  # JavaScript (aggressive)
	]

	for resource_pattern in blocked_resources:
		await page.route(resource_pattern, lambda route: route.abort())

	return page


async def process_batch_concurrent(locations_batch: List[Dict], context, semaphore, batch_id: int):
	"""
	Verarbeitet einen Batch von Locations concurrent
	"""
	print(f"🔄 Batch {batch_id}: Starte {len(locations_batch)} Locations...")

	# Erstelle Pages für den Batch
	pages = []
	for _ in range(len(locations_batch)):
		page = await setup_page_with_blocking(context)
		pages.append(page)

	try:
		# Concurrent processing mit semaphore
		tasks = [
			scrape_live_occupancy(
				pages[i],
				location['url'],
				location['name'],
				semaphore
			)
			for i, location in enumerate(locations_batch)
		]

		results = await asyncio.gather(*tasks, return_exceptions=True)

		# Exception handling
		processed_results = []
		for i, result in enumerate(results):
			if isinstance(result, Exception):
				print(f"❌ Batch {batch_id}, Location {i}: {result}")
				processed_results.append({
					'location_name': locations_batch[i]['name'],
					'error': str(result),
					'statistics': {'success': False, 'processing_time_seconds': 0, 'retries_needed': 0},
					'url': locations_batch[i]['url'],
					'timestamp': datetime.now().isoformat(),
					'live_occupancy': None,
					'is_live_data': False,
					'address': None,
					'rating': None
				})
			else:
				processed_results.append(result)

		print(
			f"✅ Batch {batch_id} abgeschlossen: {len([r for r in processed_results if r.get('statistics', {}).get('success', False)])}/{len(locations_batch)} erfolgreich")
		return processed_results

	finally:
		# Cleanup pages
		for page in pages:
			try:
				await page.close()
			except:
				pass


async def process_locations(locations):
	"""
	Verarbeitet alle Locations mit optimierter Concurrent-Strategie
	"""
	total = len(locations)
	total_start_time = time.time()
	results = []  # Initialize results

	print(f"\n🚀 Starte optimiertes Scraping von {total} Locations...")
	print("=" * 60)

	# Browser-Context erstellen
	playwright, browser, context = await create_browser_context()

	try:
		# Konfiguration
		batch_size = 5  # Locations pro Batch (balance zwischen Speed und Stabilität)
		max_concurrent = 10  # Maximale concurrent Batches

		# Semaphore für Rate Limiting
		semaphore = asyncio.Semaphore(max_concurrent)

		# Locations in Batches aufteilen
		batches = [locations[i:i + batch_size] for i in range(0, len(locations), batch_size)]
		print(f"📦 Verarbeitung in {len(batches)} Batches zu je {batch_size} Locations")

		# Batches concurrent verarbeiten
		all_results = []
		batch_tasks = []

		for batch_id, batch in enumerate(batches, 1):
			task = process_batch_concurrent(batch, context, semaphore, batch_id)
			batch_tasks.append(task)

			# Starte nicht zu viele Batches gleichzeitig
			if len(batch_tasks) >= max_concurrent or batch_id == len(batches):
				batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)

				for batch_result in batch_results:
					if isinstance(batch_result, Exception):
						print(f"❌ Batch-Fehler: {batch_result}")
					elif isinstance(batch_result, list):
						all_results.extend(batch_result)

				batch_tasks = []

				# Kurze Pause zwischen Batch-Gruppen
				if batch_id < len(batches):
					print("⏳ Pause zwischen Batch-Gruppen...")
					await asyncio.sleep(2)

		results = all_results

	except Exception as e:
		print(f"❌ Kritischer Fehler in process_locations: {e}")
		results = []

	finally:
		# Cleanup
		try:
			await context.close()
			await browser.close()
			await playwright.stop()
		except:
			pass

	# Gesamtstatistiken berechnen
	total_execution_time = time.time() - total_start_time
	successful_requests = [r for r in results if r.get('statistics', {}).get('success', False)]
	failed_requests = [r for r in results if not r.get('statistics', {}).get('success', False)]

	# Korrekte Berechnung für Batch-Processing
	# Durchschnittliche Zeit pro Location = Gesamtzeit / Anzahl Locations
	# (da Locations parallel verarbeitet werden)
	avg_time_per_location = total_execution_time / total if total > 0 else 0

	# Sammle individuelle Zeiten nur für Info-Zwecke
	individual_processing_times = [r.get('statistics', {}).get('processing_time_seconds', 0) for r in results]
	max_individual_time = max(individual_processing_times) if individual_processing_times else 0
	min_individual_time = min(individual_processing_times) if individual_processing_times else 0

	total_retries = sum(r.get('statistics', {}).get('retries_needed', 0) for r in results)

	# Erstelle finales JSON mit korrigierten Statistiken
	final_data = {
		'metadata': {
			'total_locations': total,
			'successful_requests': len(successful_requests),
			'failed_requests': len(failed_requests),
			'success_rate_percent': round((len(successful_requests) / total) * 100, 1) if total > 0 else 0,
			'total_execution_time_seconds': round(total_execution_time, 2),
			'average_time_per_location_seconds': round(avg_time_per_location, 2),
			'longest_individual_request_seconds': round(max_individual_time, 2),
			'shortest_individual_request_seconds': round(min_individual_time, 2),
			'total_retries_needed': total_retries,
			'scraping_timestamp': datetime.now().isoformat(),
			'locations_per_minute': round((total / (total_execution_time / 60)), 1) if total_execution_time > 0 else 0,
			'processing_method': 'concurrent_batches',
			'batch_size': 3,
			'max_concurrent_batches': 2
		},
		'locations': results
	}

	# Ergebnisse in JSON speichern (kompatibel mit Webapp-Format)
	# Erstelle Ordner falls nicht vorhanden
	script_dir = os.path.dirname(os.path.abspath(__file__))
	parent_dir = os.path.dirname(script_dir)
	scraping_dir = os.path.join(parent_dir, "popular-times-scrapings")
	os.makedirs(scraping_dir, exist_ok=True)
	
	timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
	
	# Webapp-kompatibles Format
	webapp_data = {
		"timestamp": datetime.now().isoformat(),
		"total_locations": final_data['metadata']['total_locations'],
		"successful_scrapes": final_data['metadata']['successful_requests'],
		"search_params": {"source": "cronjob", "type": "default_locations"},
		"results": final_data['locations']
	}
	
	# Speichere beide Formate
	# 1. Webapp-kompatible minifizierte JSON
	webapp_filename = f"scraping_{timestamp}.json"
	webapp_filepath = os.path.join(scraping_dir, webapp_filename)
	with open(webapp_filepath, 'w', encoding='utf-8') as f:
		json.dump(webapp_data, f, ensure_ascii=False, separators=(',', ':'))
	
	# 2. Original-Format für Kompatibilität
	json_filename = f"occupancy_data_{timestamp}.json"
	with open(json_filename, 'w', encoding='utf-8') as f:
		json.dump(final_data, f, indent=2, ensure_ascii=False)

	print(f"\n💾 Ergebnisse gespeichert:")
	print(f"   📱 Webapp-Format: {webapp_filepath}")
	print(f"   📄 Original-Format: {json_filename}")

	# Info über HTML Template
	print(f"📊 Für HTML-Report öffne: report-template.html")
	print(f"   Oder direkt mit JSON: report-template.html?json={json_filename}")

	# Erweiterte Zusammenfassung mit korrigierten Metriken
	print(f"\n📈 PERFORMANCE-STATISTIKEN:")
	print("=" * 50)
	print(f"⏱️  Gesamtausführung: {total_execution_time:.1f}s")
	print(f"📊 Erfolgsrate: {len(successful_requests)}/{total} ({(len(successful_requests) / total) * 100:.1f}%)")
	print(f"⚡ Durchschnittliche Zeit pro Location: {avg_time_per_location:.2f}s (concurrent)")
	print(f"📏 Längste einzelne Anfrage: {max_individual_time:.2f}s")
	print(f"📏 Kürzeste einzelne Anfrage: {min_individual_time:.2f}s")
	print(f"🔄 Wiederholungen insgesamt: {total_retries}")
	print(f"🚀 Locations pro Minute: {(total / (total_execution_time / 60)):.1f}")
	print(f"🔧 Verarbeitungsmethode: Concurrent Batches (3er-Batches, max 2 parallel)")
	if failed_requests:
		print(f"❌ Fehlgeschlagene Locations: {len(failed_requests)}")

	# Zusammenfassung anzeigen
	print("\n📊 LOCATION-ZUSAMMENFASSUNG:")
	print("=" * 40)
	for result in results:
		name = result.get('location_name') or 'Unbekannt'
		occupancy = result.get('live_occupancy') or 'Nicht verfügbar'
		is_live = result.get('is_live_data', False)
		individual_time = result.get('statistics', {}).get('processing_time_seconds', 0)
		live_indicator = " 🔴 LIVE" if is_live else " ⚫ Nicht Live"

		if result.get('error'):
			print(f"❌ {name}: Fehler (einzeln: {individual_time:.1f}s)")
		else:
			print(f"✅ {name}: {occupancy}{live_indicator} (einzeln: {individual_time:.1f}s)")


async def main():
	print("🗺️  Google Maps Live-Auslastung Scraper")
	print("=" * 50)

	locations = load_locations_from_csv()

	if locations:
		await process_locations(locations)
	else:
		print("Keine Locations zu verarbeiten.")


if __name__ == "__main__":
	asyncio.run(main())
