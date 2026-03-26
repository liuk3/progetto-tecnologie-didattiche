(function () {
    const loginBox = document.getElementById('login-box');
    const actionsBox = document.getElementById('actions-box');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('login-btn');
    const resetBtn = document.getElementById('reset-btn');
    const statusEl = document.getElementById('admin-status');

    function setStatus(message, isError) {
        statusEl.textContent = message || '';
        statusEl.classList.remove('error', 'ok');
        if (!message) return;
        statusEl.classList.add(isError ? 'error' : 'ok');
    }

    async function login() {
        const password = passwordInput ? passwordInput.value : '';
        if (!password) {
            setStatus('Inserisci la password admin.', true);
            return;
        }

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const payload = await res.json();
            if (!res.ok || !payload.success) {
                setStatus(payload.message || 'Accesso negato.', true);
                return;
            }

            if (passwordInput) {
                passwordInput.value = '';
            }
            if (loginBox) {
                loginBox.classList.add('hidden');
            }
            if (actionsBox) {
                actionsBox.classList.remove('hidden');
            }
            setStatus('Accesso admin effettuato.', false);
        } catch (err) {
            setStatus('Errore di rete durante il login.', true);
        }
    }

    async function resetAll() {
        const confirmed = window.confirm('Confermi il RESET TOTALE? Tutti i progressi saranno azzerati.');
        if (!confirmed) return;

        try {
            const res = await fetch('/api/admin/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const payload = await res.json();

            if (!res.ok || !payload.success) {
                setStatus(payload.message || 'Reset non riuscito.', true);
                return;
            }

            const n = Number.isInteger(payload.teams_reset) ? payload.teams_reset : 0;
            setStatus(`Reset completato. Team aggiornati: ${n}.`, false);
        } catch (err) {
            setStatus('Errore di rete durante il reset.', true);
        }
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }

    if (passwordInput) {
        passwordInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                login();
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetAll);
    }
})();
