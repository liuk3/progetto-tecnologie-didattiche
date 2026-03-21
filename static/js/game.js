// --- LOGICA DI GIOCO PRINCIPALE ---
// Le costanti e i moduli vengono caricati da file separati:
// - constants.js (PUZZLE_URLS, STEP_NAMES)
// - modules/secretWords.js (gestione parole segrete)
// - modules/board.js (renderizzazione board e leaderboard)
// - modules/submission.js (gestione invio risposte)

function initGame() {
    if (!document.getElementById('puzzle-frame')) return;

    // Precarica i suoni di festa (usa file reali se disponibili)
    loadCelebrationSounds();
    
    // Inizializza il post-it in stato bloccato; verra' sincronizzato al primo state_update.
    renderStickyNote(0);

    // Aggiungi event listener per il tasto Enter sull'input della parola chiave
    document.getElementById('keyword-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            const answer = document.getElementById('keyword-input').value.trim();
            if (answer) {
                submitAnswer();
            }
        }
    });

    // Connetti a SocketIO per aggiornamenti in tempo reale
    const socket = io();
    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('join', { team_id: myTeamId });
    });
    socket.on('disconnect', () => console.log('Disconnected from server'));
    socket.on('state_update', function(data) {
        console.log('Received state update:', data); // Debug
        renderBoard(data.teams);
        renderLeaderboard(data.leaderboard);

        const myTeam = data.teams[myTeamId];
        if (myTeam) {
            syncStickyNoteWithCurrentStep(myTeam.step);
        }
    });
}

async function fetchState() {
    const res = await fetch('/api/state');
    const data = await res.json();

    renderBoard(data.teams);
    renderLeaderboard(data.leaderboard);
}
