from app_factory import app, socketio
from config import DEBUG, HOST, PORT

# Import modules after app and socketio are defined
from routes import *
from socket_handlers import *
from utils import *

# Register socket handlers
socketio.on('join')(handle_join)
socketio.on('disconnect')(handle_disconnect)

if __name__ == '__main__':
    # Esegui l'app con parametri configurabili via variabili ambiente.
    socketio.run(app, host=HOST, port=PORT, debug=DEBUG, allow_unsafe_werkzeug=True)

    # ngrok http 80 