import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CharacterConfig, GameStatus, HoverboardConfig, PlayerStats, PowerUpState, PowerUpType, Upgrades } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { createRunnerRig, createInspectorRig, createDogRig, RunnerRig, InspectorRig, DogRig } from './characterModel';
import { TrackManager, TrackObstacle } from './trackManager';
import { ParticleManager } from './particles';

// Pre-allocated math helpers outside render loop (Zero GC)
const _playerPos = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onPowerUpsUpdate: (powerUps: PowerUpState[]) => void;
  onInspectorTension: (isClose: boolean) => void;
  onGameOver: (stats: PlayerStats) => void;
  onHoverboardStateChange: (hasBoard: boolean) => void;
}

export class GameEngine {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean;

  private trackManager: TrackManager;
  private particleManager: ParticleManager;

  // Characters
  private runnerRig: RunnerRig;
  private inspectorRig: InspectorRig;
  private dogRig: DogRig;

  // Game States
  public status: GameStatus = 'TITLE';
  private frameId: number = 0;
  private lastTime: number = 0;
  private elapsedTime: number = 0;

  // Running Kinematics
  private baseSpeed: number = 18; // m/s
  private currentSpeed: number = 18;
  private maxSpeed: number = 38;
  private speedRampRate: number = 0.2; // increase per 100m

  // Player Lane & Position
  private currentLane: number = 0; // -1, 0, 1
  private targetLane: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = 0;
  private currentGroundY: number = 0; // 0 or train roof height (3.2)

  // Jump & Slide Physics
  private isJumping: boolean = false;
  private jumpVelocity: number = 0;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private slideDuration: number = 0.72;

  // Inspector Chase
  private inspectorDistBehind: number = 6.5;
  private inspectorTargetDist: number = 6.5;
  private stumbleRecoverTimer: number = 0;

  // Power-Ups Active
  private activePowerUps: Map<PowerUpType, { duration: number; timeLeft: number; level: number }> = new Map();
  private hasHoverboard: boolean = false;
  private hoverboardInvincibleTime: number = 0;
  private hoverboardAvailable: boolean = true;

  // Stats & Upgrades
  private stats: PlayerStats = {
    score: 0,
    highScore: 0,
    coins: 0,
    totalCoins: 0,
    distance: 0,
    multiplier: 1,
  };
  private upgrades: Upgrades = {
    magnetLevel: 1,
    jetpackLevel: 1,
    sneakersLevel: 1,
    multiplierLevel: 1,
  };

  // Camera Shake & Hitstop
  private cameraShake: number = 0;
  private hitstopTimer: number = 0;

  // Callbacks
  private callbacks: GameEngineCallbacks;

  // Input Handlers
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private boundResize: () => void;

  constructor(
    container: HTMLDivElement,
    charConfig: CharacterConfig,
    boardConfig: HoverboardConfig,
    upgrades: Upgrades,
    callbacks: GameEngineCallbacks
  ) {
    this.container = container;
    this.upgrades = upgrades;
    this.callbacks = callbacks;

    // Load High Score and Coins
    const savedHigh = localStorage.getItem('subway_high_score');
    if (savedHigh) this.stats.highScore = parseInt(savedHigh, 10);
    const savedCoins = localStorage.getItem('subway_total_coins');
    if (savedCoins) this.stats.totalCoins = parseInt(savedCoins, 10);

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Vibrant bright blue sky
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.007); // Seamless horizon fog

    this.camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 350);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.2); // Warm California sun
    sunLight.position.set(20, 45, -25);
    sunLight.castShadow = !this.isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 120;
      const d = 25;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x334155, 1.1); // Sky blue to track ground
    this.scene.add(hemiLight);

    // 5. Track & Particles
    this.trackManager = new TrackManager(this.scene);
    this.particleManager = new ParticleManager(this.scene);

    // 6. Characters
    this.runnerRig = createRunnerRig(charConfig);
    this.scene.add(this.runnerRig.group);

    this.inspectorRig = createInspectorRig();
    this.scene.add(this.inspectorRig.group);

    this.dogRig = createDogRig();
    this.scene.add(this.dogRig.group);

    // Setup Event Listeners
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundResize = this.handleResize.bind(this);

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    window.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    window.addEventListener('resize', this.boundResize);

    // Position camera for Title Screen
    this.setupTitleCamera();

    // Start loop
    this.lastTime = performance.now();
    this.startLoop();
  }

  private setupTitleCamera() {
    this.camera.position.set(0, 2.4, -4.5);
    this.camera.lookAt(0, 1.2, 0);
    this.runnerRig.group.position.set(0, 0, 0);
    this.runnerRig.group.rotation.y = Math.PI; // Face player in title screen
    this.inspectorRig.group.visible = false;
    this.dogRig.group.visible = false;
  }

  public setCharacter(config: CharacterConfig) {
    this.scene.remove(this.runnerRig.group);
    this.runnerRig = createRunnerRig(config);
    this.scene.add(this.runnerRig.group);
  }

  public setUpgrades(upgrades: Upgrades) {
    this.upgrades = upgrades;
  }

  public startGame() {
    this.status = 'PLAYING';
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.currentLane = 0;
    this.targetLane = 0;
    this.currentGroundY = 0;
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.currentSpeed = this.baseSpeed;
    this.inspectorDistBehind = 6.5;
    this.inspectorTargetDist = 6.5;
    this.stumbleRecoverTimer = 0;
    this.hasHoverboard = false;
    this.activePowerUps.clear();

    this.stats.score = 0;
    this.stats.coins = 0;
    this.stats.distance = 0;
    this.stats.multiplier = 1;

    this.runnerRig.resetPose();
    this.runnerRig.group.rotation.y = 0; // Face forward
    this.runnerRig.setHoverboardVisible(false);
    this.runnerRig.setJetpackVisible(false);
    this.runnerRig.setSuperSneakersVisible(false);

    this.inspectorRig.group.visible = true;
    this.dogRig.group.visible = true;

    this.trackManager.reset();
    this.callbacks.onStatsUpdate({ ...this.stats });
    this.callbacks.onHoverboardStateChange(true);

    soundManager.startMusic();
    soundManager.playWhistle();
  }

  public pauseGame() {
    if (this.status === 'PLAYING') {
      this.status = 'PAUSED';
      soundManager.stopMusic();
    }
  }

  public resumeGame() {
    if (this.status === 'PAUSED') {
      this.status = 'PLAYING';
      this.lastTime = performance.now();
      soundManager.startMusic();
    }
  }

  public activateHoverboard(config?: HoverboardConfig) {
    if (this.status !== 'PLAYING' || this.hasHoverboard) return;
    this.hasHoverboard = true;
    this.runnerRig.setHoverboardVisible(true, config);
    soundManager.playHoverboardDeploy();
    this.callbacks.onHoverboardStateChange(false);
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.status === 'TITLE') {
      if (e.code === 'Space' || e.code === 'Enter') {
        this.startGame();
      }
      return;
    }

    if (e.code === 'Escape') {
      if (this.status === 'PLAYING') this.pauseGame();
      else if (this.status === 'PAUSED') this.resumeGame();
      return;
    }

    if (this.status !== 'PLAYING') return;

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.shiftLane(-1);
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.shiftLane(1);
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        if (e.code === 'Space' && !this.hasHoverboard && this.playerY === this.currentGroundY) {
          // Double tap space or space when grounded activates hoverboard if already jumping
        }
        this.jump();
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.slide();
        break;
      case 'KeyH':
      case 'KeyB':
        this.activateHoverboard();
        break;
    }
  }

  private handleTouchStart(e: TouchEvent) {
    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      const now = Date.now();
      if (now - this.touchStartTime < 300) {
        // Double tap!
        this.activateHoverboard();
      }
      this.touchStartTime = now;
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    if (this.status === 'TITLE') {
      this.startGame();
      return;
    }
    if (this.status !== 'PLAYING' || !e.changedTouches.length) return;

    const dx = e.changedTouches[0].clientX - this.touchStartX;
    const dy = e.changedTouches[0].clientY - this.touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 30) {
      if (absX > absY) {
        // Horizontal swipe
        if (dx > 0) this.shiftLane(1);
        else this.shiftLane(-1);
      } else {
        // Vertical swipe
        if (dy < 0) this.jump();
        else this.slide();
      }
    }
  }

  private shiftLane(dir: number) {
    const next = Math.max(-1, Math.min(1, this.targetLane + dir));
    if (next !== this.targetLane) {
      this.targetLane = next;
      soundManager.playLaneSwitch(dir < 0 ? 'left' : 'right');
    }
  }

  private jump() {
    // If airborne and sliding, jump cancels slide
    if (this.isSliding) {
      this.isSliding = false;
      this.slideTimer = 0;
    }

    // Grounded or on top of train
    if (this.playerY <= this.currentGroundY + 0.1) {
      this.isJumping = true;
      const hasSneakers = this.activePowerUps.has('sneakers');
      this.jumpVelocity = hasSneakers ? 18.5 : 13.5;
      soundManager.playJump(hasSneakers);

      if (hasSneakers) {
        this.particleManager.emitFootDust(this.playerX, this.playerY, this.playerZ);
      }
    }
  }

  private slide() {
    if (this.isJumping) {
      // Fast-slam downward out of jump!
      this.jumpVelocity = -22;
      soundManager.playSlide();
    }

    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    soundManager.playSlide();
    this.particleManager.emitFootDust(this.playerX, this.playerY, this.playerZ);
  }

  private triggerStumble() {
    this.inspectorTargetDist = 2.4; // Inspector surges right behind!
    this.stumbleRecoverTimer = 4.5;
    this.cameraShake = 0.25;
    soundManager.playWhistle();
    soundManager.playDogBark();
    this.callbacks.onInspectorTension(true);
  }

  private triggerCrash() {
    if (this.hasHoverboard) {
      // Hoverboard saves your life!
      this.hasHoverboard = false;
      this.runnerRig.setHoverboardVisible(false);
      this.hoverboardInvincibleTime = 1.4;
      soundManager.playBoardBreak();
      this.particleManager.emitCrashBurst(this.playerX, this.playerY + 0.8, this.playerZ);
      this.cameraShake = 0.4;
      this.hitstopTimer = 0.06;
      return;
    }

    if (this.hoverboardInvincibleTime > 0) return;

    // Fatal Crash
    this.status = 'GAMEOVER';
    this.hitstopTimer = 0.08;
    this.cameraShake = 0.55;
    soundManager.playCrash();
    soundManager.stopMusic();

    this.particleManager.emitCrashBurst(this.playerX, this.playerY + 0.8, this.playerZ);

    // Save High Score and Total Coins
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem('subway_high_score', String(this.stats.highScore));
    }
    this.stats.totalCoins += this.stats.coins;
    localStorage.setItem('subway_total_coins', String(this.stats.totalCoins));

    this.callbacks.onGameOver({ ...this.stats });
  }

  private updatePowerUps(dt: number) {
    if (this.hoverboardInvincibleTime > 0) {
      this.hoverboardInvincibleTime -= dt;
    }

    const stateList: PowerUpState[] = [];

    this.activePowerUps.forEach((state, type) => {
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) {
        this.activePowerUps.delete(type);
        if (type === 'jetpack') {
          this.runnerRig.setJetpackVisible(false);
        } else if (type === 'sneakers') {
          this.runnerRig.setSuperSneakersVisible(false);
        } else if (type === 'multiplier') {
          this.stats.multiplier = 1;
        }
      } else {
        stateList.push({
          type,
          duration: state.duration,
          timeLeft: state.timeLeft,
          level: state.level,
        });
      }
    });

    this.callbacks.onPowerUpsUpdate(stateList);

    // Jetpack special behavior
    if (this.activePowerUps.has('jetpack')) {
      const jp = this.activePowerUps.get('jetpack')!;
      // Smoothly fly up to sky altitude 8.5m
      const targetSkyY = jp.timeLeft > 1.5 ? 8.5 : 0;
      this.playerY = THREE.MathUtils.damp(this.playerY, targetSkyY, 4, dt);
      this.currentGroundY = targetSkyY;
      this.particleManager.emitJetpackThruster(this.playerX, this.playerY + 0.6, this.playerZ);
    }
  }

  public activatePowerUp(type: PowerUpType | 'mystery_box') {
    if (type === 'mystery_box') {
      const bonusCoins = Math.floor(Math.random() * 25) + 15;
      this.stats.coins += bonusCoins;
      soundManager.playPowerUpCollect();
      return;
    }

    let baseDuration = 10;
    let level = 1;

    switch (type) {
      case 'magnet':
        level = this.upgrades.magnetLevel;
        baseDuration = 10 + (level - 1) * 3;
        break;
      case 'jetpack':
        level = this.upgrades.jetpackLevel;
        baseDuration = 8 + (level - 1) * 2;
        this.runnerRig.setJetpackVisible(true);
        this.trackManager.spawnSkyCoins(this.playerZ + 15, 35);
        break;
      case 'sneakers':
        level = this.upgrades.sneakersLevel;
        baseDuration = 12 + (level - 1) * 3;
        this.runnerRig.setSuperSneakersVisible(true);
        break;
      case 'multiplier':
        level = this.upgrades.multiplierLevel;
        baseDuration = 14 + (level - 1) * 4;
        this.stats.multiplier = 2;
        break;
    }

    this.activePowerUps.set(type, {
      duration: baseDuration,
      timeLeft: baseDuration,
      level,
    });

    soundManager.playPowerUpCollect();
  }

  private checkCollisions() {
    const isJetpackActive = this.activePowerUps.has('jetpack');
    const pBox = {
      minX: this.playerX - 0.35,
      maxX: this.playerX + 0.35,
      minY: this.playerY,
      maxY: this.playerY + (this.isSliding ? 0.75 : 1.8),
      minZ: this.playerZ - 0.4,
      maxZ: this.playerZ + 0.4,
    };

    // If high up in sky with jetpack, ignore ground obstacles
    if (isJetpackActive && this.playerY > 5.0) return;

    let onTrainRoof = false;

    for (let i = 0; i < this.trackManager.obstacles.length; i++) {
      const obs = this.trackManager.obstacles[i];

      // Check Z overlap
      const obsMinZ = obs.z - (obs.ramp ? 4.5 : 0);
      const obsMaxZ = obs.z + obs.length;
      if (pBox.maxZ < obsMinZ || pBox.minZ > obsMaxZ) continue;

      // Check X lane overlap
      const obsMinX = obs.x - obs.width / 2;
      const obsMaxX = obs.x + obs.width / 2;
      if (pBox.maxX < obsMinX || pBox.minX > obsMaxX) continue;

      // Obstacle Types:
      if (obs.type === 'TRAIN_STATIC' || obs.type === 'TRAIN_RAMP' || obs.type === 'TRAIN_MOVING') {
        // If on roof
        if (this.playerY >= obs.height - 0.2) {
          onTrainRoof = true;
          this.currentGroundY = obs.height;
          continue;
        }

        // If ramp in front
        if (obs.ramp && this.playerZ < obs.z && this.playerZ > obs.z - 4.5) {
          const rampProgress = (this.playerZ - (obs.z - 4.5)) / 4.5;
          const rampY = rampProgress * obs.height;
          if (this.playerY <= rampY + 0.3) {
            this.playerY = rampY;
            this.currentGroundY = rampY;
            onTrainRoof = true;
            continue;
          }
        }

        // Direct Train Front or Side Crash!
        this.triggerCrash();
        return;
      }

      if (obs.type === 'BARRIER_LOW') {
        // Can be jumped over (height 0.85m)
        if (this.playerY < obs.height - 0.1) {
          // Stumble or crash
          this.triggerCrash();
          return;
        }
      }

      if (obs.type === 'BARRIER_HIGH') {
        // Can be slid under (clearance 1.15m)
        if (!this.isSliding || pBox.maxY > 1.2) {
          this.triggerCrash();
          return;
        }
      }

      if (obs.type === 'BARRIER_BUFFER') {
        if (this.playerY < obs.height) {
          this.triggerCrash();
          return;
        }
      }
    }

    if (!onTrainRoof && !isJetpackActive) {
      this.currentGroundY = 0;
    }
  }

  private collectCoins(dt: number) {
    const hasMagnet = this.activePowerUps.has('magnet');
    const magnetRange = 14;

    for (let i = 0; i < this.trackManager.coins.length; i++) {
      const coin = this.trackManager.coins[i];
      if (coin.collected) continue;

      const dz = coin.z - this.playerZ;
      const dx = coin.x - this.playerX;
      const dy = coin.y - this.playerY;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Magnet Pull
      if (hasMagnet && dist < magnetRange && coin.mesh) {
        coin.x = THREE.MathUtils.damp(coin.x, this.playerX, 16, dt);
        coin.y = THREE.MathUtils.damp(coin.y, this.playerY + 0.9, 16, dt);
        coin.mesh.position.set(coin.x, coin.y, coin.z);
      }

      // Collect condition
      if (dist < 1.35) {
        coin.collected = true;
        this.stats.coins += 1;
        this.stats.score += 50 * this.stats.multiplier;
        soundManager.playCoin();
        this.particleManager.emitCoinSparkles(coin.x, coin.y, coin.z);
        this.scene.remove(coin.mesh);
      }
    }

    // Power-up pickups
    for (let i = 0; i < this.trackManager.powerUps.length; i++) {
      const pu = this.trackManager.powerUps[i];
      if (pu.collected) continue;

      const dz = pu.z - this.playerZ;
      const dx = pu.x - this.playerX;
      const dy = pu.y - this.playerY;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 1.5) {
        pu.collected = true;
        this.activatePowerUp(pu.type);
        this.scene.remove(pu.mesh);
      }
    }
  }

  private updateGameLoop(dt: number, time: number) {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Speed progression
    this.currentSpeed = Math.min(this.maxSpeed, this.baseSpeed + (this.stats.distance / 100) * this.speedRampRate);

    // Forward motion
    this.playerZ += this.currentSpeed * dt;
    this.stats.distance = Math.floor(this.playerZ);
    this.stats.score += Math.floor(this.currentSpeed * dt * 4 * this.stats.multiplier);

    // Smooth Lane Interpolation
    const targetX = this.targetLane * TrackManager.LANE_WIDTH;
    this.playerX = THREE.MathUtils.damp(this.playerX, targetX, 18, dt);

    // Slide timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Jump & Gravity Physics
    if (this.isJumping || this.playerY > this.currentGroundY) {
      this.playerY += this.jumpVelocity * dt;
      this.jumpVelocity -= 36 * dt; // Gravity

      if (this.playerY <= this.currentGroundY) {
        this.playerY = this.currentGroundY;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.particleManager.emitFootDust(this.playerX, this.playerY, this.playerZ);
      }
    }

    // Check collisions and collect items
    this.checkCollisions();
    this.collectCoins(dt);
    this.updatePowerUps(dt);

    // Inspector Tension & Chase Kinematics
    if (this.stumbleRecoverTimer > 0) {
      this.stumbleRecoverTimer -= dt;
      if (this.stumbleRecoverTimer <= 0) {
        this.inspectorTargetDist = 6.5; // Falls back to normal distance
        this.callbacks.onInspectorTension(false);
      }
    }
    this.inspectorDistBehind = THREE.MathUtils.damp(this.inspectorDistBehind, this.inspectorTargetDist, 3, dt);

    // Update Character Rigs
    _playerPos.set(this.playerX, this.playerY, this.playerZ);
    this.runnerRig.group.position.copy(_playerPos);

    // Bank body slightly during lane switch
    const laneDeltaX = this.playerX - targetX;
    this.runnerRig.group.rotation.z = -Math.min(Math.max(laneDeltaX * 0.35, -0.4), 0.4);

    const animState =
      this.status === 'GAMEOVER' ? 'CRASH' :
      this.hasHoverboard ? 'HOVER' :
      this.isSliding ? 'SLIDE' :
      this.isJumping ? 'JUMP' : 'RUN';

    this.runnerRig.update(time, this.currentSpeed, animState, dt);

    // Hoverboard particles
    if (this.hasHoverboard) {
      this.particleManager.emitHoverboardSparks(this.playerX, this.playerY, this.playerZ);
    }

    // Inspector and Dog follow directly behind player
    const inspX = THREE.MathUtils.damp(this.inspectorRig.group.position.x, this.playerX, 6, dt);
    const inspZ = this.playerZ - this.inspectorDistBehind;
    this.inspectorRig.group.position.set(inspX - 0.4, this.currentGroundY, inspZ);
    this.inspectorRig.update(time, this.currentSpeed, this.inspectorDistBehind);

    this.dogRig.group.position.set(inspX + 0.65, this.currentGroundY, inspZ + 0.3);
    this.dogRig.update(time, this.currentSpeed);

    // Update track and particles
    this.trackManager.update(this.playerZ, dt, time);
    this.particleManager.update(dt);

    // Camera Follow with dynamic shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShake > 0) {
      shakeX = (Math.random() - 0.5) * this.cameraShake;
      shakeY = (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 8, dt);
    }

    _camPos.set(
      this.playerX * 0.75 + shakeX,
      this.playerY * 0.4 + (this.activePowerUps.has('jetpack') ? 11.0 : 4.6) + shakeY,
      this.playerZ - 6.2
    );
    this.camera.position.lerp(_camPos, 0.18);

    _camTarget.set(this.playerX * 0.3, this.playerY * 0.5 + 2.0, this.playerZ + 8);
    this.camera.lookAt(_camTarget);

    // Notify React HUD
    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  private startLoop() {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Clamp frame delta time
      this.elapsedTime += dt;

      if (this.status === 'TITLE') {
        // Cinematic Title Camera gentle orbit
        const orbitAngle = Math.sin(this.elapsedTime * 0.8) * 0.4;
        this.camera.position.set(Math.sin(orbitAngle) * 4.2, 2.2, -Math.cos(orbitAngle) * 4.2);
        this.camera.lookAt(0, 1.2, 0);
        this.runnerRig.update(this.elapsedTime, 10, 'RUN', dt);
      } else if (this.status === 'PLAYING') {
        this.updateGameLoop(dt, this.elapsedTime);
      } else if (this.status === 'GAMEOVER') {
        // Slow tumble
        this.runnerRig.update(this.elapsedTime, 0, 'CRASH', dt);
        this.particleManager.update(dt);
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private handleResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('touchstart', this.boundTouchStart);
    window.removeEventListener('touchend', this.boundTouchEnd);
    window.removeEventListener('resize', this.boundResize);

    soundManager.stopMusic();
    this.trackManager.dispose();
    this.particleManager.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
