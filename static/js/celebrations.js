// --- EFFETTI DI FESTA ---
// Gestisce coriandoli + suoni di festeggiamento.

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
