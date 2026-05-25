import aiohttp, random, asyncio, os

from CSFloat import get_balance_usd, get_newest_skins
from Notifier import screenshot_worker
from deal_validator import is_a_good_deal
from Timeout import save_timeout, load_timeout, TIMEOUT_FILE
from utils import cents_to_usd, parse_iso_timestamp

from asyncio import Queue
from datetime import datetime, timezone

async def running_bot(min_float, max_float, min_price, max_price, max_price_is_current_balance,
                      on_deal_found=None, on_deal_rejected=None, on_status_change=None):
    # on_status_change(status, resume_time, error_message=None)
    # status: "scanning" | "rate_limited" | "error"
    min_seen_time = None
    screenshot_queue = Queue()
    num_workers = 3  # number of concurrent screenshot tasks
    # Creates a reusable asynchronous HTTP session
    async with aiohttp.ClientSession() as session:
        # Convert the minimum and maximum prices from USD to cents
        min_price = min_price*100
        max_price = max_price*100

        # Store the current balance of the user
        if max_price == 0:
            max_price = get_balance_usd()

        # The max_price to include in the search for skins needs to be higher than the min_price
        if max_price <= min_price:
            print(f"\033[1;41mThe maximum price to include in the search for skins needs to be higher than the minimum price\033[0m")
            return  # ends the function

        # The max_float to include in the search for skins needs to be higher than the min_float
        if max_float <= min_float:
            print(f"\033[1;41mThe maximum float to include in the search for skins needs to be higher than the minimum float\033[0m")
            return  # ends the function

        # Start worker tasks
        workers = [asyncio.create_task(screenshot_worker(screenshot_queue)) for _ in range(num_workers)]

        if on_status_change:
            on_status_change("scanning", None)

        while True:
            # Make sure to always update the max_price if it corresponds to the current user balance
            if max_price_is_current_balance:
                max_price = get_balance_usd()
                if max_price < min_price:
                    if on_status_change:
                        on_status_change("error", None, "Balance is too low to continue scanning")
                    return

            # Makes a request to get the latest 50 skins listed on the CSFloat website
            skins = get_newest_skins(min_float, max_float, min_price, max_price)

            # None means auth failure (invalid API key) — stop immediately
            if skins is None:
                if on_status_change:
                    on_status_change("error", None, "Invalid API key")
                return

            # If the 'get_newest_skins' didn't return anything it means that the CSFloat account got a timeout
            if not skins:

                # It will wait for at least 30 minutes before trying to access the CSFloat website again
                # Load the UTC time when the timeout ends
                resume_time = load_timeout()
                
                # First time waiting
                if not resume_time:
                    total_minutes = 30 
                    # Calculate the future UTC time after 30 minutes and stores it into a JSON file
                    save_timeout(total_minutes)

                    # Load the UTC time when the timeout ends
                    resume_time = load_timeout()

                if on_status_change:
                    on_status_change("rate_limited", resume_time.isoformat())

                # It prints in the terminal how much time is left until the timeout ends
                while True:
                    now = datetime.now(timezone.utc)
                    remaining_seconds = (resume_time - now).total_seconds()
                    if remaining_seconds <= 0:
                        # Remove the file so the next timeout is fresh
                        try:
                            os.remove(TIMEOUT_FILE)
                        except FileNotFoundError:
                            pass
                        break
                    # Check balance during wait — stop immediately if too low (timeout.json preserved intentionally)
                    if max_price_is_current_balance:
                        try:
                            if get_balance_usd() < min_price:
                                if on_status_change:
                                    on_status_change("error", None, "Balance is too low to continue scanning")
                                return
                        except Exception:
                            pass
                    remaining_minutes = int(remaining_seconds // 60) + 1
                    print(f"\rWaiting {remaining_minutes} minutes...", end="", flush=True)
                    await asyncio.sleep(min(60, remaining_seconds))

                # After those 30 minutes, it will check if it can get the latest deals from the website. If not, it will wait 5 more minutes
                while True:
                    if max_price_is_current_balance:
                        try:
                            max_price = get_balance_usd()
                            if max_price < min_price:
                                if on_status_change:
                                    on_status_change("error", None, "Balance is too low to continue scanning")
                                return
                        except Exception:
                            pass
                    skins = get_newest_skins(min_float, max_float, min_price, max_price)
                    if skins is None:
                        if on_status_change:
                            on_status_change("error", None, "Invalid API key")
                        return
                    if skins:
                        print("\rEnd of timeout! Checking again...        ")
                        if on_status_change:
                            on_status_change("scanning", None)
                        break
                    print("\rWaiting 5 more minutes           ")
                    await asyncio.sleep(5*60)  # Wait 5 minutes
        
            # Remove the file so the next timeout is fresh (Falls here if i stop the script and run it again and the timeout was less than 30 minutes)
            try:
                os.remove(TIMEOUT_FILE)
            except FileNotFoundError:
                pass
        
            try:
                # It checks for every new deal if it is a good or a bad one (based on what the 'is_a_good_deal' returns)
                for skin in skins:
                    if min_seen_time is not None and parse_iso_timestamp(skin["created_at"]) <= min_seen_time:
                        break

                    try:
                        is_good_deal, info_for_message = await is_a_good_deal(skin, session)
                    except Exception as e:
                        print(f"[ERROR] processing skin: {e}")
                        if "403" in str(e):
                            # Cloudflare IP block — save timeout and wait before retrying
                            save_timeout(5)
                            resume_time = load_timeout()
                            if on_status_change:
                                on_status_change("rate_limited", resume_time.isoformat())
                            while True:
                                now = datetime.now(timezone.utc)
                                remaining_seconds = (resume_time - now).total_seconds()
                                if remaining_seconds <= 0:
                                    try:
                                        os.remove(TIMEOUT_FILE)
                                    except FileNotFoundError:
                                        pass
                                    break
                                await asyncio.sleep(min(60, remaining_seconds))
                            if on_status_change:
                                on_status_change("scanning", None)
                            break
                        continue

                    # If the deal seems to be profitable, it puts the information to write the message into the asynchronous
                    # queue to be processed by the worker
                    # If not, just check the next deal
                    if is_good_deal:
                        await screenshot_queue.put(info_for_message)
                        if on_deal_found:
                            on_deal_found({
                                "skin_name": info_for_message["skin"]["item"]["market_hash_name"],
                                "skin_id":   info_for_message["skin"]["id"],
                                "price":     cents_to_usd(info_for_message["skin"]["price"]),
                                "float_val": info_for_message["skin"]["item"]["float_value"],
                                "timestamp":  datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
                                "sell_min":           info_for_message.get("sell_min"),
                                "sell_max":           info_for_message.get("sell_max"),
                                "profit_min":         info_for_message.get("profit_min"),
                                "profit_max":         info_for_message.get("profit_max"),
                                "profit_pct_min":     info_for_message.get("profit_pct_min"),
                                "profit_pct_max":     info_for_message.get("profit_pct_max"),
                                "sell_min_after":         info_for_message.get("sell_min_after"),
                                "sell_max_after":         info_for_message.get("sell_max_after"),
                                "profit_min_after":       info_for_message.get("profit_min_after"),
                                "profit_max_after":       info_for_message.get("profit_max_after"),
                                "profit_pct_min_after":   info_for_message.get("profit_pct_min_after"),
                                "profit_pct_max_after":   info_for_message.get("profit_pct_max_after"),
                                "prices_filtered":        info_for_message.get("prices_filtered", []),
                                "prices_lower_floats":    info_for_message.get("prices_lower_floats", []),
                                "prices_higher_floats":   info_for_message.get("prices_higher_floats", []),
                                "similar_listed":         info_for_message.get("similar_listed", []),
                            })
                    else:
                        # Only surface rejections that produced a terminal print (skip silent pre-filters)
                        _silent = {"Not cheaper or special pattern", "Rate limited (similar check)"}
                        if on_deal_rejected and info_for_message and info_for_message.get("reason") not in _silent:
                            on_deal_rejected({
                                **info_for_message,
                                "timestamp": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
                            })
            except Exception as e:
                print(f"[ERROR] bot loop: {e}")
                if on_status_change:
                    on_status_change("error", None, str(e))
                break
            print("\n\n" + "-" * 120 + "\n\n")
            newest_time = parse_iso_timestamp(skins[0]["created_at"])
            if min_seen_time is None or newest_time > min_seen_time:
                min_seen_time = newest_time
            # Wait between 10 and 15 seconds before fetching the latest deals again, so the user doesn't hit the timeout too early
            await asyncio.sleep(random.uniform(10, 15))