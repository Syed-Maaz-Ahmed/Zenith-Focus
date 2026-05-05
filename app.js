/* ===================================
   ZENITH FLOW — App Logic (app.js)
   Beginner-friendly & well-commented
   =================================== */

// ─── 1. DEFAULT SETTINGS ─────────────────────────
const DEFAULTS = {
    focus: 25,        // minutes
    short: 5,
    long: 15,
    rounds: 4,        // sessions before long break
    autoBreak: true,
    soundNotif: true,
};

// ─── 2. APP STATE ────────────────────────────────
let state = {
    mode: 'focus',            // 'focus' | 'short' | 'long'
    timeLeft: DEFAULTS.focus * 60,  // in seconds
    totalTime: DEFAULTS.focus * 60,
    isRunning: false,
    currentSession: 1,
    intervalId: null,
    settings: { ...DEFAULTS },
    stats: { sessions: 0, minutes: 0, streak: 0, lastDate: null },
};

// ─── 3. DOM ELEMENTS ─────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
    timerDisplay: $('#timer-display'),
    timerLabel: $('#timer-label'),
    ringProgress: $('#ring-progress'),
    gradStop1: $('#grad-stop-1'),
    gradStop2: $('#grad-stop-2'),
    btnStart: $('#btn-start'),
    btnReset: $('#btn-reset'),
    btnSkip: $('#btn-skip'),
    playIcon: $('.play-icon'),
    pauseIcon: $('.pause-icon'),
    modeBtns: $$('.mode-btn'),
    modeSlider: $('#mode-slider'),
    sessionDots: $('#session-dots'),
    sessionText: $('#session-text'),
    settingsToggle: $('#settings-toggle'),
    settingsModal: $('#settings-modal'),
    settingsClose: $('#settings-close'),
    settingsSave: $('#settings-save'),
    toast: $('#toast'),
    toastMsg: $('#toast-msg'),
    quoteText: $('#quote-text'),
    quoteAuthor: $('#quote-author'),
    statSessions: $('#stat-sessions'),
    statMinutes: $('#stat-minutes'),
    statStreak: $('#stat-streak'),
};

// ─── 4. MOTIVATIONAL QUOTES ──────────────────────
const quotes = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "It's not about having time, it's about making time.", author: "Unknown" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "Small daily improvements lead to stunning results.", author: "Robin Sharma" },
    { text: "Your future is created by what you do today.", author: "Robert Kiyosaki" },
    { text: "Deep work is the superpower of the 21st century.", author: "Cal Newport" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
];

// ─── 5. THEME COLORS PER MODE ───────────────────
const themes = {
    focus: { accent: '#f5a623', glow: 'rgba(245,166,35,0.3)', label: 'Focus Time' },
    short: { accent: '#4ecdc4', glow: 'rgba(78,205,196,0.3)', label: 'Short Break' },
    long:  { accent: '#a78bfa', glow: 'rgba(167,139,250,0.3)', label: 'Long Break' },
};

// ═══════════════════════════════════════════════════
//  TIMER LOGIC
// ═══════════════════════════════════════════════════

function startTimer() {
    if (state.isRunning) return;
    state.isRunning = true;
    updatePlayPauseUI();

    state.intervalId = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();
        updateRing();

        if (state.timeLeft <= 0) {
            clearInterval(state.intervalId);
            state.isRunning = false;
            updatePlayPauseUI();
            onTimerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(state.intervalId);
    state.isRunning = false;
    updatePlayPauseUI();
}

function resetTimer() {
    clearInterval(state.intervalId);
    state.isRunning = false;
    state.timeLeft = state.totalTime;
    updatePlayPauseUI();
    updateTimerDisplay();
    updateRing();
}

function skipTimer() {
    clearInterval(state.intervalId);
    state.isRunning = false;
    updatePlayPauseUI();
    onTimerComplete();
}

function onTimerComplete() {
    // Play notification sound
    if (state.settings.soundNotif) playNotificationSound();

    // Update stats if it was a focus session
    if (state.mode === 'focus') {
        state.stats.sessions++;
        state.stats.minutes += state.settings.focus;
        updateStatsUI();
        saveStats();
        showToast(`🎉 Focus session #${state.stats.sessions} complete!`);
    } else {
        showToast('Break is over — time to focus! 💪');
    }

    // Determine next mode
    if (state.mode === 'focus') {
        if (state.currentSession >= state.settings.rounds) {
            // Time for a long break
            switchMode('long');
            state.currentSession = 0;
        } else {
            switchMode('short');
        }
        state.currentSession++;
    } else {
        // After any break, go back to focus
        switchMode('focus');
    }

    updateSessionDots();

    // Auto-start breaks if enabled
    if (state.settings.autoBreak) {
        setTimeout(() => startTimer(), 1500);
    }

    // Show a new quote
    showRandomQuote();
}

// ═══════════════════════════════════════════════════
//  MODE SWITCHING
// ═══════════════════════════════════════════════════

function switchMode(mode) {
    state.mode = mode;
    const durations = {
        focus: state.settings.focus,
        short: state.settings.short,
        long: state.settings.long,
    };
    state.totalTime = durations[mode] * 60;
    state.timeLeft = state.totalTime;

    // Update active button
    dom.modeBtns.forEach(btn => btn.classList.remove('active'));
    $(`[data-mode="${mode}"]`).classList.add('active');

    // Slide the indicator
    const modeIndex = ['focus', 'short', 'long'].indexOf(mode);
    dom.modeSlider.style.transform = `translateX(${modeIndex * 100}%)`;

    // Update theme colors
    applyTheme(mode);

    updateTimerDisplay();
    updateRing();
}

function applyTheme(mode) {
    const theme = themes[mode];
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--accent-glow', theme.glow);
    dom.gradStop1.setAttribute('stop-color', theme.accent);
    dom.gradStop2.setAttribute('stop-color', adjustColor(theme.accent, 40));
    dom.timerLabel.textContent = theme.label;
}

// ═══════════════════════════════════════════════════
//  UI UPDATES
// ═══════════════════════════════════════════════════

function updateTimerDisplay() {
    const mins = Math.floor(state.timeLeft / 60);
    const secs = state.timeLeft % 60;
    dom.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.title = `${dom.timerDisplay.textContent} — Zenith Flow`;
}

function updateRing() {
    const circumference = 2 * Math.PI * 120; // r=120
    const progress = state.timeLeft / state.totalTime;
    dom.ringProgress.style.strokeDashoffset = circumference * (1 - progress);
}

function updatePlayPauseUI() {
    if (state.isRunning) {
        dom.playIcon.classList.add('hidden');
        dom.pauseIcon.classList.remove('hidden');
    } else {
        dom.playIcon.classList.remove('hidden');
        dom.pauseIcon.classList.add('hidden');
    }
}

function updateSessionDots() {
    const rounds = state.settings.rounds;
    let html = '';
    for (let i = 1; i <= rounds; i++) {
        let cls = '';
        if (i < state.currentSession) cls = 'completed';
        else if (i === state.currentSession) cls = 'active';
        html += `<span class="dot ${cls}"></span>`;
    }
    dom.sessionDots.innerHTML = html;
    dom.sessionText.textContent = `Session ${Math.min(state.currentSession, rounds)} of ${rounds}`;
}

function updateStatsUI() {
    dom.statSessions.textContent = state.stats.sessions;
    dom.statMinutes.textContent = state.stats.minutes;
    dom.statStreak.textContent = state.stats.streak;
}

function showToast(msg) {
    dom.toastMsg.textContent = msg;
    dom.toast.classList.add('show');
    setTimeout(() => dom.toast.classList.remove('show'), 3500);
}

function showRandomQuote() {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    dom.quoteText.textContent = `"${q.text}"`;
    dom.quoteAuthor.textContent = `— ${q.author}`;
}

// ═══════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════

function openSettings() { dom.settingsModal.classList.add('open'); }
function closeSettings() { dom.settingsModal.classList.remove('open'); }

function loadSettings() {
    const saved = localStorage.getItem('zenith-settings');
    if (saved) state.settings = { ...DEFAULTS, ...JSON.parse(saved) };

    // Populate inputs
    $('#setting-focus').value = state.settings.focus;
    $('#setting-short').value = state.settings.short;
    $('#setting-long').value = state.settings.long;
    $('#setting-rounds').value = state.settings.rounds;
    $('#setting-autobreak').checked = state.settings.autoBreak;
    $('#setting-sound').checked = state.settings.soundNotif;
}

function saveSettings() {
    state.settings.focus = parseInt($('#setting-focus').value) || DEFAULTS.focus;
    state.settings.short = parseInt($('#setting-short').value) || DEFAULTS.short;
    state.settings.long = parseInt($('#setting-long').value) || DEFAULTS.long;
    state.settings.rounds = parseInt($('#setting-rounds').value) || DEFAULTS.rounds;
    state.settings.autoBreak = $('#setting-autobreak').checked;
    state.settings.soundNotif = $('#setting-sound').checked;

    localStorage.setItem('zenith-settings', JSON.stringify(state.settings));

    // Re-apply current mode with new duration
    if (!state.isRunning) {
        switchMode(state.mode);
    }
    updateSessionDots();
    closeSettings();
    showToast('⚙️ Settings saved!');
}

// ─── Stats Persistence ──────────────────────────
function loadStats() {
    const saved = localStorage.getItem('zenith-stats');
    if (saved) state.stats = JSON.parse(saved);

    // Check streak
    const today = new Date().toDateString();
    if (state.stats.lastDate) {
        const last = new Date(state.stats.lastDate);
        const diff = Math.floor((new Date(today) - last) / 86400000);
        if (diff > 1) {
            state.stats.streak = 0; // streak broken
            state.stats.sessions = 0;
            state.stats.minutes = 0;
        } else if (diff === 1) {
            // New day — keep streak, reset daily counters
            state.stats.streak++;
            state.stats.sessions = 0;
            state.stats.minutes = 0;
        }
    }
    updateStatsUI();
}

function saveStats() {
    state.stats.lastDate = new Date().toDateString();
    if (state.stats.streak === 0) state.stats.streak = 1;
    localStorage.setItem('zenith-stats', JSON.stringify(state.stats));
    updateStatsUI();
}

// ═══════════════════════════════════════════════════
//  AMBIENT SOUND ENGINE (Web Audio API)
//  No external files needed — generates sounds live!
// ═══════════════════════════════════════════════════

let audioCtx = null;
const activeSounds = {};

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

// Create white noise buffer (used by rain, wind, waves, cafe)
function createNoiseBuffer(ctx, duration = 2) {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

// Each sound type has a create function that returns { gainNode, stop() }
const soundGenerators = {

    // 🌧️ RAIN: filtered white noise
    rain(ctx) {
        const buffer = createNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;

        const gain = ctx.createGain();
        gain.gain.value = 0;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();

        return { gainNode: gain, stop: () => source.stop() };
    },

    // 🔥 FIRE: brown noise with crackle
    fire(ctx) {
        const bufferSize = 4096;
        const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
        let lastOut = 0;

        processor.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                output[i] = lastOut * 3.5;
                // Add occasional crackle
                if (Math.random() > 0.9997) {
                    output[i] += (Math.random() - 0.5) * 0.5;
                }
            }
        };

        const gain = ctx.createGain();
        gain.gain.value = 0;
        processor.connect(gain);
        gain.connect(ctx.destination);

        return { gainNode: gain, stop: () => { processor.disconnect(); } };
    },

    // 🍃 WIND: bandpass noise with slow modulation
    wind(ctx) {
        const buffer = createNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.5;

        // Slow LFO to modulate volume (wind gusts)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.15; // slow
        lfoGain.gain.value = 0.3;
        lfo.connect(lfoGain);

        const gain = ctx.createGain();
        gain.gain.value = 0;
        lfoGain.connect(gain.gain);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        lfo.start();

        return { gainNode: gain, stop: () => { source.stop(); lfo.stop(); } };
    },

    // 🌊 WAVES: noise with rhythmic volume fade
    waves(ctx) {
        const buffer = createNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        // Create wave rhythm with LFO
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.08; // very slow — like ocean waves
        lfoGain.gain.value = 0.5;
        lfo.connect(lfoGain);

        const gain = ctx.createGain();
        gain.gain.value = 0;
        lfoGain.connect(gain.gain);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        lfo.start();

        return { gainNode: gain, stop: () => { source.stop(); lfo.stop(); } };
    },

    // 🐦 BIRDS: chirpy oscillators
    birds(ctx) {
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(ctx.destination);

        let running = true;

        function chirp() {
            if (!running) return;
            const osc = ctx.createOscillator();
            const chirpGain = ctx.createGain();
            const freq = 2000 + Math.random() * 3000;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + 0.05);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.8, ctx.currentTime + 0.12);

            chirpGain.gain.setValueAtTime(0.08, ctx.currentTime);
            chirpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

            osc.connect(chirpGain);
            chirpGain.connect(gain);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);

            // Schedule next chirp at random interval
            setTimeout(chirp, 300 + Math.random() * 2000);
        }

        chirp();

        return { gainNode: gain, stop: () => { running = false; } };
    },

    // ☕ CAFÉ: mid-frequency noise murmur
    cafe(ctx) {
        const buffer = createNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.3;

        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'lowpass';
        filter2.frequency.value = 2000;

        const gain = ctx.createGain();
        gain.gain.value = 0;

        source.connect(filter);
        filter.connect(filter2);
        filter2.connect(gain);
        gain.connect(ctx.destination);
        source.start();

        return { gainNode: gain, stop: () => source.stop() };
    },
};

function toggleSound(soundName) {
    const btn = $(`#sound-${soundName}-btn`);

    if (activeSounds[soundName]) {
        // Stop this sound
        activeSounds[soundName].gainNode.gain.linearRampToValueAtTime(0, getAudioCtx().currentTime + 0.3);
        setTimeout(() => {
            try { activeSounds[soundName].stop(); } catch(e) {}
            delete activeSounds[soundName];
        }, 400);
        btn.classList.remove('active');
    } else {
        // Start this sound
        const ctx = getAudioCtx();
        const sound = soundGenerators[soundName](ctx);
        const vol = parseInt($(`#sound-${soundName}-vol`).value) / 100;
        sound.gainNode.gain.linearRampToValueAtTime(vol * 0.5, ctx.currentTime + 0.5);
        activeSounds[soundName] = sound;
        btn.classList.add('active');
    }
}

function updateSoundVolume(soundName, value) {
    if (activeSounds[soundName]) {
        const vol = value / 100;
        activeSounds[soundName].gainNode.gain.linearRampToValueAtTime(vol * 0.5, getAudioCtx().currentTime + 0.1);
    }
}

// ═══════════════════════════════════════════════════
//  NOTIFICATION SOUND
// ═══════════════════════════════════════════════════

function playNotificationSound() {
    const ctx = getAudioCtx();

    // Pleasant two-tone chime
    [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 1);
    });
}

// ═══════════════════════════════════════════════════
//  FLOATING PARTICLES (Canvas)
// ═══════════════════════════════════════════════════

function initParticles() {
    const canvas = $('#particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.4 + 0.1,
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;

            // Wrap around edges
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }
    animate();
}

// ═══════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════

// Lighten a hex color by a given percentage
function adjustColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
    const b = Math.min(255, (num & 0x0000FF) + percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ═══════════════════════════════════════════════════
//  EVENT LISTENERS
// ═══════════════════════════════════════════════════

function init() {
    // Load saved data
    loadSettings();
    loadStats();

    // Apply initial theme
    applyTheme(state.mode);
    updateTimerDisplay();
    updateRing();
    updateSessionDots();
    showRandomQuote();

    // Timer controls
    dom.btnStart.addEventListener('click', () => {
        state.isRunning ? pauseTimer() : startTimer();
    });
    dom.btnReset.addEventListener('click', resetTimer);
    dom.btnSkip.addEventListener('click', skipTimer);

    // Mode buttons
    dom.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.isRunning) pauseTimer();
            switchMode(btn.dataset.mode);
        });
    });

    // Settings
    dom.settingsToggle.addEventListener('click', openSettings);
    dom.settingsClose.addEventListener('click', closeSettings);
    dom.settingsSave.addEventListener('click', saveSettings);
    dom.settingsModal.addEventListener('click', (e) => {
        if (e.target === dom.settingsModal) closeSettings();
    });

    // Sound toggles and volume sliders
    $$('.sound-toggle').forEach(btn => {
        const soundName = btn.closest('.sound-item').dataset.sound;
        btn.addEventListener('click', () => toggleSound(soundName));
    });
    $$('.sound-volume').forEach(slider => {
        const soundName = slider.closest('.sound-item').dataset.sound;
        slider.addEventListener('input', (e) => updateSoundVolume(soundName, e.target.value));
    });

    // Keyboard shortcut: Space to start/pause
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !dom.settingsModal.classList.contains('open')) {
            e.preventDefault();
            state.isRunning ? pauseTimer() : startTimer();
        }
    });

    // Start particles
    initParticles();
}

// Launch the app!
document.addEventListener('DOMContentLoaded', init);
