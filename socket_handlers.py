import time
import re
import logging

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
    try:
        payload = data if isinstance(data, dict) else {}
        team_id = payload.get('team_id')

        if not team_id or not isinstance(team_id, str):
            emit('join_error', {'message': 'Team non valido'})
            return

        logging.info("Join event received for team_id=%s", team_id)
        if team_id in teams:
            # Se era programmata una rimozione, cancellala
            if team_id in pending_removals:
                pending_removals[team_id].cancel()
                pending_removals.pop(team_id, None)
                logging.info("Cancelled pending removal for %s", team_id)

            sid_to_team[request.sid] = team_id  # type: ignore
            logging.info("Team %s joined with SID %s", team_id, request.sid)  # type: ignore
            # Emetti stato attuale quando un client si connette
            emit_state_update()
            return

        logging.info("Team %s not found in teams; creating fallback team", team_id)
        recovered_icon = _extract_icon_from_team_id(team_id)
        recovered_name = _extract_name_from_team_id(team_id)
        fallback_icon = recovered_icon or payload.get('icon')
        if fallback_icon not in VALID_ICONS:
            fallback_icon = VALID_ICONS[0]

        # Se il team non è stato trovato, probabilmente è un team che era esistente ed è stato rimosso,
        # lo aggiungiamo come team nuovo con step 0 utilizzando i dati ricevuti.
        teams[team_id] = {
            "name": recovered_name or payload.get('name', 'Unknown'),
            "icon": fallback_icon,
            "step": 0,
            "start_time": time.time(),
            "end_time": None,
            "last_seen": time.time()
        }
        sid_to_team[request.sid] = team_id  # type: ignore
        logging.info("Team %s created and joined with SID %s", team_id, request.sid)  # type: ignore
        emit_state_update()
    except Exception:
        logging.exception("Unhandled socket join error")
        emit('join_error', {'message': 'Errore durante la connessione'})
        


def handle_disconnect():
    try:
        sid = request.sid  # type: ignore
        if sid in sid_to_team:
            team_id = sid_to_team[sid]
            logging.info("Team %s disconnected; scheduling remove in 2min", team_id)
            # Pianifica rimozione se non si ricollega entro 2 minuti
            timer = threading.Timer(120.0, _remove_team_if_still_disconnected, args=[team_id, sid])
            pending_removals[team_id] = timer
            timer.start()
    except Exception:
        logging.exception("Unhandled socket disconnect error")


logging.info("Socket handlers module loaded")