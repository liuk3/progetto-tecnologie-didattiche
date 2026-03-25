// --- GESTIONE INVIO RISPOSTE ---

async function submitAnswer() {
    const answer = document.getElementById('keyword-input').value;
    const errorMsg = document.getElementById('error-msg');
    const submitButton = document.querySelector('.submit-area button');

    if (!answer.trim()) {
        errorMsg.style.color = '#ff4c4c';
        errorMsg.innerText = 'Inserisci una parola chiave prima di inviare.';
        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
    }

    console.log('Submitting answer:', answer); // Debug

    try {
        const res = await fetch('/api/advance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer })
        });

        console.log('Response status:', res.status); // Debug

        const data = await res.json();
        console.log('Response data:', data); // Debug
        if (data.success) {
            errorMsg.style.color = 'lightgreen';
            errorMsg.innerText = 'Corretto! Avanzamento in corso...';

            // Aggiungi la parola segreta allo step appena risolto.
            const solvedWord = typeof data.solved_word === 'string' ? data.solved_word : answer;
            addSecretWordToSticky(solvedWord, data.step - 1);

            if (data.step < 5) {
                // Festeggia il passo completato
                celebrateStep();
            } else {
                // Festeggia la vittoria finale
                celebrateFinish();
            }

            // Aggiorna la UI coerentemente con lo step corrente (incluso stato finale persistente).
            applyProgressUI(data.step);
            // Non chiamiamo piu fetchState(), poiche il server emette aggiornamenti via SocketIO
        } else {
            errorMsg.style.color = '#ff4c4c';
            errorMsg.innerText = data.message || 'Risposta non valida.';
        }
    } catch (err) {
        console.error('submitAnswer failed:', err);
        errorMsg.style.color = '#ff4c4c';
        errorMsg.innerText = 'Errore di rete o server non raggiungibile. Riprova.';
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }

        // Azzera sempre il campo di testo dopo l'invio
        document.getElementById('keyword-input').value = '';
    }
}
