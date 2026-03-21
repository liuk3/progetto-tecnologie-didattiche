// --- RENDERIZZAZIONE BOARD E LEADERBOARD ---

function renderBoard(teams) {
    const layer = document.getElementById('players-absolute-layer');
    const container = document.querySelector('.board-container');
    if (!container || !layer) return;

    // Ottieni le dimensioni della griglia
    const playersGrid = document.querySelector('.players-grid');
    if (!playersGrid) return;

    const gridRect = playersGrid.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const gridRelativeTop = gridRect.top - containerRect.top;

    // Raggruppiamo le squadre per step
    const teamsByStep = {0: [], 1: [], 2: [], 3: [], 4: []};
    Object.keys(teams).forEach(id => {
        let step = teams[id].step;
        if (step > 4) step = 4;
        teamsByStep[step].push(id);
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
    const currentTeamIds = Object.keys(teams);
    const allIcons = layer.querySelectorAll('.player-icon');
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
