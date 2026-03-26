import os
import logging

# Configurazioni e costanti
SOLUTIONS = ["biblioteca", "notte di novembre", "corda", "relazione passata", "benedetta farkas"]
VALID_ICONS = ["🕵️", "👮", "🧑‍🔬", "🔍", "🕵️‍♀️", "🚔", "🔬", "🧲", "📝", "🗝️", "🔎", "👀", "🧠", "🛡️", "📚", "🕰️"]
SECRET_KEY = os.environ.get("SECRET_KEY", "password-super-segreta-del-progetto-giallo")
DEBUG = os.environ.get("FLASK_DEBUG", "0").strip().lower() in {"1", "true", "yes", "on"}
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "80"))
SOCKETIO_ALLOWED_ORIGINS = os.environ.get("SOCKETIO_ALLOWED_ORIGINS", "*")
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("RATE_LIMIT_WINDOW_SECONDS", "10"))
RATE_LIMIT_MAX_REQUESTS = int(os.environ.get("RATE_LIMIT_MAX_REQUESTS", "12"))
ADMIN_URL_PATH = os.environ.get("ADMIN_URL_PATH", "admin-access")
ADMIN_PASSWORD_SHA256 = os.environ.get(
	"ADMIN_PASSWORD_SHA256",
	"c9e3f03ba57fc9e910567964387d648cf1d97f129219c24580c5adc33331e6e4"
)

STORY_TEXT = """Era una notte di novembre gelida e immobile, quando il tranquillo silenzio che avvolgeva la villa Whitmore, una grande residenza isolata nei pressi di Londra, fu squarciato dalla scoperta di un omicidio. La villa, antica e imponente, aveva ospitato una festa elegante, un evento che prometteva allegria, ma che si sarebbe presto trasformato in un incubo.

Lord Percival Blackwell, uno degli uomini più rispettati della città, fu trovato morto nella grande biblioteca della villa. Il suo corpo giaceva senza vita su una poltrona di velluto rosso, con il volto pallido e contorto da un'espressione di terrore. Accanto a lui, una lettera incompleta giaceva su un tavolino, le parole confuse e il significato oscuro, come se avesse tentato di scrivere qualcosa di urgente, ma fosse stato colto da un destino ineluttabile.

La polizia arrivò in fretta, ma la scena del crimine era già stata contaminata dalle voci e dalle paure degli ospiti. Nessuno sembrava sapere nulla di certo, ma tutti avevano un motivo per essere lì. La villa era piena di sospetti, e ognuno degli invitati sembrava nascondere qualcosa di più profondo. Cinque persone, tutte con alibi sospetti e segreti ben celati, restarono sotto l'occhio vigile degli investigatori.

Adelaide Moreau, una giovane e affascinante artista francese, aveva trascorso la serata a parlare con Lord Blackwell, mostrando le sue ultime opere. La sua borsa, sempre a portata di mano, era stata vista in prossimità del corpo, ma nessuno sapeva se fosse stato un caso. Ivan Rostov, un vecchio amico di Lord Blackwell, era giunto dalla Russia per partecipare all'evento. Sebbene il suo comportamento calmo e composto fosse apprezzato da molti, la sua natura irascibile era ben nota. Le discussioni passate con il padrone di casa, per questioni di denaro, lo avevano reso un possibile sospetto.

Richard Pierce, un uomo d'affari inglese, aveva avuto frequenti divergenze con Lord Blackwell riguardo a un grosso affare. La sua nervosità quella sera era evidente: camminava avanti e indietro, osservando con insistenza ogni angolo della villa, come se temesse qualcosa. Benedetta Farkas, una donna elegante di origini ungheresi, aveva una relazione passata con Lord Blackwell che non era mai stata del tutto chiara. Le sue emozioni erano sempre state intense e tempestose, e quella sera non faceva eccezione. Infine, Hugo Wells, un esperto di enigmi e misteri, che spesso parlava di casi irrisolti, aveva attirato l'attenzione di molti per il suo atteggiamento distaccato e la sua insolita curiosità per ogni angolo della villa.

La scena del crimine era tanto inquietante quanto le persone che vi si trovavano. Lord Blackwell era stato trovato nella biblioteca, un luogo silenzioso e appartato, dove l'odore dei libri antichi riempiva l'aria. Il suo corpo giaceva accanto alla finestra, da cui si scorgeva solo il giardino buio e deserto. Ma nessuno sapeva con certezza se fosse stato lì il luogo dell'assassinio, o se fosse stato spostato in un momento successivo.

La polizia, con il suo consueto rigore, aveva iniziato a interrogare i presenti. Il giardino, un luogo che appariva tranquillo di notte, era stato percorso da alcuni degli invitati prima che il corpo fosse scoperto. La sala da pranzo, dove molti avevano consumato il pasto della serata, era un altro possibile luogo del delitto, sebbene fosse stato frequentato da molti e nessuno avesse notato nulla di strano. Il corridoio, lungo e buio, sembrava non offrire alcuna via di fuga certa, eppure qualcuno aveva notato strani movimenti vicino alla porta della biblioteca.

Le armi erano altrettanto inquietanti. Un coltello affilato, trovato accanto al corpo, sembrava essere stato il primo sospetto. Ma nessuno riusciva a dire se fosse stato effettivamente usato nell'omicidio. Poi, qualcuno parlò di una pistola, che si diceva appartenesse a uno degli ospiti più misteriosi. Ma la sua presenza non era certa. La fune, trovata nei pressi del giardino, sembrava anch'essa una traccia sospetta, anche se nessuno riusciva a capire cosa fosse stata davvero utilizzata a fare. Alcuni sospettavano anche che Lord Blackwell fosse stato avvelenato, forse da una sostanza che avrebbe agito in silenzio e velocemente, senza lasciare tracce evidenti. Infine, una vanga, uno strumento da giardinaggio che sarebbe potuto servire a qualcosa di ben diverso, era scomparsa, lasciando solo l'ombra di un possibile movente.

La villa Whitmore, con la sua bellezza inquietante, nascondeva più di quanto le sue stanze lussuose volessero far credere. Ogni angolo, ogni oggetto sembrava contenere indizi, ma erano frammenti sparsi e confusi che nessuno riusciva a mettere insieme. Lord Blackwell era morto, ma il suo assassino restava ancora invisibile, e la verità, come sempre accade nei casi più oscuri, si celava dietro maschere di sospetto, segreti e silenzi.
"""

CLASSROOM_LINK = "https://classroom.google.com/c/ODUxNzYyMzkyNjIx?cjc=kfolr33h"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logging.info("Config module loaded")