import os
import sys
import time
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://127.0.0.1:5173"
OUT_DIR = r"D:\Projects\timeless tales\docs\images"

os.makedirs(OUT_DIR, exist_ok=True)

def run():
    print("Launching Chromium browser via system Chrome...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--disable-web-security", "--no-sandbox"]
        )

        # 1. Desktop Context
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1.5
        )
        page = context.new_page()

        print("1. Capturing Homepage Storefront...")
        page.goto(f"{BASE_URL}/", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUT_DIR, "01_home_storefront.png"))

        print("2. Capturing Book Product Detail Page...")
        page.goto(f"{BASE_URL}/books/the-alchemist-paulo-coelho", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUT_DIR, "02_book_detail.png"))

        print("3. Capturing Catalogue & Filtering Page...")
        page.goto(f"{BASE_URL}/books", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUT_DIR, "03_catalogue_search.png"))

        print("4. Capturing Today's Deals Page...")
        page.goto(f"{BASE_URL}/deals", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUT_DIR, "04_deals_showcase.png"))

        print("5. Logging in as Reader to capture Cart, Checkout & Orders...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=30000)
        page.fill('input[name="email"]', "reader@timelesstales.com")
        page.fill('input[name="password"]', "Reader@12345")
        page.click('button:has-text("Sign In")')
        page.wait_for_timeout(2000)

        # Add book to cart via visible button
        page.goto(f"{BASE_URL}/books/the-alchemist-paulo-coelho", wait_until="networkidle", timeout=30000)
        try:
            add_btn = page.locator('button:has-text("Add to Cart"):visible').first
            if add_btn.is_visible():
                add_btn.click()
                page.wait_for_timeout(1000)
        except Exception as e:
            print("Cart add notice:", e)

        print("6. Capturing Shopping Cart...")
        page.goto(f"{BASE_URL}/cart", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUT_DIR, "05_shopping_cart.png"))

        print("7. Capturing Checkout Workflow...")
        page.goto(f"{BASE_URL}/checkout", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUT_DIR, "06_checkout_workflow.png"))

        print("8. Capturing User Orders...")
        page.goto(f"{BASE_URL}/orders", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUT_DIR, "07_user_orders.png"))

        print("9. Capturing Digital Library...")
        page.goto(f"{BASE_URL}/library", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUT_DIR, "08_digital_library.png"))

        print("10. Logging in as Admin to capture Admin Analytics...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=30000)
        page.fill('input[name="email"]', "admin@timelesstales.com")
        page.fill('input[name="password"]', "Admin@12345")
        page.click('button:has-text("Sign In")')
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/admin-panel", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUT_DIR, "09_admin_dashboard.png"))

        # 2. Mobile Responsive Context (iPhone 14)
        print("11. Capturing Mobile Responsive Viewport...")
        mobile_context = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            device_scale_factor=2
        )
        mobile_page = mobile_context.new_page()
        mobile_page.goto(f"{BASE_URL}/books/the-alchemist-paulo-coelho", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        mobile_page.screenshot(path=os.path.join(OUT_DIR, "10_mobile_responsive.png"))

        browser.close()
        print("All 10 screenshots successfully captured!")

if __name__ == "__main__":
    run()
