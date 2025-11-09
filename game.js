// ========================================
// 3D FPS GAME - СУПЕР ВЕРСИЯ
// ========================================

// Игровые переменные
let scene, camera, renderer;
let player = {
    height: 10,
    speed: 0.2,
    sprintSpeed: 0.4,
    turnSpeed: 0.002,
    position: new THREE.Vector3(0, 10, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: { x: 0, y: 0 },
    health: 100,
    maxHealth: 100,
    isGrounded: false,
    jumpSpeed: 0.6,
    gravity: -0.025,
    grenades: 3,
    maxGrenades: 10,
    abilities: {
        shield: { active: false, duration: 5, cooldown: 20, lastUsed: 0 },
        rage: { active: false, duration: 10, cooldown: 30, lastUsed: 0 }
    }
};

// Система звуков
const sounds = {
    shoot: null,
    reload: null,
    explosion: null,
    step: null,
    music: null,
    hit: null,
    pickup: null,
    enabled: true
};

// Система оружия
let currentWeapon = 'pistol';
let weaponModels = {};
let hands = null;
let grenades = [];
let particles = [];

const weapons = {
    pistol: {
        name: 'Пистолет',
        damage: 35,
        ammo: 12,
        maxAmmo: 12,
        fireRate: 0.3,
        reloadTime: 1.5,
        spread: 0.02,
        level: 1,
        maxLevel: 5
    },
    rifle: {
        name: 'Автомат',
        damage: 25,
        ammo: 30,
        maxAmmo: 30,
        fireRate: 0.1,
        reloadTime: 2.5,
        spread: 0.015,
        level: 1,
        maxLevel: 5
    },
    shotgun: {
        name: 'Дробовик',
        damage: 15,
        ammo: 6,
        maxAmmo: 6,
        fireRate: 0.8,
        reloadTime: 3.0,
        spread: 0.1,
        pellets: 8,
        level: 1,
        maxLevel: 5
    },
    sniper: {
        name: 'Снайперка',
        damage: 150,
        ammo: 5,
        maxAmmo: 5,
        fireRate: 1.5,
        reloadTime: 3.5,
        spread: 0.001,
        level: 1,
        maxLevel: 5
    },
    grenadeLauncher: {
        name: 'Гранатомет',
        damage: 80,
        ammo: 3,
        maxAmmo: 3,
        fireRate: 1.2,
        reloadTime: 4.0,
        spread: 0.05,
        explosive: true,
        level: 1,
        maxLevel: 5
    },
    laser: {
        name: 'Лазер',
        damage: 20,
        ammo: 100,
        maxAmmo: 100,
        fireRate: 0.05,
        reloadTime: 2.0,
        spread: 0.0,
        level: 1,
        maxLevel: 5
    }
};

let keys = {};
let enemies = [];
let bullets = [];
let walls = [];
let healthPacks = [];
let floor, ceiling;
let minimap, minimapCamera, minimapRenderer;

// Настройки графики
let graphicsSettings = {
    quality: 'high', // low, medium, high
    shadows: true,
    fog: true,
    particles: true
};

// Система карт
const maps = {
    default: {
        name: 'Поле боя',
        skyColor: 0x87CEEB,
        floorColor: 0x3a5a1a,
        fogDensity: 0.002,
        lighting: { ambient: 0.5, directional: 0.8 }
    },
    desert: {
        name: 'Пустыня',
        skyColor: 0xFFD700,
        floorColor: 0xC2B280,
        fogDensity: 0.003,
        lighting: { ambient: 0.7, directional: 1.0 }
    },
    city: {
        name: 'Город',
        skyColor: 0x708090,
        floorColor: 0x555555,
        fogDensity: 0.004,
        lighting: { ambient: 0.4, directional: 0.6 }
    },
    space: {
        name: 'Космос',
        skyColor: 0x000033,
        floorColor: 0x333366,
        fogDensity: 0.001,
        lighting: { ambient: 0.3, directional: 0.5 }
    }
};

let currentMap = 'default';

// Система достижений
let achievements = {
    firstKill: { unlocked: false, name: 'Первая кровь', desc: 'Убейте первого врага' },
    killer10: { unlocked: false, name: 'Убийца', desc: 'Убейте 10 врагов' },
    killer50: { unlocked: false, name: 'Истребитель', desc: 'Убейте 50 врагов' },
    killer100: { unlocked: false, name: 'Терминатор', desc: 'Убейте 100 врагов' },
    survivor5: { unlocked: false, name: 'Выживший', desc: 'Пройдите 5 раундов' },
    survivor10: { unlocked: false, name: 'Ветеран', desc: 'Пройдите 10 раундов' },
    headshot: { unlocked: false, name: 'Снайпер', desc: 'Убейте врага из снайперки' },
    explosion: { unlocked: false, name: 'Подрывник', desc: 'Убейте 5 врагов гранатами' },
    boss: { unlocked: false, name: 'Убийца боссов', desc: 'Убейте босса' },
    perfectRound: { unlocked: false, name: 'Идеально', desc: 'Пройдите раунд без урона' }
};

// Уровни сложности
const difficulties = {
    easy: {
        name: 'Легко',
        enemyHealthMultiplier: 0.7,
        enemySpeedMultiplier: 0.8,
        enemyDamageMultiplier: 0.5,
        enemyCountMultiplier: 0.8,
        playerHealthMultiplier: 1.5
    },
    normal: {
        name: 'Нормально',
        enemyHealthMultiplier: 1.0,
        enemySpeedMultiplier: 1.0,
        enemyDamageMultiplier: 1.0,
        enemyCountMultiplier: 1.0,
        playerHealthMultiplier: 1.0
    },
    hard: {
        name: 'Сложно',
        enemyHealthMultiplier: 1.5,
        enemySpeedMultiplier: 1.3,
        enemyDamageMultiplier: 1.5,
        enemyCountMultiplier: 1.3,
        playerHealthMultiplier: 0.7
    },
    hardcore: {
        name: 'Хардкор',
        enemyHealthMultiplier: 2.0,
        enemySpeedMultiplier: 1.5,
        enemyDamageMultiplier: 2.0,
        enemyCountMultiplier: 1.5,
        playerHealthMultiplier: 0.5
    }
};

let currentDifficulty = 'normal';

let gameState = {
    score: 0,
    round: 1,
    enemiesInRound: 5,
    enemiesKilled: 0,
    totalKills: 0,
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
    isReloading: false,
    reloadStartTime: 0,
    isTransitioningRound: false,
    gameMode: 'waves', // 'waves' or 'survival'
    survivalTime: 0,
    survivalStartTime: 0,
    damageTakenThisRound: 0,
    explosiveKills: 0
};

const clock = new THREE.Clock();
let lastShootTime = 0;
let lastStepTime = 0;
const GROUND_LEVEL = 0;

// ========================================
// ИНИЦИАЛИЗАЦИЯ
// ========================================

function initSounds() {
    try {
        // Создание простых звуков с помощью Web Audio API
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Функция для создания звука выстрела
        sounds.shoot = () => {
            if (!sounds.enabled) return;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        };
        
        // Звук взрыва
        sounds.explosion = () => {
            if (!sounds.enabled) return;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 50;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        };
        
        // Звук попадания
        sounds.hit = () => {
            if (!sounds.enabled) return;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 400;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
        };
        
        // Звук подбора
        sounds.pickup = () => {
            if (!sounds.enabled) return;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        };
        
        // Звук шагов
        sounds.step = () => {
            if (!sounds.enabled) return;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 100;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
        };
        
        // Звук перезарядки
        sounds.reload = () => {
            if (!sounds.enabled) return;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 300;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        };
        
        console.log('🔊 Звуковая система инициализирована');
    } catch (e) {
        console.warn('⚠️ Не удалось инициализировать звуки:', e);
    }
}

function init() {
    scene = new THREE.Scene();
    
    // Инициализация звуков
    initSounds();
    
    // Загрузка сохраненных настроек
    loadSettings();
    loadAchievements();
    
    // Создание Skybox
    createSkybox();
    applyMapSettings();

    // Камера
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.copy(player.position);

    // Рендерер
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: graphicsSettings.quality !== 'low'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = graphicsSettings.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Освещение
    setupLighting();

    // Создание мира
    createWorld();
    
    // Создание оружия и рук
    createWeaponModels();
    createHands();
    
    // Установка начального оружия
    switchWeapon('pistol');

    // Создание врагов
    startRound();
    
    // Создание миникарты
    createMinimap();

    // Обработчики событий
    setupEventListeners();

    // Запуск игрового цикла
    animate();
}

// ========================================
// СИСТЕМА СОХРАНЕНИЯ И ЗАГРУЗКИ
// ========================================

function loadSettings() {
    try {
        const saved = localStorage.getItem('fps_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            graphicsSettings = {...graphicsSettings, ...settings.graphics};
            currentDifficulty = settings.difficulty || 'normal';
            currentMap = settings.map || 'default';
            sounds.enabled = settings.soundEnabled !== false;
        }
    } catch (e) {
        console.warn('Не удалось загрузить настройки:', e);
    }
}

function saveSettings() {
    try {
        const settings = {
            graphics: graphicsSettings,
            difficulty: currentDifficulty,
            map: currentMap,
            soundEnabled: sounds.enabled
        };
        localStorage.setItem('fps_settings', JSON.stringify(settings));
    } catch (e) {
        console.warn('Не удалось сохранить настройки:', e);
    }
}

function loadAchievements() {
    try {
        const saved = localStorage.getItem('fps_achievements');
        if (saved) {
            const savedAchievements = JSON.parse(saved);
            Object.keys(savedAchievements).forEach(key => {
                if (achievements[key]) {
                    achievements[key].unlocked = savedAchievements[key].unlocked;
                }
            });
        }
    } catch (e) {
        console.warn('Не удалось загрузить достижения:', e);
    }
}

function saveAchievements() {
    try {
        localStorage.setItem('fps_achievements', JSON.stringify(achievements));
    } catch (e) {
        console.warn('Не удалось сохранить достижения:', e);
    }
}

function unlockAchievement(key) {
    if (achievements[key] && !achievements[key].unlocked) {
        achievements[key].unlocked = true;
        showAchievementNotification(achievements[key]);
        saveAchievements();
    }
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: rgba(255, 215, 0, 0.95);
        color: black;
        padding: 20px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.5s;
        border: 3px solid gold;
    `;
    notification.innerHTML = `
        <div style="font-size: 18px;">🏆 ДОСТИЖЕНИЕ!</div>
        <div style="font-size: 16px; margin-top: 5px;">${achievement.name}</div>
        <div style="font-size: 12px; margin-top: 3px; opacity: 0.8;">${achievement.desc}</div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s';
        setTimeout(() => document.body.removeChild(notification), 500);
    }, 3000);
}

function checkAchievements() {
    if (gameState.totalKills === 1) unlockAchievement('firstKill');
    if (gameState.totalKills === 10) unlockAchievement('killer10');
    if (gameState.totalKills === 50) unlockAchievement('killer50');
    if (gameState.totalKills === 100) unlockAchievement('killer100');
    if (gameState.round === 5) unlockAchievement('survivor5');
    if (gameState.round === 10) unlockAchievement('survivor10');
    if (gameState.explosiveKills >= 5) unlockAchievement('explosion');
    if (gameState.damageTakenThisRound === 0 && gameState.enemiesKilled > 0) {
        unlockAchievement('perfectRound');
    }
}

// Таблица рекордов
function saveHighScore() {
    try {
        const scores = getHighScores();
        scores.push({
            score: gameState.score,
            round: gameState.round,
            kills: gameState.totalKills,
            difficulty: currentDifficulty,
            date: new Date().toLocaleDateString()
        });
        scores.sort((a, b) => b.score - a.score);
        const top10 = scores.slice(0, 10);
        localStorage.setItem('fps_highscores', JSON.stringify(top10));
    } catch (e) {
        console.warn('Не удалось сохранить рекорд:', e);
    }
}

function getHighScores() {
    try {
        const saved = localStorage.getItem('fps_highscores');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function applyMapSettings() {
    const map = maps[currentMap];
    scene.background = new THREE.Color(map.skyColor);
    if (graphicsSettings.fog) {
        scene.fog = new THREE.FogExp2(map.skyColor, map.fogDensity);
    } else {
        scene.fog = null;
    }
}

function createMinimap() {
    // Создание миникамеры (вид сверху)
    minimapCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0, 500);
    minimapCamera.position.set(0, 200, 0);
    minimapCamera.lookAt(0, 0, 0);
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8dc, 0.8);
    dirLight.position.set(100, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -200;
    dirLight.shadow.camera.right = 200;
    dirLight.shadow.camera.top = 200;
    dirLight.shadow.camera.bottom = -200;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x2d5016, 0.4);
    scene.add(hemiLight);
}

function createSkybox() {
    const skyGeometry = new THREE.BoxGeometry(800, 800, 800);
    const skyMaterials = [
        new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ color: 0xB0E0E6, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ color: 0x6B8E23, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide })
    ];
    const skybox = new THREE.Mesh(skyGeometry, skyMaterials);
    scene.add(skybox);
}

// ========================================
// СОЗДАНИЕ МИРА (УВЕЛИЧЕННАЯ КАРТА)
// ========================================

function createWorld() {
    // Улучшенный пол (400x400 вместо 200x200)
    const floorGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a5a1a,
        roughness: 0.9,
        metalness: 0.1
    });
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = GROUND_LEVEL;
    floor.receiveShadow = true;
    
    // Рельеф пола
    const positions = floor.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getY(i);
        const y = Math.sin(x * 0.1) * 0.3 + Math.cos(z * 0.1) * 0.3;
        positions.setZ(i, y);
    }
    floor.geometry.computeVertexNormals();
    scene.add(floor);

    // Потолок
    const ceilingGeometry = new THREE.PlaneGeometry(400, 400);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.9,
        side: THREE.DoubleSide
    });
    ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 50;
    scene.add(ceiling);

    // Стены границы (400x400)
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x654321,
        roughness: 0.8,
        metalness: 0.1
    });

    walls.push(createWall(0, 15, -200, 400, 30, 4, wallMaterial));
    walls.push(createWall(0, 15, 200, 400, 30, 4, wallMaterial));
    walls.push(createWall(-200, 15, 0, 4, 30, 400, wallMaterial));
    walls.push(createWall(200, 15, 0, 4, 30, 400, wallMaterial));

    // Создание разнообразных препятствий
    createObstacles();
    
    // Создание аптечек
    createHealthPacks();
}

function createObstacles() {
    const obstacleTypes = [
        { color: 0x8B4513, count: 15 }, // Коричневые
        { color: 0x696969, count: 10 }, // Серые
        { color: 0x556B2F, count: 8 },  // Темно-зеленые
        { color: 0x8B7355, count: 12 }  // Бежевые
    ];

    obstacleTypes.forEach(type => {
        for (let i = 0; i < type.count; i++) {
            let x, z, validPosition;
            do {
                x = Math.random() * 360 - 180;
                z = Math.random() * 360 - 180;
                const distance = Math.sqrt(x * x + z * z);
                validPosition = distance > 30;
            } while (!validPosition);

            const width = Math.random() * 12 + 6;
            const height = Math.random() * 20 + 8;
            const depth = Math.random() * 12 + 6;
            
            const material = new THREE.MeshStandardMaterial({
                color: type.color,
                roughness: 0.7 + Math.random() * 0.2,
                metalness: 0.1 + Math.random() * 0.2
            });
            
            walls.push(createWall(x, height / 2, z, width, height, depth, material));
        }
    });

    // Добавляем высокие башни
    for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 320;
        const z = (Math.random() - 0.5) * 320;
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.6,
            metalness: 0.3
        });
        walls.push(createWall(x, 25, z, 15, 50, 15, material));
    }
}

function createWall(x, y, z, width, height, depth, material) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    return wall;
}

function createHealthPacks() {
    for (let i = 0; i < 8; i++) {
        spawnHealthPack();
    }
}

function spawnHealthPack() {
    const x = (Math.random() - 0.5) * 360;
    const z = (Math.random() - 0.5) * 360;
    
    const packGroup = new THREE.Group();
    
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0x330000,
            metalness: 0.5,
            roughness: 0.3
        })
    );
    box.castShadow = true;
    packGroup.add(box);
    
    const cross1 = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.5, 0.5),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    packGroup.add(cross1);
    
    const cross2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 2.5, 0.5),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    packGroup.add(cross2);
    
    packGroup.position.set(x, 3, z);
    packGroup.userData.isHealthPack = true;
    scene.add(packGroup);
    healthPacks.push(packGroup);
}

// ========================================
// СОЗДАНИЕ РУК И ОРУЖИЯ ОТ ПЕРВОГО ЛИЦА
// ========================================

function createHands() {
    hands = new THREE.Group();
    
    // Правая рука (меньше и дальше)
    const rightArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 1.5, 0.4),
        new THREE.MeshStandardMaterial({ 
            color: 0xffdbac,
            roughness: 0.7 
        })
    );
    rightArm.position.set(0.6, -0.8, -2.5);
    hands.add(rightArm);
    
    const rightHand = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.4, 0.6),
        new THREE.MeshStandardMaterial({ 
            color: 0xffdbac,
            roughness: 0.7 
        })
    );
    rightHand.position.set(0.6, -1.6, -2.5);
    hands.add(rightHand);
    
    // Левая рука (поддержка оружия) - меньше и дальше
    const leftArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 1.2, 0.35),
        new THREE.MeshStandardMaterial({ 
            color: 0xffdbac,
            roughness: 0.7 
        })
    );
    leftArm.position.set(-0.5, -0.6, -3);
    leftArm.rotation.z = 0.3;
    hands.add(leftArm);
    
    camera.add(hands);
    scene.add(camera);
}

function createWeaponModels() {
    // ПИСТОЛЕТ
    const pistol = new THREE.Group();
    const pistolBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.5, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 })
    );
    pistolBody.position.set(0.3, -1.2, -3.5);
    pistol.add(pistolBody);
    const pistolBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 })
    );
    pistolBarrel.rotation.x = Math.PI / 2;
    pistolBarrel.position.set(0.3, -1.1, -4.5);
    pistol.add(pistolBarrel);
    weaponModels.pistol = pistol;
    
    // АВТОМАТ
    const rifle = new THREE.Group();
    const rifleBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.4 })
    );
    rifleBody.position.set(0.2, -1.2, -4);
    rifle.add(rifleBody);
    const rifleBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 })
    );
    rifleBarrel.rotation.x = Math.PI / 2;
    rifleBarrel.position.set(0.2, -1.0, -5.5);
    rifle.add(rifleBarrel);
    const rifleStock = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
    );
    rifleStock.position.set(0.2, -1.2, -2.5);
    rifle.add(rifleStock);
    weaponModels.rifle = rifle;
    
    // ДРОБОВИК
    const shotgun = new THREE.Group();
    const shotgunBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 })
    );
    shotgunBody.position.set(0.3, -1.3, -3.5);
    shotgun.add(shotgunBody);
    const shotgunBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 })
    );
    shotgunBarrel.rotation.x = Math.PI / 2;
    shotgunBarrel.position.set(0.3, -1.1, -5);
    shotgun.add(shotgunBarrel);
    weaponModels.shotgun = shotgun;
    
    // СНАЙПЕРКА
    const sniper = new THREE.Group();
    const sniperBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.35, 3.0),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.2 })
    );
    sniperBody.position.set(0.2, -1.2, -4.5);
    sniper.add(sniperBody);
    const sniperBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2.0, 8),
        new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 1.0, roughness: 0.1 })
    );
    sniperBarrel.rotation.x = Math.PI / 2;
    sniperBarrel.position.set(0.2, -1.0, -6.5);
    sniper.add(sniperBarrel);
    const sniperScope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 1.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 })
    );
    sniperScope.rotation.z = Math.PI / 2;
    sniperScope.position.set(0.2, -0.6, -4);
    sniper.add(sniperScope);
    weaponModels.sniper = sniper;
    
    // ГРАНАТОМЕТ
    const grenadeLauncher = new THREE.Group();
    const glBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.6, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x4a4a2a, metalness: 0.6, roughness: 0.5 })
    );
    glBody.position.set(0.3, -1.3, -3.5);
    grenadeLauncher.add(glBody);
    const glBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 1.8, 12),
        new THREE.MeshStandardMaterial({ color: 0x2a2a1a, metalness: 0.7, roughness: 0.4 })
    );
    glBarrel.rotation.x = Math.PI / 2;
    glBarrel.position.set(0.3, -1.1, -5.5);
    grenadeLauncher.add(glBarrel);
    weaponModels.grenadeLauncher = grenadeLauncher;
    
    // ЛАЗЕР
    const laser = new THREE.Group();
    const laserBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 2.0),
        new THREE.MeshStandardMaterial({ 
            color: 0x0088ff, 
            metalness: 1.0, 
            roughness: 0.1,
            emissive: 0x0044aa,
            emissiveIntensity: 0.5
        })
    );
    laserBody.position.set(0.2, -1.2, -3.5);
    laser.add(laserBody);
    const laserCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8),
        new THREE.MeshStandardMaterial({ 
            color: 0x00ffff, 
            metalness: 1.0, 
            roughness: 0.0,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0
        })
    );
    laserCore.rotation.x = Math.PI / 2;
    laserCore.position.set(0.2, -1.0, -5.0);
    laser.add(laserCore);
    weaponModels.laser = laser;
}

function switchWeapon(weaponName) {
    // Удаляем текущее оружие
    if (hands.children.length > 3) {
        hands.remove(hands.children[hands.children.length - 1]);
    }
    
    currentWeapon = weaponName;
    const weapon = weaponModels[weaponName];
    
    if (weapon) {
        hands.add(weapon);
    }
    
    updateUI();
}

// ========================================
// СИСТЕМА РАУНДОВ
// ========================================

function startRound() {
    console.log(`🌊 Начало раунда ${gameState.round}`);
    
    gameState.enemiesKilled = 0;
    gameState.enemiesInRound = 5 + (gameState.round - 1) * 3;
    gameState.damageTakenThisRound = 0; // Сброс для достижения "Идеально"
    
    console.log(`Создаем ${gameState.enemiesInRound} врагов для раунда ${gameState.round}`);
    
    createEnemies(gameState.enemiesInRound);
    
    // Показываем уведомление о раунде
    showRoundNotification();
    
    // Проверяем достижение выживания
    checkAchievements();
}

function showRoundNotification() {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '30%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.fontSize = '48px';
    notification.style.fontWeight = 'bold';
    notification.style.color = '#00ff00';
    notification.style.textShadow = '0 0 20px #00ff00';
    notification.style.zIndex = '10000';
    notification.textContent = `РАУНД ${gameState.round}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 2000);
}

function checkRoundComplete() {
    // Проверяем завершение раунда (с защитой от дублирования)
    if (gameState.enemiesKilled >= gameState.enemiesInRound && 
        enemies.length === 0 && 
        !gameState.isTransitioningRound) {
        
        console.log(`✅ Раунд ${gameState.round} завершен! Убито: ${gameState.enemiesKilled}/${gameState.enemiesInRound}`);
        
        // Устанавливаем флаг перехода
        gameState.isTransitioningRound = true;
        
        // Переходим к следующему раунду
        gameState.round++;
        gameState.enemiesKilled = 0; // Сбрасываем счетчик
        
        console.log(`⏳ Переход к раунду ${gameState.round} через 3 секунды...`);
        
        setTimeout(() => {
            if (gameState.isPlaying && !gameState.isGameOver) {
                gameState.isTransitioningRound = false;
                startRound();
            }
        }, 3000);
    }
}

// ========================================
// СОЗДАНИЕ ВРАГОВ
// ========================================

function createEnemyModel(type = 'normal') {
    const enemyGroup = new THREE.Group();
    
    let bodyColor, emissiveColor, size, heightMultiplier;
    
    switch(type) {
        case 'fast':
            bodyColor = 0xff00ff;
            emissiveColor = 0x440044;
            size = 0.8;
            heightMultiplier = 0.9;
            break;
        case 'tank':
            bodyColor = 0x00ff00;
            emissiveColor = 0x004400;
            size = 1.5;
            heightMultiplier = 1.2;
            break;
        case 'flying':
            bodyColor = 0x00ffff;
            emissiveColor = 0x004444;
            size = 0.9;
            heightMultiplier = 0.8;
            break;
        case 'boss':
            bodyColor = 0xffaa00;
            emissiveColor = 0x442200;
            size = 2.0;
            heightMultiplier = 1.5;
            break;
        default: // normal
            bodyColor = 0xff0000;
            emissiveColor = 0x440000;
            size = 1.0;
            heightMultiplier = 1.0;
    }
    
    const bodyGeometry = new THREE.BoxGeometry(4 * size, 6 * heightMultiplier, 3 * size);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: bodyColor,
        emissive: emissiveColor,
        roughness: 0.3,
        metalness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 3 * heightMultiplier;
    body.castShadow = true;
    enemyGroup.add(body);
    
    // Добавление пропеллеров для летающих врагов
    if (type === 'flying') {
        const propeller = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 0.5, 16),
            new THREE.MeshStandardMaterial({ 
                color: 0x888888, 
                metalness: 0.9, 
                roughness: 0.1 
            })
        );
        propeller.position.y = 7;
        propeller.rotation.x = Math.PI / 2;
        enemyGroup.add(propeller);
        enemyGroup.userData.propeller = propeller;
    }
    
    // Добавление брони для танков
    if (type === 'tank') {
        const armor = new THREE.Mesh(
            new THREE.BoxGeometry(5 * size, 7 * heightMultiplier, 4 * size),
            new THREE.MeshStandardMaterial({ 
                color: 0x333333, 
                metalness: 0.9, 
                roughness: 0.2,
                transparent: true,
                opacity: 0.5
            })
        );
        armor.position.y = 3 * heightMultiplier;
        enemyGroup.add(armor);
    }
    
    // Добавление короны для боссов
    if (type === 'boss') {
        const crown = new THREE.Mesh(
            new THREE.ConeGeometry(2, 3, 6),
            new THREE.MeshStandardMaterial({ 
                color: 0xFFD700, 
                metalness: 1.0, 
                roughness: 0.1,
                emissive: 0xFFD700,
                emissiveIntensity: 0.5
            })
        );
        crown.position.y = 10;
        enemyGroup.add(crown);
    }
    
    const headGeometry = new THREE.BoxGeometry(3 * size, 3 * size, 3 * size);
    const headMaterial = new THREE.MeshStandardMaterial({
        color: type === 'boss' ? 0xffaa00 : (type === 'tank' ? 0x00cc00 : (type === 'fast' ? 0xff00ff : 0xcc0000)),
        emissive: emissiveColor,
        roughness: 0.4,
        metalness: 0.6
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 7.5 * heightMultiplier;
    head.castShadow = true;
    enemyGroup.add(head);
    
    const eyeGeometry = new THREE.SphereGeometry(0.4 * size, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        emissive: 0xffff00
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.8 * size, 7.5 * heightMultiplier, 1.6 * size);
    enemyGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.8 * size, 7.5 * heightMultiplier, 1.6 * size);
    enemyGroup.add(rightEye);
    
    const armGeometry = new THREE.BoxGeometry(1 * size, 4 * heightMultiplier, 1 * size);
    const armMaterial = new THREE.MeshStandardMaterial({
        color: type === 'boss' ? 0x996600 : (type === 'tank' ? 0x009900 : (type === 'fast' ? 0x990099 : 0x990000)),
        roughness: 0.5,
        metalness: 0.5
    });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-3 * size, 3 * heightMultiplier, 0);
    leftArm.castShadow = true;
    enemyGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(3 * size, 3 * heightMultiplier, 0);
    rightArm.castShadow = true;
    enemyGroup.add(rightArm);
    
    const legGeometry = new THREE.BoxGeometry(1.5 * size, 3 * heightMultiplier, 1.5 * size);
    const legMaterial = new THREE.MeshStandardMaterial({
        color: type === 'boss' ? 0x885500 : (type === 'tank' ? 0x008800 : (type === 'fast' ? 0x880088 : 0x880000)),
        roughness: 0.6,
        metalness: 0.4
    });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-1 * size, -1.5 * heightMultiplier, 0);
    leftLeg.castShadow = true;
    enemyGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(1 * size, -1.5 * heightMultiplier, 0);
    rightLeg.castShadow = true;
    enemyGroup.add(rightLeg);
    
    // ОРУЖИЕ ВРАГА
    const weaponGroup = new THREE.Group();
    
    // Корпус оружия
    const weaponBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.8, 3),
        new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.3
        })
    );
    weaponBody.position.set(0, 0, 0);
    weaponGroup.add(weaponBody);
    
    // Ствол оружия
    const weaponBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 2, 8),
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.2
        })
    );
    weaponBarrel.rotation.x = Math.PI / 2;
    weaponBarrel.position.set(0, 0, -2);
    weaponGroup.add(weaponBarrel);
    
    // Магазин
    const magazine = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 1.5, 0.6),
        new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.7,
            roughness: 0.4
        })
    );
    magazine.position.set(0, -1, 0.5);
    weaponGroup.add(magazine);
    
    // Позиция оружия в правой руке
    weaponGroup.position.set(4 * size, 2 * heightMultiplier, 2 * size);
    weaponGroup.rotation.y = -Math.PI / 4;
    weaponGroup.rotation.x = -Math.PI / 8;
    weaponGroup.castShadow = true;
    enemyGroup.add(weaponGroup);
    
    enemyGroup.userData.parts = {
        body, head, leftArm, rightArm, leftLeg, rightLeg, leftEye, rightEye, weapon: weaponGroup
    };
    
    enemyGroup.userData.enemyType = type;
    
    return enemyGroup;
}

function createEnemies(count) {
    const difficulty = difficulties[currentDifficulty];
    const adjustedCount = Math.floor(count * difficulty.enemyCountMultiplier);
    
    for (let i = 0; i < adjustedCount; i++) {
        let x, z, validPosition;
        
        do {
            x = (Math.random() - 0.5) * 360;
            z = (Math.random() - 0.5) * 360;
            const distance = Math.sqrt(x * x + z * z);
            const testPos = new THREE.Vector3(x, GROUND_LEVEL + 4, z);
            validPosition = distance > 40 && !checkCollision(testPos);
        } while (!validPosition);

        // Определяем тип врага на основе раунда
        let enemyType = 'normal';
        const rand = Math.random();
        
        if (gameState.round >= 10 && rand < 0.1) {
            enemyType = 'boss';
        } else if (gameState.round >= 7) {
            if (rand < 0.2) enemyType = 'fast';
            else if (rand < 0.4) enemyType = 'tank';
            else if (rand < 0.6) enemyType = 'flying';
        } else if (gameState.round >= 5) {
            if (rand < 0.25) enemyType = 'fast';
            else if (rand < 0.5) enemyType = 'tank';
        } else if (gameState.round >= 3) {
            if (rand < 0.3) enemyType = 'fast';
        }

        const enemy = createEnemyModel(enemyType);
        
        // Позиция (летающие враги выше)
        const yPos = enemyType === 'flying' ? GROUND_LEVEL + 15 : GROUND_LEVEL + 4;
        enemy.position.set(x, yPos, z);
        
        // Характеристики в зависимости от типа и сложности
        let baseHealth = 100 + (gameState.round - 1) * 20;
        let baseSpeed = 0.08 + (gameState.round - 1) * 0.01;
        let baseDamage = 15 + gameState.round * 2;
        
        switch(enemyType) {
            case 'fast':
                baseHealth *= 0.6;
                baseSpeed *= 2.0;
                baseDamage *= 0.7;
                break;
            case 'tank':
                baseHealth *= 3.0;
                baseSpeed *= 0.5;
                baseDamage *= 1.5;
                break;
            case 'flying':
                baseHealth *= 0.8;
                baseSpeed *= 1.5;
                baseDamage *= 1.0;
                break;
            case 'boss':
                baseHealth *= 10.0;
                baseSpeed *= 0.7;
                baseDamage *= 3.0;
                break;
        }
        
        enemy.userData = {
            ...enemy.userData,
            health: baseHealth * difficulty.enemyHealthMultiplier,
            maxHealth: baseHealth * difficulty.enemyHealthMultiplier,
            speed: baseSpeed * difficulty.enemySpeedMultiplier,
            damage: baseDamage * difficulty.enemyDamageMultiplier,
            detectionRadius: 60,
            attackRadius: enemyType === 'boss' ? 15 : 10,
            lastAttackTime: 0,
            attackCooldown: enemyType === 'fast' ? 1.5 : (enemyType === 'boss' ? 1.0 : 2.0),
            animationOffset: Math.random() * Math.PI * 2,
            isBoss: enemyType === 'boss'
        };
        
        scene.add(enemy);
        enemies.push(enemy);
    }
}

// ========================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ========================================

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = true;
        
        // Отладка движения
        if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
            console.log(`Клавиша ${key.toUpperCase()} нажата. Игра: ${gameState.isPlaying}, Пауза: ${gameState.isPaused}`);
        }
        
        // Перезарядка
        if (key === 'r' && gameState.isPlaying && !gameState.isPaused) {
            console.log('🔄 Нажата клавиша R - попытка перезарядки');
            reloadWeapon();
        }
        
        // Прыжок
        if (e.key === ' ' && gameState.isPlaying && !gameState.isPaused && player.isGrounded) {
            player.velocity.y = player.jumpSpeed;
            player.isGrounded = false;
        }
        
        // Смена оружия
        if (e.key === '1') switchWeapon('pistol');
        if (e.key === '2') switchWeapon('rifle');
        if (e.key === '3') switchWeapon('shotgun');
        if (e.key === '4') switchWeapon('sniper');
        if (e.key === '5') switchWeapon('grenadeLauncher');
        if (e.key === '6') switchWeapon('laser');
        
        // Гранаты
        if (key === 'g' && gameState.isPlaying && !gameState.isPaused) {
            throwGrenade();
        }
        
        // Способности
        if (key === 'q' && gameState.isPlaying && !gameState.isPaused) {
            activateShield();
        }
        if (key === 'e' && gameState.isPlaying && !gameState.isPaused) {
            activateRage();
        }
        
        // Апгрейд оружия (на паузе)
        if (key === 'u' && gameState.isPaused) {
            upgradeWeapon();
        }
        
        // Пауза
        if (e.key === 'Escape') {
            if (gameState.isPlaying && !gameState.isGameOver) {
                togglePause();
            }
        }
        
        // Отладочная панель (F3)
        if (e.key === 'F3') {
            e.preventDefault();
            const debugPanel = document.getElementById('debugInfo');
            if (debugPanel) {
                debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
                console.log('🔧 Отладочная панель:', debugPanel.style.display === 'block' ? 'ВКЛЮЧЕНА' : 'ВЫКЛЮЧЕНА');
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = false;
    });

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);

    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', restartGame);
    document.getElementById('resumeButton').addEventListener('click', togglePause);
    document.getElementById('mainMenuButton').addEventListener('click', returnToMenu);
    
    // Новые обработчики
    const achievementsBtn = document.getElementById('viewAchievementsButton');
    if (achievementsBtn) {
        achievementsBtn.addEventListener('click', showAchievements);
    }
    
    const scoresBtn = document.getElementById('viewScoresButton');
    if (scoresBtn) {
        scoresBtn.addEventListener('click', showLeaderboard);
    }

    window.addEventListener('resize', onWindowResize);
}

function showAchievements() {
    const modal = document.getElementById('achievementsModal');
    const list = document.getElementById('achievementsList');
    
    list.innerHTML = '';
    
    Object.keys(achievements).forEach(key => {
        const ach = achievements[key];
        const div = document.createElement('div');
        div.style.cssText = `
            background: ${ach.unlocked ? 'rgba(0,255,0,0.2)' : 'rgba(100,100,100,0.2)'};
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid ${ach.unlocked ? '#0f0' : '#555'};
        `;
        div.innerHTML = `
            <div style="font-size: 18px; color: ${ach.unlocked ? '#ffd700' : '#999'};">
                ${ach.unlocked ? '✅' : '🔒'} <strong>${ach.name}</strong>
            </div>
            <div style="font-size: 14px; color: ${ach.unlocked ? '#fff' : '#888'}; margin-top: 5px;">
                ${ach.desc}
            </div>
        `;
        list.appendChild(div);
    });
    
    modal.style.display = 'block';
}

function showLeaderboard() {
    const modal = document.getElementById('scoresModal');
    const list = document.getElementById('scoresList');
    
    const scores = getHighScores();
    
    list.innerHTML = '';
    
    if (scores.length === 0) {
        list.innerHTML = '<p style="color: #888; text-align: center;">Пока нет рекордов. Сыграйте первую игру!</p>';
    } else {
        scores.forEach((score, index) => {
            const div = document.createElement('div');
            const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `${index + 1}.`));
            div.style.cssText = `
                background: rgba(0,100,200,0.2);
                padding: 12px;
                margin: 8px 0;
                border-radius: 8px;
                border-left: 4px solid ${index < 3 ? '#ffd700' : '#0088ff'};
            `;
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 20px;">${medal}</span>
                        <span style="font-size: 18px; color: #0ff; margin-left: 10px;">${score.score} очков</span>
                    </div>
                    <div style="text-align: right; font-size: 14px;">
                        <div style="color: #fff;">Раунд ${score.round} | ${score.kills} убийств</div>
                        <div style="color: #888;">${score.difficulty} | ${score.date}</div>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    }
    
    modal.style.display = 'block';
}

function startGame() {
    console.log('=== ЗАПУСК ИГРЫ ===');
    
    document.getElementById('instructions').style.display = 'none';
    
    // ПРИНУДИТЕЛЬНАЯ установка состояний
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.isGameOver = false;
    gameState.isReloading = false;
    gameState.survivalStartTime = clock.getElapsedTime();
    
    // Применение сложности к здоровью игрока
    const difficulty = difficulties[currentDifficulty];
    player.maxHealth = Math.floor(100 * difficulty.playerHealthMultiplier);
    player.health = player.maxHealth;
    
    // Очистка клавиш
    keys = {};
    
    // Сброс позиции игрока
    player.position.set(0, GROUND_LEVEL + player.height / 2, 0);
    player.velocity.set(0, 0, 0);
    player.rotation = { x: 0, y: 0 };
    player.isGrounded = true;
    
    camera.position.copy(player.position);
    
    console.log('Состояние игры:', gameState);
    console.log('Позиция игрока:', player.position);
    console.log(`Сложность: ${difficulties[currentDifficulty].name}`);
    console.log(`Карта: ${maps[currentMap].name}`);
    console.log('🎮 Игра запущена! Нажимайте WASD для движения');
    console.log('Если не работает - проверьте, что курсор захвачен (кликните ЛКМ)');
    
    document.body.requestPointerLock();
}

function restartGame() {
    enemies.forEach(enemy => scene.remove(enemy));
    bullets.forEach(bullet => scene.remove(bullet));
    enemies = [];
    bullets = [];

    player.position.set(0, GROUND_LEVEL + player.height / 2, 0);
    player.rotation = { x: 0, y: 0 };
    player.health = player.maxHealth;
    player.velocity.set(0, 0, 0);
    player.isGrounded = true;

    gameState.score = 0;
    gameState.round = 1;
    gameState.enemiesKilled = 0;
    gameState.isPlaying = true;
    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.isReloading = false;
    gameState.isTransitioningRound = false;

    switchWeapon('pistol');
    startRound();

    updateUI();
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('reloadIndicator').style.display = 'none';
    document.body.requestPointerLock();
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        // Обновляем информацию в меню паузы
        const pauseScore = document.getElementById('pauseScore');
        const pauseRound = document.getElementById('pauseRound');
        const pauseKills = document.getElementById('pauseKills');
        const pauseWeapon = document.getElementById('pauseWeapon');
        const pauseWeaponLevel = document.getElementById('pauseWeaponLevel');
        const upgradeCost = document.getElementById('upgradeCost');
        
        if (pauseScore) pauseScore.textContent = gameState.score;
        if (pauseRound) pauseRound.textContent = gameState.round;
        if (pauseKills) pauseKills.textContent = gameState.totalKills;
        
        const weapon = weapons[currentWeapon];
        if (pauseWeapon) pauseWeapon.textContent = weapon.name;
        if (pauseWeaponLevel) pauseWeaponLevel.textContent = weapon.level;
        if (upgradeCost) upgradeCost.textContent = weapon.level * 500;
        
        document.getElementById('pauseMenu').style.display = 'block';
        document.exitPointerLock();
    } else {
        document.getElementById('pauseMenu').style.display = 'none';
        document.getElementById('achievementsModal').style.display = 'none';
        document.getElementById('scoresModal').style.display = 'none';
        document.body.requestPointerLock();
    }
}

function returnToMenu() {
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.isGameOver = false;
    
    document.getElementById('pauseMenu').style.display = 'none';
    document.getElementById('instructions').style.display = 'block';
    document.exitPointerLock();
}

function onMouseMove(event) {
    if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    player.rotation.y -= movementX * player.turnSpeed;
    player.rotation.x -= movementY * player.turnSpeed;
    player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.rotation.x));
}

function onMouseClick() {
    if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused) return;
    shoot();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ========================================
// СТРЕЛЬБА
// ========================================

function shoot() {
    const currentTime = clock.getElapsedTime();
    const weapon = weapons[currentWeapon];
    
    if (currentTime - lastShootTime < weapon.fireRate) return;
    if (weapon.ammo <= 0 || gameState.isReloading) return;

    lastShootTime = currentTime;
    weapon.ammo--;

    // Звук выстрела
    if (sounds.shoot) sounds.shoot();

    // Анимация отдачи оружия
    if (hands) {
        const recoil = new THREE.Vector3(0, 0.05, 0.1);
        hands.position.add(recoil);
        setTimeout(() => {
            hands.position.sub(recoil);
        }, 50);
    }

    // Создание пуль (для дробовика несколько)
    const pellets = weapon.pellets || 1;
    
    for (let i = 0; i < pellets; i++) {
        createBullet(weapon);
    }

    createMuzzleFlash();
    updateUI();
}

// Гранаты
function throwGrenade() {
    if (player.grenades <= 0) return;
    
    player.grenades--;
    
    const grenadeGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const grenadeMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.3
    });
    const grenade = new THREE.Mesh(grenadeGeometry, grenadeMaterial);
    
    grenade.position.copy(camera.position);
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    direction.y += 0.3; // Бросок вверх
    direction.normalize();
    
    grenade.userData = {
        velocity: direction.multiplyScalar(0.8),
        life: 3.0,
        explosive: true
    };
    
    scene.add(grenade);
    grenades.push(grenade);
    updateUI();
}

function updateGrenades(delta) {
    grenades = grenades.filter(grenade => {
        grenade.position.add(grenade.userData.velocity);
        grenade.userData.velocity.y -= 0.02; // Гравитация
        grenade.rotation.x += 0.2;
        grenade.rotation.y += 0.1;
        
        grenade.userData.life -= delta;
        
        if (grenade.userData.life <= 0 || grenade.position.y < GROUND_LEVEL) {
            // Взрыв
            createGrenadeExplosion(grenade.position);
            scene.remove(grenade);
            return false;
        }
        
        return true;
    });
}

function createGrenadeExplosion(position) {
    if (sounds.explosion) sounds.explosion();
    
    // Урон врагам в радиусе
    const explosionRadius = 20;
    enemies.forEach(enemy => {
        const distance = enemy.position.distanceTo(position);
        if (distance < explosionRadius) {
            const damage = 200 * (1 - distance / explosionRadius);
            enemy.userData.health -= damage;
            
            if (enemy.userData.health <= 0) {
                gameState.explosiveKills++;
                checkAchievements();
            }
        }
    });
    
    // Визуальный эффект
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0xff4500 : 0xffaa00
        });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.copy(position);
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8
        );
        
        scene.add(particle);
        
        let life = 1.0;
        const animateParticle = () => {
            particle.position.add(velocity);
            velocity.y -= 0.02;
            life -= 0.02;
            particle.material.opacity = life;
            particle.material.transparent = true;
            
            if (life > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                scene.remove(particle);
            }
        };
        animateParticle();
    }
    
    // Световая вспышка
    const flash = new THREE.PointLight(0xff4500, 10, 50);
    flash.position.copy(position);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 200);
}

// Способности
function activateShield() {
    const ability = player.abilities.shield;
    const currentTime = clock.getElapsedTime();
    
    if (currentTime - ability.lastUsed < ability.cooldown) {
        console.log('Щит на перезарядке!');
        return;
    }
    
    ability.active = true;
    ability.lastUsed = currentTime;
    
    console.log('🛡️ Щит активирован!');
    
    // Визуальный эффект щита
    const shieldGeometry = new THREE.SphereGeometry(8, 32, 32);
    const shieldMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    camera.add(shield);
    
    setTimeout(() => {
        ability.active = false;
        camera.remove(shield);
        console.log('Щит деактивирован');
    }, ability.duration * 1000);
}

function activateRage() {
    const ability = player.abilities.rage;
    const currentTime = clock.getElapsedTime();
    
    if (currentTime - ability.lastUsed < ability.cooldown) {
        console.log('Ярость на перезарядке!');
        return;
    }
    
    ability.active = true;
    ability.lastUsed = currentTime;
    
    console.log('😈 Ярость активирована!');
    
    // Увеличиваем урон всех оружий
    Object.keys(weapons).forEach(key => {
        weapons[key].damage *= 2;
    });
    
    // Эффект красного экрана
    document.body.style.background = 'rgba(255, 0, 0, 0.2)';
    
    setTimeout(() => {
        ability.active = false;
        Object.keys(weapons).forEach(key => {
            weapons[key].damage /= 2;
        });
        document.body.style.background = '#000';
        console.log('Ярость закончилась');
    }, ability.duration * 1000);
}

// Система улучшения оружия
function upgradeWeapon() {
    const weapon = weapons[currentWeapon];
    
    if (weapon.level >= weapon.maxLevel) {
        console.log('Оружие уже на максимальном уровне!');
        return;
    }
    
    const upgradeCost = weapon.level * 500;
    
    if (gameState.score < upgradeCost) {
        console.log(`Недостаточно очков! Нужно: ${upgradeCost}, Есть: ${gameState.score}`);
        return;
    }
    
    gameState.score -= upgradeCost;
    weapon.level++;
    
    // Улучшения
    weapon.damage = Math.floor(weapon.damage * 1.2);
    weapon.maxAmmo = Math.floor(weapon.maxAmmo * 1.1);
    weapon.ammo = weapon.maxAmmo;
    weapon.reloadTime *= 0.9;
    weapon.spread *= 0.9;
    
    console.log(`✨ ${weapon.name} улучшен до уровня ${weapon.level}!`);
    if (sounds.pickup) sounds.pickup();
    updateUI();
}

function createBullet(weapon) {
    let bullet;
    
    // Лазер - особая визуализация
    if (currentWeapon === 'laser') {
        const laserGeometry = new THREE.CylinderGeometry(0.1, 0.1, 100, 8);
        const laserMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.8
        });
        bullet = new THREE.Mesh(laserGeometry, laserMaterial);
        bullet.rotation.x = Math.PI / 2;
    } else if (weapon.explosive) {
        // Граната из гранатомета
        const grenadeGeometry = new THREE.SphereGeometry(0.4, 12, 12);
        const grenadeMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.7,
            roughness: 0.4
        });
        bullet = new THREE.Mesh(grenadeGeometry, grenadeMaterial);
    } else {
        // Обычная пуля
        const bulletGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const bulletMaterial = new THREE.MeshStandardMaterial({
            color: currentWeapon === 'sniper' ? 0xff0000 : 0xffff00,
            emissive: currentWeapon === 'sniper' ? 0xaa0000 : 0xffaa00,
            emissiveIntensity: 2,
            metalness: 0.8,
            roughness: 0.2
        });
        bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    }

    bullet.position.copy(camera.position);
    
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    // Добавляем разброс
    direction.x += (Math.random() - 0.5) * weapon.spread;
    direction.y += (Math.random() - 0.5) * weapon.spread;
    direction.normalize();
    
    const speed = currentWeapon === 'laser' ? 5 : (currentWeapon === 'sniper' ? 6 : 3);
    
    bullet.userData = {
        velocity: direction.multiplyScalar(speed),
        life: currentWeapon === 'laser' ? 0.1 : (weapon.explosive ? 5 : 3),
        damage: weapon.damage * (weapon.level || 1),
        explosive: weapon.explosive || false,
        weaponType: currentWeapon
    };

    scene.add(bullet);
    bullets.push(bullet);
}

function createMuzzleFlash() {
    const flash = new THREE.PointLight(0xffff00, 3, 25);
    flash.position.copy(camera.position);
    scene.add(flash);

    setTimeout(() => {
        scene.remove(flash);
    }, 50);
}

function reloadWeapon() {
    const weapon = weapons[currentWeapon];
    
    console.log(`Попытка перезарядки. Текущее оружие: ${weapon.name}, Патроны: ${weapon.ammo}/${weapon.maxAmmo}, Перезаряжается: ${gameState.isReloading}`);
    
    // Проверяем, можно ли перезаряжаться
    if (gameState.isReloading) {
        console.log('❌ Уже перезаряжаемся!');
        return;
    }
    
    if (weapon.ammo === weapon.maxAmmo) {
        console.log('❌ Магазин полон!');
        return;
    }
    
    console.log('✅ Начинаем перезарядку...');
    gameState.isReloading = true;
    gameState.reloadStartTime = clock.getElapsedTime();
    
    // Звук перезарядки
    if (sounds.reload) sounds.reload();
    
    const reloadIndicator = document.getElementById('reloadIndicator');
    if (reloadIndicator) {
        reloadIndicator.style.display = 'block';
    }
}

// ========================================
// ОБНОВЛЕНИЕ ИГРЫ
// ========================================

function update() {
    const delta = clock.getDelta();
    const currentTime = clock.getElapsedTime();
    
    // Отладка - показываем раз в 5 секунд
    if (Math.random() < 0.001) {
        console.log(`⏱️ Update вызван. Состояние: играем=${gameState.isPlaying}, пауза=${gameState.isPaused}, game over=${gameState.isGameOver}`);
    }
    
    // Проверка состояний
    if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused) {
        return;
    }

    // Обработка перезарядки
    if (gameState.isReloading) {
        const weapon = weapons[currentWeapon];
        const reloadProgress = (currentTime - gameState.reloadStartTime) / weapon.reloadTime;
        
        const reloadBar = document.getElementById('reloadBar');
        if (reloadBar) {
            reloadBar.style.width = (reloadProgress * 100) + '%';
        }
        
        if (reloadProgress >= 1.0) {
            gameState.isReloading = false;
            weapon.ammo = weapon.maxAmmo;
            document.getElementById('reloadIndicator').style.display = 'none';
            updateUI();
        }
    }

    // Обновление камеры
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.rotation.y;
    camera.rotation.x = player.rotation.x;

    // Гравитация
    player.velocity.y += player.gravity;
    
    // Движение игрока
    const speed = keys['shift'] ? player.sprintSpeed : player.speed;
    const moveDirection = new THREE.Vector3();

    // Проверяем каждую клавишу
    const wPressed = keys['w'] || keys['W'] || keys['ц'] || keys['Ц'];
    const sPressed = keys['s'] || keys['S'] || keys['ы'] || keys['Ы'];
    const aPressed = keys['a'] || keys['A'] || keys['ф'] || keys['Ф'];
    const dPressed = keys['d'] || keys['D'] || keys['в'] || keys['В'];
    
    if (wPressed) moveDirection.z -= 1;
    if (sPressed) moveDirection.z += 1;
    if (aPressed) moveDirection.x -= 1;
    if (dPressed) moveDirection.x += 1;

    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
        player.velocity.x = moveDirection.x * speed;
        player.velocity.z = moveDirection.z * speed;
        
        // Звук шагов
        if (currentTime - lastStepTime > 0.5 && player.isGrounded) {
            if (sounds.step) sounds.step();
            lastStepTime = currentTime;
        }
        
        // Отладка (показываем раз в 100 кадров)
        if (Math.random() < 0.02) {
            console.log(`✅ ДВИЖЕНИЕ! velocity=(${player.velocity.x.toFixed(2)}, ${player.velocity.z.toFixed(2)}), pos=(${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)})`);
        }
    } else {
        player.velocity.x *= 0.85;
        player.velocity.z *= 0.85;
    }

    // Применение движения с коллизиями
    const horizontalPos = player.position.clone();
    horizontalPos.x += player.velocity.x;
    horizontalPos.z += player.velocity.z;
    
    if (!checkCollision(horizontalPos)) {
        player.position.x = horizontalPos.x;
        player.position.z = horizontalPos.z;
    } else {
        player.velocity.x = 0;
        player.velocity.z = 0;
    }

    // Вертикальное движение
    player.position.y += player.velocity.y;
    
    if (player.position.y <= GROUND_LEVEL + player.height / 2) {
        player.position.y = GROUND_LEVEL + player.height / 2;
        player.velocity.y = 0;
        player.isGrounded = true;
    } else {
        player.isGrounded = false;
    }
    
    if (player.position.y >= 45) {
        player.position.y = 45;
        player.velocity.y = 0;
    }

    camera.position.copy(player.position);

    // Проверка аптечек
    checkHealthPackPickup();

    // Обновление врагов
    updateEnemies(delta);

    // Обновление пуль
    updateBullets(delta);
    
    // Обновление гранат
    updateGrenades(delta);
    
    // Обновление таймера выживания
    if (gameState.gameMode === 'survival' && gameState.isPlaying) {
        gameState.survivalTime = currentTime - gameState.survivalStartTime;
    }

    // Проверка завершения раунда
    checkRoundComplete();

    // Автоперезарядка
    const weapon = weapons[currentWeapon];
    if (weapon.ammo === 0 && !gameState.isReloading) {
        reloadWeapon();
    }
    
    // Анимация аптечек
    healthPacks.forEach((pack, index) => {
        if (pack.parent) {
            pack.rotation.y += 0.02;
            pack.position.y = 3 + Math.sin(currentTime * 2 + index) * 0.5;
        }
    });
}

function checkHealthPackPickup() {
    for (let i = healthPacks.length - 1; i >= 0; i--) {
        const pack = healthPacks[i];
        if (!pack.parent) continue;
        
        const distance = player.position.distanceTo(pack.position);
        if (distance < 5 && player.health < player.maxHealth) {
            player.health = Math.min(player.health + 50, player.maxHealth);
            scene.remove(pack);
            healthPacks.splice(i, 1);
            
            // Звук подбора
            if (sounds.pickup) sounds.pickup();
            
            updateUI();
            
            // Респаун аптечки через 20 секунд
            setTimeout(() => spawnHealthPack(), 20000);
        }
    }
}

function checkCollision(position) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        position,
        new THREE.Vector3(4, player.height, 4)
    );

    for (let wall of walls) {
        const wallBox = new THREE.Box3().setFromObject(wall);
        if (playerBox.intersectsBox(wallBox)) {
            return true;
        }
    }

    return false;
}

function checkEnemyCollision(position) {
    const enemyBox = new THREE.Box3().setFromCenterAndSize(
        position,
        new THREE.Vector3(4, 8, 4)
    );

    for (let wall of walls) {
        const wallBox = new THREE.Box3().setFromObject(wall);
        if (enemyBox.intersectsBox(wallBox)) {
            return true;
        }
    }

    return false;
}

function updateEnemies(delta) {
    const currentTime = clock.getElapsedTime();

    enemies.forEach((enemy, index) => {
        if (!enemy.parent) return;

        const enemyPos = enemy.position;
        const distance = enemyPos.distanceTo(player.position);
        const isFlying = enemy.userData.enemyType === 'flying';

        // Анимация
        if (enemy.userData.parts) {
            const offset = enemy.userData.animationOffset;
            const { leftArm, rightArm, leftLeg, rightLeg, weapon } = enemy.userData.parts;
            
            leftArm.rotation.x = Math.sin(currentTime * 3 + offset) * 0.5;
            rightArm.rotation.x = Math.sin(currentTime * 3 + offset + Math.PI) * 0.5;
            leftLeg.rotation.x = Math.sin(currentTime * 3 + offset + Math.PI) * 0.3;
            rightLeg.rotation.x = Math.sin(currentTime * 3 + offset) * 0.3;
            
            // Анимация оружия (слегка покачивается)
            if (weapon) {
                weapon.rotation.z = Math.sin(currentTime * 2 + offset) * 0.1;
            }
        }
        
        // Анимация пропеллера для летающих врагов
        if (isFlying && enemy.userData.propeller) {
            enemy.userData.propeller.rotation.z += 0.5;
            enemy.position.y = GROUND_LEVEL + 15 + Math.sin(currentTime * 2 + enemy.userData.animationOffset) * 2;
        }

        // AI
        if (distance < enemy.userData.detectionRadius) {
            const direction = new THREE.Vector3()
                .subVectors(player.position, enemyPos)
                .normalize();

            const newEnemyPos = enemyPos.clone();
            newEnemyPos.x += direction.x * enemy.userData.speed;
            newEnemyPos.z += direction.z * enemy.userData.speed;
            
            // Летающие враги могут двигаться по Y
            if (isFlying) {
                newEnemyPos.y += direction.y * enemy.userData.speed * 0.5;
            }
            
            if (!checkEnemyCollision(newEnemyPos)) {
                enemyPos.x = newEnemyPos.x;
                enemyPos.z = newEnemyPos.z;
                if (isFlying) enemyPos.y = newEnemyPos.y;
            }

            const lookAtPos = player.position.clone();
            lookAtPos.y = enemyPos.y;
            enemy.lookAt(lookAtPos);

            if (distance < enemy.userData.attackRadius &&
                currentTime - enemy.userData.lastAttackTime > enemy.userData.attackCooldown) {
                enemy.userData.lastAttackTime = currentTime;
                damagePlayer(enemy.userData.damage);
                
                if (enemy.userData.parts) {
                    const body = enemy.userData.parts.body;
                    const originalColor = body.material.color.getHex();
                    body.material.color.setHex(0xffffff);
                    setTimeout(() => {
                        if (enemy.parent) {
                            body.material.color.setHex(originalColor);
                        }
                    }, 100);
                }
            }
        }
    });
}

function updateBullets(delta) {
    bullets = bullets.filter(bullet => {
        bullet.position.add(bullet.userData.velocity);
        bullet.userData.life -= delta;

        if (bullet.userData.life <= 0) {
            // Взрыв для гранатометных снарядов
            if (bullet.userData.explosive) {
                createGrenadeExplosion(bullet.position);
            }
            scene.remove(bullet);
            return false;
        }

        // Попадание во врагов
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const distance = bullet.position.distanceTo(enemy.position);

            if (distance < 6) {
                // Взрыв от гранатомета
                if (bullet.userData.explosive) {
                    createGrenadeExplosion(bullet.position);
                    scene.remove(bullet);
                    return false;
                }
                
                enemy.userData.health -= bullet.userData.damage;
                
                // Звук попадания
                if (sounds.hit) sounds.hit();

                if (enemy.userData.health <= 0) {
                    const isBoss = enemy.userData.isBoss;
                    const isSniper = bullet.userData.weaponType === 'sniper';
                    
                    createExplosion(enemy.position);
                    scene.remove(enemy);
                    enemies.splice(i, 1);
                    
                    gameState.score += isBoss ? 1000 : 100;
                    gameState.enemiesKilled++;
                    gameState.totalKills++;
                    
                    // Проверка достижений
                    if (isBoss) {
                        unlockAchievement('boss');
                        console.log('🏆 БОСС УБИТ!');
                    }
                    if (isSniper) {
                        unlockAchievement('headshot');
                    }
                    checkAchievements();
                    
                    console.log(`💀 Враг убит! Всего убито: ${gameState.enemiesKilled}/${gameState.enemiesInRound}`);
                    
                    updateUI();
                } else {
                    if (enemy.userData.parts) {
                        const body = enemy.userData.parts.body;
                        const originalColor = body.material.color.getHex();
                        body.material.color.setHex(0xff8888);
                        setTimeout(() => {
                            if (enemy.parent) {
                                body.material.color.setHex(originalColor);
                            }
                        }, 100);
                    }
                }

                scene.remove(bullet);
                return false;
            }
        }

        // Попадание в стены
        for (let wall of walls) {
            const wallBox = new THREE.Box3().setFromObject(wall);
            if (wallBox.containsPoint(bullet.position)) {
                if (bullet.userData.explosive) {
                    createGrenadeExplosion(bullet.position);
                } else {
                    createSparks(bullet.position);
                }
                scene.remove(bullet);
                return false;
            }
        }

        return true;
    });
}

function createExplosion(position) {
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0xff0000 : 0xffaa00
        });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.copy(position);
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        
        scene.add(particle);
        
        let life = 1.0;
        const animateParticle = () => {
            particle.position.add(velocity);
            life -= 0.02;
            particle.material.opacity = life;
            particle.material.transparent = true;
            
            if (life > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                scene.remove(particle);
            }
        };
        animateParticle();
    }
    
    const flash = new THREE.PointLight(0xff0000, 5, 30);
    flash.position.copy(position);
    scene.add(flash);
    
    setTimeout(() => scene.remove(flash), 100);
}

function createSparks(position) {
    for (let i = 0; i < 5; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const spark = new THREE.Mesh(geometry, material);
        
        spark.position.copy(position);
        scene.add(spark);
        
        setTimeout(() => scene.remove(spark), 200);
    }
}

function damagePlayer(damage) {
    // Проверка щита
    if (player.abilities.shield.active) {
        console.log('🛡️ Урон заблокирован щитом!');
        return;
    }
    
    gameState.damageTakenThisRound += damage;
    
    player.health -= damage;
    player.health = Math.max(0, player.health);
    updateUI();

    document.body.style.background = 'rgba(255, 0, 0, 0.3)';
    setTimeout(() => {
        document.body.style.background = '#000';
    }, 200);

    if (player.health <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameState.isPlaying = false;
    gameState.isGameOver = true;
    
    // Сохранение рекорда
    saveHighScore();
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalRound').textContent = gameState.round;
    document.getElementById('gameOver').style.display = 'block';
    
    document.exitPointerLock();
}

function updateUI() {
    document.getElementById('healthValue').textContent = Math.floor(player.health);
    document.getElementById('scoreValue').textContent = gameState.score;
    document.getElementById('roundValue').textContent = gameState.round;
    document.getElementById('enemiesValue').textContent = 
        `${gameState.enemiesKilled}/${gameState.enemiesInRound}`;
    
    const weapon = weapons[currentWeapon];
    document.getElementById('weaponName').textContent = weapon.name;
    document.getElementById('ammoValue').textContent = `${weapon.ammo}/${weapon.maxAmmo}`;
    
    // Обновление дополнительной информации
    const weaponLevelEl = document.getElementById('weaponLevel');
    if (weaponLevelEl) {
        weaponLevelEl.textContent = weapon.level;
    }
    
    const grenadesEl = document.getElementById('grenadesValue');
    if (grenadesEl) {
        grenadesEl.textContent = player.grenades;
    }
    
    const survivalTimeEl = document.getElementById('survivalTime');
    if (survivalTimeEl && gameState.gameMode === 'survival') {
        const minutes = Math.floor(gameState.survivalTime / 60);
        const seconds = Math.floor(gameState.survivalTime % 60);
        survivalTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    const mapNameEl = document.getElementById('mapName');
    if (mapNameEl) {
        mapNameEl.textContent = maps[currentMap].name;
    }
    
    const difficultyEl = document.getElementById('difficultyName');
    if (difficultyEl) {
        difficultyEl.textContent = difficulties[currentDifficulty].name;
    }
    
    // Обновление отладочной панели
    updateDebugPanel();
}

function updateDebugPanel() {
    const debugKeys = document.getElementById('debugKeys');
    const debugPos = document.getElementById('debugPos');
    const debugState = document.getElementById('debugState');
    
    if (debugKeys && gameState.isPlaying) {
        const keysPressed = [];
        if (keys['w'] || keys['W'] || keys['ц']) keysPressed.push('W');
        if (keys['a'] || keys['A'] || keys['ф']) keysPressed.push('A');
        if (keys['s'] || keys['S'] || keys['ы']) keysPressed.push('S');
        if (keys['d'] || keys['D'] || keys['в']) keysPressed.push('D');
        
        debugKeys.textContent = `Клавиши: ${keysPressed.length > 0 ? keysPressed.join('+') : 'нет'}`;
        debugPos.textContent = `Позиция: (${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)})`;
        debugState.textContent = `Игра: ${gameState.isPlaying ? '✅' : '❌'} Пауза: ${gameState.isPaused ? '⏸️' : '▶️'}`;
    }
}

// ========================================
// ИГРОВОЙ ЦИКЛ
// ========================================

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
    
    // Рендеринг миникарты
    if (minimapCamera && gameState.isPlaying) {
        minimapCamera.position.x = player.position.x;
        minimapCamera.position.z = player.position.z;
        
        const minimapCanvas = document.getElementById('minimapCanvas');
        if (minimapCanvas) {
            const ctx = minimapCanvas.getContext('2d');
            
            // Очистка
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, 200, 200);
            
            // Рисуем врагов
            ctx.fillStyle = 'red';
            enemies.forEach(enemy => {
                const relX = (enemy.position.x - player.position.x) + 100;
                const relZ = (enemy.position.z - player.position.z) + 100;
                if (relX >= 0 && relX <= 200 && relZ >= 0 && relZ <= 200) {
                    ctx.fillRect(relX - 2, relZ - 2, 4, 4);
                }
            });
            
            // Рисуем аптечки
            ctx.fillStyle = 'lime';
            healthPacks.forEach(pack => {
                if (!pack.parent) return;
                const relX = (pack.position.x - player.position.x) + 100;
                const relZ = (pack.position.z - player.position.z) + 100;
                if (relX >= 0 && relX <= 200 && relZ >= 0 && relZ <= 200) {
                    ctx.fillRect(relX - 1, relZ - 1, 2, 2);
                }
            });
            
            // Рисуем игрока (в центре)
            ctx.fillStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(100, 100, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Направление взгляда
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(100, 100);
            const lookAngle = player.rotation.y;
            ctx.lineTo(100 + Math.sin(lookAngle) * 15, 100 - Math.cos(lookAngle) * 15);
            ctx.stroke();
        }
    }
}

// Запуск
init();
