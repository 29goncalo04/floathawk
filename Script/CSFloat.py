import os
import requests, urllib.parse

def _get_header():
    return {"Authorization": os.environ.get("CSFLOAT_API_KEY", "")}

# Gets the current balance of the user account in USD
def get_balance_usd():
    url = "https://csfloat.com/api/v1/me"
    r = requests.get(url, headers=_get_header())
    r.raise_for_status()
    data = r.json()
    return data["user"]["balance"]



# Retrieves the 50 newest skins (in a specific price range, float range, only buy_now, and no stattrak/souvenir)
# Parameters: 
#   - min_float: minimum float for the skins being searched
#   - max_float: maximum float for the skins being searched
#   - min_price: minimum price limit for the skins being searched
#   - max_price: maximum price limit for the skins being searched
def get_newest_skins(min_float, max_float, min_price, max_price):
    url = "https://csfloat.com/api/v1/listings"
    parameters = {
        "sort_by": "most_recent",
        "min_price": min_price,
        "max_price": max_price,
        "type": "buy_now", # Only instant-buy listings
        "min_float": min_float,
        "max_float": max_float,
        "category": "1", # No stattrak/souvenir
    }
    try:
        # Make the request to the API
        # This endpoint requires authentication, so a header with the API token is needed to get the latest listings
        response = requests.get(url, headers=_get_header(), params=parameters)
        response.raise_for_status()
        data = response.json()

        # The API returns a maximum of 50 listings per request
        return data.get("data", [])
    
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 401:
            print(f"[ERROR] Invalid CSFloat API key (401 Unauthorized)")
            return None  # signals auth failure, not rate limit
        print(f"[ERROR] fetch CSFloat data: {e}")
        return []
    except Exception as e:
        print(f"[ERROR] fetch CSFloat data: {e}")
        return []



# Retrieves the skin based on its ID
# Parameters: 
#   - skin_id: ID of the skin 
#   - session: asynchronous HTTP session
async def get_specific_skin(skin_id, session):
    url = f"https://csfloat.com/api/v1/listings/{skin_id}"
    async with session.get(url) as response:
        if response.status == 200:
            data = await response.json()  
            # returns a JSON object following the structure defined in 'Skin_Format.txt' (located in the 'Data' folder)
            return data
        else:
            raise RuntimeError(response)



# Retrieves the latest sales history of a specific skin in JSON format
# Parameters:
#   - skin: JSON object following the structure defined in 'Skin_Format.txt' (located in the 'Data' folder)
#   - session: asynchronous HTTP session
async def fetch_latest_sales_sold(skin, session):
    # Extract the skin's 'market_hash_name'
    # Example: "M4A4 | Howl (Field-Tested)"
    # It is URL-encoded to: "M4A4%20%7C%20Howl%20(Field-Tested)"
    encoded_name = urllib.parse.quote(skin['item']['market_hash_name'])

    # Extract the paint index of the skin
    paint_index = skin['item']['paint_index']

    url = f"https://csfloat.com/api/v1/history/{encoded_name}/sales?paint_index={paint_index}"
    # This endpoint doesn't require authentication (no API token needed)
    async with session.get(url) as response:
        if response.status == 200:
            data = await response.json()  
            # returns a JSON list following the structure defined in 'Latest_Sales_Format.txt' (located in the 'Data' folder)
            return data
        else:
            raise RuntimeError(response)
        


# Retrieves the sales history graph of a specific skin in JSON format
# Parameters:
#   - skin: JSON object following the structure defined in 'Skin_Format.txt' (located in the 'Data' folder)
#   - session: asynchronous HTTP session
async def fetch_sales_graph_sold(skin, session):
    # Extract the skin's 'market_hash_name'
    # Example: "M4A4 | Howl (Field-Tested)"
    # It is URL-encoded to: "M4A4%20%7C%20Howl%20(Field-Tested)"
    encoded_name = urllib.parse.quote(skin['item']['market_hash_name'])
    
    # Extract the paint index of the skin
    paint_index = skin['item']['paint_index']

    url = f"https://csfloat.com/api/v1/history/{encoded_name}/graph?paint_index={paint_index}"
    # This endpoint doesn't require authentication (no API token needed)
    async with session.get(url) as response:
        if response.status == 200:
            data = await response.json()  
            # returns a JSON list following the structure defined in 'Sales_Graph_Format.txt' (located in the 'Data' folder)
            return data
        else:
            raise RuntimeError(response)
        


# Retrieves the 5 cheapest similar listed skins (no stattrak/souvenir, within a specific float range and only buy_now listings)
# Parameters:
#   - min_float: minimum float to include in the search
#   - max_float: maximum float to include in the search
#   - def_index: def index of the skin
#   - paint_index: paint index of the skin
#   - session: asynchronous HTTP session
async def fetch_similar_listed(min_float, max_float, def_index, paint_index, session):
    url = "https://csfloat.com/api/v1/listings"
    parameters = {
        "limit": "5", # Return only the 5 cheapest similar listings
        "category": "1", # No stattrak/souvenir items
        "sort_by": "lowest_price",
        "min_float": min_float,
        "max_float": max_float,
        "type": "buy_now", # Only instant-buy listings
        "def_index": def_index,
        "paint_index": paint_index
    }
    try:
        # Make the request to the API
        # This endpoint requires authentication, so a header with the API token is needed
        async with session.get(url, headers=_get_header(), params=parameters) as response:
            response.raise_for_status()
            data = await response.json()
            return data.get("data", [])
    except Exception as e:
        # If it falls here it means the account got a timeout for doing too many requests and the program needs to wait before doing requests again
        print(f"[ERROR] fetch_similar_listed: {e}")
        return None
    


# Retrieves the 200 newest bought skins
def get_skins_bought():
    url = "https://csfloat.com/api/v1/me/trades?role=buyer&state=pending,verified&limit=200&page=0"
    response = requests.get(url, headers=_get_header())
    response.raise_for_status()
    data = response.json()
    return data.get("trades", [])



# Retrieves the 200 newest sold skins
def get_skins_sold():
    url = "https://csfloat.com/api/v1/me/trades?role=seller&state=pending,verified&limit=200&page=0"
    response = requests.get(url, headers=_get_header())
    response.raise_for_status()
    data = response.json()
    return data.get("trades", [])