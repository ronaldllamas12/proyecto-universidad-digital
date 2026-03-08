from __future__ import annotations

import json
import os
import time
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone


def _http_request(
    url: str,
    method: str = "GET",
    headers: dict[str, str] | None = None,
) -> tuple[int, dict[str, str], str]:
    request = urllib.request.Request(url, headers=headers or {}, method=method)
    with urllib.request.urlopen(request, timeout=20) as response:
        status = int(response.status)
        response_headers = {k.lower(): v for k, v in response.headers.items()}
        body = response.read().decode("utf-8", errors="replace")
        return status, response_headers, body


def _http_request_with_retries(
    url: str,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    attempts: int = 3,
    base_delay_seconds: float = 1.0,
) -> tuple[int, dict[str, str], str]:
    last_exc: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return _http_request(url=url, method=method, headers=headers)
        except urllib.error.HTTPError as exc:
            # Retry only transient HTTP status codes.
            if exc.code in {500, 502, 503, 504} and attempt < attempts:
                time.sleep(base_delay_seconds * (2 ** (attempt - 1)))
                continue
            raise
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            if attempt < attempts:
                time.sleep(base_delay_seconds * (2 ** (attempt - 1)))
                continue
            raise

    if last_exc is not None:
        raise last_exc
    raise RuntimeError("No se pudo completar la solicitud HTTP tras reintentos.")


def _check(name: str, condition: bool, details: str) -> dict[str, str]:
    return {
        "name": name,
        "status": "PASS" if condition else "FAIL",
        "details": details,
    }


def main() -> int:
    api_base = os.getenv("STAGING_API_BASE_URL", "").rstrip("/")
    frontend_base = os.getenv("STAGING_FRONTEND_URL", "").rstrip("/")
    expected_origin = (os.getenv("EXPECTED_CORS_ORIGIN") or "").strip()
    if not expected_origin:
        # Prefer validating CORS with the deployed frontend origin when available.
        expected_origin = frontend_base or "http://localhost:5173"

    if not api_base:
        print("ERROR: STAGING_API_BASE_URL es obligatorio")
        return 2

    checks: list[dict[str, str]] = []

    # 1) Contrato OpenAPI en staging
    try:
        status, openapi_headers, body = _http_request_with_retries(f"{api_base}/openapi.json")
        parsed = json.loads(body)
        has_paths = isinstance(parsed.get("paths"), dict) and len(parsed["paths"]) > 0
        checks.append(_check("openapi_available", status == 200 and has_paths, f"status={status}, paths={len(parsed.get('paths', {}))}"))
    except Exception as exc:  # noqa: BLE001
        openapi_headers = {}
        checks.append(_check("openapi_available", False, f"error={exc}"))

    # 2) Auth sin credenciales debe devolver no autorizado
    try:
        status, headers, _ = _http_request_with_retries(f"{api_base}/auth/me")
        checks.append(_check("auth_unauthorized", status == 401, f"status={status}"))

        csp = headers.get("content-security-policy", "")
        xfo = headers.get("x-frame-options", "")
        has_security_headers = bool(csp) and xfo.upper() == "DENY"
        details = f"source=auth_me, csp={bool(csp)}, xfo={xfo}"
        if not has_security_headers and openapi_headers:
            openapi_csp = openapi_headers.get("content-security-policy", "")
            openapi_xfo = openapi_headers.get("x-frame-options", "")
            has_security_headers = bool(openapi_csp) and openapi_xfo.upper() == "DENY"
            details = f"source=openapi_fallback, csp={bool(openapi_csp)}, xfo={openapi_xfo}"
        checks.append(_check("security_headers_present", has_security_headers, details))
    except urllib.error.HTTPError as exc:
        status = int(exc.code)
        hdrs = {k.lower(): v for k, v in exc.headers.items()}
        checks.append(_check("auth_unauthorized", status == 401, f"status={status}"))
        csp = hdrs.get("content-security-policy", "")
        xfo = hdrs.get("x-frame-options", "")
        has_security_headers = bool(csp) and xfo.upper() == "DENY"
        details = f"source=auth_me_error, csp={bool(csp)}, xfo={xfo}"
        if not has_security_headers and openapi_headers:
            openapi_csp = openapi_headers.get("content-security-policy", "")
            openapi_xfo = openapi_headers.get("x-frame-options", "")
            has_security_headers = bool(openapi_csp) and openapi_xfo.upper() == "DENY"
            details = f"source=openapi_fallback, csp={bool(openapi_csp)}, xfo={openapi_xfo}"
        checks.append(_check("security_headers_present", has_security_headers, details))
    except Exception as exc:  # noqa: BLE001
        checks.append(_check("auth_unauthorized", False, f"error={exc}"))
        checks.append(_check("security_headers_present", False, f"error={exc}"))

    # 3) CORS esperado en preflight OPTIONS.
    try:
        status, headers, _ = _http_request_with_retries(
            f"{api_base}/openapi.json",
            method="OPTIONS",
            headers={
                "Origin": expected_origin,
                "Access-Control-Request-Method": "GET",
            },
        )
        acao = headers.get("access-control-allow-origin", "")
        checks.append(
            _check(
                "cors_header_present",
                status == 200 and acao == expected_origin,
                f"status={status}, expected={expected_origin}, acao={acao}",
            )
        )
    except Exception as exc:  # noqa: BLE001
        checks.append(_check("cors_header_present", False, f"error={exc}"))

    # 4) Frontend staging disponible
    if frontend_base:
        try:
            status, _headers, body = _http_request_with_retries(frontend_base)
            looks_html = "<html" in body.lower() or "<!doctype html" in body.lower()
            checks.append(_check("frontend_available", status == 200 and looks_html, f"status={status}"))
        except Exception as exc:  # noqa: BLE001
            checks.append(_check("frontend_available", False, f"error={exc}"))

    passed = sum(1 for c in checks if c["status"] == "PASS")
    failed = len(checks) - passed

    report_lines = [
        "# Staging Equivalence Report",
        "",
        f"- Generated UTC: {datetime.now(timezone.utc).replace(microsecond=0).isoformat()}",
        f"- API base: {api_base}",
        f"- Frontend base: {frontend_base or 'n/a'}",
        f"- Expected Origin: {expected_origin}",
        "",
        "| Check | Status | Details |",
        "| --- | --- | --- |",
    ]
    for check in checks:
        report_lines.append(f"| {check['name']} | {check['status']} | {check['details']} |")

    report_lines.extend([
        "",
        f"- Total checks: {len(checks)}",
        f"- Passed: {passed}",
        f"- Failed: {failed}",
    ])

    with open("staging-equivalence-report.md", "w", encoding="utf-8") as file_obj:
        file_obj.write("\n".join(report_lines) + "\n")

    print("\n".join(report_lines))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
