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

// Salva le parole segrete nel localStorage
function saveSecretWords(words) {
    localStorage.setItem('secretWords', JSON.stringify(words));
}

// Carica le parole segrete dal localStorage
function loadSecretWords() {
    const words = localStorage.getItem('secretWords');
    return words ? JSON.parse(words) : [];
}

// Aggiunge una parola segreta al post-it
function addSecretWordToSticky(word, step) {
    const content = document.getElementById('sticky-note-content');
    const words = loadSecretWords();
    
    const stepName = step < STEP_NAMES.length ? STEP_NAMES[step] : `Step ${step + 1}`;
    const fullEntry = `${stepName}: ${word}`;
    
    // Aggiungi alla lista se non è già presente
    if (!words.includes(fullEntry)) {
        words.push(fullEntry);
        saveSecretWords(words);
    }
    
    // Aggiorna il post-it
    renderStickyNote();
}

// Renderizza il post-it con tutte le parole
function renderStickyNote() {
    const content = document.getElementById('sticky-note-content');
    const words = loadSecretWords();
    
    if (words.length === 0) {
        content.innerHTML = '<p style="color: #999; font-style: italic;">Nessuna parola ancora...</p>';
        return;
    }
    
    content.innerHTML = words.map((word, index) => {
        return `<div class="secret-word">${word}</div>`;
    }).join('');
}

function initGame() {
    if (!document.getElementById('puzzle-frame')) return;

    // Precarica i suoni di festa (usa file reali se disponibili)
    loadCelebrationSounds();
    
    // Inizializza il post-it
    renderStickyNote();

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
            // Calcola il tempo in minuti e secondi
            const minutes = Math.floor(timeTaken / 60);
            const seconds = timeTaken % 60;
            status = `🏆 Completato in ${minutes}:${seconds.toString()}!`;
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
        
        // Aggiungi la parola segreta al post-it
        addSecretWordToSticky(answer, data.step);

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
