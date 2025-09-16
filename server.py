#!/usr/bin/env python3
"""
Simple HTTP server for testing SayChord Demo
Serves files with proper MIME types for modern web development
"""

import http.server
import socketserver
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def guess_type(self, path):
        mimetype = super().guess_type(path)
        # Ensure JavaScript files are served with correct MIME type
        if path.endswith('.js'):
            return ('application/javascript', None)
        return mimetype

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"SayChord Demo Server")
    print(f"====================")
    print(f"Serving at: http://localhost:{PORT}")
    print(f"Open http://localhost:{PORT}/index.html in your browser")
    print(f"Press Ctrl+C to stop the server")
    httpd.serve_forever()