# Configurazioni e costanti
SOLUTIONS = ["arma123", "movente123", "luogo123", "tempo123", "assassino123"]
VALID_ICONS = ["🕵️", "👮", "🧑‍🔬", "🔍", "🕵️‍♀️", "🚔", "🔬", "🧲", "📝", "🗝️", "🔎", "👀", "🧠", "🛡️", "📚", "🕰️"]
SECRET_KEY = "attivita_il_testo_giallo"

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logging.info("Config module loaded")