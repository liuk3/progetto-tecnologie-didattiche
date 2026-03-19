# Strutture dati globali e funzioni associate
teams = {}
sid_to_team = {}  # Mappa socket ID a team ID per gestire disconnessioni
pending_removals = {}  # team_id -> threading.Timer (ritardo per rimozione)


def get_leaderboard():
    """Restituisce la classifica ordinata come richiesto.

    - Prima i team che hanno già finito, ordinati per tempo impiegato (meno tempo = più in alto).
    - Poi i team in corso, ordinati per step (più alto = più in alto).
    """
    finished = []
    unfinished = []

    for team in teams.values():
        if team.get('end_time') is not None:
            duration = team['end_time'] - team['start_time']
            finished.append((duration, team))
        else:
            unfinished.append(team)

    finished.sort(key=lambda x: x[0])  # tempo minore = posizione migliore
    finished_teams = [t for _, t in finished]
    unfinished.sort(key=lambda t: t['step'], reverse=True)

    return finished_teams + unfinished

import logging
logging.info("Data module loaded")