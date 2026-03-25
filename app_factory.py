from flask import Flask
from flask_socketio import SocketIO
from config import SECRET_KEY, SOCKETIO_ALLOWED_ORIGINS
import logging

app = Flask(__name__)
app.secret_key = SECRET_KEY
socketio = SocketIO(app, cors_allowed_origins=SOCKETIO_ALLOWED_ORIGINS)


@app.after_request
def add_security_headers(response):
	response.headers["X-Content-Type-Options"] = "nosniff"
	response.headers["X-Frame-Options"] = "SAMEORIGIN"
	response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
	response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
	response.headers["Content-Security-Policy"] = (
		"default-src 'self'; "
		"script-src 'self' 'unsafe-inline' https://cdn.socket.io https://embed.puzzle-maker.online; "
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
		"font-src 'self' https://fonts.gstatic.com; "
		"img-src 'self' data:; "
		"frame-src 'self' https://puzzle-maker.online https://embed.puzzle-maker.online; "
		"connect-src 'self' ws: wss:;"
	)
	return response

logging.info("App factory module loaded")