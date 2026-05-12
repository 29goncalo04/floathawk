import aiohttp, asyncio, os, tempfile
from asyncio import Queue
from playwright.async_api import async_playwright


async def send_message(text, file_path):
    token = os.environ.get("BOT_TOKEN")
    chat_id = os.environ.get("CHAT_ID")
    if not token or not chat_id:
        return
    chat_id = int(chat_id)
    url = f"https://api.telegram.org/bot{token}/sendPhoto"
    with open(file_path, "rb") as photo:
        data = aiohttp.FormData()
        data.add_field("chat_id", str(chat_id))
        data.add_field("caption", text)
        data.add_field("photo", photo, filename=os.path.basename(file_path), content_type="image/png")
        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=data) as response:
                response.raise_for_status()


# One persistent browser per worker — launched once, reused for every deal.
async def screenshot_worker(queue: Queue):
    price_selector = "item-detail .grid-item .footer .price-row.ng-star-inserted .price.ng-star-inserted"
    selector = "item-detail .grid-item"

    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(headless=True)
        except Exception as e:
            print(f"\033[1;41mNotifier: failed to launch browser: {e}\033[0m")
            return
        try:
            while True:
                item = await queue.get()
                skin = item["skin"]
                msg = item["msg"]

                url = f"https://csfloat.com/item/{skin['id']}"
                msg += f"\nLink: {url}"
                usd_price = f"{skin['price'] / 100:.2f}"
                output_path = os.path.join(tempfile.gettempdir(), f"deal_{skin['id']}.png")

                page = await browser.new_page(viewport={"width": 471, "height": 601})
                try:
                    await page.goto(url, wait_until="domcontentloaded")
                    element = await page.wait_for_selector(selector, timeout=10000)
                    await page.evaluate(f"""
                        const priceEl = document.querySelector("{price_selector}");
                        if (priceEl) {{
                            priceEl.textContent = '${usd_price}';
                        }}
                    """)
                    await element.screenshot(path=output_path)
                    await send_message(msg, output_path)
                except Exception as e:
                    print(f"\033[1;41mNotifier error: {e}\033[0m")
                finally:
                    await page.close()
                    if os.path.exists(output_path):
                        os.remove(output_path)

                queue.task_done()
        finally:
            await browser.close()
