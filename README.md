# Progetto Testo Giallo

Web app Flask + Socket.IO per una gara investigativa a squadre.

## Requisiti

- Python 3.10+
- Ambiente virtuale attivo

## Setup rapido

1. Installa le dipendenze:

```bash
pip install -r requirements.txt
```

2. Crea il file ambiente partendo dal template:

```bash
cp .env.example .env
```

Su Windows PowerShell puoi usare:

```powershell
Copy-Item .env.example .env
```

3. Imposta almeno `SECRET_KEY` nel file `.env`.

4. Avvia il server:

```bash
python app.py
```

## Configurazione principale

Le variabili supportate sono:

- `SECRET_KEY`: chiave sessione Flask
- `FLASK_DEBUG`: `1` solo in sviluppo, `0` in demo/rilascio
- `HOST`: host bind (default `0.0.0.0`)
- `PORT`: porta bind (default `5000`)
- `SOCKETIO_ALLOWED_ORIGINS`: origini consentite per Socket.IO
- `RATE_LIMIT_WINDOW_SECONDS`: finestra del rate limit
- `RATE_LIMIT_MAX_REQUESTS`: numero massimo richieste nella finestra

## Checklist pre-demo

- `SECRET_KEY` non di default
- `FLASK_DEBUG=0`
- Il server parte senza errori
- Almeno 2 client riescono a entrare e avanzare in parallelo
- In caso di disconnessione, il client mostra messaggio di riconnessione

## Note

Questa release e ottimizzata per demo controllate con pochi utenti concorrenti e usa stato in-memory.
