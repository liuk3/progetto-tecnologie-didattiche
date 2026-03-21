// --- LOGICA DI GIOCO ---
const PUZZLE_URLS = [
    "https://puzzel.org/it/cruciverba/tuo-id-1", // 1. Arma
    "https://puzzel.org/it/cruciverba/tuo-id-2", // 2. Movente
    "https://puzzel.org/it/cruciverba/tuo-id-3", // 3. Luogo
    "https://puzzel.org/it/cruciverba/tuo-id-4", // 4. Tempo
    "https://puzzel.org/it/cruciverba/tuo-id-5"  // 5. Assassino (Pergamena)
];

const STEP_NAMES = [
    "Arma",
    "Movente",
    "Luogo",
    "Tempo",
    "Colpevole"
];

function getSecretWordsStorageKey() {
    return `secretWords_${myTeamId}`;
}

function normalizeSecretWords(words) {
    if (!Array.isArray(words)) return [];

    return words
        .map(entry => {
            if (entry && typeof entry === 'object' && typeof entry.step === 'number' && typeof entry.word === 'string') {
                return { step: entry.step, word: entry.word };
            }

            // Compatibilita con formato legacy: "NomeStep: parola"
            if (typeof entry === 'string' && entry.includes(':')) {
                const parts = entry.split(':');
                if (parts.length >= 2) {
                    const stepName = parts[0].trim();
                    const word = parts.slice(1).join(':').trim();
                    const step = STEP_NAMES.findIndex(name => name.toLowerCase() === stepName.toLowerCase());
                    if (step >= 0 && word) {
                        return { step, word };
                    }
                }
            }

            return null;
        })
        .filter(Boolean);
}

// Salva le parole segrete nel localStorage (scope per team)
function saveSecretWords(words) {
    localStorage.setItem(getSecretWordsStorageKey(), JSON.stringify(words));
}

// Carica le parole segrete dal localStorage (scope per team)
function loadSecretWords() {
    const words = localStorage.getItem(getSecretWordsStorageKey());
    if (!words) return [];

    try {
        return normalizeSecretWords(JSON.parse(words));
    } catch (_) {
        return [];
    }
}

// Aggiunge una parola segreta al post-it
function addSecretWordToSticky(word, solvedStep) {
    const words = loadSecretWords();

    // Aggiungi alla lista se non è già presente
    const alreadyPresent = words.some(entry => entry.step === solvedStep && entry.word === word);
    if (!alreadyPresent) {
        words.push({ step: solvedStep, word });
        saveSecretWords(words);
    }

    // Aggiorna il post-it
    renderStickyNote();
}

// Renderizza il post-it con tutte le parole
function renderStickyNote(maxUnlockedStep = null) {
    const content = document.getElementById('sticky-note-content');
    const allWords = loadSecretWords();
    const words = typeof maxUnlockedStep === 'number'
        ? allWords.filter(entry => entry.step < maxUnlockedStep)
        : allWords;
    
    if (words.length === 0) {
        content.innerHTML = '<p style="color: #999; font-style: italic;">Nessuna parola ancora...</p>';
        return;
    }

    words.sort((a, b) => a.step - b.step);

    content.innerHTML = words.map((entry) => {
        const stepName = entry.step < STEP_NAMES.length ? STEP_NAMES[entry.step] : `Step ${entry.step + 1}`;
        return `<div class="secret-word">${stepName}: ${entry.word}</div>`;
    }).join('');
}

function syncStickyNoteWithCurrentStep(teamStep) {
    const words = loadSecretWords();
    const filteredWords = words.filter(entry => entry.step < teamStep);

    // Se lo step corrente e' piu' indietro rispetto al salvato, persistiamo il taglio.
    if (filteredWords.length !== words.length) {
        saveSecretWords(filteredWords);
    }

    renderStickyNote(teamStep);
}

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

function renderBoard(teams) {
    const layer = document.getElementById('players-layer');
    const track = document.querySelector('.track');
    if (!track) return;

    const trackWidth = track.offsetWidth;
    const stepWidth = trackWidth / 4;

    // 1. Raggruppiamo le squadre in base alla casella in cui si trovano
    const teamsByStep = {0: [], 1: [], 2: [], 3: [], 4: [], 5: []};
    Object.keys(teams).forEach(id => {
        let step = teams[id].step;
        if (step > 4) step = 4; // Assicuriamoci che non vadano oltre la pergamena
        teamsByStep[step].push(id);
    });

    // 2. Posizioniamo le squadre casella per casella
    Object.keys(teamsByStep).forEach(stepStr => {
        const step = parseInt(stepStr);
        const teamsOnThisStep = teamsByStep[step];
        const total = teamsOnThisStep.length;

        teamsOnThisStep.forEach((teamId, index) => {
            const team = teams[teamId];

            // Cerchiamo l'icona nel DOM. Se non c'è (nuovo giocatore), la creiamo.
            let iconDiv = document.getElementById(`icon-${teamId}`);
            if (!iconDiv) {
                iconDiv = document.createElement('div');
                iconDiv.id = `icon-${teamId}`;
                iconDiv.className = 'player-icon';
                iconDiv.innerText = team.icon;
                iconDiv.title = team.name;
                layer.appendChild(iconDiv);
            }

            // Calcolo della posizione base (il centro della casella)
            const baseX = (step * stepWidth) + 20;
            const baseY = 120; // Posizione sotto il testo del livello

            // Calcolo matematico per disporre le icone in righe da max 3
            const cols = Math.min(3, total); // Massimo 3 per riga
            const rows = Math.ceil(total / 3); // Numero di righe
            const row = Math.floor(index / cols);     // Riga attuale
            const col = index % cols;                 // Colonna attuale

            const spacingX = 32; // Spazio orizzontale
            const spacingY = 32; // Spazio verticale tra righe

            // Centriamo il gruppetto di icone rispetto al centro della casella
            const groupWidth = (cols - 1) * spacingX;
            const offsetX = (col * spacingX) - (groupWidth / 2);
            const offsetY = row * spacingY;

            // Applichiamo le nuove coordinate.
            // Grazie al CSS "transition: all 0.8s", l'icona "scivolerà" qui fluidamente!
            iconDiv.style.left = `${baseX + offsetX}px`;
            iconDiv.style.top = `${baseY + offsetY}px`;
        });
    });

    // Remove icons for disconnected teams
    const currentTeamIds = Object.keys(teams);
    const allIcons = document.querySelectorAll('.player-icon');
    allIcons.forEach(icon => {
        const teamId = icon.id.replace('icon-', '');
        if (!currentTeamIds.includes(teamId)) {
            icon.remove();
        }
    });
}

function renderLeaderboard(leaderboard) {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';

    leaderboard.forEach((team, index) => {
        const li = document.createElement('li');
        let status = `Step ${team.step + 1}/5`;
        if (team.step === 5) {
            // Calcola il tempo in secondi
            const timeTaken = Math.round(team.end_time - team.start_time);
            // Se il tempo impiegato è di più di un minuto, lo visualizziamo in minuti e secondi,altrimenti solo in secondi
            if (timeTaken > 60) {
                const minutes = Math.floor(timeTaken / 60);
                const seconds = timeTaken % 60;
                status = `🏆 Completato in ${minutes}:${seconds.toString()}!`;
            } else {
                status = `🏆 Completato in ${timeTaken} sec!`;
            }
        }
        li.innerText = `${index + 1}. ${team.icon} ${team.name} - ${status}`;
        list.appendChild(li);
    });
}

async function submitAnswer() {
    const answer = document.getElementById('keyword-input').value;
    const errorMsg = document.getElementById('error-msg');

    console.log('Submitting answer:', answer); // Debug

    const res = await fetch('/api/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
    });

    console.log('Response status:', res.status); // Debug

    const data = await res.json();
    console.log('Response data:', data); // Debug
    if (data.success) {
        errorMsg.style.color = "lightgreen";
        errorMsg.innerText = "Corretto! Avanzamento in corso...";
        
        // Aggiungi la parola segreta allo step appena risolto.
        addSecretWordToSticky(answer, data.step - 1);

        if (data.step < 5) {
            // Festeggia il passo completato
            celebrateStep();

            // Aggiorna iframe al puzzle successivo
            document.getElementById('puzzle-frame').src = PUZZLE_URLS[data.step];
        } else {
            // Festeggia la vittoria finale
            celebrateFinish();

            document.getElementById('iframe-container').innerHTML = "<h2>🎉 MISTERO RISOLTO! 🎉</h2><p>Hai trovato l'assassino! Guarda la classifica.</p>";
            document.querySelector('.submit-area').style.display = 'none';
        }
        // Non chiamiamo più fetchState(), poiché il server emette aggiornamenti via SocketIO
    } else {
        errorMsg.style.color = "#ff4c4c";
        errorMsg.innerText = data.message;
    }

    // Azzera sempre il campo di testo dopo l'invio
    document.getElementById('keyword-input').value = "";
}
