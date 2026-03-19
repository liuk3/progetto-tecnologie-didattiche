from flask import Flask
from flask_socketio import SocketIO
from config import SECRET_KEY
import logging

app = Flask(__name__)
app.secret_key = SECRET_KEY
socketio = SocketIO(app)

logging.info("App factory module loaded")