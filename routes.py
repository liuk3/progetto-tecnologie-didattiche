from flask import render_template, request, jsonify, session, redirect, url_for
import time
import html
import logging
import hashlib
import hmac
from collections import defaultdict, deque
from app_factory import app
from config import (
    VALID_ICONS,
    STORY_TEXT,
    CLASSROOM_LINK,
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_MAX_REQUESTS,
    ADMIN_PASSWORD_SHA256,
    ADMIN_URL_PATH,
)
from data import teams, pending_removals
from utils import emit_state_update

_rate_limit_buckets = defaultdict(deque)


def _is_rate_limited(client_ip):
    if not client_ip:
        return False

    now = time.time()
    bucket = _rate_limit_buckets[client_ip]

    while bucket and (now - bucket[0]) > RATE_LIMIT_WINDOW_SECONDS:
        bucket.popleft()

    if len(bucket) >= RATE_LIMIT_MAX_REQUESTS:
        return True

    bucket.append(now)
    return False


def _normalize_solution_text(value):
    # Confronto tollerante: ignora spazi interni/esterni e maiuscole/minuscole.
    return ''.join(value.strip().lower().split())


def _sha256_hex(value):
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def _is_admin_authenticated():
    return session.get('is_admin_authenticated') is True


@app.route('/')
def index():
    if 'team_id' in session:
        return redirect(url_for('game'))
    return render_template('index.html', valid_icons=VALID_ICONS)


@app.route('/register', methods=['POST'])
def register():
    try:
        if _is_rate_limited(request.remote_addr):
            return jsonify({"success": False, "message": "Troppe richieste. Riprova tra pochi secondi."}), 429

        data = request.get_json(silent=True) or {}
        if not isinstance(data, dict):
            return jsonify({"success": False, "message": "Formato richiesta non valido"}), 400

        team_name = data.get('name', '').strip()

        # Sanitizzazione e validazione
        if not team_name or len(team_name) > 50:
            return jsonify({"success": False, "message": "Nome squadra invalido (max 50 caratteri, non vuoto)"}), 400

        team_name = html.escape(team_name)  # Evita XSS

        icon = data.get('icon')
        if icon not in VALID_ICONS:
            return jsonify({"success": False, "message": "Icona non valida"}), 400

        # Crea un ID unico per la squadra includendo anche l'indice dell'icona selezionata.
        # Formato: team_<timestamp>_i<icon_index>_<team_name>
        icon_index = VALID_ICONS.index(icon)
        team_id = f"team_{int(time.time())}_i{icon_index}_{team_name}"

        teams[team_id] = {
            "name": team_name,
            "icon": icon,
            "step": 0,
            "start_time": time.time(),
            "end_time": None,
            "last_seen": time.time()
        }

        session['team_id'] = team_id
        logging.info("Team %s registered with name '%s'", team_id, team_name)

        # Emetti aggiornamento stato per includere il nuovo giocatore
        emit_state_update()

        return jsonify({"success": True})
    except Exception:
        logging.exception("Unhandled error in /register")
        return jsonify({"success": False, "message": "Errore interno del server"}), 500


@app.route('/game')
def game():
    if 'team_id' not in session:
        return redirect(url_for('index'))
    return render_template('game.html', story_text=STORY_TEXT, classroom_link=CLASSROOM_LINK)


@app.route(f'/{ADMIN_URL_PATH}')
def admin_page():
    return render_template('admin.html', is_authenticated=_is_admin_authenticated())


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        if _is_rate_limited(request.remote_addr):
            return jsonify({"success": False, "message": "Troppe richieste. Riprova tra pochi secondi."}), 429

        data = request.get_json(silent=True) or {}
        if not isinstance(data, dict):
            return jsonify({"success": False, "message": "Formato richiesta non valido"}), 400

        password = data.get('password', '')
        if not isinstance(password, str) or not password:
            return jsonify({"success": False, "message": "Password non valida"}), 400

        password_hash = _sha256_hex(password)
        if hmac.compare_digest(password_hash, ADMIN_PASSWORD_SHA256):
            session['is_admin_authenticated'] = True
            return jsonify({"success": True})

        session.pop('is_admin_authenticated', None)
        return jsonify({"success": False, "message": "Password errata"}), 401
    except Exception:
        logging.exception("Unhandled error in /api/admin/login")
        return jsonify({"success": False, "message": "Errore interno del server"}), 500


@app.route('/api/admin/reset', methods=['POST'])
def admin_reset():
    try:
        if not _is_admin_authenticated():
            return jsonify({"success": False, "message": "Non autorizzato"}), 403

        now = time.time()

        # Ferma eventuali timer di rimozione pendenti: dopo un reset lo stato deve essere coerente.
        for timer in pending_removals.values():
            timer.cancel()
        pending_removals.clear()

        for team in teams.values():
            team['step'] = 0
            team['start_time'] = now
            team['end_time'] = None
            team['last_seen'] = now

        emit_state_update()
        return jsonify({"success": True, "message": "Reset totale completato", "teams_reset": len(teams)})
    except Exception:
        logging.exception("Unhandled error in /api/admin/reset")
        return jsonify({"success": False, "message": "Errore interno del server"}), 500


@app.route('/api/state')
def get_state():
    """Restituisce lo stato di tutti i giocatori per la mappa in tempo reale."""
    try:
        from data import get_leaderboard

        leaderboard = get_leaderboard()
        return jsonify({"teams": teams, "leaderboard": leaderboard})
    except Exception:
        logging.exception("Unhandled error in /api/state")
        return jsonify({"success": False, "message": "Errore interno del server"}), 500


@app.route('/api/advance', methods=['POST'])
def advance():
    """Verifica la parola chiave e fa avanzare la squadra."""
    try:
        if _is_rate_limited(request.remote_addr):
            return jsonify({"success": False, "message": "Troppe richieste. Rallenta e riprova."}), 429

        if 'team_id' not in session:
            return jsonify({"success": False, "message": "Non autorizzato"}), 401

        from config import SOLUTIONS

        team_id = session['team_id']
        team = teams.get(team_id)
        if not team:
            return jsonify({"success": False, "message": "Sessione non valida. Effettua di nuovo l'accesso."}), 401

        team['last_seen'] = time.time()

        data = request.get_json(silent=True) or {}
        if not isinstance(data, dict):
            return jsonify({"success": False, "message": "Formato richiesta non valido"}), 400

        answer = data.get('answer', '').strip().lower()

        # Validazione input
        if not answer:
            return jsonify({"success": False, "message": "Inserisci una parola chiave"}), 400
        if len(answer) > 100:
            return jsonify({"success": False, "message": "Risposta troppo lunga"}), 400

        current_step = team['step']

        if current_step < 5:
            expected_solution = SOLUTIONS[current_step]
            normalized_answer = _normalize_solution_text(answer)

            # Ultimo step: soluzione ufficiale "benedetta farkas", ma accettiamo anche "benedetta".
            accepted_solutions = {_normalize_solution_text(expected_solution)}
            if current_step == len(SOLUTIONS) - 1:
                accepted_solutions.add(_normalize_solution_text("benedetta"))

            # Verifica se la risposta è corretta per lo step attuale
            if normalized_answer in accepted_solutions:
                team['step'] += 1
                logging.info("Team %s advanced to step %s", team_id, team['step'])
                if team['step'] == 5:
                    team['end_time'] = time.time()  # Registra il tempo finale.
                    time_taken = int(team['end_time'] - team['start_time'])
                    logging.info("Team %s completed the game in %s seconds", team_id, time_taken)

                # Emetti aggiornamento stato a tutti i client connessi
                emit_state_update()

                return jsonify({"success": True, "step": team['step'], "solved_word": expected_solution})

            return jsonify({"success": False, "message": "Parola chiave errata!"})

        return jsonify({"success": False, "message": "Hai gia finito!"})
    except Exception:
        logging.exception("Unhandled error in /api/advance")
        return jsonify({"success": False, "message": "Errore interno del server"}), 500


logging.info("Routes module loaded")