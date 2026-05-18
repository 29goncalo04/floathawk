from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import uvicorn
import requests
import asyncio
import json
import os

from RunningBot import running_bot
from DiscoverSellPrice import discover_price_to_sell_skin
from UpdateExcel import update_excel
from CSFloat import get_balance_usd
from DealsDB import init_db
from paths import data_path

app = FastAPI()

_excel_path: str | None = os.environ.get("EXCEL_PATH")
API_TOKEN: str | None = os.environ.get("API_TOKEN")

# Token middleware must be added BEFORE CORS so CORS becomes the outermost layer
# (Starlette wraps in reverse order — last add_middleware call = outermost).
# CORS handles OPTIONS preflight without calling inner middleware, so no OPTIONS exemption needed.
@app.middleware("http")
async def _verify_token(request, call_next):
    if API_TOKEN:
        token = request.headers.get("X-Api-Token") or request.query_params.get("token")
        if token != API_TOKEN:
            return JSONResponse({"error": "unauthorized"}, status_code=401)
    return await call_next(request)

bot_task: asyncio.Task = None
bot_status: str = "stopped"
rate_limit_resume: str = None
bot_error: str = None
bot_params: dict = None
session_deals: list = []
session_rejected: list = []
deal_event_queue: asyncio.Queue = asyncio.Queue()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "null"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Api-Token"],
)



class SetupRequest(BaseModel):
    bot_token: str

class PushBotRequest(BaseModel):
    bot_token: str
    chat_id: str

class CsfloatSetupRequest(BaseModel):
    api_key: str

class RunBotRequest(BaseModel):
    min_float: float
    max_float: float
    min_price: int
    max_price: int
    max_price_is_current_balance: bool



# Validates the bot token by calling Telegram's getMe endpoint
@app.post("/setup/validate")
def setup_validate(data: SetupRequest):
    try:
        response = requests.get(
            f"https://api.telegram.org/bot{data.bot_token}/getMe",
            timeout=5
        ).json()
    except Exception:
        return {"error": "network_error"}

    if not response.get("ok"):
        return {"error": response.get("description", "invalid_bot_token")}

    return {"bot_username": response["result"]["username"]}



# Retrieves the chat ID by reading the bot's first received message via getUpdates.
# Requires the user to have sent at least one message to the bot beforehand.
@app.post("/setup/confirm")
def setup_confirm(data: SetupRequest):
    try:
        response = requests.get(
            f"https://api.telegram.org/bot{data.bot_token}/getUpdates",
            timeout=5
        ).json()
    except Exception:
        return {"error": "network_error"}

    if not response.get("ok"):
        return {"error": response.get("description", "unknown_error")}

    chat_id = None
    for update in response.get("result", []):
        chat = update.get("message", {}).get("chat", {})
        if chat.get("id"):
            chat_id = chat["id"]
            break

    if chat_id is None:
        return {"error": "no_messages_received"}

    return {"chat_id": chat_id}



@app.post("/setup/push-bot-credentials")
def push_bot_credentials(data: PushBotRequest):
    os.environ["BOT_TOKEN"] = data.bot_token
    os.environ["CHAT_ID"] = data.chat_id
    return {"status": "ok"}

# Validates the CSFloat API key by calling the /me endpoint
@app.post("/setup/push-csfloat-key")
def push_csfloat_key(data: CsfloatSetupRequest):
    os.environ["CSFLOAT_API_KEY"] = data.api_key
    return {"status": "ok"}

@app.post("/setup/validate-csfloat")
def setup_validate_csfloat(data: CsfloatSetupRequest):
    try:
        r = requests.get(
            "https://csfloat.com/api/v1/me",
            headers={"Authorization": data.api_key},
            timeout=5
        )
    except Exception:
        return {"error": "network_error"}

    if not r.ok:
        return {"error": "invalid_csfloat_api_key"}

    try:
        data = r.json()
    except Exception:
        return {"error": "invalid_csfloat_api_key"}

    if "code" in data and data["code"] != 200:
        return {"error": "invalid_csfloat_api_key"}

    if "user" not in data:
        return {"error": "invalid_csfloat_api_key"}

    return {"success": True}



# Returns the user's current CSFloat wallet balance in cents
@app.get("/balance")
async def balance():
    try:
        return {"balance": get_balance_usd()}
    except Exception:
        raise HTTPException(status_code=500, detail="Could not fetch balance")



def _mark_bot_stopped(task):
    global bot_status
    if bot_status != "error":
        bot_status = "stopped"

# Starts the CSFloat sniper bot as a background task
@app.post("/run-bot-endpoint")
async def run_bot_endpoint(data: RunBotRequest):
    global bot_task, bot_status, rate_limit_resume, bot_error, bot_params, session_deals, session_rejected

    if bot_task and not bot_task.done():
        raise HTTPException(status_code=400, detail="bot_already_running")

    bot_status = "scanning"
    rate_limit_resume = None
    bot_error = None
    bot_params = data.model_dump()
    session_deals = []
    session_rejected = []
    while not deal_event_queue.empty():
        deal_event_queue.get_nowait()

    def on_deal_found(deal_info: dict):
        session_deals.append(deal_info)
        deal_event_queue.put_nowait(deal_info)

    def on_deal_rejected(rejection_info: dict):
        global session_rejected
        session_rejected = (session_rejected + [rejection_info])[-10:]

    def on_status_change(status: str, resume_time: str | None, error: str | None = None):
        global bot_status, rate_limit_resume, bot_error
        bot_status = status
        rate_limit_resume = resume_time
        bot_error = error
        if status == "error" and error:
            deal_event_queue.put_nowait({"_type": "bot_error", "reason": error})

    bot_task = asyncio.create_task(
        running_bot(
            data.min_float, data.max_float,
            data.min_price, data.max_price,
            data.max_price_is_current_balance,
            on_deal_found=on_deal_found,
            on_deal_rejected=on_deal_rejected,
            on_status_change=on_status_change,
        )
    )
    bot_task.add_done_callback(_mark_bot_stopped)
    return {"status": "started"}


# Stops the running bot
@app.post("/bot-stop")
async def bot_stop():
    global bot_task, bot_status, bot_error
    if bot_task and not bot_task.done():
        bot_task.cancel()
    bot_status = "stopped"
    bot_error = None
    return {"status": "stopped"}


# Returns the current bot status and session data
@app.get("/bot-status")
async def get_bot_status():
    return {
        "is_running": bot_task is not None and not bot_task.done(),
        "status": bot_status,
        "rate_limit_resume": rate_limit_resume,
        "error": bot_error,
        "params": bot_params,
        "deals_this_session": session_deals,
        "rejected_recent": session_rejected,
    }



# Calculates the price range to sell a skin based on its ID
@app.get("/sell-price/{skin_id}")
async def sell_price(skin_id: int):
    result = await discover_price_to_sell_skin(skin_id)
    error = result.get("_error") if isinstance(result, dict) else None
    if error == "invalid_id":
        raise HTTPException(status_code=422, detail="Invalid skin ID.")
    if error == "rate_limited":
        raise HTTPException(status_code=429, detail="Too many requests. Please wait and try again.")
    if error == "no_similar_listed":
        raise HTTPException(status_code=404, detail="Not enough similar listings to calculate a price range.")
    if error:
        raise HTTPException(status_code=500, detail="internal_error")
    return result



class ExcelPathRequest(BaseModel):
    file_path: str

# Registers the Excel file path with the backend (called by Electron when path is set/changed)
@app.post("/setup/excel-path")
def setup_excel_path(req: ExcelPathRequest):
    global _excel_path
    if not req.file_path.lower().endswith(".xlsm"):
        raise HTTPException(status_code=400, detail="invalid_path")
    _excel_path = req.file_path
    return {"status": "ok"}

# Updates the Excel file with bought/sold skins from CSFloat history
@app.post("/update-excel")
async def update():
    if not _excel_path:
        raise HTTPException(status_code=400, detail="no_path_configured")
    try:
        result = await update_excel(_excel_path)
        return {"status": "ok", **result}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="file_not_found")
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 401:
            raise HTTPException(status_code=401, detail="api_key_invalid")
        raise HTTPException(status_code=500, detail="internal_error")
    except Exception:
        raise HTTPException(status_code=500, detail="internal_error")



@app.get("/bot-events")
async def bot_events():
    async def generate():
        while True:
            try:
                event = await asyncio.wait_for(deal_event_queue.get(), timeout=15)
                if event.get("_type") == "bot_error":
                    yield f"event: bot_error\ndata: {json.dumps(event)}\n\n"
                else:
                    yield f"data: {json.dumps(event)}\n\n"
            except asyncio.TimeoutError:
                yield ": keepalive\n\n"
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )



def _find_playwright_driver():
    """Returns a list of args [executable, ...] for running the playwright CLI, or None."""
    import sys
    try:
        from playwright._impl._driver import compute_driver_executable
        result = compute_driver_executable()
        # Modern playwright returns (node_exe, cli_js) tuple; older returns a single Path
        args = [str(p) for p in result] if isinstance(result, (tuple, list)) else [str(result)]
        if all(os.path.exists(p) for p in args):
            return args
    except Exception:
        pass

    if not hasattr(sys, "_MEIPASS"):
        return None

    # Fallback: look for node.exe + cli.js (modern) or playwright.exe (legacy) in _MEIPASS
    driver_dir = os.path.join(sys._MEIPASS, "playwright", "driver")
    node_exe = os.path.join(driver_dir, "node.exe")
    cli_js = os.path.join(driver_dir, "package", "cli.js")
    if os.path.exists(node_exe) and os.path.exists(cli_js):
        return [node_exe, cli_js]

    for root, _dirs, files in os.walk(sys._MEIPASS):
        for f in files:
            if f.lower() == "playwright.exe":
                return [os.path.join(root, f)]

    return None


def _ensure_playwright_browser():
    browsers_path = os.environ.get("PLAYWRIGHT_BROWSERS_PATH")
    if not browsers_path:
        browsers_path = os.path.join(os.environ.get("LOCALAPPDATA", ""), "ms-playwright")

    try:
        if os.path.exists(browsers_path) and any(
            d.startswith("chromium")
            for d in os.listdir(browsers_path)
            if os.path.isdir(os.path.join(browsers_path, d))
        ):
            return
    except Exception:
        pass

    try:
        import subprocess
        driver_args = _find_playwright_driver()
        if not driver_args:
            return
        print("Installing Playwright browser (first run)...")
        subprocess.run(driver_args + ["install", "chromium"], timeout=300)
        print("Playwright browser ready.")
    except Exception as e:
        print(f"Could not install Playwright browser: {e}")


if __name__ == "__main__":
    init_db()
    _ensure_playwright_browser()
    uvicorn.run(app, host="127.0.0.1", port=8000)
