// --- LOGICA DI INGRESSO ---
document.querySelectorAll('.icon-option').forEach(item => {
    item.addEventListener('click', event => {
        document.querySelectorAll('.icon-option').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
    });
});

// Aggiungi event listener per il tasto Enter sul campo nome squadra
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

// --- EFFETTI DI FESTA ---
const CELEBRATION_SOUND_FILES = {
    step: '/static/sounds/step.wav',
    finish: '/static/sounds/finish.wav'
};

const celebrationAudio = {
    step: null,
    finish: null
};

function loadCelebrationSounds() {
    Object.entries(CELEBRATION_SOUND_FILES).forEach(([key, src]) => {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = 0.7;
        celebrationAudio[key] = audio;
    });
}

function playCelebrationSound(key) {
    const original = celebrationAudio[key];
    if (!original) return;
    const audio = original.cloneNode(true);
    // play may reject if autoplay is blocked; ignore errors
    audio.play().catch(() => {});
}

let _audioContext = null;
function getAudioContext() {
    if (!_audioContext) {
        _audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioContext;
}

function playTone(freq, duration = 0.1, volume = 0.15) {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
}

function celebrateStep() {
    // piccolo effetto per il passo completato
    playCelebrationSound('step');
    launchConfetti({ count: 120, spread: 110, gravity: 0.35, duration: 1600, minSize: 6, maxSize: 14 });
    playTone(520, 0.12, 0.18);
}

function celebrateFinish() {
    // festa più grande alla fine
    playCelebrationSound('finish');
    launchConfetti({ count: 240, spread: 140, gravity: 0.4, duration: 2600, minSize: 7, maxSize: 18 });
    setTimeout(() => {
        launchConfetti({ count: 220, spread: 120, gravity: 0.35, duration: 2400, minSize: 6, maxSize: 16 });
    }, 180);

    // piccola melodia di vittoria (fallback)
    const notes = [520, 660, 780, 880];
    notes.forEach((freq, idx) => {
        setTimeout(() => playTone(freq, 0.14, 0.2), idx * 160);
    });
}

function launchConfetti({ count = 60, spread = 90, gravity = 0.3, duration = 1800, minSize = 5, maxSize = 12 } = {}) {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const colours = ['#f3c623', '#ff4c4c', '#4cf3c6', '#9b59b6', '#3498db', '#2ecc71'];
    const startTime = performance.now();

    const confettiPieces = [];

    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.background = colours[Math.floor(Math.random() * colours.length)];

        const size = minSize + Math.random() * (maxSize - minSize);
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = `${Math.random() * 50}%`;
        el.style.left = `${Math.random() * 100}%`;
        el.style.top = `0%`;
        el.style.opacity = '1';

        const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180);
        const speed = 2 + Math.random() * 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const rotationVel = (Math.random() - 0.5) * 0.6;

        const piece = {
            el,
            x: Math.random() * window.innerWidth,
            y: -20,
            vx,
            vy,
            rotation: Math.random() * 360,
            rotationVel,
            scale: 1
        };

        confettiPieces.push(piece);
        container.appendChild(el);
    }

    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        confettiPieces.forEach(p => {
            p.vy += gravity * 0.06;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationVel;

            const fade = 1 - progress;
            p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${p.scale})`;
            p.el.style.opacity = String(fade);
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            confettiPieces.forEach(p => p.el.remove());
        }
    }

    requestAnimationFrame(animate);
}

// --- LOGICA DI GIOCO ---
const PUZZLE_URLS = [
    "https://puzzel.org/it/cruciverba/tuo-id-1", // 1. Arma
    "https://puzzel.org/it/cruciverba/tuo-id-2", // 2. Movente
    "https://puzzel.org/it/cruciverba/tuo-id-3", // 3. Luogo
    "https://puzzel.org/it/cruciverba/tuo-id-4", // 4. Tempo
    "https://puzzel.org/it/cruciverba/tuo-id-5"  // 5. Assassino (Pergamena)
];

function initGame() {
    if(!document.getElementById('puzzle-frame')) return;

    // Precarica i suoni di festa (usa file reali se disponibili)
    loadCelebrationSounds();
    
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
    
    // Non carichiamo più fetchState(), poiché SocketIO gestisce tutto
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
    if(!track) return;
    
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
            status = `🏆 Completato in ${timeTaken} sec!`;
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