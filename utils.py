import threading
from data import teams, sid_to_team, pending_removals, get_leaderboard
from app_factory import socketio


def _remove_team_if_still_disconnected(team_id, sid):
    # Rimuove il team se il socket non è ricollegato entro il timeout
    if sid in sid_to_team and sid_to_team[sid] == team_id:
        if team_id in teams:
            del teams[team_id]
            import logging
            logging.info(f"Team {team_id} removed after timeout")
        del sid_to_team[sid]
        pending_removals.pop(team_id, None)
        emit_state_update()


def emit_state_update():
    """Funzione per emettere l'aggiornamento dello stato a tutti i client."""
    leaderboard = get_leaderboard()
    # Emetti a tutti i client
    socketio.emit('state_update', {"teams": teams, "leaderboard": leaderboard})

import logging
logging.info("Utils module loaded")