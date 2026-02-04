from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        # Determine the file path
        cwd = os.getcwd()
        file_url = f"file://{cwd}/index.html"

        print(f"Navigating to {file_url}")
        page.goto(file_url)

        # Wait for the card to be visible
        page.wait_for_selector(".glass-card")

        # Take a screenshot of the whole page to see the card context
        screenshot_path = "verification/desktop_layout_check.png"
        os.makedirs("verification", exist_ok=True)
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        # Take a specific screenshot of the card
        card = page.locator(".glass-card")
        card.screenshot(path="verification/glass_card_detail.png")
        print("Card detail screenshot saved.")

        browser.close()

if __name__ == "__main__":
    run()
