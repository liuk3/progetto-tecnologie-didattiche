from flask_socketio import emit
from flask import request
import threading
from data import teams, sid_to_team, pending_removals
from utils import _remove_team_if_still_disconnected, emit_state_update


def handle_join(data):
    team_id = data.get('team_id')
    import logging
    logging.info(f"Join event received: {data}")  # Debug
    if team_id and team_id in teams:
        # Se era programmata una rimozione, cancellala
        if team_id in pending_removals:
            pending_removals[team_id].cancel()
            pending_removals.pop(team_id, None)
            import logging
            logging.info(f"Cancelled pending removal for {team_id}")
        
        sid_to_team[request.sid] = team_id  # type: ignore
        import logging
        logging.info(f"Team {team_id} joined with SID {request.sid}")  # type: ignore
        # Emetti stato attuale quando un client si connette
        emit_state_update()
    else:
        import logging
        logging.info(f"Team {team_id} not found in teams")  # Debug


def handle_disconnect():
    sid = request.sid  # type: ignore
    if sid in sid_to_team:
        team_id = sid_to_team[sid]
        import logging
        logging.info(f"Team {team_id} disconnected; scheduling remove in 2min")
        # Pianifica rimozione se non si ricollega entro 2 minuti
        timer = threading.Timer(120.0, _remove_team_if_still_disconnected, args=[team_id, sid])
        pending_removals[team_id] = timer
        timer.start()

import logging
logging.info("Socket handlers module loaded")