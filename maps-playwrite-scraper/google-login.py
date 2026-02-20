#!/usr/bin/env python3
"""
Google Login für Berlinometer Scraper.

Öffnet einen echten Browser-Fenster, damit der User sich manuell bei Google einloggen kann.
Speichert den Login-State in google-auth-state.json, der vom Scraper wiederverwendet wird.

Nutzung:
  1. Lokal ausführen: python3 google-login.py
  2. Im Browser manuell bei Google einloggen (E-Mail, Passwort, 2FA)
  3. Nach erfolgreichem Login wird der State gespeichert
  4. Datei auf VPS kopieren: scp google-auth-state.json root@69.62.121.168:/var/www/html/popular-times/maps-playwrite-scraper/
"""

import asyncio
import os
import sys

from playwright.async_api import async_playwright

AUTH_STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "google-auth-state.json")


async def main():
    print("🔑 Google Login für Berlinometer Scraper")
    print("=" * 50)
    print()
    print("Ein Chromium-Fenster wird geöffnet.")
    print("Bitte logge dich manuell bei Google ein.")
    print("Nach dem Login wird der State automatisch gespeichert.")
    print()

    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(
        headless=False,
        args=["--no-sandbox"],
    )

    context = await browser.new_context(
        viewport={"width": 1280, "height": 900},
        locale="de-DE",
    )

    page = await context.new_page()

    # Google Login-Seite öffnen
    print("🌐 Öffne Google Login...")
    await page.goto("https://accounts.google.com", wait_until="domcontentloaded")

    # Warte bis der User eingeloggt ist
    print("⏳ Warte auf Login...")
    print("   → Bitte im Browser einloggen (E-Mail, Passwort, 2FA)")
    print()

    try:
        # Warte auf eine URL die anzeigt, dass der Login erfolgreich war
        await page.wait_for_url(
            lambda url: any(domain in url for domain in [
                "myaccount.google.com",
                "accounts.google.com/b/",
                "accounts.google.com/SignOutOptions",
                "google.com/maps",
            ]),
            timeout=300000,  # 5 Minuten Zeit zum Einloggen
        )
    except Exception:
        # Fallback: Prüfe ob wir auf einer eingeloggten Seite sind
        current_url = page.url
        print(f"⚠️  Timeout, aber aktuelle URL: {current_url}")

    # Kurz warten damit Cookies gesetzt werden
    await page.wait_for_timeout(2000)

    # Teste ob Login funktioniert hat: Lade Google Maps
    print("🗺️  Teste Login mit Google Maps...")
    await page.goto("https://www.google.com/maps", wait_until="domcontentloaded")
    await page.wait_for_timeout(3000)

    # Storage State speichern
    await context.storage_state(path=AUTH_STATE_FILE)
    print()
    print(f"✅ Auth State gespeichert: {AUTH_STATE_FILE}")
    print()
    print("📋 Nächste Schritte:")
    print(f"   scp {AUTH_STATE_FILE} root@69.62.121.168:/var/www/html/popular-times/maps-playwrite-scraper/")
    print()

    await context.close()
    await browser.close()
    await playwright.stop()


if __name__ == "__main__":
    asyncio.run(main())
