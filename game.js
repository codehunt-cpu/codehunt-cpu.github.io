// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const achievementPopup = document.getElementById('achievementPopup');
// New UI elements for advanced systems
const waveTransitionEl = document.getElementById('waveTransition');
const waveNumberEl = document.getElementById('waveNumber');
const waveSubtitleEl = document.getElementById('waveSubtitle');
const bossHealthContainer = document.getElementById('bossHealthContainer');
const bossHealthFill = document.getElementById('bossHealthFill');
const bossHealthText = document.getElementById('bossHealthText');
const scorePopupsContainer = document.getElementById('scorePopups');

// Add mute button SVG toggle
let muteIconHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
    <path d="M15.54 8.46a5 5 0 010 7.07"/>
</svg>`;
let mutedIconHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
    <line x1="23" y1="9" x2="17" y2="15"/>
    <line x1="17" y1="9" x2="23" y2="15"/>
</svg>`;

// UI Elements
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const menuButton = document.getElementById('menuButton');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const quitButton = document.getElementById('quitButton');
const muteButton = document.getElementById('muteButton');
const showLeaderboardBtn = document.getElementById('showLeaderboard');
const backToMenuBtn = document.getElementById('backToMenu');
const clearLeaderboardBtn = document.getElementById('clearLeaderboard');

const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const finalScoreDisplay = document.getElementById('finalScore');
const finalComboDisplay = document.getElementById('finalCombo');
const finalWaveDisplay = document.getElementById('finalWave');
const creditsEarnedDisplay = document.getElementById('creditsEarned');
// Share elements
const shareButton = document.getElementById('shareButton');
const shareScreen = document.getElementById('shareScreen');
const shareScoreText = document.getElementById('shareScoreText');
const shareWave = document.getElementById('shareWave');
const shareMode = document.getElementById('shareMode');
const copyScoreBtn = document.getElementById('copyScore');
const closeShareBtn = document.getElementById('closeShare');
const replayButton = document.getElementById('replayButton');

function playReplay(){
    if (!replayData.length) return;
    isReplaying = true;
    let frameIndex = 0;
    function replayStep(){
        ctx.fillStyle = 'rgba(10,10,30,0.6)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        const frame = replayData[frameIndex];
        frame.players.forEach((pos, idx) => {
            ctx.save();
            ctx.translate(pos.x + 20, pos.y + 20);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = idx===0? '#4fc3f7':'#51cf66';
            ctx.beginPath();
            ctx.arc(0,0,18,0,Math.PI*2);
            ctx.fill();
            ctx.restore();
        });
        ctx.fillStyle = '#fff';
        ctx.font = '16px Orbitron';
        ctx.fillText('REPLAY SCORE: '+frame.score, 20, 30);
        frameIndex++;
        if (frameIndex < replayData.length) requestAnimationFrame(replayStep); else isReplaying=false;
    }
    requestAnimationFrame(replayStep);
}
if (replayButton) replayButton.addEventListener('click', playReplay);
const comboDisplay = document.getElementById('comboDisplay');
const difficultyDisplay = document.getElementById('difficultyDisplay');
const modeDisplay = document.getElementById('modeDisplay');
const highScoreDisplay = document.getElementById('highScore');
const newHighScoreDisplay = document.getElementById('newHighScore');
const achievementsDisplay = document.getElementById('achievements');
const activePowerupsDisplay = document.getElementById('activePowerups');
const playerNameInput = document.getElementById('playerName');
const mobileControls = document.getElementById('mobileControls');
// Game mode / menu elements
const modeScreen = document.getElementById('modeScreen');
const gameModeButton = document.getElementById('gameModeButton');
const backFromModeBtn = document.getElementById('backFromMode');

// Set canvas size
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    if (useTiledBackground) {
        // Rebuild star layers to match new size
        buildStarLayers();
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Audio setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = false;

function playSound(frequency, duration, type = 'sine') {
    if (isMuted) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    const masterVolEl = document.getElementById('masterVolume');
    const vol = masterVolEl ? parseFloat(masterVolEl.value)/100 : 0.7;
    gainNode.gain.setValueAtTime(0.3 * vol, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

const sounds = {
    collect: () => playSound(800, 0.1),
    rainbow: () => {
        playSound(600, 0.15);
        setTimeout(() => playSound(800, 0.15), 100);
        setTimeout(() => playSound(1000, 0.15), 200);
    },
    hit: () => playSound(150, 0.3, 'sawtooth'),
    powerup: () => {
        playSound(400, 0.1);
        setTimeout(() => playSound(600, 0.1), 80);
        setTimeout(() => playSound(800, 0.15), 160);
    },
    achievement: () => {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => playSound(800 + i * 200, 0.15), i * 100);
        }
    }
};

// Game state
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let difficulty = 'easy';
let shipColor = 'blue';
let playerName = 'Pilot';
let gameMode = 'classic'; // classic, timeattack, zen, onelife, collection, coop
let collectedStarsThisRun = 0;
let collectionTarget = 0; // set per collection run
let players = []; // coop support
let replayData = [];
let isReplaying = false;
let highScore = 0;
let combo = 0;
let maxCombo = 0;
let lastStarTime = 0;
let comboTimeout = null;

let player;
let stars = [];
let asteroids = [];
let particles = [];
let powerups = [];
let activePowerups = [];
let backgroundStars = [];
// Offscreen tiled background layers optimization
let useTiledBackground = true;
let starLayers = [];// each: {canvas, ctx, speed, alpha, scroll}
let warpLines = [];
let animationId;
let gameTime = 0;
let firstPlay = true;
let unlockedAchievements = [];
let frozenTime = 0;
let nebulaOffsetX = 0; // parallax drift based on player movement
let nebulaOffsetY = 0;
let slowMotionTime = 0;
let triplePointsTime = 0;
let globalTimeScale = 1;
let screenShakeTime = 0;

// Wave / Boss state
let waveNumber = 1;
let waveElapsed = 0; // ms into current wave
let waveDuration = 45000; // 45s per wave baseline
let waveTransitionTime = 0; // ms remaining of transition overlay
let bossActive = false;
let boss = null;
let nextBossScore = 100; // spawn boss every 100 points baseline
let nextBossTime = 60000; // or every 60 seconds

// Combat state
let bullets = [];
let bulletCooldown = 0;
let bulletRate = 300; // ms between shots baseline
let weaponLevel = 1; // simple upgrade placeholder
// Special enemies state
let ufos = [];
let comets = [];
let blackHoles = [];
let cometShowerCooldown = 0;
let blackHoleCooldown = 0;
let bossKills = 0;
// Progression & persistence
let cosmicCredits = 0;
let shipVariants = {
    default: { speedMult:1, size:40, livesBonus:0 },
    interceptor: { speedMult:1.15, size:36, livesBonus:0 },
    defender: { speedMult:0.95, size:44, livesBonus:1 },
    phantom: { speedMult:1.25, size:38, livesBonus:0 }
};
let unlockedShips = ['default'];
let selectedShip = 'default';
let upgradeTree = { maxLives:0, magnetRange:0, powerupDuration:0, speedBoost:0 };
let dailyChallenge = null; // {id, desc, target, progress, reward, date, completed, type}
let playStreak = { lastDate:null, days:0 };
let activeLeaderboardMode = 'classic';

function updateModeBadge(){
    if (modeDisplay) modeDisplay.textContent = gameMode.toUpperCase();
}

// Difficulty settings
const difficultySettings = {
    easy: { asteroidSpawnRate: 0.01, starSpawnRate: 0.025, asteroidSpeed: 2, lives: 5 },
    medium: { asteroidSpawnRate: 0.018, starSpawnRate: 0.02, asteroidSpeed: 3, lives: 3 },
    hard: { asteroidSpawnRate: 0.025, starSpawnRate: 0.015, asteroidSpeed: 4, lives: 2 }
};

// Ship colors
const shipColors = {
    blue: { main: '#4fc3f7', light: '#81d4fa', dark: '#0288d1' },
    red: { main: '#ff6b6b', light: '#ff8787', dark: '#c92a2a' },
    green: { main: '#51cf66', light: '#8ce99a', dark: '#2f9e44' },
    purple: { main: '#cc5de8', light: '#e599f7', dark: '#9c36b5' },
    gold: { main: '#ffd700', light: '#ffe066', dark: '#f59f00' }
};

// Non-offensive, neutral UI themes (color variable overrides)
const themes = {
    default: {
        '--color-cyan': '#00d9ff',
        '--color-magenta': '#ff00ff',
        '--color-purple': '#9d4edd',
        '--color-gold': '#ffd700',
        '--glass-border': 'rgba(0,217,255,0.3)'
    },
    cyberpunk: {
        '--color-cyan': '#00fff2',
        '--color-magenta': '#ff0099',
        '--color-purple': '#7f00ff',
        '--color-gold': '#ffea00',
        '--glass-border': 'rgba(255,0,153,0.35)'
    },
    retro: {
        '--color-cyan': '#4fc3f7',
        '--color-magenta': '#ff6b6b',
        '--color-purple': '#ff9f1c',
        '--color-gold': '#ffe066',
        '--glass-border': 'rgba(255,224,102,0.35)'
    },
    vaporwave: {
        '--color-cyan': '#01cdfe',
        '--color-magenta': '#ff71ce',
        '--color-purple': '#b967ff',
        '--color-gold': '#fffb96',
        '--glass-border': 'rgba(255,113,206,0.35)'
    }
};

function applyTheme(name){
    const theme = themes[name] || themes.default;
    Object.entries(theme).forEach(([k,v])=> document.documentElement.style.setProperty(k,v));
    localStorage.setItem('cosmicTheme', name);
}

function initTheme(){
    const saved = localStorage.getItem('cosmicTheme') || 'default';
    applyTheme(saved);
    document.querySelectorAll('.theme-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.theme === saved);
    });
}

// Achievements
const achievements = [
    { id: 'first100', name: 'Century Club', condition: () => score >= 100, unlocked: false },
    { id: 'combo5', name: '5x Combo Master', condition: () => maxCombo >= 5, unlocked: false },
    { id: 'flawless', name: 'Flawless Run', condition: () => score >= 50 && lives === difficultySettings[difficulty].lives, unlocked: false },
    { id: 'survivor', name: '60 Second Survivor', condition: () => gameTime >= 60000, unlocked: false },
    { id: 'rainbow', name: 'Rainbow Hunter', condition: () => false, manual: true },
];

// Load/Save functions
function loadHighScore() {
    const saved = localStorage.getItem('cosmicHighScore');
    highScore = saved ? parseInt(saved) : 0;
    highScoreDisplay.textContent = highScore;
    cosmicCredits = parseInt(localStorage.getItem('cosmicCredits')||'0');
    unlockedShips = JSON.parse(localStorage.getItem('cosmicShipsUnlocked')||'["default"]');
    upgradeTree = JSON.parse(localStorage.getItem('cosmicUpgrades')||'{"maxLives":0,"magnetRange":0,"powerupDuration":0,"speedBoost":0}');
    playStreak = JSON.parse(localStorage.getItem('cosmicPlayStreak')||'{"lastDate":null,"days":0}');
    initDailyChallenge();
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cosmicHighScore', highScore);
        highScoreDisplay.textContent = highScore;
        return true;
    }
    return false;
}

function saveProgress() {
    localStorage.setItem('cosmicCredits', cosmicCredits);
    localStorage.setItem('cosmicShipsUnlocked', JSON.stringify(unlockedShips));
    localStorage.setItem('cosmicUpgrades', JSON.stringify(upgradeTree));
    localStorage.setItem('cosmicPlayStreak', JSON.stringify(playStreak));
    if (dailyChallenge) localStorage.setItem('cosmicDailyChallenge', JSON.stringify(dailyChallenge));
}

function evaluateShipUnlocks() {
    if (score >= 200 && !unlockedShips.includes('interceptor')) unlockedShips.push('interceptor');
    if (score >= 500 && !unlockedShips.includes('defender')) unlockedShips.push('defender');
    if (score >= 1000 && !unlockedShips.includes('phantom')) unlockedShips.push('phantom');
}

function applySelectedShip(p) {
    const variant = shipVariants[selectedShip] || shipVariants.default;
    p.baseSpeed *= variant.speedMult;
    p.speed = p.baseSpeed;
    p.width = variant.size;
    p.height = variant.size;
    lives += variant.livesBonus;
}

function applyUpgrades() {
    lives += upgradeTree.maxLives;
    // Further upgrade effects can be applied here (magnet range, duration modifications)
}

// Daily Challenge System
const challengePool = [
    { id:'collect50', desc:'Collect 50 stars', target:50, reward:40, type:'star' },
    { id:'rainbow3', desc:'Collect 3 rainbow stars', target:3, reward:60, type:'rainbow' },
    { id:'survive120', desc:'Survive 120s', target:120000, reward:80, type:'time' },
    { id:'combo8', desc:'Reach 8x combo', target:8, reward:70, type:'combo' },
    { id:'boss2', desc:'Defeat 2 bosses', target:2, reward:120, type:'bossKill' }
];

function initDailyChallenge() {
    const stored = localStorage.getItem('cosmicDailyChallenge');
    const today = new Date().toISOString().slice(0,10);
    if (stored) {
        const obj = JSON.parse(stored);
        if (obj.date === today) { dailyChallenge = obj; return; }
    }
    dailyChallenge = { ...challengePool[Math.floor(Math.random()*challengePool.length)], progress:0, completed:false, date:today };
    localStorage.setItem('cosmicDailyChallenge', JSON.stringify(dailyChallenge));
}

function updateDailyChallenge(event) {
    if (!dailyChallenge || dailyChallenge.completed) return;
    if (dailyChallenge.type === 'time' && event === 'tick') dailyChallenge.progress = gameTime;
    else if (event === dailyChallenge.type) dailyChallenge.progress++;
    else if (dailyChallenge.type === 'combo' && event === 'combo') { if (combo > dailyChallenge.progress) dailyChallenge.progress = combo; }
    if ((dailyChallenge.type === 'time' ? dailyChallenge.progress >= dailyChallenge.target : dailyChallenge.progress >= dailyChallenge.target)) {
        dailyChallenge.completed = true;
        cosmicCredits += dailyChallenge.reward;
        showAchievement('Daily Challenge Complete');
    }
}

function updatePlayStreak() {
    const today = new Date().toISOString().slice(0,10);
    if (playStreak.lastDate === today) return;
    if (playStreak.lastDate) {
        const last = new Date(playStreak.lastDate);
        const diff = (new Date(today) - last)/(1000*3600*24);
        if (diff <= 1.5) playStreak.days++; else playStreak.days = 1;
    } else playStreak.days = 1;
    playStreak.lastDate = today;
}

function saveToLeaderboard() {
    const key = 'cosmicLeaderboard_' + gameMode;
    let leaderboard = JSON.parse(localStorage.getItem(key) || '[]');
    leaderboard.push({
        name: playerName,
        score: score,
        difficulty: difficulty,
        mode: gameMode,
        date: new Date().toISOString()
    });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(leaderboard));
}

function displayLeaderboard(mode = activeLeaderboardMode) {
    activeLeaderboardMode = mode;
    const key = 'cosmicLeaderboard_' + mode;
    const leaderboard = JSON.parse(localStorage.getItem(key) || '[]');
    const list = document.getElementById('leaderboardList');
    if (!list) return;
    if (leaderboard.length === 0) {
        list.innerHTML = `<p style="color: rgba(255,255,255,0.6); padding: 20px;">No ${mode.toUpperCase()} records yet.</p>`;
        return;
    }
    list.innerHTML = leaderboard.map((entry, index) => `
        <div class="leaderboard-entry">
            <span class="leaderboard-rank">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
            <span class="leaderboard-name">${entry.name}</span>
            <span class="leaderboard-difficulty">${entry.difficulty}</span>
            <span class="leaderboard-score">${entry.score}</span>
        </div>
    `).join('');
}

// Background stars
class BackgroundStar {
    constructor(layer) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = layer === 1 ? 1 : layer === 2 ? 1.5 : 2;
        this.speed = layer * 0.3;
        this.opacity = 0.3 + (layer * 0.2);
        this.layer = layer;
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    update() {
        this.y += this.speed * (frozenTime > 0 ? 0.2 : 1) * globalTimeScale;
        // subtle horizontal parallax influenced by player horizontal velocity
        if (player) this.x -= player.dx * 0.02 * this.layer;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
        if (this.x < 0) this.x += canvas.width; else if (this.x > canvas.width) this.x -= canvas.width;
    }
}

// Warp line effect (speed / warp feeling)
class WarpLine {
    constructor() {
        this.x = Math.random()*canvas.width;
        this.y = Math.random()*canvas.height;
        this.length = 20 + Math.random()*40;
        this.speed = 6 + Math.random()*6;
        this.alpha = 0.15 + Math.random()*0.35;
    }
    update() {
        const boostFactor = player && player.speed > player.baseSpeed ? 2.2 : 1;
        this.y += this.speed * globalTimeScale * boostFactor;
        if (this.y > canvas.height) { this.y = -this.length; this.x = Math.random()*canvas.width; }
    }
    draw() {
        ctx.strokeStyle = `rgba(255,255,255,${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
    }
}

function buildStarLayers(){
    starLayers = [];
    const layerConfigs = [
        { density: 0.00025, speed: 0.3, alpha:0.35 },
        { density: 0.00018, speed: 0.55, alpha:0.5 },
        { density: 0.00012, speed: 0.85, alpha:0.65 }
    ];
    layerConfigs.forEach(cfg => {
        const off = document.createElement('canvas');
        off.width = canvas.width; off.height = canvas.height;
        const octx = off.getContext('2d');
        const starCount = Math.floor(canvas.width * canvas.height * cfg.density);
        for (let i=0;i<starCount;i++){
            const x = Math.random()*canvas.width;
            const y = Math.random()*canvas.height;
            const size = Math.random()<0.7?1:2;
            octx.fillStyle = `rgba(255,255,255,${0.3+Math.random()*0.4})`;
            octx.fillRect(x,y,size,size);
        }
        starLayers.push({canvas:off, ctx:octx, speed:cfg.speed, alpha:cfg.alpha, scroll:0});
    });
}
function initBackgroundStars() {
    if (useTiledBackground) {
        buildStarLayers();
    } else {
        backgroundStars = [];
        for (let i = 0; i < 100; i++) {
            const layer = Math.floor(Math.random() * 3) + 1;
            backgroundStars.push(new BackgroundStar(layer));
        }
    }
    warpLines = [];
    for (let i=0;i<60;i++) warpLines.push(new WarpLine());
}

function drawTiledBackground(delta){
    starLayers.forEach(layer => {
        layer.scroll += layer.speed * (frozenTime>0?0.2:1) * globalTimeScale * (delta/16.666);
        const sy = layer.scroll % canvas.height;
        ctx.globalAlpha = layer.alpha;
        ctx.drawImage(layer.canvas, 0, sy - canvas.height);
        ctx.drawImage(layer.canvas, 0, sy);
        ctx.globalAlpha = 1;
    });
}

// Player
class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.baseSpeed = 5;
        this.speed = this.baseSpeed;
        this.dx = 0;
        this.dy = 0;
        this.trail = [];
        this.invincible = false;
        this.magnetActive = false;
    }

    draw() {
        // Trail
        this.trail.forEach((pos, index) => {
            const alpha = (index / this.trail.length) * 0.5;
            ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pos.x + this.width / 2, pos.y + this.height / 2, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        const colors = shipColors[shipColor];
        
        if (this.invincible) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.fillStyle = colors.main;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 15);
        ctx.lineTo(15, 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = colors.light;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.dark;
        ctx.beginPath();
        ctx.moveTo(-15, 5);
        ctx.lineTo(-25, 15);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(15, 5);
        ctx.lineTo(25, 15);
        ctx.lineTo(15, 15);
        ctx.closePath();
        ctx.fill();
        
        const glowColor = this.speed > this.baseSpeed ? '#ffd700' : '#ff6b6b';
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = 0.7 + Math.random() * 0.3;
        ctx.beginPath();
        ctx.arc(-8, 15, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, 15, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) this.trail.shift();

        this.x += this.dx;
        this.y += this.dy;

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
    }
}

// Bullet / Projectile
class Bullet {
    constructor(x, y, vx = 0, vy = -10, type = 'normal') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = 6;
        this.type = type; // normal, spread, laser, homing (placeholders)
        this.life = 2000; // ms
        this.active = true;
    }
    update(dt) {
        // homing example (future): adjust vx/vy toward nearest asteroid
        if (this.type === 'homing' && asteroids.length) {
            const target = asteroids[0];
            const tx = target.x + target.size/2 - this.x;
            const ty = target.y + target.size/2 - this.y;
            const d = Math.hypot(tx, ty) || 1;
            this.vx += (tx/d)*0.2;
            this.vy += (ty/d)*0.2;
            // clamp speed
            const speed = Math.hypot(this.vx, this.vy);
            const maxSpeed = 12;
            if (speed > maxSpeed) { this.vx = this.vx/speed*maxSpeed; this.vy = this.vy/speed*maxSpeed; }
        }
        this.x += this.vx * globalTimeScale;
        this.y += this.vy * globalTimeScale;
        this.life -= dt;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.type === 'laser' ? '#ff00ff' : this.type === 'homing' ? '#ffd700' : '#00ffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
    collidesWith(obj) {
        return this.x - this.size < obj.x + obj.size && this.x + this.size > obj.x && this.y - this.size < obj.y + obj.size && this.y + this.size > obj.y;
    }
}

// Bullet pool
const bulletPool = [];
function getBullet(x,y,vx,vy,type='normal'){
    let b = bulletPool.find(b=>!b.active);
    if (b){
        b.x=x; b.y=y; b.vx=vx; b.vy=vy; b.type=type; b.life=2000; b.active=true; return b;
    }
    return new Bullet(x,y,vx,vy,type);
}

// Star
class Star {
    constructor(type = 'normal') {
        this.type = type;
        this.size = type === 'rainbow' ? 30 : type === 'freeze' ? 25 : 20 + Math.random() * 10;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = 2 + Math.random() * 2;
        this.rotation = 0;
        this.rotationSpeed = 0.05 + Math.random() * 0.1;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.type === 'rainbow') {
            ctx.fillText('🌈', 0, 0);
        } else if (this.type === 'freeze') {
            ctx.fillText('⏸️', 0, 0);
        } else {
            ctx.fillText('⭐', 0, 0);
        }
        
        ctx.restore();
    }

    update() {
        this.y += this.speed * (frozenTime > 0 ? 0.2 : 1);
        this.rotation += this.rotationSpeed;
    }

    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.size > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.size > obj.y;
    }
}

// Asteroid
class Asteroid {
    constructor() {
        this.size = 25 + Math.random() * 15;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        const settings = difficultySettings[difficulty];
        this.speed = settings.asteroidSpeed + Math.random() * 2 + (score / 500);
        this.rotation = 0;
        this.rotationSpeed = 0.02 + Math.random() * 0.08;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☄️', 0, 0);
        
        ctx.restore();
    }

    update() {
        this.y += this.speed * (frozenTime > 0 ? 0.2 : 1);
        this.rotation += this.rotationSpeed;
    }

    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.size > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.size > obj.y;
    }
}

// Boss (large asteroid variant)
class BossAsteroid {
    constructor() {
        this.size = 160;
        this.x = canvas.width / 2 - this.size/2;
        this.y = -this.size;
        this.speed = 1.2 + waveNumber * 0.2;
        this.health = 300 + waveNumber * 120;
        this.maxHealth = this.health;
        this.rotation = 0;
        this.rotationSpeed = 0.005;
        this.phase = 1; // attack pattern phase
    }
    update(dt) {
        if (this.y < canvas.height * 0.2) this.y += this.speed * globalTimeScale;
        else {
            // simple horizontal sweeping
            this.x += Math.sin(performance.now()/1000)*2 * globalTimeScale;
            // spawn mini asteroids as attack
            if (Math.random() < 0.01 * globalTimeScale) asteroids.push(new Asteroid());
        }
        this.rotation += this.rotationSpeed * globalTimeScale;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x + this.size/2, this.y + this.size/2);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#5a2d0c';
        ctx.beginPath();
        ctx.arc(0, 0, this.size/2, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.restore();
    }
    collidesWith(obj) {
        return this.x < obj.x + obj.width && this.x + this.size > obj.x && this.y < obj.y + obj.height && this.y + this.size > obj.y;
    }
}

// UFO enemy
class UFO {
    constructor() {
        this.width = 50; this.height = 25;
        this.x = Math.random() < 0.5 ? -60 : canvas.width + 60;
        this.y = 60 + Math.random()* (canvas.height*0.3);
        this.speed = (2 + waveNumber*0.3) * (this.x < 0 ? 1 : -1);
        this.health = 40 + waveNumber*10;
        this.maxHealth = this.health;
        this.flashTime = 0;
    }
    update(dt) {
        this.x += this.speed * globalTimeScale;
        if (this.x < -80 || this.x > canvas.width+80) this.health = 0; // remove off screen
        if (this.flashTime > 0) this.flashTime -= dt;
        // occasional zig-zag
        this.y += Math.sin(performance.now()/400) * 0.6 * globalTimeScale;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.flashTime>0? '#ffffff':'#9d4edd';
        ctx.beginPath();
        ctx.ellipse(0,0, this.width/2, this.height/2, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#00d9ff';
        ctx.fillRect(-12,-4,24,8);
        ctx.restore();
    }
    collidesWith(obj){
        return this.x - this.width/2 < obj.x + obj.width && this.x + this.width/2 > obj.x && this.y - this.height/2 < obj.y + obj.height && this.y + this.height/2 > obj.y;
    }
}

class CometPiece {
    constructor() {
        this.size = 12 + Math.random()*6;
        this.x = Math.random()*canvas.width;
        this.y = -this.size;
        this.vx = (Math.random()-0.5)*2;
        this.vy = 8 + Math.random()*4 + waveNumber*0.3;
        this.rotation = Math.random()*Math.PI*2;
        this.rotationSpeed = (Math.random()-0.5)*0.3;
    }
    update(dt){
        this.x += this.vx * globalTimeScale;
        this.y += this.vy * globalTimeScale;
        this.rotation += this.rotationSpeed * globalTimeScale;
    }
    draw(){
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(-this.size/2,-this.size/2,this.size,this.size);
        ctx.restore();
    }
    collidesWith(obj){
        return this.x - this.size/2 < obj.x + obj.width && this.x + this.size/2 > obj.x && this.y - this.size/2 < obj.y + obj.height && this.y + this.size/2 > obj.y;
    }
}

class BlackHole {
    constructor(){
        this.size = 80;
        this.x = 80 + Math.random()*(canvas.width-160);
        this.y = 120 + Math.random()*(canvas.height*0.4);
        this.life = 20000; // ms
    }
    update(dt){
        this.life -= dt;
        // slow pulsation
        this.size += Math.sin(performance.now()/700)*0.3;
        // gravitational pull
        if (player) {
            const px = player.x + player.width/2;
            const py = player.y + player.height/2;
            const dx = this.x - px;
            const dy = this.y - py;
            const distSq = dx*dx + dy*dy;
            const radius = 300;
            if (distSq < radius*radius) {
                const dist = Math.sqrt(distSq) || 1;
                const force = (1 - dist/radius) * 0.4; // normalized pull
                player.dx += (dx/dist) * force;
                player.dy += (dy/dist) * force;
            }
        }
    }
    draw(){
        ctx.save();
        ctx.translate(this.x, this.y);
        const gradient = ctx.createRadialGradient(0,0,10,0,0,this.size/2);
        gradient.addColorStop(0,'#000');
        gradient.addColorStop(0.4,'#2d2d5f');
        gradient.addColorStop(0.7,'#9d4edd');
        gradient.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(0,0,this.size/2,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }
    collidesWith(obj){
        return this.x - this.size/2 < obj.x + obj.width && this.x + this.size/2 > obj.x && this.y - this.size/2 < obj.y + obj.height && this.y + this.size/2 > obj.y;
    }
}

// Powerup
class Powerup {
    constructor() {
        const types = ['shield', 'magnet', 'speed', 'triple', 'slow', 'spread', 'laser', 'homing'];
        this.type = types[Math.floor(Math.random() * types.length)];
        this.size = 25;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = 2;
        this.rotation = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const icons = { shield: '🛡️', magnet: '💥', speed: '⏩', triple: '✴️', slow: '🐢', spread: '🔱', laser: '💫', homing: '🎯' };
        ctx.fillText(icons[this.type], 0, 0);
        
        ctx.restore();
    }

    update() {
        this.y += this.speed;
        this.rotation += 0.05;
    }

    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.size > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.size > obj.y;
    }
}

// Particle
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = 3 + Math.random() * 3;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.color = color;
        this.life = 30;
        this.active = true;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 30;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        let p = particlePool.find(p=>!p.active);
        if (!p) { p = new Particle(x,y,color); particlePool.push(p); }
        else {
            p.x = x; p.y = y; p.color=color; p.life=30; p.size = 3 + Math.random()*3; p.speedX=(Math.random()-0.5)*6; p.speedY=(Math.random()-0.5)*6; p.active=true;
        }
        particles.push(p);
    }
}

const particlePool = [];

// Combo system
function updateCombo() {
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    
    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
        combo = 0;
        comboDisplay.textContent = '';
    }, 2000);
    
    if (combo >= 2) {
        comboDisplay.textContent = `${combo}x COMBO! 🔥`;
        comboDisplay.style.animation = 'none';
        setTimeout(() => comboDisplay.style.animation = 'pulse 0.5s ease-in-out', 10);
    }
    updateDailyChallenge('combo');
}

// Achievement system
function checkAchievements() {
    achievements.forEach(ach => {
        if (!ach.unlocked && !ach.manual && ach.condition()) {
            ach.unlocked = true;
            unlockedAchievements.push(ach.name);
            showAchievement(ach.name);
        }
    });
}

function showAchievement(name) {
    sounds.achievement();
    document.getElementById('achievementText').textContent = name;
    achievementPopup.classList.remove('hidden');
    setTimeout(() => achievementPopup.classList.add('hidden'), 3000);
}

// Powerup activation
function activatePowerup(type) {
    sounds.powerup();
    const duration = 5000;
    
    if (type === 'shield') {
        player.invincible = true;
        addPowerupIndicator('🛡️ Shield', duration);
        setTimeout(() => player.invincible = false, duration);
    } else if (type === 'magnet') {
        player.magnetActive = true;
        addPowerupIndicator('💥 Magnet', duration);
        setTimeout(() => player.magnetActive = false, duration);
    } else if (type === 'speed') {
        player.speed = player.baseSpeed * 2;
        addPowerupIndicator('⏩ Speed', duration);
        setTimeout(() => player.speed = player.baseSpeed, duration);
    } else if (type === 'triple') {
        triplePointsTime = duration;
        addPowerupIndicator('✴️ Triple Points', duration);
    } else if (type === 'slow') {
        slowMotionTime = duration;
        addPowerupIndicator('🐢 Slow Motion', duration);
    } else if (type === 'spread') {
        const prev = weaponLevel;
        weaponLevel = Math.max(weaponLevel, 3);
        addPowerupIndicator('🔱 Spread Shot', duration);
        setTimeout(()=> weaponLevel = prev, duration);
    } else if (type === 'laser') {
        const prevRate = bulletRate;
        bulletRate = 80; // rapid fire
        const prevLevel = weaponLevel;
        weaponLevel = Math.max(weaponLevel, 2);
        addPowerupIndicator('💫 Laser Burst', duration);
        setTimeout(()=> { bulletRate = prevRate; weaponLevel = prevLevel; }, duration);
    } else if (type === 'homing') {
        const prevLevel = weaponLevel;
        weaponLevel = Math.max(weaponLevel, 2);
        addPowerupIndicator('🎯 Homing Missiles', duration);
        // Mark bullets as homing for duration by tagging future attempts
        const originalAttemptShoot = attemptShoot;
        window._attemptShootWrapped = () => {
            if (!gameRunning || gamePaused) return;
            const now = performance.now();
            if (now - bulletCooldown < bulletRate) return;
            bulletCooldown = now;
            const cx = player.x + player.width/2;
            const cy = player.y;
            const shots = [];
            shots.push(new Bullet(cx, cy, 0, -9, 'homing'));
            if (weaponLevel >=2) shots.push(new Bullet(cx-10, cy, -1, -9, 'homing'));
            if (weaponLevel >=2) shots.push(new Bullet(cx+10, cy, 1, -9, 'homing'));
            shots.forEach(b => bullets.push(b));
            playSound(1200, 0.08, 'triangle');
        };
        attemptShoot = window._attemptShootWrapped;
        setTimeout(()=> { weaponLevel = prevLevel; attemptShoot = originalAttemptShoot; delete window._attemptShootWrapped; }, duration);
    }
}

function addPowerupIndicator(text, duration) {
    const indicator = document.createElement('div');
    indicator.className = 'powerup-indicator';
    indicator.innerHTML = `<span>${text}</span><span class="powerup-timer">${(duration/1000).toFixed(0)}s</span>`;
    activePowerupsDisplay.appendChild(indicator);
    
    const interval = setInterval(() => {
        const timeLeft = parseInt(indicator.querySelector('.powerup-timer').textContent);
        if (timeLeft > 1) {
            indicator.querySelector('.powerup-timer').textContent = `${timeLeft - 1}s`;
        }
    }, 1000);
    
    setTimeout(() => {
        clearInterval(interval);
        indicator.remove();
    }, duration);
}

// Spawn functions
function spawnStar() {
    const settings = difficultySettings[difficulty];
    if (Math.random() < settings.starSpawnRate) {
        const rand = Math.random();
        if (rand < 0.05) {
            stars.push(new Star('rainbow'));
        } else if (rand < 0.1) {
            stars.push(new Star('freeze'));
        } else {
            stars.push(new Star('normal'));
        }
    }
}

function spawnAsteroid() {
    const settings = difficultySettings[difficulty];
    if (Math.random() < settings.asteroidSpawnRate * (1 + score / 1000)) {
        asteroids.push(new Asteroid());
    }
}

function spawnPowerup() {
    if (Math.random() < 0.005) {
        powerups.push(new Powerup());
    }
}

// Special enemy spawns
function spawnSpecialEnemies(deltaTime){
    // UFO spawn chance increases with wave
    if (waveNumber >= 2 && Math.random() < 0.002 * waveNumber) {
        ufos.push(new UFO());
    }
    // Comet shower cooldown
    if (waveNumber >=3) {
        cometShowerCooldown -= deltaTime;
        if (cometShowerCooldown <=0 && Math.random()<0.01) {
            cometShowerCooldown = 15000; // 15s between showers
            for (let i=0;i<20;i++) comets.push(new CometPiece());
            screenShakeTime = 500;
        }
    }
    // Black hole spawn
    if (waveNumber >=4) {
        blackHoleCooldown -= deltaTime;
        if (blackHoleCooldown <=0 && Math.random()<0.005) {
            blackHoleCooldown = 30000;
            blackHoles.push(new BlackHole());
            screenShakeTime = 700;
        }
    }
}

// Update displays
let _prevScore = -1;
let _prevLives = -1;
let _prevDifficulty = '';
function updateDisplay(force=false) {
    if (force || score !== _prevScore) {
        scoreDisplay.textContent = score;
        _prevScore = score;
    }
    if (force || lives !== _prevLives) {
        if (force || _prevLives === -1) {
            livesDisplay.innerHTML = '';
            for (let i = 0; i < lives; i++) {
                const lifeBar = document.createElement('span');
                lifeBar.className = 'life-bar';
                livesDisplay.appendChild(lifeBar);
            }
        } else if (lives > _prevLives) {
            // append only new life bars
            for (let i = _prevLives; i < lives; i++) {
                const lifeBar = document.createElement('span');
                lifeBar.className = 'life-bar';
                livesDisplay.appendChild(lifeBar);
            }
        } else if (lives < _prevLives) {
            // remove excess life bars
            const removeCount = _prevLives - lives;
            for (let i = 0; i < removeCount; i++) livesDisplay.removeChild(livesDisplay.lastElementChild);
        }
        _prevLives = lives;
    }
    if (force || difficulty !== _prevDifficulty) {
        difficultyDisplay.textContent = difficulty.toUpperCase();
        _prevDifficulty = difficulty;
    }
}

// Keyboard controls
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (e.key.toLowerCase() === 'p' && gameRunning) {
        togglePause();
    }
    
    if (e.key.toLowerCase() === 'm') {
        toggleMute();
    }
    
    if (gameRunning && !gamePaused && player) {
        if (keys['arrowleft'] || keys['a']) player.dx = -player.speed;
        if (keys['arrowright'] || keys['d']) player.dx = player.speed;
        if (keys['arrowup'] || keys['w']) player.dy = -player.speed;
        if (keys['arrowdown'] || keys['s']) player.dy = player.speed;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    
    if (player) {
        if (!keys['arrowleft'] && !keys['a'] && !keys['arrowright'] && !keys['d']) {
            player.dx = 0;
        }
        if (!keys['arrowup'] && !keys['w'] && !keys['arrowdown'] && !keys['s']) {
            player.dy = 0;
        }
        
        if (keys['arrowleft'] || keys['a']) player.dx = -player.speed;
        if (keys['arrowright'] || keys['d']) player.dx = player.speed;
        if (keys['arrowup'] || keys['w']) player.dy = -player.speed;
        if (keys['arrowdown'] || keys['s']) player.dy = player.speed;
    }
});

// Pause/Resume
function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseScreen.classList.remove('hidden');
    } else {
        pauseScreen.classList.add('hidden');
    }
}

function toggleMute() {
    isMuted = !isMuted;
    muteButton.innerHTML = `<span class="btn-glow"></span>${isMuted ? mutedIconHTML : muteIconHTML}`;
}

// Settings toggles
const screenShakeCheckbox = document.getElementById('screenShake');
const particleEffectsCheckbox = document.getElementById('particleEffects');


// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    if (!gameRunning) return;
    if (gamePaused) {
        animationId = requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    const effectiveDelta = deltaTime * globalTimeScale;
    gameTime += effectiveDelta;
    waveElapsed += effectiveDelta;

    // Handle wave transitions
    if (waveTransitionTime > 0) {
        waveTransitionTime -= deltaTime;
        if (waveTransitionTime <= 0) waveTransitionEl.classList.add('hidden');
    }
    if (waveElapsed >= waveDuration && !bossActive) {
        waveNumber++;
        waveElapsed = 0;
        waveTransitionTime = 3000;
        waveNumberEl.textContent = 'WAVE ' + waveNumber;
        waveSubtitleEl.textContent = 'INCOMING';
        waveTransitionEl.classList.remove('hidden');
    }

    // Spawn boss conditions (disabled for certain modes)
    if (gameMode !== 'zen' && gameMode !== 'timeattack' && gameMode !== 'collection' && !bossActive && (score >= nextBossScore || gameTime >= nextBossTime)) {
        bossActive = true;
        boss = new BossAsteroid();
        bossHealthContainer.classList.remove('hidden');
        nextBossScore += 100;
        nextBossTime += 60000;
    }

    // Screen shake transform
    ctx.save();
    if (screenShakeTime > 0 && (!screenShakeCheckbox || screenShakeCheckbox.checked)) {
        screenShakeTime -= effectiveDelta;
        const shakeMag = Math.min(10, 3 + screenShakeTime/200);
        ctx.translate((Math.random()-0.5)*shakeMag, (Math.random()-0.5)*shakeMag);
    }
    // Clear with fade effect
    ctx.fillStyle = 'rgba(10, 10, 30, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background (tiled offscreen or legacy per-star)
    if (useTiledBackground && starLayers.length) {
        drawTiledBackground(effectiveDelta);
    } else {
        backgroundStars.forEach(star => { star.update(); star.draw(); });
    }
    // Warp lines
    warpLines.forEach(w => { w.update(); w.draw(); });
    // Nebula offset smoothing (placeholder for future background layer manipulation)
    if (player) {
        nebulaOffsetX += (player.dx * 0.002 - nebulaOffsetX) * 0.05;
        nebulaOffsetY += (player.dy * 0.002 - nebulaOffsetY) * 0.05;
    }

    // Adjust spawn scaling by wave & mode
    spawnStar();
    if (gameMode !== 'zen') {
        for (let i = 0; i < Math.min(1 + Math.floor(waveNumber/2), 4); i++) spawnAsteroid();
        if (gameMode !== 'collection') spawnSpecialEnemies(effectiveDelta);
    }
    spawnPowerup();

    // Update frozen time
    if (frozenTime > 0) frozenTime -= effectiveDelta;
    if (slowMotionTime > 0) slowMotionTime -= deltaTime;
    if (triplePointsTime > 0) triplePointsTime -= deltaTime;
    globalTimeScale = 1 * (frozenTime > 0 ? 0.2 : 1) * (slowMotionTime > 0 ? 0.6 : 1);

    // Update and draw players (coop aware)
    if (players.length) {
        players.forEach(p => { p.update(); p.draw(); });
    } else {
        player.update();
        player.draw();
    }

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(effectiveDelta);
        bullets[i].draw();
        if (bullets[i].life <= 0 || bullets[i].y < -20 || bullets[i].y > canvas.height+20) {
            bullets.splice(i,1);
            continue;
        }
    }

    // Stars
    for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].update();
        stars[i].draw();

        // Magnet effect
        if (player.magnetActive && stars[i].y > 0) {
            const dx = (player.x + player.width / 2) - (stars[i].x + stars[i].size / 2);
            const dy = (player.y + player.height / 2) - (stars[i].y + stars[i].size / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                stars[i].x += dx * 0.05;
                stars[i].y += dy * 0.05;
            }
        }

        const starCollector = players.length ? players.find(pl => stars[i].collidesWith(pl)) : (stars[i].collidesWith(player) ? player : null);
        if (starCollector) {
            let points = 10;
            if (stars[i].type === 'rainbow') {
                points = 50;
                sounds.rainbow();
                achievements.find(a => a.id === 'rainbow').unlocked = true;
                unlockedAchievements.push('Rainbow Hunter');
                showAchievement('Rainbow Hunter');
                updateDailyChallenge('rainbow');
            } else if (stars[i].type === 'freeze') {
                frozenTime = 3000;
                sounds.powerup();
                createParticles(stars[i].x + stars[i].size / 2, stars[i].y + stars[i].size / 2, '#00ffff', 20);
            } else {
                sounds.collect();
            }
            
            score += points * (combo >= 2 ? combo : 1);
            collectedStarsThisRun++;
            updateCombo();
            updateDisplay();
            createParticles(stars[i].x + stars[i].size / 2, stars[i].y + stars[i].size / 2, '#ffd700', 15);
            stars.splice(i, 1);
            checkAchievements();
            updateDailyChallenge('star');
            if (gameMode === 'collection' && collectionTarget > 0 && collectedStarsThisRun >= collectionTarget) {
                showAchievement('Collection Complete');
                endGame();
                return;
            }
            continue;
        }

        if (stars[i].y > canvas.height) {
            stars.splice(i, 1);
        }
    }

    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].update();
        asteroids[i].draw();

        // Bullet collisions
        for (let j = bullets.length -1; j >=0; j--) {
            if (bullets[j].collidesWith(asteroids[i])) {
                createParticles(asteroids[i].x + asteroids[i].size/2, asteroids[i].y + asteroids[i].size/2, '#ff6b6b', 12);
                const chainPointsBase = 15;
                let pointsEarned = chainPointsBase;
                if (triplePointsTime > 0) pointsEarned *= 3;
                if (combo >= 2) pointsEarned *= combo;
                score += pointsEarned;
                showScorePopup(asteroids[i].x + asteroids[i].size/2, asteroids[i].y + asteroids[i].size/2, pointsEarned);
                updateCombo();
                // Chain reaction radius
                const radius = 60;
                let chainCount = 0;
                for (let k = asteroids.length -1; k >=0; k--) {
                    if (k === i) continue;
                    const ax = asteroids[k].x + asteroids[k].size/2;
                    const ay = asteroids[k].y + asteroids[k].size/2;
                    const dx = ax - (asteroids[i].x + asteroids[i].size/2);
                    const dy = ay - (asteroids[i].y + asteroids[i].size/2);
                    if (dx*dx + dy*dy < radius*radius) {
                        createParticles(ax, ay, '#ff6b6b', 8);
                        score += 10;
                        chainCount++;
                        asteroids.splice(k,1);
                    }
                }
                if (chainCount) {
                    showScorePopup(asteroids[i].x + asteroids[i].size/2, asteroids[i].y + asteroids[i].size/2 - 25, chainCount*10, 'CHAIN +' + (chainCount*10));
                    screenShakeTime = 400;
                }
                asteroids.splice(i,1);
                bullets.splice(j,1);
                updateDisplay();
                break;
            }
        }

        const asteroidVictim = players.length ? players.find(pl => asteroids[i] && asteroids[i].collidesWith(pl) && !pl.invincible) : (!player.invincible && asteroids[i].collidesWith(player) ? player : null);
        if (asteroidVictim) {
            lives--;
            sounds.hit();
            updateDisplay();
            createParticles(asteroids[i].x + asteroids[i].size / 2, asteroids[i].y + asteroids[i].size / 2, '#ff6b6b', 20);
            screenShakeTime = 600;
            asteroids.splice(i, 1);

            if (lives <= 0) {
                endGame();
                return;
            }
            continue;
        }

        if (asteroids[i].y > canvas.height) {
            asteroids.splice(i, 1);
        }
    }

    // UFOs
    for (let i = ufos.length -1; i >=0; i--) {
        ufos[i].update(effectiveDelta);
        ufos[i].draw();
        // Bullet hits
        for (let j = bullets.length -1; j >=0; j--) {
            if (bullets[j].x > ufos[i].x - ufos[i].width/2 && bullets[j].x < ufos[i].x + ufos[i].width/2 && bullets[j].y > ufos[i].y - ufos[i].height/2 && bullets[j].y < ufos[i].y + ufos[i].height/2) {
                ufos[i].health -= 20 + weaponLevel*5;
                ufos[i].flashTime = 150;
                createParticles(bullets[j].x, bullets[j].y, '#9d4edd', 10);
                bullets.splice(j,1);
                if (ufos[i].health <=0) {
                    const pointsEarned = 120 + waveNumber*20;
                    score += pointsEarned;
                    showScorePopup(ufos[i].x, ufos[i].y, pointsEarned, 'UFO DOWN');
                    updateDisplay();
                    ufos.splice(i,1);
                }
                break;
            }
        }
        // Player collision
        const ufoVictim = players.length ? players.find(pl => ufos[i] && ufos[i].collidesWith(pl) && !pl.invincible) : (ufos[i].collidesWith(player) && !player.invincible ? player : null);
        if (ufoVictim) {
            if (!player.invincible) {
                lives--; sounds.hit(); screenShakeTime = 500; updateDisplay();
                if (lives<=0){ endGame(); return; }
            }
            ufos.splice(i,1);
        }
    }

    // Comets
    for (let i = comets.length -1; i >=0; i--) {
        comets[i].update(effectiveDelta);
        comets[i].draw();
        // Bullet
        for (let j = bullets.length -1; j >=0; j--) {
            if (comets[i].collidesWith({x: bullets[j].x - bullets[j].size, y: bullets[j].y - bullets[j].size, width: bullets[j].size*2, height: bullets[j].size*2})) {
                score += 8;
                bullets.splice(j,1); comets.splice(i,1);
                updateDisplay();
                break;
            }
        }
        // Player collision
        const cometVictim = players.length ? players.find(pl => comets[i] && comets[i].collidesWith(pl) && !pl.invincible) : (comets[i].collidesWith(player) && !player.invincible ? player : null);
        if (cometVictim) {
            if (!player.invincible){ lives--; sounds.hit(); screenShakeTime=400; updateDisplay(); if (lives<=0){ endGame(); return; } }
            comets.splice(i,1);
        }
        if (comets[i] && comets[i].y > canvas.height+30) comets.splice(i,1);
    }

    // Black holes
    for (let i = blackHoles.length -1; i >=0; i--) {
        blackHoles[i].update(effectiveDelta);
        blackHoles[i].draw();
        const bhVictim = players.length ? players.find(pl => blackHoles[i].collidesWith(pl) && !pl.invincible) : (blackHoles[i].collidesWith(player) && !player.invincible ? player : null);
        if (bhVictim) {
            if (!player.invincible){ lives--; sounds.hit(); screenShakeTime=800; updateDisplay(); if (lives<=0){ endGame(); return; } }
        }
        if (blackHoles[i].life <=0) blackHoles.splice(i,1);
    }

    // Boss logic
    if (bossActive && boss) {
        boss.update(effectiveDelta);
        boss.draw();
        // Bullet hits
        for (let i = bullets.length -1; i >=0; i--) {
            if (bullets[i].collidesWith({x: boss.x, y: boss.y, size: boss.size})) {
                boss.health -= 10 + weaponLevel * 2;
                createParticles(bullets[i].x, bullets[i].y, '#ffd700', 6);
                bullets.splice(i,1);
                screenShakeTime = 300;
            }
        }
        // Player collision
        const bossVictim = players.length ? players.find(pl => boss.collidesWith(pl) && !pl.invincible) : (!player.invincible && boss.collidesWith(player) ? player : null);
        if (bossVictim) {
            lives--;
            sounds.hit();
            updateDisplay();
            screenShakeTime = 800;
            if (lives <=0) { endGame(); return; }
        }
        // Health bar update
        const hpPct = Math.max(0, boss.health) / boss.maxHealth * 100;
        bossHealthFill.style.width = hpPct + '%';
        bossHealthText.textContent = Math.ceil(hpPct) + '%';
        if (boss.health <=0) {
            // Boss defeated
            score += 200 * waveNumber;
            showScorePopup(boss.x + boss.size/2, boss.y + boss.size/2, 200*waveNumber, 'BOSS DEFEATED');
            updateDisplay();
            bossActive = false;
            bossHealthContainer.classList.add('hidden');
            createParticles(boss.x + boss.size/2, boss.y + boss.size/2, '#ffd700', 120);
            screenShakeTime = 1200;
            // Reward: temporary triple points + speed
            triplePointsTime = 8000;
            player.speed = player.baseSpeed * 2;
            setTimeout(()=> player.speed = player.baseSpeed, 8000);
            addPowerupIndicator('🏆 Boss Bonus', 8000);
            bossKills++;
            updateDailyChallenge('bossKill');
        }
    }

    // Powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].update();
        powerups[i].draw();

        const powerCollector = players.length ? players.find(pl => powerups[i].collidesWith(pl)) : (powerups[i].collidesWith(player) ? player : null);
        if (powerCollector) {
            activatePowerup(powerups[i].type);
            createParticles(powerups[i].x + powerups[i].size / 2, powerups[i].y + powerups[i].size / 2, '#8b5cf6', 15);
            powerups.splice(i, 1);
            continue;
        }

        if (powerups[i].y > canvas.height) {
            powerups.splice(i, 1);
        }
    }

    // Particles
    if (!particleEffectsCheckbox || particleEffectsCheckbox.checked) {
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].life <= 0) { particles[i].active = false; particles.splice(i, 1); }
        }
    } else {
        particles.length = 0; // clear when disabled
    }

    // Daily challenge tick update
    updateDailyChallenge('tick');

    checkAchievements();
    // Time Attack termination
    if (gameMode === 'timeattack' && gameTime >= 60000) { endGame(); return; }
    // Replay recording (every ~120ms)
    if (!isReplaying && (replayData.length === 0 || timestamp - replayData[replayData.length-1].t >= 120)) {
        replayData.push({ t: timestamp, players: (players.length? players : [player]).map(p=>({x:p.x,y:p.y})) , score });
    }
    ctx.restore(); // screen shake end
    animationId = requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    score = 0;
    lives = difficultySettings[difficulty].lives;
    stars = [];
    asteroids = [];
    particles = [];
    powerups = [];
    activePowerups = [];
    combo = 0;
    maxCombo = 0;
    gameTime = 0;
    frozenTime = 0;
    unlockedAchievements = [];
    player = new Player();
    players = [player];
    if (gameMode === 'coop') {
        const p2 = new Player();
        p2.x = canvas.width/2 + 60;
        p2.y = player.y;
        players.push(p2);
    }
    gameRunning = true;
    gamePaused = false;
    waveNumber = 1;
    waveElapsed = 0;
    bossActive = false;
    boss = null;
    nextBossScore = 100;
    nextBossTime = 60000;
    waveTransitionEl.classList.add('hidden');
    bossHealthContainer.classList.add('hidden');
    bullets = [];
    bossKills = 0;
    collectedStarsThisRun = 0;
    if (gameMode === 'onelife') lives = 1;
    if (gameMode === 'collection') {
        collectionTarget = difficulty === 'hard' ? 120 : difficulty === 'medium' ? 90 : 70;
    } else collectionTarget = 0;
    updatePlayStreak();
    applyUpgrades();
    applySelectedShip(player);
    bossKills = 0;
    
    initBackgroundStars();
    nebulaOffsetX = 0; nebulaOffsetY = 0;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');
    
    updateDisplay();
    updateModeBadge();
    lastTime = performance.now();
    gameLoop(lastTime);
}

// End game
function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    finalScoreDisplay.textContent = score;
    finalComboDisplay.textContent = maxCombo;
    if (finalWaveDisplay) finalWaveDisplay.textContent = waveNumber;
    
    const isNewHighScore = saveHighScore();
    if (isNewHighScore) {
        newHighScoreDisplay.classList.remove('hidden');
    } else {
        newHighScoreDisplay.classList.add('hidden');
    }
    
    saveToLeaderboard();
    evaluateShipUnlocks();
    const creditGain = Math.floor(score/10) + bossKills*50 + Math.floor(playStreak.days*5);
    cosmicCredits += creditGain;
    saveProgress();
    if (creditsEarnedDisplay) creditsEarnedDisplay.textContent = '+'+creditGain+'💎';
    // Collection mode success indicator
    if (gameMode === 'collection' && collectionTarget>0) {
        const collectionInfo = document.createElement('div');
        collectionInfo.style.marginTop = '12px';
        collectionInfo.style.fontFamily = 'var(--font-secondary)';
        collectionInfo.style.fontSize = '14px';
        collectionInfo.textContent = `Collected ${collectedStarsThisRun}/${collectionTarget} target stars`;
        achievementsDisplay.parentElement?.appendChild(collectionInfo);
    }
    
    if (unlockedAchievements.length > 0) {
        achievementsDisplay.innerHTML = unlockedAchievements.map(name => 
            `<div class="achievement-item">🏆 ${name}</div>`
        ).join('');
    } else {
        achievementsDisplay.innerHTML = '';
    }
    
    gameOverScreen.classList.remove('hidden');
}

// UI Events
startButton.addEventListener('click', () => {
    playerName = playerNameInput.value.trim() || 'Pilot';
    startGame();
});

restartButton.addEventListener('click', startGame);

menuButton.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

quitButton.addEventListener('click', () => {
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    pauseScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

resumeButton.addEventListener('click', togglePause);
pauseButton.addEventListener('click', togglePause);
muteButton.addEventListener('click', toggleMute);

// Share modal logic
function openShareModal(){
    if (!shareScreen) return;
    shareScoreText.textContent = 'Score: ' + score;
    if (shareWave) shareWave.textContent = waveNumber;
    if (shareMode) shareMode.textContent = gameMode.charAt(0).toUpperCase()+gameMode.slice(1);
    shareScreen.classList.remove('hidden');
    // Attempt navigator.share
    const shareText = `I scored ${score} in COSMIC COLLECTOR (${gameMode.toUpperCase()} wave ${waveNumber})!`;
    if (navigator.share) {
        // Provide a quick button inside modal if desired later
        window._nativeShare = () => navigator.share({ title:'Cosmic Collector', text:shareText, url:location.href }).catch(()=>{});
    }
}

if (shareButton) shareButton.addEventListener('click', openShareModal);
if (closeShareBtn) closeShareBtn.addEventListener('click', ()=> shareScreen.classList.add('hidden'));
if (copyScoreBtn) copyScoreBtn.addEventListener('click', () => {
    const txt = `Score: ${score} | Mode: ${gameMode} | Wave: ${waveNumber}`;
    navigator.clipboard?.writeText(txt).then(()=> {
        copyScoreBtn.textContent = 'Copied!';
        setTimeout(()=> copyScoreBtn.textContent='📋 Copy',1500);
    });
});

// Social share buttons if present
document.querySelectorAll('.share-btn.twitter').forEach(btn => {
    btn.addEventListener('click', () => {
        const text = encodeURIComponent(`I scored ${score} in Cosmic Collector (${gameMode} wave ${waveNumber})!`);
        const url = encodeURIComponent(location.href);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`,'_blank');
    });
});
document.querySelectorAll('.share-btn.facebook').forEach(btn => {
    btn.addEventListener('click', () => {
        const url = encodeURIComponent(location.href);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`,'_blank');
    });
});

// Shooting handlers
function attemptShoot() {
    if (!gameRunning || gamePaused) return;
    const now = performance.now();
    if (now - bulletCooldown < bulletRate) return;
    bulletCooldown = now;
    const cx = player.x + player.width/2;
    const cy = player.y;
    // Basic weapon levels / spread
    const shots = [];
    if (weaponLevel === 1) shots.push(new Bullet(cx, cy));
    else if (weaponLevel === 2) {
        shots.push(new Bullet(cx-8, cy));
        shots.push(new Bullet(cx+8, cy));
    } else if (weaponLevel >=3) {
        shots.push(new Bullet(cx, cy));
        shots.push(new Bullet(cx-10, cy, -1, -10));
        shots.push(new Bullet(cx+10, cy, 1, -10));
    }
    shots.forEach(b => bullets.push(b));
    playSound(1000, 0.08, 'square');
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        attemptShoot();
    }
});

const mobileShootBtn = document.getElementById('mobileShootBtn');
if (mobileShootBtn) mobileShootBtn.addEventListener('click', attemptShoot);

// Score popup
function showScorePopup(x, y, value, label) {
    if (!scorePopupsContainer) return;
    const el = document.createElement('div');
    el.className = 'score-popup';
    el.style.left = (x - 20) + 'px';
    el.style.top = (y - 20) + 'px';
    el.textContent = label ? `${label} (+${value})` : `+${value}`;
    scorePopupsContainer.appendChild(el);
    setTimeout(()=> { el.style.transform = 'translateY(-40px)'; el.style.opacity = '0'; }, 50);
    setTimeout(()=> el.remove(), 1200);
}

// Basic progression placeholder (unlock ships by score milestones)
function checkShipUnlocks() {
    // Example: if score reaches thresholds, mark achievement (future UI integration)
    // Implementation stub
}

showLeaderboardBtn.addEventListener('click', () => {
    displayLeaderboard(activeLeaderboardMode);
    startScreen.classList.add('hidden');
    leaderboardScreen.classList.remove('hidden');
});

backToMenuBtn.addEventListener('click', () => {
    leaderboardScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

clearLeaderboardBtn.addEventListener('click', () => {
    if (confirm('Clear records for current mode?')) {
        localStorage.removeItem('cosmicLeaderboard_' + activeLeaderboardMode);
        displayLeaderboard(activeLeaderboardMode);
    }
});

// Difficulty selection
document.querySelectorAll('.diff-card').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = btn.dataset.difficulty;
    });
});

// Game mode menu open
if (gameModeButton && modeScreen) {
    gameModeButton.addEventListener('click', () => {
        modeScreen.classList.remove('hidden');
    });
}
if (backFromModeBtn && modeScreen) {
    backFromModeBtn.addEventListener('click', () => {
        modeScreen.classList.add('hidden');
    });
}

// Game mode selection cards
document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        gameMode = card.dataset.mode || 'classic';
        updateModeBadge();
        // Close mode screen after selection (optional UX)
        if (modeScreen) modeScreen.classList.add('hidden');
    });
});

// Theme chip listeners
document.querySelectorAll('.theme-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.theme-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyTheme(chip.dataset.theme);
    });
});

// Leaderboard mode tabs
document.querySelectorAll('.lb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeLeaderboardMode = tab.dataset.mode || 'classic';
        displayLeaderboard(activeLeaderboardMode);
    });
});

// Ship color selection
document.querySelectorAll('.color-chip').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.color-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        shipColor = btn.dataset.color;
    });
});

// Mobile detection
if ('ontouchstart' in window) {
    mobileControls.classList.remove('hidden');
    
    // Simple touch controls
    let touchStartX = 0, touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!player || gamePaused) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        const dx = touchX - touchStartX;
        const dy = touchY - touchStartY;
        
        player.dx = dx * 0.1;
        player.dy = dy * 0.1;
        
        touchStartX = touchX;
        touchStartY = touchY;
    });
    
    canvas.addEventListener('touchend', () => {
        if (player) {
            player.dx = 0;
            player.dy = 0;
        }
    });
}

// Initialize
loadHighScore();
initTheme();
