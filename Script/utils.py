from datetime import datetime


def cents_to_usd(cents: int) -> float:
    return round(cents / 100, 2)


def parse_iso_timestamp(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))
