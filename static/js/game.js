// --- LOGICA DI GIOCO PRINCIPALE ---
// Le costanti e i moduli vengono caricati da file separati:
// - constants.js (PUZZLE_URLS, STEP_NAMES)
// - modules/secretWords.js (gestione parole segrete)
// - modules/board.js (renderizzazione board e leaderboard)
// - modules/submission.js (gestione invio risposte)

let initialIframeMarkup = null;

function syncStepNodeLabels() {
    for (let i = 0; i < STEP_NAMES.length; i++) {
        const node = document.getElementById(`node-${i}`);
        if (node) {
            node.textContent = STEP_NAMES[i];
        }
    }
}

function getIframeContainer() {
    return document.getElementById('iframe-container');
}

function extractPuzzleMakerXid(url) {
    if (!url) return null;

    const match = url.match(/puzzle-maker\.online\/crossword-([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

function renderPuzzleMakerEmbed(iframeContainer, xid) {
    iframeContainer.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'wl-xword';
    wrapper.setAttribute('data-xid', xid);
    wrapper.setAttribute('data-width', '100%');
    wrapper.setAttribute('data-height', '700px');

    const script = document.createElement('script');
    script.src = 'https://embed.puzzle-maker.online/dist/embed.js';
    script.async = true;
    script.defer = true;

    const info = document.createElement('p');
    info.className = 'wl-info';
    info.innerHTML = 'Creato con l\'ausilio di <a href="https://puzzle-maker.online?lang=it">puzzle-maker.online</a>';

    wrapper.appendChild(script);
    wrapper.appendChild(info);
    iframeContainer.appendChild(wrapper);
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

    const puzzleUrl = step >= 0 && step < PUZZLE_URLS.length ? PUZZLE_URLS[step] : null;
    const puzzleMakerXid = extractPuzzleMakerXid(puzzleUrl) || (step === 0 ? '1d7gf82' : null);

    if (puzzleMakerXid) {
        renderPuzzleMakerEmbed(iframeContainer, puzzleMakerXid);
    } else {
        if (!document.getElementById('puzzle-frame')) {
            iframeContainer.innerHTML = initialIframeMarkup;
        }

        const puzzleFrame = document.getElementById('puzzle-frame');
        if (puzzleFrame && puzzleUrl) {
            puzzleFrame.src = puzzleUrl;
        }
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

    syncStepNodeLabels();

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
