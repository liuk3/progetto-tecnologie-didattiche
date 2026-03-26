// --- LOGICA DI GIOCO PRINCIPALE ---
// Le costanti e i moduli vengono caricati da file separati:
// - constants.js (PUZZLE_URLS, STEP_NAMES)
// - modules/secretWords.js (gestione parole segrete)
// - modules/board.js (renderizzazione board e leaderboard)
// - modules/submission.js (gestione invio risposte)

let initialIframeMarkup = null;
let lastRenderedTeamStep = null;
let latestTeamsSnapshot = null;
let mobileReflowTimer = null;

function setTransientMessage(message, color) {
    const errorMsg = document.getElementById('error-msg');
    if (!errorMsg) return;

    errorMsg.style.color = color || '#ffb347';
    errorMsg.innerText = message;
}

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

function getPuzzleEmbedHeightPx() {
    const viewportHeight = window.innerHeight || 800;
    const computed = Math.round(viewportHeight * 0.84);
    return Math.min(1060, Math.max(620, computed));
}

function scrollPageToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function extractPuzzleMakerXid(url) {
    if (!url) return null;

    const match = url.match(/puzzle-maker\.online\/crossword-([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

function renderPuzzleMakerEmbed(iframeContainer, xid) {
    iframeContainer.innerHTML = '';
    const embedHeightPx = getPuzzleEmbedHeightPx();

    const wrapper = document.createElement('div');
    wrapper.className = 'wl-xword';
    wrapper.setAttribute('data-xid', xid);
    wrapper.setAttribute('data-width', '100%');
    wrapper.setAttribute('data-height', `${embedHeightPx}px`);

    const script = document.createElement('script');
    script.src = 'https://embed.puzzle-maker.online/dist/embed.js';
    script.async = true;
    script.defer = true;

    const info = document.createElement('p');
    info.className = 'wl-info';
    info.innerHTML = 'Creato con l\'ausilio di <a href="https://puzzle-maker.online?lang=it" target="_blank" rel="noopener noreferrer">puzzle-maker.online</a>';

    wrapper.appendChild(script);
    wrapper.appendChild(info);
    iframeContainer.appendChild(wrapper);
}

function showCompletedState() {
    const iframeContainer = getIframeContainer();
    if (!iframeContainer) return;
    iframeContainer.classList.add('is-completed');

    toggleFinalPuzzleNote(false);

    iframeContainer.innerHTML = `
        <section class="completed-state" aria-live="polite">
            <h2 class="completed-title">MISTERO RISOLTO!</h2>
            <p class="completed-subtitle">Bravissimi detective! Avete trovato l'assassino.</p>
            <p class="completed-text">Date un ultimo sguardo alla classifica e poi consegnate il riassunto finale.</p>
            <a class="completed-cta" href="${classroomLink}" target="_blank" rel="noopener noreferrer">
                Vai su Classroom e completa l'indagine
            </a>
        </section>
    `;

    const submitArea = document.querySelector('.submit-area');
    if (submitArea) {
        submitArea.style.display = 'none';
    }
}

function toggleFinalPuzzleNote(isVisible) {
    const finalPuzzleNote = document.getElementById('final-puzzle-note');
    if (!finalPuzzleNote) return;

    finalPuzzleNote.hidden = !isVisible;
}

function showPuzzleState(step) {
    const iframeContainer = getIframeContainer();
    if (!iframeContainer) return;
    iframeContainer.classList.remove('is-completed');

    // L'ultimo cruciverba e allo step index 4 (5° step).
    toggleFinalPuzzleNote(step === 4);

    if (initialIframeMarkup === null) {
        initialIframeMarkup = iframeContainer.innerHTML;
    }

    const puzzleUrl = step >= 0 && step < PUZZLE_URLS.length ? PUZZLE_URLS[step] : null;
    const puzzleMakerXid = extractPuzzleMakerXid(puzzleUrl);

    if (puzzleMakerXid) {
        renderPuzzleMakerEmbed(iframeContainer, puzzleMakerXid);
    } else {
        if (!document.getElementById('puzzle-frame')) {
            iframeContainer.innerHTML = initialIframeMarkup;
        }

        const puzzleFrame = document.getElementById('puzzle-frame');
        if (puzzleFrame && puzzleUrl) {
            puzzleFrame.style.height = `${getPuzzleEmbedHeightPx()}px`;
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

function updateMyTeamUI(teamStep) {
    if (teamStep === lastRenderedTeamStep) {
        return;
    }

    const didAdvanceStep = lastRenderedTeamStep !== null && teamStep > lastRenderedTeamStep;

    syncStickyNoteWithCurrentStep(teamStep);
    applyProgressUI(teamStep);

    if (didAdvanceStep) {
        scrollPageToTop();
    }

    lastRenderedTeamStep = teamStep;
}

function rerenderBoardPositionsForViewport() {
    if (!latestTeamsSnapshot) return;
    renderBoard(latestTeamsSnapshot, { force: true });
}

function scheduleMobileBoardReflow(delayMs = 120) {
    if (mobileReflowTimer) {
        clearTimeout(mobileReflowTimer);
    }

    mobileReflowTimer = setTimeout(() => {
        rerenderBoardPositionsForViewport();
    }, delayMs);
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
    const socket = io({
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 1000
    });
    socket.on('connect', () => {
        console.log('Connected to server');
        setTransientMessage('Connessione ristabilita.', 'lightgreen');
        socket.emit('join', { team_id: myTeamId });
    });
    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setTransientMessage('Problema di connessione al server. Riprovo automaticamente...');
    });
    socket.on('reconnect_attempt', () => {
        setTransientMessage('Riconnessione in corso...');
    });
    socket.on('join_error', (payload) => {
        const message = payload && payload.message ? payload.message : 'Errore durante il join della sessione.';
        setTransientMessage(message, '#ff4c4c');
    });
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        setTransientMessage('Connessione persa. Tentativo di riconnessione...');
    });
    socket.on('state_update', function(data) {
        console.log('Received state update:', data); // Debug
        latestTeamsSnapshot = data.teams;
        renderBoard(data.teams);
        renderLeaderboard(data.leaderboard);

        const myTeam = data.teams[myTeamId];
        if (myTeam) {
            updateMyTeamUI(myTeam.step);
        }
    });

    // Fallback iniziale: assicura UI coerente anche se lo state_update tarda ad arrivare.
    fetchState();

    window.addEventListener('resize', () => {
        scheduleMobileBoardReflow(150);
    });

    window.addEventListener('orientationchange', () => {
        scheduleMobileBoardReflow(220);
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            scheduleMobileBoardReflow(80);
        }
    });
}

async function fetchState() {
    try {
        const res = await fetch('/api/state');
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        latestTeamsSnapshot = data.teams;
        renderBoard(data.teams);
        renderLeaderboard(data.leaderboard);

        const myTeam = data.teams[myTeamId];
        if (myTeam) {
            updateMyTeamUI(myTeam.step);
        }
    } catch (err) {
        console.error('Unable to fetch game state:', err);
        setTransientMessage('Impossibile recuperare lo stato iniziale. Ricarica la pagina o riprova tra poco.', '#ff4c4c');
    }
}
