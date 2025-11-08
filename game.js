// ========================================
// 3D FPS GAME - УЛУЧШЕННАЯ ВЕРСИЯ
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
    gravity: -0.025
};

// Система оружия
let currentWeapon = 'pistol';
let weaponModels = {};
let hands = null;

const weapons = {
    pistol: {
        name: 'Пистолет',
        damage: 35,
        ammo: 12,
        maxAmmo: 12,
        fireRate: 0.3,
        reloadTime: 1.5,
        spread: 0.02
    },
    rifle: {
        name: 'Автомат',
        damage: 25,
        ammo: 30,
        maxAmmo: 30,
        fireRate: 0.1,
        reloadTime: 2.5,
        spread: 0.015
    },
    shotgun: {
        name: 'Дробовик',
        damage: 15,
        ammo: 6,
        maxAmmo: 6,
        fireRate: 0.8,
        reloadTime: 3.0,
        spread: 0.1,
        pellets: 8
    }
};

let keys = {};
let enemies = [];
let bullets = [];
let walls = [];
let healthPacks = [];
let floor, ceiling;

let gameState = {
    score: 0,
    round: 1,
    enemiesInRound: 5,
    enemiesKilled: 0,
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
    isReloading: false,
    reloadStartTime: 0,
    isTransitioningRound: false // Защита от дублирования раундов
};

const clock = new THREE.Clock();
let lastShootTime = 0;
const GROUND_LEVEL = 0;

// ========================================
// ИНИЦИАЛИЗАЦИЯ
// ========================================

function init() {
    scene = new THREE.Scene();
    
    // Создание Skybox
    createSkybox();
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.002);

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
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
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

    // Обработчики событий
    setupEventListeners();

    // Запуск игрового цикла
    animate();
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
    // ПИСТОЛЕТ (меньше и дальше от камеры)
    const pistol = new THREE.Group();
    
    const pistolBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.5, 1.2),
        new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            metalness: 0.8, 
            roughness: 0.3 
        })
    );
    pistolBody.position.set(0.3, -1.2, -3.5);
    pistol.add(pistolBody);
    
    const pistolBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8),
        new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            metalness: 0.9, 
            roughness: 0.2 
        })
    );
    pistolBarrel.rotation.x = Math.PI / 2;
    pistolBarrel.position.set(0.3, -1.1, -4.5);
    pistol.add(pistolBarrel);
    
    weaponModels.pistol = pistol;
    
    // АВТОМАТ (меньше и дальше)
    const rifle = new THREE.Group();
    
    const rifleBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 2.5),
        new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a, 
            metalness: 0.7, 
            roughness: 0.4 
        })
    );
    rifleBody.position.set(0.2, -1.2, -4);
    rifle.add(rifleBody);
    
    const rifleBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.5, 8),
        new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            metalness: 0.9, 
            roughness: 0.1 
        })
    );
    rifleBarrel.rotation.x = Math.PI / 2;
    rifleBarrel.position.set(0.2, -1.0, -5.5);
    rifle.add(rifleBarrel);
    
    const rifleStock = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.8),
        new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, 
            roughness: 0.8 
        })
    );
    rifleStock.position.set(0.2, -1.2, -2.5);
    rifle.add(rifleStock);
    
    const rifleScope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8),
        new THREE.MeshStandardMaterial({ 
            color: 0x444444, 
            metalness: 0.8,
            roughness: 0.3
        })
    );
    rifleScope.rotation.z = Math.PI / 2;
    rifleScope.position.set(0.2, -0.7, -3.5);
    rifle.add(rifleScope);
    
    weaponModels.rifle = rifle;
    
    // ДРОБОВИК (меньше и дальше)
    const shotgun = new THREE.Group();
    
    const shotgunBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 2.2),
        new THREE.MeshStandardMaterial({ 
            color: 0x654321, 
            roughness: 0.7 
        })
    );
    shotgunBody.position.set(0.3, -1.3, -3.5);
    shotgun.add(shotgunBody);
    
    const shotgunBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 1.5, 8),
        new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            metalness: 0.8, 
            roughness: 0.3 
        })
    );
    shotgunBarrel.rotation.x = Math.PI / 2;
    shotgunBarrel.position.set(0.3, -1.1, -5);
    shotgun.add(shotgunBarrel);
    
    weaponModels.shotgun = shotgun;
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
    
    console.log(`Создаем ${gameState.enemiesInRound} врагов для раунда ${gameState.round}`);
    
    createEnemies(gameState.enemiesInRound);
    
    // Показываем уведомление о раунде
    showRoundNotification();
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

function createEnemyModel() {
    const enemyGroup = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(4, 6, 3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0x440000,
        roughness: 0.3,
        metalness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 3;
    body.castShadow = true;
    enemyGroup.add(body);
    
    const headGeometry = new THREE.BoxGeometry(3, 3, 3);
    const headMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc0000,
        emissive: 0x330000,
        roughness: 0.4,
        metalness: 0.6
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 7.5;
    head.castShadow = true;
    enemyGroup.add(head);
    
    const eyeGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        emissive: 0xffff00
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.8, 7.5, 1.6);
    enemyGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.8, 7.5, 1.6);
    enemyGroup.add(rightEye);
    
    const armGeometry = new THREE.BoxGeometry(1, 4, 1);
    const armMaterial = new THREE.MeshStandardMaterial({
        color: 0x990000,
        roughness: 0.5,
        metalness: 0.5
    });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-3, 3, 0);
    leftArm.castShadow = true;
    enemyGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(3, 3, 0);
    rightArm.castShadow = true;
    enemyGroup.add(rightArm);
    
    const legGeometry = new THREE.BoxGeometry(1.5, 3, 1.5);
    const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x880000,
        roughness: 0.6,
        metalness: 0.4
    });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-1, -1.5, 0);
    leftLeg.castShadow = true;
    enemyGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(1, -1.5, 0);
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
    weaponGroup.position.set(4, 2, 2);
    weaponGroup.rotation.y = -Math.PI / 4;
    weaponGroup.rotation.x = -Math.PI / 8;
    weaponGroup.castShadow = true;
    enemyGroup.add(weaponGroup);
    
    enemyGroup.userData.parts = {
        body, head, leftArm, rightArm, leftLeg, rightLeg, leftEye, rightEye, weapon: weaponGroup
    };
    
    return enemyGroup;
}

function createEnemies(count) {
    for (let i = 0; i < count; i++) {
        let x, z, validPosition;
        
        do {
            x = (Math.random() - 0.5) * 360;
            z = (Math.random() - 0.5) * 360;
            const distance = Math.sqrt(x * x + z * z);
            const testPos = new THREE.Vector3(x, GROUND_LEVEL + 4, z);
            validPosition = distance > 40 && !checkCollision(testPos);
        } while (!validPosition);

        const enemy = createEnemyModel();
        enemy.position.set(x, GROUND_LEVEL + 4, z);
        
        const health = 100 + (gameState.round - 1) * 20;
        const speed = 0.08 + (gameState.round - 1) * 0.01;
        
        enemy.userData = {
            health: health,
            maxHealth: health,
            speed: speed,
            detectionRadius: 60,
            attackRadius: 10,
            lastAttackTime: 0,
            attackCooldown: 2,
            animationOffset: Math.random() * Math.PI * 2
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

    window.addEventListener('resize', onWindowResize);
}

function startGame() {
    console.log('=== ЗАПУСК ИГРЫ ===');
    
    document.getElementById('instructions').style.display = 'none';
    
    // ПРИНУДИТЕЛЬНАЯ установка состояний
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.isGameOver = false;
    gameState.isReloading = false;
    
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
        document.getElementById('pauseMenu').style.display = 'block';
        document.exitPointerLock();
    } else {
        document.getElementById('pauseMenu').style.display = 'none';
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

    // Анимация отдачи оружия (небольшая)
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

function createBullet(weapon) {
    const bulletGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const bulletMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffaa00,
        emissiveIntensity: 2,
        metalness: 0.8,
        roughness: 0.2
    });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    bullet.position.copy(camera.position);
    
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    // Добавляем разброс
    direction.x += (Math.random() - 0.5) * weapon.spread;
    direction.y += (Math.random() - 0.5) * weapon.spread;
    direction.normalize();
    
    bullet.userData = {
        velocity: direction.multiplyScalar(3),
        life: 3,
        damage: weapon.damage
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

        // AI
        if (distance < enemy.userData.detectionRadius) {
            const direction = new THREE.Vector3()
                .subVectors(player.position, enemyPos)
                .normalize();

            const newEnemyPos = enemyPos.clone();
            newEnemyPos.x += direction.x * enemy.userData.speed;
            newEnemyPos.z += direction.z * enemy.userData.speed;
            
            if (!checkEnemyCollision(newEnemyPos)) {
                enemyPos.x = newEnemyPos.x;
                enemyPos.z = newEnemyPos.z;
            }

            const lookAtPos = player.position.clone();
            lookAtPos.y = enemyPos.y;
            enemy.lookAt(lookAtPos);

            if (distance < enemy.userData.attackRadius &&
                currentTime - enemy.userData.lastAttackTime > enemy.userData.attackCooldown) {
                enemy.userData.lastAttackTime = currentTime;
                damagePlayer(15 + gameState.round * 2);
                
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
            scene.remove(bullet);
            return false;
        }

        // Попадание во врагов
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const distance = bullet.position.distanceTo(enemy.position);

            if (distance < 6) {
                enemy.userData.health -= bullet.userData.damage;

                if (enemy.userData.health <= 0) {
                    createExplosion(enemy.position);
                    scene.remove(enemy);
                    enemies.splice(i, 1);
                    gameState.score += 100;
                    gameState.enemiesKilled++;
                    
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
                createSparks(bullet.position);
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
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalRound').textContent = gameState.round;
    document.getElementById('gameOver').style.display = 'block';
    
    document.exitPointerLock();
}

function updateUI() {
    document.getElementById('healthValue').textContent = player.health;
    document.getElementById('scoreValue').textContent = gameState.score;
    document.getElementById('roundValue').textContent = gameState.round;
    document.getElementById('enemiesValue').textContent = 
        `${gameState.enemiesKilled}/${gameState.enemiesInRound}`;
    
    const weapon = weapons[currentWeapon];
    document.getElementById('weaponName').textContent = weapon.name;
    document.getElementById('ammoValue').textContent = `${weapon.ammo}/${weapon.maxAmmo}`;
    
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
}

// Запуск
init();
