const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
const timerDisplay = document.getElementById('timer');
const statusDisplay = document.getElementById('status');
const container = document.querySelector('.timer-container');
const minusBtn = document.getElementById('minus-btn');
const plusBtn = document.getElementById('plus-btn');

let width, height;
let particles = [];
let isRunning = false;
let initialTime = 25 * 60;
let timeLeft = initialTime;
let timerInterval;

// SoundFX using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const sound = {
    playTone: (freq, type, duration) => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },
    start: () => {
        sound.playTone(440, 'sine', 0.5);
        setTimeout(() => sound.playTone(880, 'sine', 0.5), 100);
    },
    stop: () => {
        sound.playTone(300, 'triangle', 0.3);
    },
    finish: () => {
        let count = 0;
        const interval = setInterval(() => {
            sound.playTone(880, 'sine', 0.5);
            count++;
            if (count > 2) clearInterval(interval);
        }, 500);
    },
    click: () => {
        sound.playTone(1200, 'sine', 0.1);
    }
};

// Resize handling
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Particle Class
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 300 + 150; // Start outside
        this.x = width / 2 + Math.cos(angle) * radius;
        this.y = height / 2 + Math.sin(angle) * radius;
        this.size = Math.random() * 2 + 0.5;
        this.speed = Math.random() * 1 + 0.5;
        this.life = 0;
        this.maxLife = Math.random() * 100 + 50;

        // Target center
        this.tx = width / 2;
        this.ty = height / 2;
    }

    update() {
        if (!isRunning) {
            // Idle float
            this.x += (Math.random() - 0.5) * 0.5;
            this.y += (Math.random() - 0.5) * 0.5;
            return;
        }

        // Move towards center
        const dx = this.tx - this.x;
        const dy = this.ty - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
            this.reset();
        } else {
            this.x += (dx / dist) * this.speed * 2;
            this.y += (dy / dist) * this.speed * 2;
        }
    }

    draw() {
        ctx.fillStyle = `rgba(0, 242, 255, ${Math.random() * 0.5 + 0.1})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Init particles
for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
}
animate();

// Timer Logic
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        timerDisplay.textContent = formatTime(timeLeft);
    } else {
        clearInterval(timerInterval);
        isRunning = false;
        container.classList.remove('active');
        statusDisplay.textContent = "FOCUS COMPLETE";
        sound.finish();
        timeLeft = initialTime;
    }
}

function toggleTimer(e) {
    // Prevent toggle if clicking control buttons
    if (e.target.tagName === 'BUTTON') return;

    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        container.classList.remove('active');
        statusDisplay.textContent = "PAUSED";
        sound.stop();
    } else {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        sound.start();
        timerInterval = setInterval(updateTimer, 1000);
        isRunning = true;
        container.classList.add('active');
        statusDisplay.textContent = "FOCUSING...";
    }
}

function adjustTime(amount) {
    if (isRunning) return;
    initialTime += amount * 60;
    if (initialTime < 60) initialTime = 60; // Min 1 min
    if (initialTime > 99 * 60) initialTime = 99 * 60; // Max 99 min
    timeLeft = initialTime;
    timerDisplay.textContent = formatTime(timeLeft);
    sound.click();
}

container.addEventListener('click', toggleTimer);

minusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    adjustTime(-5);
});

plusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    adjustTime(5);
});
