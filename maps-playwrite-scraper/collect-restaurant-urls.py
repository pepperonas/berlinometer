#!/usr/bin/env python3
"""
Collect Berlin restaurant URLs from Google Maps and store them in the database.

Usage:
    python3 collect-restaurant-urls.py              # Full run with DB insertion
    python3 collect-restaurant-urls.py --dry-run    # Print URLs without DB insertion
    python3 collect-restaurant-urls.py --headed      # Run with visible browser (for debugging)
"""

import argparse
import asyncio
import json
import os
import random
import sys
import time
from datetime import datetime

import mysql.connector
from mysql.connector import pooling
from playwright.async_api import async_playwright
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

db_config = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', ''),
    'database': os.getenv('MYSQL_DATABASE', 'popular_times_db'),
    'port': int(os.getenv('MYSQL_PORT', '3306'))
}

BERLIN_DISTRICTS = [
    'Mitte', 'Kreuzberg', 'Neukölln', 'Friedrichshain', 'Prenzlauer Berg',
    'Charlottenburg', 'Schöneberg', 'Wedding', 'Moabit', 'Tempelhof',
    'Steglitz', 'Zehlendorf', 'Wilmersdorf', 'Lichtenberg', 'Pankow',
    'Treptow', 'Köpenick', 'Reinickendorf', 'Spandau', 'Tiergarten'
]

TARGET_PER_DISTRICT = 30  # Aim high to get ~25 after dedup


def get_db_connection():
    """Get a database connection."""
    return mysql.connector.connect(**db_config)


def ensure_category_column():
    """Ensure the locations table has the category column."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'locations' AND COLUMN_NAME = 'category'
        """, (db_config['database'],))
        if cursor.fetchone()[0] == 0:
            cursor.execute("ALTER TABLE locations ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'bar_club'")
            cursor.execute("CREATE INDEX idx_locations_category ON locations (category)")
            conn.commit()
            print("[DB] Added category column to locations table")
        else:
            print("[DB] Category column already exists")
    except Exception as e:
        print(f"[DB] Error checking/adding category column: {e}")
    finally:
        cursor.close()
        conn.close()


def insert_restaurants(restaurants, dry_run=False):
    """Insert restaurants into the database. Returns (inserted, updated, skipped) counts."""
    if dry_run:
        for r in restaurants:
            print(f"  [DRY-RUN] {r['name']} -> {r['url']}")
        return 0, 0, len(restaurants)

    conn = get_db_connection()
    cursor = conn.cursor()
    inserted = 0
    updated = 0
    skipped = 0

    try:
        for r in restaurants:
            try:
                cursor.execute("""
                    INSERT INTO locations (name, google_maps_url, category)
                    VALUES (%s, %s, 'restaurant')
                    ON DUPLICATE KEY UPDATE category = VALUES(category)
                """, (r['name'], r['url']))
                if cursor.rowcount == 1:
                    inserted += 1
                elif cursor.rowcount == 2:
                    # ON DUPLICATE KEY UPDATE counts as 2 affected rows
                    updated += 1
                else:
                    skipped += 1
            except Exception as e:
                print(f"  [DB ERROR] {r['name']}: {e}")
                skipped += 1

        conn.commit()
    finally:
        cursor.close()
        conn.close()

    return inserted, updated, skipped


async def setup_browser(headed=False):
    """Launch browser with the same config as the existing scraper."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)

    # Find auth state
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
        headless=not headed,
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

    context_options = {
        'viewport': {'width': 1280, 'height': 720},
        'user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'locale': 'de-DE',
    }

    if auth_state_path:
        context_options['storage_state'] = auth_state_path
        print(f"[AUTH] Google Auth State loaded: {auth_state_path}")
    else:
        print("[AUTH] No google-auth-state.json found — running without Google login")

    context = await browser.new_context(**context_options)
    return playwright, browser, context


async def setup_page(context):
    """Create a page with resource blocking (same pattern as existing scraper)."""
    page = await context.new_page()

    blocked_resources = [
        "**/*.{png,jpg,jpeg,gif,svg,webp,ico}",
        "**/*.{woff,woff2,ttf,otf,eot}",
        "**/ads/**",
        "**/analytics/**",
        "**/gtm/**",
        "**/doubleclick/**",
        "**/googletagmanager/**",
        "**/facebook.com/**",
        "**/twitter.com/**",
    ]

    for resource_pattern in blocked_resources:
        await page.route(resource_pattern, lambda route: route.abort())

    return page


async def dismiss_cookie_banner(page):
    """Handle Google cookie consent dialog (full-page consent, not overlay)."""
    try:
        # This consent page is a full page redirect, not an overlay
        # Try clicking "Alle akzeptieren" with a generous timeout
        for selector in [
            'button:has-text("Alle akzeptieren")',
            'button:has-text("Alle ablehnen")',
            'button:has-text("Accept all")',
            'button:has-text("Reject all")',
        ]:
            try:
                button = await page.wait_for_selector(selector, timeout=8000)
                if button and await button.is_visible():
                    await button.click()
                    print("  [COOKIE] Consent accepted, waiting for Maps to load...")
                    # After clicking, Google redirects to the actual Maps page
                    # Wait for the redirect and Maps JS to fully load
                    await page.wait_for_timeout(8000)
                    return True
            except:
                continue
    except:
        pass
    return False


async def search_district(context, district, semaphore):
    """Search for restaurants in a single Berlin district and return found URLs."""
    async with semaphore:
        restaurants = []
        search_query = f"Restaurants Berlin {district}"
        print(f"\n[SEARCH] Searching: {search_query}")

        page = None
        try:
            # Fresh page per district to avoid stale page issues
            page = await setup_page(context)

            # Navigate directly to search URL (avoids needing to find searchbox)
            search_url = f"https://www.google.de/maps/search/Restaurants+Berlin+{district.replace(' ', '+')}"
            await page.goto(search_url, wait_until='domcontentloaded', timeout=45000)
            await page.wait_for_timeout(3000)

            # Dismiss cookie consent (full-page, blocks everything)
            await dismiss_cookie_banner(page)

            # Wait for place links to appear
            place_link_found = False
            for selector in ['a[href*="/maps/place/"]', 'div[role="feed"]', 'div[role="article"]']:
                try:
                    await page.wait_for_selector(selector, timeout=15000)
                    print(f"  [OK] Results loaded via: {selector}")
                    place_link_found = True
                    break
                except:
                    continue

            if not place_link_found:
                print(f"  [WARN] No results found for {district}, trying to scroll anyway...")
                await page.wait_for_timeout(5000)

            # Scroll through results to load more
            restaurants = await scroll_and_collect(page, district)

        except Exception as e:
            print(f"  [ERROR] Failed for {district}: {e}")
        finally:
            if page:
                try:
                    await page.close()
                except:
                    pass

        # Random delay between districts to be polite
        delay = random.uniform(3, 6)
        print(f"  [WAIT] Sleeping {delay:.1f}s before next district...")
        await asyncio.sleep(delay)

        return restaurants


async def scroll_and_collect(page, district):
    """Scroll the results panel and collect restaurant URLs."""
    restaurants = []
    seen_urls = set()
    max_scrolls = 15
    no_new_count = 0

    for scroll_num in range(max_scrolls):
        # Extract current visible results
        links = await page.query_selector_all('a[href*="/maps/place/"]')

        new_found = 0
        for link in links:
            try:
                href = await link.get_attribute('href')
                if not href or href in seen_urls:
                    continue

                # Clean up the URL - keep only the place URL part
                if '/maps/place/' not in href:
                    continue

                seen_urls.add(href)

                # Try to get the restaurant name from the link's aria-label or nearby text
                name = await link.get_attribute('aria-label')
                if not name:
                    # Try to find name from parent element
                    try:
                        name = await link.evaluate('el => el.closest("[class]")?.querySelector(".fontHeadlineSmall, .qBF1Pd")?.textContent')
                    except:
                        pass
                if not name:
                    # Extract name from URL as fallback
                    try:
                        name = href.split('/maps/place/')[1].split('/')[0].replace('+', ' ')
                        # URL decode common patterns
                        name = name.replace('%C3%A4', 'ä').replace('%C3%B6', 'ö').replace('%C3%BC', 'ü')
                        name = name.replace('%C3%84', 'Ä').replace('%C3%96', 'Ö').replace('%C3%9C', 'Ü')
                        name = name.replace('%C3%9F', 'ß').replace('%26', '&').replace('%2C', ',')
                    except:
                        name = f"Unknown Restaurant ({district})"

                restaurants.append({'name': name, 'url': href, 'district': district})
                new_found += 1

            except Exception as e:
                continue

        if new_found > 0:
            print(f"  [SCROLL {scroll_num + 1}] Found {new_found} new ({len(restaurants)} total for {district})")
            no_new_count = 0
        else:
            no_new_count += 1

        # Stop if we have enough or no new results after several scrolls
        if len(restaurants) >= TARGET_PER_DISTRICT:
            print(f"  [DONE] Reached target of {TARGET_PER_DISTRICT} for {district}")
            break

        if no_new_count >= 3:
            print(f"  [DONE] No new results after {no_new_count} scrolls for {district}")
            break

        # Check if we hit "end of results" marker
        try:
            end_marker = await page.query_selector('span.HlvSq')
            if end_marker:
                end_text = await end_marker.text_content()
                if end_text and ('Ende' in end_text or 'end of' in end_text.lower()):
                    print(f"  [DONE] Reached end of results for {district}")
                    break
        except:
            pass

        # Scroll the results panel using multiple strategies
        try:
            scrolled = False
            for scroll_selector in ['div[role="feed"]', 'div[role="main"]', 'div.m6QErb']:
                try:
                    el = await page.query_selector(scroll_selector)
                    if el:
                        await el.evaluate('el => el.scrollTop = el.scrollHeight')
                        scrolled = True
                        break
                except:
                    continue
            if not scrolled:
                # Last resort: keyboard scroll
                for _ in range(3):
                    await page.keyboard.press('PageDown')
                    await page.wait_for_timeout(300)
        except:
            await page.keyboard.press('End')

        await page.wait_for_timeout(2500 + random.uniform(0, 1500))

    return restaurants


async def main():
    parser = argparse.ArgumentParser(description='Collect Berlin restaurant URLs from Google Maps')
    parser.add_argument('--dry-run', action='store_true', help='Print URLs without DB insertion')
    parser.add_argument('--headed', action='store_true', help='Run with visible browser')
    parser.add_argument('--districts', nargs='+', help='Only search specific districts (e.g. --districts Mitte Kreuzberg)')
    parser.add_argument('--concurrency', type=int, default=1, help='Number of concurrent district searches (default: 1)')
    args = parser.parse_args()

    districts = args.districts if args.districts else BERLIN_DISTRICTS

    print("=" * 60)
    print(f"  Berlin Restaurant URL Collector")
    print(f"  Districts: {len(districts)}")
    print(f"  Target per district: ~{TARGET_PER_DISTRICT}")
    print(f"  Dry run: {args.dry_run}")
    print(f"  Headed: {args.headed}")
    print("=" * 60)

    # Ensure DB is ready
    if not args.dry_run:
        try:
            ensure_category_column()
        except Exception as e:
            print(f"[ERROR] Database connection failed: {e}")
            print("[INFO] You can use --dry-run to test without a database")
            sys.exit(1)

    start_time = time.time()
    all_restaurants = []
    summary = {}
    semaphore = asyncio.Semaphore(args.concurrency)

    playwright, browser, context = await setup_browser(headed=args.headed)

    try:
        for i, district in enumerate(districts):
            print(f"\n{'='*40}")
            print(f"  District {i + 1}/{len(districts)}: {district}")
            print(f"{'='*40}")

            restaurants = await search_district(context, district, semaphore)
            all_restaurants.extend(restaurants)
            summary[district] = len(restaurants)

            print(f"  [RESULT] {district}: {len(restaurants)} restaurants found")

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

    # Deduplicate by URL across all districts
    seen_urls = set()
    unique_restaurants = []
    for r in all_restaurants:
        if r['url'] not in seen_urls:
            seen_urls.add(r['url'])
            unique_restaurants.append(r)

    duplicates_removed = len(all_restaurants) - len(unique_restaurants)

    print(f"\n{'='*60}")
    print(f"  COLLECTION COMPLETE")
    print(f"{'='*60}")
    print(f"  Total found (raw):    {len(all_restaurants)}")
    print(f"  Duplicates removed:   {duplicates_removed}")
    print(f"  Unique restaurants:   {len(unique_restaurants)}")
    print(f"  Time elapsed:         {time.time() - start_time:.0f}s")
    print()

    # Per-district summary
    print("  Per-district breakdown:")
    for district in districts:
        count = summary.get(district, 0)
        bar = '#' * min(count, 40)
        print(f"    {district:20s} {count:3d} {bar}")
    print()

    # Insert into DB
    if unique_restaurants:
        inserted, updated, skipped = insert_restaurants(unique_restaurants, dry_run=args.dry_run)
        if not args.dry_run:
            print(f"  [DB] Inserted: {inserted}, Updated: {updated}, Skipped: {skipped}")
        else:
            print(f"  [DRY-RUN] Would insert {len(unique_restaurants)} restaurants")
    else:
        print("  [WARN] No restaurants found!")

    # Save results to JSON as backup
    output_file = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        f"restaurant-urls-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    )
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total': len(unique_restaurants),
            'per_district': summary,
            'restaurants': unique_restaurants
        }, f, ensure_ascii=False, indent=2)
    print(f"  [FILE] Results saved to {output_file}")


if __name__ == '__main__':
    asyncio.run(main())
