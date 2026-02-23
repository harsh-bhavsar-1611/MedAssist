import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen


GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


class GoogleTokenError(Exception):
    pass


def verify_google_id_token(id_token: str):
    if not id_token:
        raise GoogleTokenError("Missing Google credential token.")

    query = urlencode({"id_token": id_token})
    url = f"{GOOGLE_TOKENINFO_URL}?{query}"

    try:
        with urlopen(url, timeout=8) as response:  # nosec B310
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError) as exc:
        raise GoogleTokenError("Unable to validate Google token.") from exc

    if "error_description" in payload:
        raise GoogleTokenError(payload.get("error_description", "Invalid Google token."))

    return payload
