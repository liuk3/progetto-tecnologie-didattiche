from flask import render_template, request, jsonify, session, redirect, url_for
import time
import html
from app_factory import app
from config import VALID_ICONS
from data import teams
from utils import emit_state_update


@app.route('/')
def index():
    if 'team_id' in session:
        return redirect(url_for('game'))
    return render_template('index.html', valid_icons=VALID_ICONS)


@app.route('/register', methods=['POST'])
def register():
    data = request.json
    team_name = data.get('name', '').strip()
    
    # Sanitizzazione e validazione
    if not team_name or len(team_name) > 50:
        return jsonify({"success": False, "message": "Nome squadra invalido (max 50 caratteri, non vuoto)"})
    
    team_name = html.escape(team_name)  # Evita XSS
    
    icon = data.get('icon')
    if icon not in VALID_ICONS:
        return jsonify({"success": False, "message": "Icona non valida"})
    
    # Crea un ID unico per la squadra
    team_id = f"team_{int(time.time())}_{team_name}"
    
    teams[team_id] = {
        "name": team_name,
        "icon": icon,
        "step": 0,
        "start_time": time.time(),
        "end_time": None,
        "last_seen": time.time()
    }
    
    session['team_id'] = team_id
    
    import logging
    logging.info(f"Team {team_id} registered with name '{team_name}'")
    
    # Emetti aggiornamento stato per includere il nuovo giocatore
    emit_state_update()
    
    return jsonify({"success": True})


@app.route('/game')
def game():
    if 'team_id' not in session:
        return redirect(url_for('index'))
    return render_template('game.html')


@app.route('/api/state')
def get_state():
    """Restituisce lo stato di tutti i giocatori per la mappa in tempo reale."""
    from data import get_leaderboard
    leaderboard = get_leaderboard()
    return jsonify({"teams": teams, "leaderboard": leaderboard})


@app.route('/api/advance', methods=['POST'])
def advance():
    """Verifica la parola chiave e fa avanzare la squadra."""
    if 'team_id' not in session:
        return jsonify({"success": False, "message": "Non autorizzato"})
    
    from config import SOLUTIONS
    team_id = session['team_id']
    team = teams[team_id]
    team['last_seen'] = time.time()
    
    data = request.json
    answer = data.get('answer', '').strip().lower()
    
    # Validazione input
    if len(answer) > 100:
        return jsonify({"success": False, "message": "Risposta troppo lunga"})
    
    current_step = team['step']
    
    if current_step < 5:
        # Verifica se la risposta è corretta per lo step attuale
        if answer == SOLUTIONS[current_step]:
            team['step'] += 1
            import logging
            logging.info(f"Team {team_id} advanced to step {team['step']}")
            if team['step'] == 5:
                team['end_time'] = time.time() # Registra il tempo finale!
                time_taken = int(team['end_time'] - team['start_time'])
                logging.info(f"Team {team_id} completed the game in {time_taken} seconds")
            
            # Emetti aggiornamento stato a tutti i client connessi
            emit_state_update()
            
            return jsonify({"success": True, "step": team['step']})
        else:
            return jsonify({"success": False, "message": "Parola chiave errata!"})
            
    return jsonify({"success": False, "message": "Hai già finito!"})

import logging
logging.info("Routes module loaded")