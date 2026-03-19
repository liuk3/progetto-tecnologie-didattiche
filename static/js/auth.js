// --- LOGICA DI INGRESSO ---
// Gestisce la selezione dell'icona e la registrazione della squadra.

const ICON_SELECTOR = document.getElementById('iconSelector');

if (ICON_SELECTOR) {
    ICON_SELECTOR.querySelectorAll('.icon-option').forEach(item => {
        item.addEventListener('click', () => {
            ICON_SELECTOR.querySelectorAll('.icon-option').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
        });
    });
}

// Invio con Invio (Enter) sul campo nome squadra
if (document.getElementById('teamName')) {
    document.getElementById('teamName').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            joinGame();
        }
    });
}

async function joinGame() {
    const name = document.getElementById('teamName').value;
    const icon = document.querySelector('.icon-option.selected').dataset.icon;

    if (!name) return alert("Inserisci un nome squadra!");

    const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon })
    });

    if (res.ok) window.location.href = '/game';
}
