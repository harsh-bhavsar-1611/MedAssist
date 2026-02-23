from rest_framework.response import Response


def api_success(*, data=None, message="OK", status=200):
    payload = {"ok": True, "message": message}
    if data is not None:
        payload["data"] = data
    return Response(payload, status=status)


def api_error(*, message="Request failed", errors=None, status=400, code=None):
    payload = {"ok": False, "message": message}
    if code:
        payload["code"] = code
    if errors:
        payload["errors"] = errors
    return Response(payload, status=status)
