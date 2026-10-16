#!/usr/bin/env python3
"""Run the Mage tools on this computer, or build a static copy of them.

    python serve.py                 # serve on http://localhost:8000 and open the tarot reader
    python serve.py --port 9000     # pick another port
    python serve.py --no-browser    # don't open a browser tab
    python serve.py --build dist    # write a static copy (data.json pre-built) to ./dist

Needs only the Python standard library (3.9+).
"""

import argparse
import json
import re
import shutil
import sys
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from apps.tarot import data as tarot_data  # noqa: E402

# URL path -> function returning JSON-ready data. Each app that needs
# generated data adds an entry here; everything else is served as static files.
DATA_ROUTES = {
    "/apps/tarot/data.json": tarot_data.build_data,
}

START_PAGE = "/apps/tarot/"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _route(self):
        """The decoded request path, or None (after a 404) for hidden files."""
        path = unquote(self.path.split("?", 1)[0].split("#", 1)[0])
        if any(part.startswith(".") for part in re.split(r"[/\\]", path) if part):
            self.send_error(404)
            return None
        return path

    def _send_data(self, path, include_body):
        try:
            payload = DATA_ROUTES[path]()
            status = 200
        except Exception as error:  # show loader errors in the page instead of a bare 500
            payload = {"error": f"{type(error).__name__}: {error}"}
            status = 500
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if include_body:
            self.wfile.write(body)

    def do_GET(self):
        path = self._route()
        if path in DATA_ROUTES:
            self._send_data(path, include_body=True)
        elif path is not None:
            super().do_GET()

    def do_HEAD(self):
        path = self._route()
        if path in DATA_ROUTES:
            self._send_data(path, include_body=False)
        elif path is not None:
            super().do_HEAD()

    def end_headers(self):
        # Always revalidate, so newly dropped-in images and edited text show up on reload.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format, *args):
        pass


def build(out_dir):
    out = Path(out_dir).resolve()
    apps = ROOT / "apps"
    if out == ROOT or out in ROOT.parents or out == apps or apps in out.parents:
        raise SystemExit(f"refusing to build into {out}: it would overwrite the source files")
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    shutil.copy2(ROOT / "index.html", out / "index.html")
    shutil.copytree(ROOT / "apps", out / "apps",
                    ignore=shutil.ignore_patterns("__pycache__", "*.py", "*.pyc"))
    for route, loader in DATA_ROUTES.items():
        target = out / route.lstrip("/")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(loader(), ensure_ascii=False), encoding="utf-8")
    print(f"Static copy written to {out}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--build", metavar="DIR", help="write a static copy to DIR instead of serving")
    args = parser.parse_args()

    if args.build:
        build(args.build)
        return

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    url = f"http://{'localhost' if args.host in ('127.0.0.1', '0.0.0.0') else args.host}:{server.server_port}"
    print(f"Mage tools running at {url}/  (tarot reader: {url}{START_PAGE})")
    print("Press Ctrl+C to stop.")
    if not args.no_browser:
        threading.Timer(0.5, webbrowser.open, [url + START_PAGE]).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
