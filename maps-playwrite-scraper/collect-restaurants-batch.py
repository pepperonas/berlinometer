#!/usr/bin/env python3
"""
Batch collector — runs multiple search query variations across Berlin districts
to find a large number of unique restaurants. Deduplicates by google_maps_url.

Usage:
    python3 collect-restaurants-batch.py                    # Full run
    python3 collect-restaurants-batch.py --dry-run          # Print only
    python3 collect-restaurants-batch.py --target 2000      # Custom target
"""

import argparse
import asyncio
import json
import os
import random
import sys
import time
from datetime import datetime
from urllib.parse import quote_plus

import mysql.connector
from playwright.async_api import async_playwright
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

db_config = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', ''),
    'database': os.getenv('MYSQL_DATABASE', 'popular_times_db'),
    'port': int(os.getenv('MYSQL_PORT', '3306'))
}

DISTRICTS = [
    'Mitte', 'Kreuzberg', 'Neukölln', 'Friedrichshain', 'Prenzlauer Berg',
    'Charlottenburg', 'Schöneberg', 'Wedding', 'Moabit', 'Tempelhof',
    'Steglitz', 'Zehlendorf', 'Wilmersdorf', 'Lichtenberg', 'Pankow',
    'Treptow', 'Köpenick', 'Reinickendorf', 'Spandau', 'Tiergarten',
    'Dahlem', 'Grunewald', 'Adlershof', 'Weißensee', 'Karlshorst',
    'Rummelsburg', 'Oberschöneweide', 'Rudow', 'Britz', 'Buckow',
    'Mariendorf', 'Lankwitz', 'Nikolassee', 'Wannsee', 'Gatow',
    'Kladow', 'Staaken', 'Siemensstadt', 'Haselhorst', 'Tegel',
    'Hermsdorf', 'Frohnau', 'Wittenau', 'Borsigwalde', 'Märkisches Viertel',
    'Karow', 'Buch', 'Blankenburg', 'Heinersdorf', 'Niederschönhausen',
    'Rosenthal', 'Französisch Buchholz', 'Malchow', 'Wartenberg',
    'Falkenberg', 'Hohenschönhausen', 'Fennpfuhl', 'Friedrichsfelde',
    'Biesdorf', 'Kaulsdorf', 'Mahlsdorf', 'Hellersdorf', 'Marzahn',
    'Altglienicke', 'Baumschulenweg', 'Johannisthal', 'Grünau',
    'Schmöckwitz', 'Friedrichshagen', 'Rahnsdorf', 'Müggelheim'
]

QUERY_TEMPLATES = [
    "Restaurant Berlin {district}",
    "beste Restaurants {district} Berlin",
    "Gaststätte {district} Berlin",
    "Imbiss {district} Berlin",
    "Pizzeria {district} Berlin",
    "asiatisches Restaurant {district} Berlin",
    "türkisches Restaurant {district} Berlin",
    "italienisches Restaurant {district} Berlin",
    "indisches Restaurant {district} Berlin",
    "griechisches Restaurant {district} Berlin",
    "vietnamesisches Restaurant {district} Berlin",
    "Sushi {district} Berlin",
    "Burger {district} Berlin",
    "Brunch {district} Berlin",
    "Steakhouse {district} Berlin",
    "Thai Restaurant {district} Berlin",
    "mexikanisches Restaurant {district} Berlin",
    "Döner {district} Berlin",
    "Bäckerei {district} Berlin",
    "Café Restaurant {district} Berlin",
]

TARGET_PER_SEARCH = 25


def get_db_connection():
    return mysql.connector.connect(**db_config)


def get_existing_urls():
    """Load all existing restaurant URLs from DB for fast dedup."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT google_maps_url FROM locations WHERE category = 'restaurant'")
    urls = {row[0] for row in cursor.fetchall()}
    cursor.close()
    conn.close()
    return urls


def insert_batch(restaurants):
    """Insert a batch of restaurants, skipping duplicates via ON DUPLICATE KEY."""
    if not restaurants:
        return 0, 0
    conn = get_db_connection()
    cursor = conn.cursor()
    inserted = 0
    skipped = 0
    try:
        for r in restaurants:
            try:
                cursor.execute("""
                    INSERT INTO locations (name, google_maps_url, category)
                    VALUES (%s, %s, 'restaurant')
                    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
                """, (r['name'], r['url']))
                if cursor.rowcount == 1:
                    inserted += 1
                else:
                    skipped += 1
            except Exception:
                skipped += 1
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    return inserted, skipped


async def setup_browser():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    auth_state_path = None
    for candidate in [
        os.path.join(script_dir, 'google-auth-state.json'),
        os.path.join(parent_dir, 'google-auth-state.json'),
    ]:
        if os.path.exists(candidate):
            auth_state_path = candidate
            break

    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(
        headless=True,
        args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
              '--disable-extensions', '--disable-web-security']
    )
    ctx_opts = {
        'viewport': {'width': 1280, 'height': 720},
        'user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'locale': 'de-DE',
    }
    if auth_state_path:
        ctx_opts['storage_state'] = auth_state_path
        print(f"[AUTH] Loaded: {auth_state_path}")
    context = await browser.new_context(**ctx_opts)
    return playwright, browser, context


async def setup_page(context):
    page = await context.new_page()
    blocked = [
        "**/*.{png,jpg,jpeg,gif,svg,webp,ico}",
        "**/*.{woff,woff2,ttf,otf,eot}",
        "**/ads/**", "**/analytics/**", "**/gtm/**",
        "**/doubleclick/**", "**/googletagmanager/**",
    ]
    for pat in blocked:
        await page.route(pat, lambda route: route.abort())
    return page


async def dismiss_consent(page):
    for sel in ['button:has-text("Alle akzeptieren")', 'button:has-text("Alle ablehnen")']:
        try:
            btn = await page.wait_for_selector(sel, timeout=6000)
            if btn and await btn.is_visible():
                await btn.click()
                await page.wait_for_timeout(6000)
                return True
        except:
            continue
    return False


async def accept_consent_once(context):
    """Accept Google consent once so cookies persist in context."""
    page = await setup_page(context)
    try:
        await page.goto('https://www.google.de/maps', wait_until='domcontentloaded', timeout=30000)
        await page.wait_for_timeout(2000)
        await dismiss_consent(page)
        print("[CONSENT] Done")
    finally:
        try:
            await page.close()
        except:
            pass


async def search_and_collect(context, query, known_urls):
    """Run a single search query and return new restaurants not in known_urls."""
    # Global timeout for entire search — 60s max
    try:
        return await asyncio.wait_for(_search_and_collect_inner(context, query, known_urls), timeout=60)
    except asyncio.TimeoutError:
        print(f"    [TIMEOUT] Search took >60s, skipping")
        return []


async def _search_and_collect_inner(context, query, known_urls):
    page = None
    results = []
    try:
        page = await setup_page(context)
        search_url = f"https://www.google.de/maps/search/{quote_plus(query)}"
        await page.goto(search_url, wait_until='domcontentloaded', timeout=30000)
        await page.wait_for_timeout(3000)

        # Wait for results (short timeout — consent already handled)
        found = False
        for sel in ['a[href*="/maps/place/"]', 'div[role="feed"]']:
            try:
                await page.wait_for_selector(sel, timeout=8000)
                found = True
                break
            except:
                continue
        if not found:
            # Maybe consent reappeared
            await dismiss_consent(page)
            try:
                await page.wait_for_selector('a[href*="/maps/place/"]', timeout=8000)
            except:
                pass

        # Scroll and collect
        seen = set()
        no_new = 0
        for scroll in range(12):
            links = await page.query_selector_all('a[href*="/maps/place/"]')
            new_count = 0
            for link in links:
                try:
                    href = await link.get_attribute('href')
                    if not href or href in seen or href in known_urls or '/maps/place/' not in href:
                        continue
                    seen.add(href)
                    name = await link.get_attribute('aria-label')
                    if not name:
                        try:
                            name = await link.evaluate('el => el.closest("[class]")?.querySelector(".fontHeadlineSmall, .qBF1Pd")?.textContent')
                        except:
                            pass
                    if not name:
                        try:
                            name = href.split('/maps/place/')[1].split('/')[0].replace('+', ' ')
                        except:
                            name = "Unknown"
                    results.append({'name': name, 'url': href})
                    new_count += 1
                except:
                    continue

            if new_count > 0:
                no_new = 0
            else:
                no_new += 1

            if len(results) >= TARGET_PER_SEARCH or no_new >= 3:
                break

            # Scroll
            try:
                for sel in ['div[role="feed"]', 'div.m6QErb']:
                    el = await page.query_selector(sel)
                    if el:
                        await el.evaluate('el => el.scrollTop = el.scrollHeight')
                        break
                else:
                    for _ in range(3):
                        await page.keyboard.press('PageDown')
                        await page.wait_for_timeout(300)
            except:
                await page.keyboard.press('End')

            await page.wait_for_timeout(2000 + random.uniform(0, 1000))

    except Exception as e:
        print(f"    [ERROR] {e}")
    finally:
        if page:
            try:
                await page.close()
            except:
                pass
    return results


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--target', type=int, default=2000)
    args = parser.parse_args()

    print("=" * 60)
    print(f"  Restaurant Batch Collector")
    print(f"  Target: {args.target} new restaurants")
    print(f"  Districts: {len(DISTRICTS)}")
    print(f"  Query templates: {len(QUERY_TEMPLATES)}")
    print(f"  Max combinations: {len(DISTRICTS) * len(QUERY_TEMPLATES)}")
    print(f"  Dry run: {args.dry_run}")
    print("=" * 60)

    known_urls = get_existing_urls()
    print(f"[DB] {len(known_urls)} existing restaurant URLs loaded for dedup")

    start_time = time.time()
    total_inserted = 0
    total_found = 0

    playwright, browser, context = await setup_browser()

    # Accept consent once before any searches
    await accept_consent_once(context)

    try:
        # Prioritize main districts first, then smaller ones
        main_districts = DISTRICTS[:20]
        extra_districts = DISTRICTS[20:]
        # For main districts: all query templates. For extra: only first 5 templates
        combos = [(t, d) for d in main_districts for t in QUERY_TEMPLATES]
        combos += [(t, d) for d in extra_districts for t in QUERY_TEMPLATES[:5]]
        random.shuffle(combos)

        consecutive_errors = 0
        for i, (template, district) in enumerate(combos):
            if total_inserted >= args.target:
                print(f"\n[DONE] Target of {args.target} reached!")
                break

            # If too many errors, recreate browser
            if consecutive_errors >= 5:
                print("[WARN] Too many errors, recreating browser...")
                try:
                    await context.close()
                    await browser.close()
                    await playwright.stop()
                except:
                    pass
                playwright, browser, context = await setup_browser()
                await accept_consent_once(context)
                consecutive_errors = 0

            query = template.format(district=district)
            print(f"\n[{i+1}/{len(combos)}] {query} (new so far: {total_inserted})")

            try:
                results = await search_and_collect(context, query, known_urls)
            except Exception as e:
                print(f"    [CRASH] {e}")
                consecutive_errors += 1
                continue

            total_found += len(results)
            consecutive_errors = 0 if results else consecutive_errors

            if results:
                for r in results:
                    known_urls.add(r['url'])

                if not args.dry_run:
                    ins, skip = insert_batch(results)
                    total_inserted += ins
                    print(f"    Found: {len(results)}, Inserted: {ins}, Skipped: {skip} | Total new: {total_inserted}")
                else:
                    total_inserted += len(results)
                    print(f"    [DRY-RUN] Found: {len(results)} | Total new: {total_inserted}")
            else:
                print(f"    Found: 0")
                consecutive_errors += 1

            await asyncio.sleep(random.uniform(2, 4))

    finally:
        try:
            await context.close()
        except:
            pass
        try:
            await browser.close()
        except:
            pass
        try:
            await playwright.stop()
        except:
            pass

    elapsed = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"  BATCH COMPLETE")
    print(f"  Total found (raw): {total_found}")
    print(f"  New inserted:      {total_inserted}")
    print(f"  Time:              {elapsed:.0f}s ({elapsed/60:.1f}m)")
    print(f"{'='*60}")

    # Verify total in DB
    if not args.dry_run:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM locations WHERE category = 'restaurant'")
        print(f"  Total restaurants in DB: {cur.fetchone()[0]}")
        conn.close()


if __name__ == '__main__':
    asyncio.run(main())
