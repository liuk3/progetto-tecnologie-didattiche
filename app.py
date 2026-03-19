from app_factory import app, socketio

# Import modules after app and socketio are defined
from routes import *
from socket_handlers import *
from utils import *

# Register socket handlers
socketio.on('join')(handle_join)
socketio.on('disconnect')(handle_disconnect)

if __name__ == '__main__':
    # Esegui l'app in ascolto su tutte le interfacce
    socketio.run(app, host='0.0.0.0', port=80, debug=True)

    # ngrok http 80 