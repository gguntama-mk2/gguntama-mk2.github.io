#!/usr/bin/env python3
"""Local TEST ONLY server with explicit cache semantics for controlled comparisons.

The 600-second policy is a test assumption, not a claim about GitHub Pages CDN.
No backend endpoints, user data, credentials, OAuth or external networking.
"""
import argparse
import functools
import http.server
from pathlib import Path
from urllib.parse import urlsplit

ASSET_EXT={".js",".css",".json",".woff",".woff2",".webp",".avif",".png",".jpg",".jpeg",".svg",".ico",".gif",".mp4",".webm"}

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        path=urlsplit(self.path).path
        if Path(path).suffix.lower() in ASSET_EXT:
            self.send_header("Cache-Control","public, max-age=600")
        else:
            self.send_header("Cache-Control","no-cache")
        self.send_header("X-PT-Test-Only","phase16-local-cache-simulation")
        self.send_header("Content-Security-Policy",
            "default-src 'self' data: blob:; connect-src 'self'; "
            "img-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; font-src 'self' data:; "
            "media-src 'self' blob:; frame-src 'none'; object-src 'none'; "
            "base-uri 'self'; form-action 'self'")
        super().end_headers()

    def do_GET(self):
        if urlsplit(self.path).path.startswith("/api/"):
            data=b'{"detail":"test_only"}'
            self.send_response(401)
            self.send_header("Content-Type","application/json")
            self.send_header("Content-Length",str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        return super().do_GET()

    def do_POST(self):
        self.send_error(403,"Test server is read-only")

    do_PUT=do_POST
    do_PATCH=do_POST
    do_DELETE=do_POST

    def log_message(self,format,*args):
        return  # silent synthetic local browser tests

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--port",type=int,default=8776)
    parser.add_argument("--directory",default=".")
    a=parser.parse_args()
    root=Path(a.directory).resolve(strict=True)
    handler=functools.partial(Handler,directory=str(root))
    server=http.server.ThreadingHTTPServer(("127.0.0.1",a.port),handler)
    server.serve_forever()

if __name__=="__main__":
    main()
