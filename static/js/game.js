// --- LOGICA DI GIOCO PRINCIPALE ---
// Le costanti e i moduli vengono caricati da file separati:
// - constants.js (PUZZLE_URLS, STEP_NAMES)
// - modules/secretWords.js (gestione parole segrete)
// - modules/board.js (renderizzazione board e leaderboard)
// - modules/submission.js (gestione invio risposte)

let initialIframeMarkup = null;

function getIframeContainer() {
    return document.getElementById('iframe-container');
}

function showCompletedState() {
    const iframeContainer = getIframeContainer();
    if (!iframeContainer) return;

    iframeContainer.innerHTML = `
        <h2>🎉 MISTERO RISOLTO! 🎉</h2>
        <p>Hai trovato l'assassino! Guarda la classifica.</p>
        <p>
            Ora puoi procedere scrivendo il riassunto della storia su
            <a href="${classroomLink}" target="_blank" rel="noopener noreferrer">Classroom</a>.
        </p>
    `;

    const submitArea = document.querySelector('.submit-area');
    if (submitArea) {
        submitArea.style.display = 'none';
    }
}

function showPuzzleState(step) {
    const iframeContainer = getIframeContainer();
    if (!iframeContainer) return;

    if (initialIframeMarkup === null) {
        initialIframeMarkup = iframeContainer.innerHTML;
    }

    if (!document.getElementById('puzzle-frame')) {
        iframeContainer.innerHTML = initialIframeMarkup;
    }

    const puzzleFrame = document.getElementById('puzzle-frame');
    if (puzzleFrame && step >= 0 && step < PUZZLE_URLS.length) {
        puzzleFrame.src = PUZZLE_URLS[step];
    }

    const submitArea = document.querySelector('.submit-area');
    if (submitArea) {
        submitArea.style.display = '';
    }
}

function applyProgressUI(teamStep) {
    if (teamStep >= 5) {
        showCompletedState();
        return;
    }

    showPuzzleState(teamStep);
}

function initGame() {
    if (!document.getElementById('puzzle-frame')) return;

    const iframeContainer = getIframeContainer();
    if (iframeContainer) {
        initialIframeMarkup = iframeContainer.innerHTML;
    }

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
            applyProgressUI(myTeam.step);
        }
    });

    // Fallback iniziale: assicura UI coerente anche se lo state_update tarda ad arrivare.
    fetchState();
}

async function fetchState() {
    const res = await fetch('/api/state');
    const data = await res.json();

    renderBoard(data.teams);
    renderLeaderboard(data.leaderboard);

    const myTeam = data.teams[myTeamId];
    if (myTeam) {
        syncStickyNoteWithCurrentStep(myTeam.step);
        applyProgressUI(myTeam.step);
    }
}
