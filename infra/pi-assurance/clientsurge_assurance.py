#!/usr/bin/env python3
"""ClientSurge independent deployment and revenue assurance engine.

Designed for a Raspberry Pi running systemd timers. The engine performs:
- public DNS, TLS and route checks without depending on Base44 or GitHub;
- controlled Stripe Checkout smoke verification without submitting payment;
- post-publish verification keyed to the Base44 Auto Publish GitHub workflow;
- stateful, deduplicated Telegram failure and recovery alerts.

Only Python's standard library is required.
"""

from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import re
import socket
import ssl
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

APP_ID = os.getenv("CLIENTSURGE_APP_ID", "69dc4a79656fdba136d413d3")
BASE_URL = os.getenv("CLIENTSURGE_BASE_URL", "https://clientsurgesystems.com").rstrip("/")
STATE_DIR = Path(os.getenv("CLIENTSURGE_STATE_DIR", "/var/lib/clientsurge-assurance"))
RUNTIME_DIR = Path(os.getenv("CLIENTSURGE_RUNTIME_DIR", "/run/clientsurge-assurance"))
TIMEOUT_SECONDS = float(os.getenv("CLIENTSURGE_HTTP_TIMEOUT_SECONDS", "20"))
SLOW_WARNING_MS = int(os.getenv("CLIENTSURGE_SLOW_WARNING_MS", "4000"))
SLOW_CRITICAL_MS = int(os.getenv("CLIENTSURGE_SLOW_CRITICAL_MS", "10000"))
SSL_WARNING_DAYS = int(os.getenv("CLIENTSURGE_SSL_WARNING_DAYS", "21"))
SSL_CRITICAL_DAYS = int(os.getenv("CLIENTSURGE_SSL_CRITICAL_DAYS", "7"))
FAILURE_THRESHOLD = int(os.getenv("CLIENTSURGE_FAILURE_THRESHOLD", "2"))
ALERT_REPEAT_HOURS = int(os.getenv("CLIENTSURGE_ALERT_REPEAT_HOURS", "6"))
GITHUB_REPOSITORY = os.getenv("CLIENTSURGE_GITHUB_REPOSITORY", "stellaragencyai/clientsurge-systems")
GITHUB_WORKFLOW = os.getenv("CLIENTSURGE_GITHUB_WORKFLOW", "base44-auto-publish.yml")
GITHUB_TOKEN = os.getenv("CLIENTSURGE_GITHUB_TOKEN", "").strip()
TELEGRAM_BOT_TOKEN = os.getenv("CLIENTSURGE_TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_CHAT_ID = os.getenv("CLIENTSURGE_TELEGRAM_CHAT_ID", "").strip()
EXPECTED_STRIPE_MODE = os.getenv("CLIENTSURGE_EXPECT_STRIPE_MODE", "live").strip()
CHECKOUT_PACKAGE = os.getenv("CLIENTSURGE_CHECKOUT_PACKAGE", "growth_system").strip()
USER_AGENT = "ClientSurge Assurance Node/1.0"
MAX_BODY_BYTES = 2_000_000


class AssuranceError(RuntimeError):
    """Raised for a failed assurance operation."""


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utc_now().isoformat()


def read_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return default


def atomic_write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=path.parent,
        prefix=f".{path.name}.",
        delete=False,
    ) as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
        temp_name = handle.name
    os.replace(temp_name, path)


def append_jsonl(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, sort_keys=True) + "\n")


def request(
    url: str,
    *,
    method: str = "GET",
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
    timeout: float = TIMEOUT_SECONDS,
) -> dict[str, Any]:
    request_headers = {
        "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
        "User-Agent": USER_AGENT,
        "Connection": "close",
    }
    if headers:
        request_headers.update(headers)

    req = urllib.request.Request(url, data=data, headers=request_headers, method=method)
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            body = response.read(MAX_BODY_BYTES)
            return {
                "ok": 200 <= response.status < 400,
                "status": response.status,
                "headers": dict(response.headers.items()),
                "body": body,
                "final_url": response.geturl(),
                "latency_ms": round((time.perf_counter() - started) * 1000),
            }
    except urllib.error.HTTPError as error:
        return {
            "ok": False,
            "status": error.code,
            "headers": dict(error.headers.items()) if error.headers else {},
            "body": error.read(MAX_BODY_BYTES),
            "final_url": error.geturl(),
            "latency_ms": round((time.perf_counter() - started) * 1000),
            "error": str(error),
        }
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        return {
            "ok": False,
            "status": None,
            "headers": {},
            "body": b"",
            "final_url": url,
            "latency_ms": round((time.perf_counter() - started) * 1000),
            "error": str(error),
        }


def send_telegram(message: str) -> bool:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print(f"ALERT (Telegram not configured):\n{message}", file=sys.stderr)
        return False

    endpoint = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = urllib.parse.urlencode(
        {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "disable_web_page_preview": "true",
        }
    ).encode("utf-8")
    result = request(
        endpoint,
        method="POST",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
    )
    if not result["ok"]:
        print(f"Telegram alert failed: HTTP {result['status']} {result.get('error', '')}", file=sys.stderr)
        return False
    return True


def check_dns(hostname: str) -> dict[str, Any]:
    started = time.perf_counter()
    try:
        records = socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
        addresses = sorted({record[4][0] for record in records})
        return {
            "name": "DNS resolution",
            "kind": "dns",
            "status": "pass" if addresses else "fail",
            "latency_ms": round((time.perf_counter() - started) * 1000),
            "addresses": addresses,
            "failures": [] if addresses else ["no IP addresses returned"],
        }
    except OSError as error:
        return {
            "name": "DNS resolution",
            "kind": "dns",
            "status": "fail",
            "latency_ms": round((time.perf_counter() - started) * 1000),
            "addresses": [],
            "failures": [str(error)],
        }


def check_tls(hostname: str) -> dict[str, Any]:
    started = time.perf_counter()
    failures: list[str] = []
    warnings: list[str] = []
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=TIMEOUT_SECONDS) as raw_socket:
            with context.wrap_socket(raw_socket, server_hostname=hostname) as tls_socket:
                certificate = tls_socket.getpeercert()
                cipher = tls_socket.cipher()
        not_after_text = certificate.get("notAfter", "")
        not_after = datetime.strptime(not_after_text, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        days_remaining = int((not_after - utc_now()).total_seconds() // 86400)
        if days_remaining < SSL_CRITICAL_DAYS:
            failures.append(f"TLS certificate expires in {days_remaining} day(s)")
        elif days_remaining < SSL_WARNING_DAYS:
            warnings.append(f"TLS certificate expires in {days_remaining} day(s)")
        return {
            "name": "TLS certificate",
            "kind": "tls",
            "status": "fail" if failures else "pass",
            "latency_ms": round((time.perf_counter() - started) * 1000),
            "expires_at": not_after.isoformat(),
            "days_remaining": days_remaining,
            "cipher": cipher[0] if cipher else None,
            "warnings": warnings,
            "failures": failures,
        }
    except (OSError, ssl.SSLError, ValueError) as error:
        return {
            "name": "TLS certificate",
            "kind": "tls",
            "status": "fail",
            "latency_ms": round((time.perf_counter() - started) * 1000),
            "warnings": [],
            "failures": [str(error)],
        }


def load_routes(routes_file: Path, profile: str) -> list[dict[str, Any]]:
    payload = read_json(routes_file, {})
    routes = payload.get(profile)
    if not isinstance(routes, list) or not routes:
        raise AssuranceError(f"Route profile '{profile}' is missing or empty in {routes_file}")
    return routes


def check_route(route: dict[str, Any]) -> dict[str, Any]:
    path = str(route.get("path", "/"))
    name = str(route.get("name", path))
    url = urllib.parse.urljoin(f"{BASE_URL}/", path.lstrip("/"))
    result = request(url)
    failures: list[str] = []
    warnings: list[str] = []
    expected_status = route.get("expect_status", [200])
    if result["status"] not in expected_status:
        failures.append(f"expected HTTP {expected_status}, received {result['status']}")

    content_type = result["headers"].get("Content-Type", result["headers"].get("content-type", ""))
    body_text = result["body"].decode("utf-8", errors="replace")
    if route.get("require_html", True) and "text/html" not in content_type.lower():
        failures.append(f"expected text/html, received {content_type or 'no content-type'}")
    if route.get("require_app_shell", True) and '<div id="root">' not in body_text:
        failures.append("response does not contain the ClientSurge Vite app shell")
    if "404 | ClientSurge Systems" in body_text:
        failures.append("route appears to serve the ClientSurge not-found shell")

    contains_all = [str(value) for value in route.get("contains_all", [])]
    missing_all = [value for value in contains_all if value not in body_text]
    if missing_all:
        failures.append(f"missing required marker(s): {', '.join(missing_all)}")

    contains_any = [str(value) for value in route.get("contains_any", [])]
    if contains_any and not any(value in body_text for value in contains_any):
        failures.append(f"none of the expected markers were found: {', '.join(contains_any)}")

    if result["latency_ms"] >= SLOW_CRITICAL_MS:
        failures.append(f"response time {result['latency_ms']}ms exceeds critical limit {SLOW_CRITICAL_MS}ms")
    elif result["latency_ms"] >= SLOW_WARNING_MS:
        warnings.append(f"response time {result['latency_ms']}ms exceeds warning limit {SLOW_WARNING_MS}ms")

    return {
        "name": name,
        "kind": "route",
        "path": path,
        "url": url,
        "final_url": result["final_url"],
        "http_status": result["status"],
        "content_type": content_type,
        "bytes_read": len(result["body"]),
        "latency_ms": result["latency_ms"],
        "status": "fail" if failures else "pass",
        "warnings": warnings,
        "failures": failures or ([result["error"]] if result.get("error") else []),
    }


def run_web_checks(routes_file: Path, profile: str) -> dict[str, Any]:
    hostname = urllib.parse.urlparse(BASE_URL).hostname
    if not hostname:
        raise AssuranceError(f"Invalid CLIENTSURGE_BASE_URL: {BASE_URL}")

    checks = [check_dns(hostname), check_tls(hostname)]
    checks.extend(check_route(route) for route in load_routes(routes_file, profile))
    failed = [check for check in checks if check["status"] != "pass"]
    warnings = [warning for check in checks for warning in check.get("warnings", [])]
    return {
        "ok": not failed,
        "checked_at": iso_now(),
        "base_url": BASE_URL,
        "profile": profile,
        "check_count": len(checks),
        "pass_count": len(checks) - len(failed),
        "fail_count": len(failed),
        "warning_count": len(warnings),
        "checks": checks,
    }


def redact_checkout_url(url: str) -> str:
    try:
        parsed = urllib.parse.urlparse(url)
        segments = [segment for segment in parsed.path.split("/") if segment]
        prefix = "/" + "/".join(segments[:2]) if segments else ""
        return f"{parsed.scheme}://{parsed.netloc}{prefix}/[redacted-checkout-session]"
    except (TypeError, ValueError):
        return "[invalid-url]"


def validate_checkout_response(status: int | None, payload: dict[str, Any]) -> tuple[list[str], dict[str, Any]]:
    nested = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    checkout_url = payload.get("url") or nested.get("url") or ""
    session_id = payload.get("session_id") or nested.get("session_id") or ""
    request_id = payload.get("request_id") or nested.get("request_id") or ""
    stripe_mode = payload.get("stripe_mode") or nested.get("stripe_mode") or ""
    smoke_test = payload.get("smoke_test") if "smoke_test" in payload else nested.get("smoke_test")

    failures: list[str] = []
    if status is None or not 200 <= status < 300:
        failures.append(f"expected HTTP 2xx, received {status}")
    if not isinstance(checkout_url, str) or not re.match(r"^https://checkout\.stripe\.com/", checkout_url):
        failures.append("missing or invalid Stripe Checkout URL")
    if not isinstance(session_id, str) or not re.match(r"^cs_(live|test)_", session_id):
        failures.append("missing or invalid Stripe Checkout Session ID")
    if not request_id:
        failures.append("missing request_id")
    if EXPECTED_STRIPE_MODE and stripe_mode and stripe_mode != EXPECTED_STRIPE_MODE:
        failures.append(f"expected Stripe mode {EXPECTED_STRIPE_MODE}, received {stripe_mode}")
    if smoke_test is False:
        failures.append("runtime explicitly reported smoke_test=false")

    safe = {
        "checkout_url": redact_checkout_url(checkout_url),
        "session_id_prefix": session_id[:12] if session_id else None,
        "request_id": request_id or None,
        "stripe_mode": stripe_mode or "not_returned_by_runtime",
        "smoke_test": smoke_test,
    }
    return failures, safe


def run_checkout_smoke() -> dict[str, Any]:
    endpoint = f"{BASE_URL}/api/apps/{APP_ID}/functions/createCheckoutSession"
    stamp = utc_now().strftime("%Y%m%d%H%M%S")
    random_suffix = hashlib.sha256(os.urandom(16)).hexdigest()[:8]
    payload = {
        "package_key": CHECKOUT_PACKAGE,
        "customer_name": "ClientSurge Pi Assurance Smoke",
        "customer_email": f"checkout-smoke+pi-{stamp}-{random_suffix}@clientsurge.test",
        "customer_phone": "6025550100",
        "business_name": "ClientSurge Pi Assurance Smoke Test",
        "industry": "smoke_test",
        "success_url": f"{BASE_URL}/order-success?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{BASE_URL}/product-signup?package={urllib.parse.quote(CHECKOUT_PACKAGE)}",
        "smoke_test": True,
        "source": "raspberry_pi_assurance_node",
    }
    result = request(
        endpoint,
        method="POST",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Accept": "application/json", "Content-Type": "application/json"},
    )
    try:
        response_payload = json.loads(result["body"].decode("utf-8", errors="replace"))
    except json.JSONDecodeError:
        response_payload = {}

    failures, safe = validate_checkout_response(result["status"], response_payload)
    if not response_payload:
        failures.append("checkout response was not valid JSON")

    return {
        "name": "Live Stripe checkout smoke",
        "kind": "revenue",
        "status": "fail" if failures else "pass",
        "checked_at": iso_now(),
        "endpoint": endpoint,
        "package_key": CHECKOUT_PACKAGE,
        "http_status": result["status"],
        "latency_ms": result["latency_ms"],
        "safe_response": safe,
        "failures": failures,
        "note": "Creates a smoke-only Stripe Checkout Session. It does not submit payment.",
    }


def github_api(path: str) -> dict[str, Any]:
    if not GITHUB_TOKEN:
        raise AssuranceError("CLIENTSURGE_GITHUB_TOKEN is required for release assurance on the private repository")
    result = request(
        f"https://api.github.com{path}",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    if not result["ok"]:
        raise AssuranceError(f"GitHub API request failed: HTTP {result['status']} {path}")
    try:
        return json.loads(result["body"].decode("utf-8"))
    except json.JSONDecodeError as error:
        raise AssuranceError(f"GitHub API returned invalid JSON for {path}: {error}") from error


def latest_publish_run() -> dict[str, Any]:
    repository = urllib.parse.quote(GITHUB_REPOSITORY, safe="/")
    workflow = urllib.parse.quote(GITHUB_WORKFLOW, safe="")
    payload = github_api(
        f"/repos/{repository}/actions/workflows/{workflow}/runs?branch=main&status=completed&per_page=1"
    )
    runs = payload.get("workflow_runs", [])
    if not runs:
        raise AssuranceError("No completed Base44 Auto Publish workflow runs were returned")
    run = runs[0]
    return {
        "id": run.get("id"),
        "run_number": run.get("run_number"),
        "run_attempt": run.get("run_attempt"),
        "conclusion": run.get("conclusion"),
        "head_sha": run.get("head_sha"),
        "html_url": run.get("html_url"),
        "created_at": run.get("created_at"),
        "updated_at": run.get("updated_at"),
    }


def failure_lines(report: dict[str, Any]) -> list[str]:
    lines: list[str] = []
    for check in report.get("checks", []):
        for failure in check.get("failures", []):
            lines.append(f"{check.get('name', 'Check')}: {failure}")
    for failure in report.get("failures", []):
        lines.append(str(failure))
    return lines


def fingerprint(lines: list[str]) -> str:
    normalized = "\n".join(sorted(lines))
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def update_alert_state(mode: str, report: dict[str, Any], *, threshold: int = FAILURE_THRESHOLD) -> None:
    state_path = STATE_DIR / f"{mode}-alert-state.json"
    state = read_json(
        state_path,
        {
            "status": "unknown",
            "consecutive_failures": 0,
            "last_fingerprint": "",
            "last_alert_at": None,
        },
    )
    lines = failure_lines(report)
    healthy = bool(report.get("ok"))

    if healthy:
        if state.get("status") == "unhealthy" and state.get("last_alert_at"):
            send_telegram(
                f"✅ CLIENTSURGE RECOVERED\n"
                f"Mode: {mode}\n"
                f"Checks: {report.get('pass_count', report.get('check_count', 'n/a'))} passed\n"
                f"Recovered: {iso_now()}"
            )
        state.update(
            {
                "status": "healthy",
                "consecutive_failures": 0,
                "last_fingerprint": "",
                "last_healthy_at": iso_now(),
            }
        )
        atomic_write_json(state_path, state)
        return

    state["status"] = "unhealthy"
    state["consecutive_failures"] = int(state.get("consecutive_failures", 0)) + 1
    current_fingerprint = fingerprint(lines)
    last_alert = parse_iso(state.get("last_alert_at"))
    repeat_due = not last_alert or (utc_now() - last_alert).total_seconds() >= ALERT_REPEAT_HOURS * 3600
    changed = current_fingerprint != state.get("last_fingerprint")

    if state["consecutive_failures"] >= threshold and (changed or repeat_due):
        preview = lines[:8]
        remaining = max(0, len(lines) - len(preview))
        details = "\n".join(f"• {line}" for line in preview)
        if remaining:
            details += f"\n• …and {remaining} more failure(s)"
        send_telegram(
            f"🚨 CLIENTSURGE ASSURANCE FAILURE\n"
            f"Mode: {mode}\n"
            f"Consecutive failures: {state['consecutive_failures']}\n"
            f"Time: {iso_now()}\n\n{details}"
        )
        state["last_alert_at"] = iso_now()
        state["last_fingerprint"] = current_fingerprint

    atomic_write_json(state_path, state)


def persist_report(mode: str, report: dict[str, Any]) -> None:
    report = {"mode": mode, **report}
    atomic_write_json(STATE_DIR / f"latest-{mode}.json", report)
    append_jsonl(STATE_DIR / "history.jsonl", report)
    print(json.dumps(report, indent=2, sort_keys=True))


def run_watchdog(routes_file: Path) -> int:
    report = run_web_checks(routes_file, "light")
    persist_report("watchdog", report)
    update_alert_state("watchdog", report)
    return 0 if report["ok"] else 2


def run_revenue(routes_file: Path) -> int:
    web = run_web_checks(routes_file, "full")
    checkout = run_checkout_smoke()
    checks = [*web["checks"], checkout]
    failed = [check for check in checks if check["status"] != "pass"]
    report = {
        "ok": not failed,
        "checked_at": iso_now(),
        "base_url": BASE_URL,
        "check_count": len(checks),
        "pass_count": len(checks) - len(failed),
        "fail_count": len(failed),
        "checks": checks,
    }
    persist_report("revenue", report)
    update_alert_state("revenue", report, threshold=1)
    return 0 if report["ok"] else 2


def run_release(routes_file: Path) -> int:
    release_state_path = STATE_DIR / "release-state.json"
    release_state = read_json(release_state_path, {})
    try:
        run = latest_publish_run()
    except AssuranceError as error:
        report = {
            "ok": False,
            "checked_at": iso_now(),
            "check_count": 1,
            "pass_count": 0,
            "fail_count": 1,
            "checks": [
                {
                    "name": "GitHub Base44 publish workflow lookup",
                    "kind": "release",
                    "status": "fail",
                    "failures": [str(error)],
                }
            ],
        }
        persist_report("release", report)
        update_alert_state("release", report)
        return 3

    if run.get("conclusion") != "success":
        report = {
            "ok": False,
            "checked_at": iso_now(),
            "check_count": 1,
            "pass_count": 0,
            "fail_count": 1,
            "publish_run": run,
            "checks": [
                {
                    "name": "Base44 Auto Publish workflow",
                    "kind": "release",
                    "status": "fail",
                    "failures": [f"latest completed run concluded {run.get('conclusion')!r}"],
                }
            ],
        }
        persist_report("release", report)
        update_alert_state("release", report, threshold=1)
        return 2

    if run.get("id") == release_state.get("last_verified_run_id"):
        report = {
            "ok": True,
            "checked_at": iso_now(),
            "check_count": 1,
            "pass_count": 1,
            "fail_count": 0,
            "publish_run": run,
            "checks": [
                {
                    "name": "Release verification state",
                    "kind": "release",
                    "status": "pass",
                    "failures": [],
                    "note": "Latest successful Base44 publish run was already independently verified.",
                }
            ],
        }
        persist_report("release", report)
        update_alert_state("release", report)
        return 0

    web = run_web_checks(routes_file, "full")
    checkout = run_checkout_smoke()
    checks = [
        {
            "name": "Base44 Auto Publish workflow",
            "kind": "release",
            "status": "pass",
            "failures": [],
            "run_id": run.get("id"),
            "head_sha": run.get("head_sha"),
            "run_url": run.get("html_url"),
        },
        *web["checks"],
        checkout,
    ]
    failed = [check for check in checks if check["status"] != "pass"]
    report = {
        "ok": not failed,
        "checked_at": iso_now(),
        "base_url": BASE_URL,
        "publish_run": run,
        "check_count": len(checks),
        "pass_count": len(checks) - len(failed),
        "fail_count": len(failed),
        "checks": checks,
    }
    if report["ok"]:
        release_state.update(
            {
                "last_verified_run_id": run.get("id"),
                "last_verified_run_number": run.get("run_number"),
                "last_verified_sha": run.get("head_sha"),
                "verified_at": iso_now(),
            }
        )
        atomic_write_json(release_state_path, release_state)
        send_telegram(
            f"✅ CLIENTSURGE RELEASE VERIFIED\n"
            f"Commit: {(run.get('head_sha') or '')[:12]}\n"
            f"Workflow run: {run.get('run_number')} attempt {run.get('run_attempt')}\n"
            f"Independent checks passed: {report['pass_count']}\n"
            f"Verified: {report['checked_at']}"
        )

    persist_report("release", report)
    update_alert_state("release", report, threshold=1)
    return 0 if report["ok"] else 2


def acquire_lock(mode: str):
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    lock_path = RUNTIME_DIR / f"{mode}.lock"
    handle = lock_path.open("w", encoding="utf-8")
    try:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError as error:
        handle.close()
        raise AssuranceError(f"another {mode} assurance run is already active") from error
    return handle


def main() -> int:
    parser = argparse.ArgumentParser(description="ClientSurge Raspberry Pi assurance engine")
    parser.add_argument("--mode", choices=("watchdog", "release", "revenue"), required=True)
    parser.add_argument(
        "--routes-file",
        type=Path,
        default=Path("/opt/clientsurge-assurance/routes.json"),
    )
    args = parser.parse_args()

    STATE_DIR.mkdir(parents=True, exist_ok=True)
    lock_handle = acquire_lock(args.mode)
    try:
        if args.mode == "watchdog":
            return run_watchdog(args.routes_file)
        if args.mode == "release":
            return run_release(args.routes_file)
        return run_revenue(args.routes_file)
    finally:
        fcntl.flock(lock_handle.fileno(), fcntl.LOCK_UN)
        lock_handle.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssuranceError as error:
        print(json.dumps({"ok": False, "checked_at": iso_now(), "error": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(3) from error
