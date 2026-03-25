// --- RENDERIZZAZIONE BOARD E LEADERBOARD ---

let lastBoardRenderSignature = null;
let lastLeaderboardRenderSignature = null;

function normalizeStep(step) {
    return step > 4 ? 4 : step;
}

function isTeamFinished(team) {
    return typeof team.step === 'number' && team.step >= 5;
}

function getBoardRenderSignature(teams) {
    return Object.keys(teams)
        .sort()
        .map(id => {
            const team = teams[id];
            return `${id}:${team.step}:${team.icon}:${team.name}`;
        })
        .join('|');
}

function getLeaderboardRenderSignature(leaderboard) {
    return leaderboard
        .map((team, index) => `${index}:${team.name}:${team.icon}:${team.step}:${team.start_time ?? ''}:${team.end_time ?? ''}`)
        .join('|');
}

function renderBoard(teams) {
    const layer = document.getElementById('players-absolute-layer');
    const container = document.querySelector('.board-container');
    if (!container || !layer) return;

    const boardSignature = getBoardRenderSignature(teams);
    if (boardSignature === lastBoardRenderSignature) {
        return;
    }

    // Ottieni le dimensioni della griglia
    const playersGrid = document.querySelector('.players-grid');
    if (!playersGrid) return;

    const gridRect = playersGrid.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const gridRelativeTop = gridRect.top - containerRect.top;

    // Raggruppiamo le squadre per step
    const teamsByStep = {0: [], 1: [], 2: [], 3: [], 4: []};
    const visibleTeamIds = [];
    Object.keys(teams).forEach(id => {
        if (isTeamFinished(teams[id])) {
            return;
        }

        const step = normalizeStep(teams[id].step);
        teamsByStep[step].push(id);
        visibleTeamIds.push(id);
    });

    // Calcola le colonne e le coordinate
    const stepPlayerContainers = [];
    for (let i = 0; i <= 4; i++) {
        const container = document.getElementById(`players-step-${i}`);
        if (container) {
            const rect = container.getBoundingClientRect();
            stepPlayerContainers[i] = {
                left: rect.left - containerRect.left + rect.width / 2,
                top: rect.top - containerRect.top + rect.height / 2,
                width: rect.width,
                height: rect.height
            };
        }
    }

    // Per ogni step, posiziona le icone
    for (let step = 0; step <= 4; step++) {
        const teamsOnThisStep = teamsByStep[step];
        const stepPos = stepPlayerContainers[step];
        if (!stepPos) continue;

        const total = teamsOnThisStep.length;
        const cols = Math.min(3, total);
        const rows = Math.ceil(total / 3);

        teamsOnThisStep.forEach((teamId, index) => {
            const team = teams[teamId];

            let iconDiv = document.getElementById(`icon-${teamId}`);
            if (!iconDiv) {
                iconDiv = document.createElement('div');
                iconDiv.id = `icon-${teamId}`;
                iconDiv.className = 'player-icon';
                iconDiv.innerText = team.icon;
                iconDiv.title = team.name;
                layer.appendChild(iconDiv);
            }

            const row = Math.floor(index / cols);
            const col = index % cols;

            const spacingX = 32;
            const spacingY = 32;

            const groupWidth = (cols - 1) * spacingX;
            const groupHeight = (rows - 1) * spacingY;
            
            const offsetX = (col * spacingX) - (groupWidth / 2);
            const offsetY = (row * spacingY) - (groupHeight / 2);

            const finalX = stepPos.left + offsetX;
            const finalY = stepPos.top + offsetY;

            iconDiv.style.left = `${finalX}px`;
            iconDiv.style.top = `${finalY}px`;
        });
    }

    // Rimuovi icone di team disconnessi
    const allIcons = layer.querySelectorAll('.player-icon');
    allIcons.forEach(icon => {
        const teamId = icon.id.replace('icon-', '');
        if (!visibleTeamIds.includes(teamId)) {
            icon.remove();
        }
    });

    lastBoardRenderSignature = boardSignature;
}

function renderLeaderboard(leaderboard) {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;

    const leaderboardSignature = getLeaderboardRenderSignature(leaderboard);
    if (leaderboardSignature === lastLeaderboardRenderSignature) {
        return;
    }

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

    lastLeaderboardRenderSignature = leaderboardSignature;
}
