"""Local preview server that tells the browser not to cache, so edits show up on a normal reload.

Usage:
    python3 scripts/dev_server.py [port]
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8417
    handler = partial(NoCacheHandler, directory=str(ROOT))
    print(f"Serving {ROOT} on http://localhost:{port}")
    ThreadingHTTPServer(("", port), handler).serve_forever()
