# Configurazioni e costanti
SOLUTIONS = ["arma123", "movente123", "luogo123", "tempo123", "assassino123"]
VALID_ICONS = ["🕵️", "👮", "🧑‍🔬", "🔍", "🕵️‍♀️", "🚔", "🔬", "🧲", "📝", "🗝️", "🔎", "👀", "🧠", "🛡️", "📚", "🕰️"]
SECRET_KEY = "attivita_il_testo_giallo"

STORY_TEXT = """Sono le 22:47 e Villa Neri e' in completo silenzio.
La festa di beneficenza e' appena terminata, ma un dettaglio stona.
Il professor Valli, storico del paese, e' scomparso dal salone principale.
Sul tavolo del buffet resta un bicchiere mezzo pieno e una chiave antica.
La porta dello studio e' socchiusa, con segni di graffiatura vicino alla serratura.
Nel corridoio, una lampada e' stata spostata come se qualcuno avesse cercato qualcosa.
Un orologio a pendolo e' fermo sulle 21:13, ma nessuno ricorda un blackout.
La governante giura di aver sentito passi rapidi sulle scale di servizio.
Il giardiniere sostiene invece di aver visto una torcia nel cortile interno.
Sotto la finestra dello studio ci sono impronte diverse, non tutte della stessa misura.
Nella libreria manca un volume: il registro delle donazioni degli ultimi cinque anni.
Tra le pagine di un atlante e' nascosto un foglietto con numeri e iniziali.
In cucina, un coltello da collezione risulta pulito troppo di recente.
Una sciarpa bagnata e' stata trovata nel guardaroba, anche se fuori non piove.
Sul pianoforte compare una nota: 'La verita' non e' dove tutti guardano'.
Due invitati hanno fornito alibi quasi identici, parola per parola.
La telecamera del portone e' attiva, ma il file delle 21:00-22:00 e' corrotto.
Nel camino restano cenere fredda e frammenti di carta parzialmente leggibili.
Chi ha agito conosce bene la villa e i suoi passaggi meno visibili.
Ricostruite i dettagli nascosti nel racconto per trovare le parole del cruciverba."""

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logging.info("Config module loaded")