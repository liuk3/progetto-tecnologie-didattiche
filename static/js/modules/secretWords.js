// --- GESTIONE PAROLE SEGRETE ---

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
