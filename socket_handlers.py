import time
import re

from flask_socketio import emit
from flask import request
import threading
from data import teams, sid_to_team, pending_removals
from config import VALID_ICONS
from utils import _remove_team_if_still_disconnected, emit_state_update


def _extract_icon_from_team_id(team_id):
    """Estrae l'icona dal team_id (formato previsto: team_<ts>_i<idx>_<name>)."""
    if not isinstance(team_id, str):
        return None

    match = re.search(r"_i(\d+)_", team_id)
    if not match:
        return None

    icon_index = int(match.group(1))
    if 0 <= icon_index < len(VALID_ICONS):
        return VALID_ICONS[icon_index]
    return None


def _extract_name_from_team_id(team_id):
    """Estrae il nome squadra dal team_id (formato previsto: team_<ts>_i<idx>_<name>)."""
    if not isinstance(team_id, str):
        return None

    match = re.search(r"_i\d+_(.+)$", team_id)
    if not match:
        return None

    extracted_name = match.group(1).strip()
    return extracted_name if extracted_name else None


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
        recovered_icon = _extract_icon_from_team_id(team_id)
        recovered_name = _extract_name_from_team_id(team_id)
        # Se il team non è stato trovato, probabilmente è un team che era esistente ed è stato rimosso, lo aggiungiamo come team nuovo con step 0 utilizzando i dati ricevuti
        teams[team_id] = {
            "name": recovered_name or data.get('name', 'Unknown'),
            "icon": recovered_icon or data.get('icon', 'default'),
            "step": 0,
            "start_time": time.time(),
            "end_time": None,
            "last_seen": time.time()
        }
        sid_to_team[request.sid] = team_id  # type: ignore
        import logging
        logging.info(f"Team {team_id} created and joined with SID {request.sid}")  # type: ignore
        emit_state_update()
        


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