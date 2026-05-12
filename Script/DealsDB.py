import json, sqlite3

from datetime import datetime
from paths import data_path


def db_path():
    return data_path("deals.db")


def init_db():
    with sqlite3.connect(db_path()) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS deals (
                id                    INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp             TEXT    NOT NULL,
                skin_name             TEXT    NOT NULL,
                skin_id               TEXT    NOT NULL,
                skin_price            INTEGER NOT NULL,
                skin_float            REAL    NOT NULL,
                sell_min_before       INTEGER NOT NULL,
                sell_max_before       INTEGER NOT NULL,
                profit_min_before     INTEGER NOT NULL,
                profit_max_before     INTEGER NOT NULL,
                profit_pct_min_before REAL    NOT NULL,
                profit_pct_max_before REAL    NOT NULL,
                sell_min_after        INTEGER NOT NULL,
                sell_max_after        INTEGER NOT NULL,
                profit_min_after      INTEGER NOT NULL,
                profit_max_after      INTEGER NOT NULL,
                profit_pct_min_after  REAL    NOT NULL,
                profit_pct_max_after  REAL    NOT NULL,
                prices_filtered       TEXT    NOT NULL,
                prices_lower_floats   TEXT    NOT NULL,
                prices_higher_floats  TEXT    NOT NULL,
                min_float_similar     REAL    NOT NULL,
                max_float_similar     REAL    NOT NULL,
                similar_listed        TEXT    NOT NULL
            )
        """)
        conn.commit()
    print("DB initialized")


def save_deal(skin_name, skin_id, skin_price, skin_float,
              sell_min_before, sell_max_before,
              profit_min_before, profit_max_before,
              profit_pct_min_before, profit_pct_max_before,
              sell_min_after, sell_max_after,
              profit_min_after, profit_max_after,
              profit_pct_min_after, profit_pct_max_after,
              prices_filtered, prices_lower_floats, prices_higher_floats,
              min_float_similar, max_float_similar,
              similar_listed_str):
    with sqlite3.connect(db_path()) as conn:
        conn.execute("""
            INSERT INTO deals (
                timestamp, skin_name, skin_id, skin_price, skin_float,
                sell_min_before, sell_max_before, profit_min_before, profit_max_before,
                profit_pct_min_before, profit_pct_max_before,
                sell_min_after, sell_max_after, profit_min_after, profit_max_after,
                profit_pct_min_after, profit_pct_max_after,
                prices_filtered, prices_lower_floats, prices_higher_floats,
                min_float_similar, max_float_similar, similar_listed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.now().replace(microsecond=0).isoformat(),
            skin_name, str(skin_id), round(float(skin_price) * 100), round(skin_float, 5),
            round(sell_min_before), round(sell_max_before),
            round(profit_min_before), round(profit_max_before),
            round(profit_pct_min_before, 2), round(profit_pct_max_before, 2),
            round(sell_min_after), round(sell_max_after),
            round(profit_min_after), round(profit_max_after),
            round(profit_pct_min_after, 2), round(profit_pct_max_after, 2),
            json.dumps(prices_filtered),
            json.dumps(prices_lower_floats),
            json.dumps(prices_higher_floats),
            round(min_float_similar, 5), round(max_float_similar, 5),
            json.dumps(similar_listed_str.splitlines()),
        ))
        conn.commit()


def get_sell_range_by_id(skin_id):
    with sqlite3.connect(db_path()) as conn:
        row = conn.execute(
            "SELECT sell_min_after, sell_max_after FROM deals WHERE skin_id = ? ORDER BY id DESC LIMIT 1",
            (str(skin_id),)
        ).fetchone()
    if row is None:
        return None
    return f"[{row[0] / 100:.2f}$ - {row[1] / 100:.2f}$]"


