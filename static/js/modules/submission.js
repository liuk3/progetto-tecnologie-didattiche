// --- GESTIONE INVIO RISPOSTE ---

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
