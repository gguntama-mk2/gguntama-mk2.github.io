#!/usr/bin/env python3
"""PROJECT T Stage 5.3: read-only local test servers. No production connections.

Usage:
  py -3.12 project_t_stage5_3_mock.py --self-test
  py -3.12 project_t_stage5_3_mock.py --preview "C:\path\to\PROJECT_T_STAGE4_FULL_PREVIEW"

Serves static preview at http://127.0.0.1:8766 and empty, public mock API
responses at both :8766 and :8000. Binds to 127.0.0.1 only.
Never modifies preview files, accounts, database, or remote services.
"""
import argparse
import functools
import json
import sys
import threading
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

STATIC_PORT = 8766
API_PORT = 8000
HOST = "127.0.0.1"
ALLOWED_ORIGINS = {
    "http://127.0.0.1:8766",
    "http://localhost:8766",
}

# Contract verified against the existing server's public GET test fixtures.
# All values are intentionally empty; NO production data is returned.
PUBLIC_MOCKS = {
    "/api/v1/move-icons": {"schema": 1, "characters": {}},
    "/api/v1/move-media": {"schema": 1, "characters": {}},
    "/api/v1/px-overrides": {"schema": 1, "items": []},
    "/api/v1/checksheet/overrides": {"schema": 1, "characters": {}},
    "/api/v1/community/published": {"schema": 1, "published": False},
}


def api_result(path):
    if path == "/healthz":
        return 200, {"ok": True, "mock": True}
    if path in PUBLIC_MOCKS:
        return 200, PUBLIC_MOCKS[path]
    if path in {"/me", "/api/v1/me"}:
        return 401, {"detail": "Not signed in (mock server)"}
    return 404, {"detail": "Not implemented in read-only mock"}


class TestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory, role, **kwargs):
        self.role = role
        super().__init__(*args, directory=str(directory), **kwargs)

    def log_message(self, format_string, *args):
        # Do not log URL query strings or private test details.
        return

    def _json_reply(self, status, payload, head=False):
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        origin = self.headers.get("Origin", "")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        if not head:
            self.wfile.write(body)

    def _read(self, head=False):
        path = urlsplit(self.path).path
        if path == "/healthz" or path.startswith("/api/") or path == "/me":
            status, payload = api_result(path)
            self._json_reply(status, payload, head=head)
        elif self.role == "api":
            self._json_reply(404, {"detail": "API mock only"}, head=head)
        elif head:
            super().do_HEAD()
        else:
            super().do_GET()

    def do_GET(self):
        self._read(False)

    def do_HEAD(self):
        self._read(True)

    def do_OPTIONS(self):
        self.send_response(204)
        origin = self.headers.get("Origin", "")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Accept, Content-Type")
            self.send_header("Vary", "Origin")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _deny_write(self):
        self._json_reply(405, {"detail": "Read-only mock. Writes disabled."})

    do_POST = _deny_write
    do_PUT = _deny_write
    do_PATCH = _deny_write
    do_DELETE = _deny_write


def preflight(preview):
    preview = preview.expanduser().resolve(strict=True)
    if not preview.is_dir():
        raise ValueError("Preview is not a directory")
    for filename in ("pc.html", "sp.html", "calendar-events.json", "favicon.svg", "STAGE3_VERIFY.json"):
        path = preview / filename
        if not path.is_file() or path.is_symlink():
            raise ValueError("Missing or unsafe preview file: " + filename)
    payload = json.loads((preview / "calendar-events.json").read_text(encoding="utf-8"))
    if not isinstance(payload.get("events"), list) or len(payload["events"]) != 21:
        raise ValueError("Calendar preview is not the reviewed 21-event seed")
    print("STAGE5_3_PREFLIGHT=PASS (21 seed events; no files changed)", flush=True)
    return preview


def self_test():
    expected = {
        "/api/v1/move-icons": "characters",
        "/api/v1/move-media": "characters",
        "/api/v1/px-overrides": "items",
        "/api/v1/checksheet/overrides": "characters",
        "/api/v1/community/published": "published",
    }
    for path, field in expected.items():
        status, data = api_result(path)
        assert status == 200 and data["schema"] == 1 and field in data, path
    assert api_result("/api/v1/unknown")[0] == 404
    assert api_result("/api/v1/me")[0] == 401
    print("STAGE5_3_SELF_TEST=PASS (5 public contracts, 2 negative tests)")


def start(preview):
    # Both listeners run only on this computer. Existing :8766 must be stopped first.
    static_handler = functools.partial(TestHandler, directory=preview, role="static")
    api_handler = functools.partial(TestHandler, directory=preview, role="api")
    static_server = None
    api_server = None
    listeners_started = False
    try:
        static_server = ThreadingHTTPServer((HOST, STATIC_PORT), static_handler)
        api_server = ThreadingHTTPServer((HOST, API_PORT), api_handler)
        static_server.daemon_threads = True
        api_server.daemon_threads = True
        thread = threading.Thread(target=static_server.serve_forever, daemon=True)
        thread.start()
        api_thread = threading.Thread(target=api_server.serve_forever, daemon=True)
        api_thread.start()
        listeners_started = True
        # Confirm both listener ports before declaring success.
        for url in (
            "http://127.0.0.1:8766/api/v1/checksheet/overrides",
            "http://127.0.0.1:8000/api/v1/move-icons",
            "http://127.0.0.1:8766/calendar-events.json",
        ):
            with urllib.request.urlopen(url, timeout=5) as response:
                if response.status != 200:
                    raise RuntimeError("Local HTTP self-check failed")
        print("STAGE5_3_LOCAL_HTTP=PASS", flush=True)
        print("STATIC_PREVIEW=http://127.0.0.1:8766/pc.html", flush=True)
        print("SMARTPHONE_PREVIEW=http://127.0.0.1:8766/sp.html", flush=True)
        print("MOCK_API=http://localhost:8000", flush=True)
        print("API_DATA=EMPTY_TEST_ONLY; AUTH=DISABLED; WRITES=DENIED", flush=True)
        print("PRODUCTION=HOLD; Press Ctrl+C to stop both servers.", flush=True)
        api_thread.join()
    except KeyboardInterrupt:
        print("\nSTAGE5_3_STOPPED")
    finally:
        for server in (static_server, api_server):
            if server is not None:
                if listeners_started:
                    server.shutdown()
                server.server_close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preview", type=Path, help="Verified Stage4 preview directory")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if args.preview is None:
        parser.error("--preview is required unless --self-test is used")
    self_test()
    preview = preflight(args.preview)
    try:
        start(preview)
    except OSError as exc:
        print("PORT_BIND_FAILED: Stop the existing local HTTP server on port 8766 or 8000.", file=sys.stderr)
        print(str(exc), file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
