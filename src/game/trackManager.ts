import * as THREE from 'three';
import { ProceduralTextures } from './proceduralTextures';
import { PowerUpType } from '../types/game';

export interface TrackObstacle {
  id: number;
  type: 'TRAIN_STATIC' | 'TRAIN_RAMP' | 'TRAIN_MOVING' | 'BARRIER_LOW' | 'BARRIER_HIGH' | 'BARRIER_BUFFER';
  lane: number; // -1 (left), 0 (center), 1 (right)
  x: number;
  z: number;
  length: number;
  height: number;
  width: number;
  mesh: THREE.Group;
  speedZ?: number; // for moving trains
  ramp?: boolean;
}

export interface TrackCoin {
  id: number;
  lane: number;
  x: number;
  y: number;
  z: number;
  mesh: THREE.Group;
  collected: boolean;
  baseY: number;
}

export interface TrackPowerUp {
  id: number;
  type: PowerUpType | 'mystery_box';
  lane: number;
  x: number;
  y: number;
  z: number;
  mesh: THREE.Group;
  collected: boolean;
  baseY: number;
}

export class TrackManager {
  public static readonly LANE_WIDTH = 2.2;
  public static readonly SEGMENT_LENGTH = 50;
  public static readonly ACTIVE_SEGMENTS = 7;

  private scene: THREE.Scene;
  private segmentGroups: THREE.Group[] = [];
  public obstacles: TrackObstacle[] = [];
  public coins: TrackCoin[] = [];
  public powerUps: TrackPowerUp[] = [];

  private nextObstacleId = 1;
  private nextCoinId = 1;
  private nextPowerUpId = 1;

  // Shared Geometries & Materials
  private railMaterial: THREE.MeshStandardMaterial;
  private tieMaterial: THREE.MeshStandardMaterial;
  private ballastMaterial: THREE.MeshStandardMaterial;
  private wallMaterial: THREE.MeshStandardMaterial;
  private gantryMaterial: THREE.MeshStandardMaterial;
  private coinGeometry: THREE.CylinderGeometry;
  private coinMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Materials
    this.railMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.2,
    });

    this.tieMaterial = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getRailTiesTexture(),
      roughness: 0.8,
      metalness: 0.1,
    });

    this.ballastMaterial = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getBallastTexture(),
      roughness: 0.9,
      metalness: 0.05,
    });

    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getBrickWallTexture(),
      roughness: 0.85,
    });

    this.gantryMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.3,
    });

    this.coinGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    this.coinGeometry.rotateX(Math.PI / 2);
    this.coinMaterial = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getCoinTexture(),
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0xd97706,
      emissiveIntensity: 0.2,
    });

    this.initSegments();
  }

  private initSegments() {
    for (let i = 0; i < TrackManager.ACTIVE_SEGMENTS; i++) {
      const zOffset = i * TrackManager.SEGMENT_LENGTH;
      const segment = this.createSegmentMesh(zOffset);
      this.segmentGroups.push(segment);
      this.scene.add(segment);

      // Populate obstacles & items (skip the first 2 segments so player has clean runway to start)
      if (i >= 2) {
        this.populateSegment(zOffset);
      }
    }
  }

  /**
   * Builds the 3D ground, rails, ties, walls, and overhead catenary gantries for one track segment
   */
  private createSegmentMesh(zOffset: number): THREE.Group {
    const group = new THREE.Group();
    group.position.z = zOffset;

    const len = TrackManager.SEGMENT_LENGTH;
    const halfLen = len / 2;

    // 1. Ballast Bed (Gravel ground)
    const groundGeo = new THREE.PlaneGeometry(12, len);
    groundGeo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeo, this.ballastMaterial);
    ground.position.set(0, 0, halfLen);
    ground.receiveShadow = true;
    group.add(ground);

    // 2. Concrete Trackside Barriers / Curbs
    const curbGeo = new THREE.BoxGeometry(0.5, 0.4, len);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    [-5.2, 5.2].forEach(x => {
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(x, 0.2, halfLen);
      curb.receiveShadow = true;
      group.add(curb);
    });

    // 3. Side City / Tunnel Walls
    const wallGeo = new THREE.BoxGeometry(0.8, 6.0, len);
    [-5.8, 5.8].forEach(x => {
      const wall = new THREE.Mesh(wallGeo, this.wallMaterial);
      wall.position.set(x, 3.0, halfLen);
      wall.receiveShadow = true;
      group.add(wall);
    });

    // 4. Three Track Sets (Left, Center, Right)
    const laneOffsets = [-TrackManager.LANE_WIDTH, 0, TrackManager.LANE_WIDTH];
    const railGeo = new THREE.BoxGeometry(0.08, 0.12, len);

    laneOffsets.forEach(lx => {
      // Two metal rails per lane
      [-0.45, 0.45].forEach(rx => {
        const rail = new THREE.Mesh(railGeo, this.railMaterial);
        rail.position.set(lx + rx, 0.08, halfLen);
        rail.receiveShadow = true;
        group.add(rail);
      });

      // Wooden Ties spaced every 1.6m
      const tieGeo = new THREE.BoxGeometry(1.2, 0.06, 0.26);
      for (let tz = 1; tz < len; tz += 1.6) {
        const tie = new THREE.Mesh(tieGeo, this.tieMaterial);
        tie.position.set(lx, 0.03, tz);
        tie.receiveShadow = true;
        group.add(tie);
      }
    });

    // 5. Overhead Catenary Power Gantries (1 per segment)
    const gantry = this.createGantry();
    gantry.position.set(0, 0, halfLen);
    group.add(gantry);

    return group;
  }

  private createGantry(): THREE.Group {
    const gantry = new THREE.Group();
    // Two vertical steel pillars
    const pillarGeo = new THREE.BoxGeometry(0.25, 5.5, 0.25);
    [-5.0, 5.0].forEach(x => {
      const pillar = new THREE.Mesh(pillarGeo, this.gantryMaterial);
      pillar.position.set(x, 2.75, 0);
      pillar.castShadow = true;
      gantry.add(pillar);
    });

    // Crossbeam spanning all 3 tracks
    const beamGeo = new THREE.BoxGeometry(10.2, 0.35, 0.35);
    const beam = new THREE.Mesh(beamGeo, this.gantryMaterial);
    beam.position.set(0, 5.2, 0);
    beam.castShadow = true;
    gantry.add(beam);

    // Overhead power wire insulators and signal lights
    [-TrackManager.LANE_WIDTH, 0, TrackManager.LANE_WIDTH].forEach(x => {
      const dropArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), this.gantryMaterial);
      dropArm.position.set(x, 4.6, 0);
      const signalLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x22c55e }) // green signal
      );
      signalLight.position.set(x, 4.2, 0.2);
      gantry.add(dropArm, signalLight);
    });

    return gantry;
  }

  /**
   * Generates varied obstacles, train cars, ramps, and coin clusters in a segment
   */
  public populateSegment(zOffset: number) {
    const len = TrackManager.SEGMENT_LENGTH;
    const availableLanes = [-1, 0, 1];

    // Difficulty scaling based on distance
    const dist = Math.max(0, zOffset);
    const difficulty = Math.min(1.0, dist / 2500);

    // Choose 1 or 2 obstacle zones in this segment
    const zonePositions = [zOffset + 12, zOffset + 34];

    zonePositions.forEach((zoneZ) => {
      // Pick 1 to 2 lanes to place obstacles (always leave at least 1 open escape route)
      const shuffledLanes = [...availableLanes].sort(() => Math.random() - 0.5);
      const obstacleCount = Math.random() < 0.45 + difficulty * 0.35 ? 2 : 1;

      for (let i = 0; i < obstacleCount; i++) {
        const lane = shuffledLanes[i];
        const laneX = lane * TrackManager.LANE_WIDTH;

        const rand = Math.random();

        if (rand < 0.42) {
          // SUBWAY TRAIN (Stationary or with Ramp or Moving)
          const isRamp = Math.random() < 0.35;
          const isMoving = !isRamp && Math.random() < 0.3 + difficulty * 0.3;
          this.spawnTrain(lane, laneX, zoneZ, isRamp, isMoving);
        } else if (rand < 0.7) {
          // LOW BARRIER (Must jump over)
          this.spawnLowBarrier(lane, laneX, zoneZ);
        } else if (rand < 0.88) {
          // HIGH BARRIER (Must slide/roll under)
          this.spawnHighBarrier(lane, laneX, zoneZ);
        } else {
          // BUFFER BARRICADE (Dodge left/right)
          this.spawnBufferBarricade(lane, laneX, zoneZ);
        }
      }

      // Populate open lanes with coins or power-ups
      const openLane = shuffledLanes[obstacleCount];
      if (openLane !== undefined) {
        const openX = openLane * TrackManager.LANE_WIDTH;
        if (Math.random() < 0.22) {
          this.spawnPowerUp(openLane, openX, zoneZ);
        } else {
          this.spawnCoinRow(openLane, openX, zoneZ - 6, 6);
        }
      }
    });

    // Additional coin row between zones
    const midLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    this.spawnCoinRow(midLane, midLane * TrackManager.LANE_WIDTH, zOffset + 22, 5);
  }

  /**
   * Spawns a full 3D subway train car (with cabin, windows, graffiti, headlights, and optional ramp)
   */
  private spawnTrain(lane: number, x: number, z: number, hasRamp: boolean, isMoving: boolean) {
    const trainGroup = new THREE.Group();
    trainGroup.position.set(x, 0, z);

    const theme = (lane === -1 ? 'red' : lane === 0 ? 'green' : 'blue') as 'red' | 'green' | 'blue';
    const trainLen = 14;
    const trainH = 3.2;
    const trainW = 1.9;

    // Train Body
    const bodyGeo = new THREE.BoxGeometry(trainW, trainH, trainLen);
    const bodyMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getTrainSideTexture(theme),
      roughness: 0.4,
      metalness: 0.5,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, trainH / 2, trainLen / 2);
    body.castShadow = true;
    body.receiveShadow = true;
    trainGroup.add(body);

    // Front Cab Face
    const frontGeo = new THREE.PlaneGeometry(trainW, trainH);
    const frontMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getTrainFrontTexture(theme),
      roughness: 0.3,
      metalness: 0.4,
    });
    const front = new THREE.Mesh(frontGeo, frontMat);
    front.position.set(0, trainH / 2, -0.01);
    front.rotation.y = Math.PI; // Face the oncoming player
    trainGroup.add(front);

    // Train Headlight Glows (Spotlights/pointlights for moving trains)
    if (isMoving) {
      const leftLight = new THREE.PointLight(0xfef08a, 2.5, 18);
      leftLight.position.set(-0.5, 1.8, -1.0);
      const rightLight = new THREE.PointLight(0xfef08a, 2.5, 18);
      rightLight.position.set(0.5, 1.8, -1.0);
      trainGroup.add(leftLight, rightLight);
    }

    // Roof AC / Ventilation Units
    const acGeo = new THREE.BoxGeometry(1.2, 0.3, 1.8);
    const acMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
    [3.0, 7.0, 11.0].forEach(acZ => {
      const ac = new THREE.Mesh(acGeo, acMat);
      ac.position.set(0, trainH + 0.15, acZ);
      ac.castShadow = true;
      trainGroup.add(ac);
    });

    // Optional Front Wooden Surfing Ramp
    if (hasRamp) {
      const rampGeo = new THREE.BufferGeometry();
      const hw = trainW / 2;
      const rampLen = 4.5;
      // Sloped wedge vertices
      const vertices = new Float32Array([
        // Front base
        -hw, 0, -rampLen,
        hw, 0, -rampLen,
        hw, trainH, 0,
        -hw, 0, -rampLen,
        hw, trainH, 0,
        -hw, trainH, 0,
        // Sides
        -hw, 0, -rampLen,
        -hw, trainH, 0,
        -hw, 0, 0,
        hw, 0, -rampLen,
        hw, 0, 0,
        hw, trainH, 0,
      ]);
      rampGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      rampGeo.computeVertexNormals();

      const rampMat = new THREE.MeshStandardMaterial({
        map: ProceduralTextures.getCautionStripeTexture(),
        roughness: 0.6,
        metalness: 0.2,
      });
      const rampMesh = new THREE.Mesh(rampGeo, rampMat);
      rampMesh.castShadow = true;
      rampMesh.receiveShadow = true;
      trainGroup.add(rampMesh);

      // Coins along the train roof to reward ramping onto it!
      for (let rz = 2; rz < trainLen; rz += 2.2) {
        this.spawnSingleCoin(lane, x, trainH + 0.6, z + rz);
      }
    }

    this.scene.add(trainGroup);

    this.obstacles.push({
      id: this.nextObstacleId++,
      type: hasRamp ? 'TRAIN_RAMP' : isMoving ? 'TRAIN_MOVING' : 'TRAIN_STATIC',
      lane,
      x,
      z,
      length: trainLen + (hasRamp ? 4.5 : 0),
      height: trainH,
      width: trainW,
      mesh: trainGroup,
      speedZ: isMoving ? -12 : 0,
      ramp: hasRamp,
    });
  }

  /**
   * Spawns a low hurdle barrier (must JUMP over)
   */
  private spawnLowBarrier(lane: number, x: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const barW = 2.0;
    const barH = 0.85;

    // Caution striped crossboard
    const boardGeo = new THREE.BoxGeometry(barW, 0.4, 0.12);
    const boardMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getCautionStripeTexture(),
      roughness: 0.5,
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, barH - 0.2, 0);
    board.castShadow = true;
    group.add(board);

    // Two support legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, barH, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    [-0.85, 0.85].forEach(lx => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, barH / 2, 0);
      leg.castShadow = true;
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.45), legMat);
      base.position.set(lx, 0.04, 0);
      group.add(leg, base);
    });

    this.scene.add(group);

    this.obstacles.push({
      id: this.nextObstacleId++,
      type: 'BARRIER_LOW',
      lane,
      x,
      z,
      length: 0.6,
      height: barH,
      width: barW,
      mesh: group,
    });

    // Parabolic coin arch over the low barrier to reward jumping!
    const archCoins = [-2.2, 0, 2.2];
    archCoins.forEach(offsetZ => {
      const coinY = offsetZ === 0 ? 2.4 : 1.6;
      this.spawnSingleCoin(lane, x, coinY, z + offsetZ);
    });
  }

  /**
   * Spawns a high construction clearance barrier (must SLIDE / ROLL under)
   */
  private spawnHighBarrier(lane: number, x: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const frameW = 2.1;
    const totalH = 2.5;
    const clearanceH = 1.15; // Player slides under this clearance

    // Overhead "KEEP OUT" caution board
    const signGeo = new THREE.BoxGeometry(frameW, 1.2, 0.16);
    const signMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getCautionStripeTexture(),
      roughness: 0.4,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, clearanceH + 0.6, 0);
    sign.castShadow = true;
    group.add(sign);

    // Side metal scaffold poles
    const poleGeo = new THREE.CylinderGeometry(0.07, 0.07, totalH, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
    [-0.95, 0.95].forEach(lx => {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(lx, totalH / 2, 0);
      pole.castShadow = true;
      group.add(pole);
    });

    this.scene.add(group);

    this.obstacles.push({
      id: this.nextObstacleId++,
      type: 'BARRIER_HIGH',
      lane,
      x,
      z,
      length: 0.6,
      height: totalH,
      width: frameW,
      mesh: group,
    });

    // Low coins underneath the high barrier to reward sliding!
    [-1.5, 0, 1.5].forEach(offsetZ => {
      this.spawnSingleCoin(lane, x, 0.45, z + offsetZ);
    });
  }

  /**
   * Spawns a solid buffer barricade / stop block (must DODGE left or right)
   */
  private spawnBufferBarricade(lane: number, x: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const blockW = 1.9;
    const blockH = 1.8;

    const blockGeo = new THREE.BoxGeometry(blockW, blockH, 0.8);
    const blockMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getCautionStripeTexture(),
      roughness: 0.7,
    });
    const block = new THREE.Mesh(blockGeo, blockMat);
    block.position.set(0, blockH / 2, 0);
    block.castShadow = true;
    group.add(block);

    // Flashing red warning hazard lamp on top
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    lamp.position.set(0, blockH + 0.16, 0);
    group.add(lamp);

    this.scene.add(group);

    this.obstacles.push({
      id: this.nextObstacleId++,
      type: 'BARRIER_BUFFER',
      lane,
      x,
      z,
      length: 1.0,
      height: blockH,
      width: blockW,
      mesh: group,
    });
  }

  /**
   * Spawns a single spinning 3D coin
   */
  private spawnSingleCoin(lane: number, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.scene.add(mesh as unknown as THREE.Group);

    this.coins.push({
      id: this.nextCoinId++,
      lane,
      x,
      y,
      z,
      mesh: mesh as unknown as THREE.Group,
      collected: false,
      baseY: y,
    });
  }

  /**
   * Spawns a line of consecutive coins along a track
   */
  public spawnCoinRow(lane: number, x: number, startZ: number, count: number = 6, y: number = 0.8) {
    for (let i = 0; i < count; i++) {
      this.spawnSingleCoin(lane, x, y, startZ + i * 2.0);
    }
  }

  /**
   * Spawns high-altitude coin trails for Jetpack flight
   */
  public spawnSkyCoins(startZ: number, count: number = 30) {
    const skyY = 8.5; // High in the sky above trains
    for (let i = 0; i < count; i++) {
      const z = startZ + i * 2.2;
      const waveLane = Math.sin(i * 0.4); // gentle S-curve across lanes
      const x = waveLane * TrackManager.LANE_WIDTH;
      this.spawnSingleCoin(0, x, skyY, z);
    }
  }

  /**
   * Spawns a 3D power-up crate or icon
   */
  private spawnPowerUp(lane: number, x: number, z: number) {
    const types: (PowerUpType | 'mystery_box')[] = ['magnet', 'jetpack', 'sneakers', 'multiplier', 'mystery_box'];
    const type = types[Math.floor(Math.random() * types.length)];

    const group = new THREE.Group();
    const y = 1.1;
    group.position.set(x, y, z);

    if (type === 'mystery_box') {
      // Mystery crate
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6, metalness: 0.2 })
      );
      box.castShadow = true;
      group.add(box);
    } else {
      // Glowing spherical orb with floating power-up emblem
      const orbColor =
        type === 'magnet' ? 0xef4444 :
        type === 'jetpack' ? 0xf59e0b :
        type === 'sneakers' ? 0xec4899 : 0x3b82f6;

      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 16, 16),
        new THREE.MeshStandardMaterial({
          color: orbColor,
          emissive: orbColor,
          emissiveIntensity: 0.6,
          metalness: 0.8,
          roughness: 0.2,
        })
      );
      orb.castShadow = true;

      // Orbiting energy ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.05, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      ring.rotation.x = Math.PI / 3;
      group.add(orb, ring);
    }

    this.scene.add(group);

    this.powerUps.push({
      id: this.nextPowerUpId++,
      type,
      lane,
      x,
      y,
      z,
      mesh: group,
      collected: false,
      baseY: y,
    });
  }

  /**
   * Update loop: spins coins, moves oncoming trains, recycles distant segments
   */
  public update(playerZ: number, dt: number, time: number) {
    // 1. Move oncoming trains
    this.obstacles.forEach(obs => {
      if (obs.speedZ && obs.mesh) {
        obs.z += obs.speedZ * dt;
        obs.mesh.position.z = obs.z;
      }
    });

    // 2. Rotate & bob active coins
    const coinRot = time * 4.5;
    this.coins.forEach(coin => {
      if (!coin.collected && coin.mesh) {
        coin.mesh.rotation.z = coinRot;
        coin.mesh.position.y = coin.baseY + Math.sin(time * 6 + coin.z * 0.1) * 0.08;
      }
    });

    // 3. Rotate & float active power-ups
    const puRot = time * 3.0;
    this.powerUps.forEach(pu => {
      if (!pu.collected && pu.mesh) {
        pu.mesh.rotation.y = puRot;
        pu.mesh.position.y = pu.baseY + Math.sin(time * 4) * 0.15;
      }
    });

    // 4. Recycle segments that have fallen far behind player
    const recycleThreshold = playerZ - TrackManager.SEGMENT_LENGTH - 10;
    for (let i = 0; i < this.segmentGroups.length; i++) {
      const seg = this.segmentGroups[i];
      if (seg.position.z < recycleThreshold) {
        // Find furthest segment Z
        let maxZ = 0;
        this.segmentGroups.forEach(s => {
          if (s.position.z > maxZ) maxZ = s.position.z;
        });

        const newZ = maxZ + TrackManager.SEGMENT_LENGTH;
        seg.position.z = newZ;

        // Clean up old obstacles/coins/powerups in that recycled zone
        this.cleanupBehind(playerZ - 20);

        // Populate new obstacles/coins in the forward segment
        this.populateSegment(newZ);
      }
    }
  }

  /**
   * Cleans up obstacles, coins, and power-ups that are well behind the player
   */
  private cleanupBehind(minZ: number) {
    // Cleanup obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.z + obs.length < minZ) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    // Cleanup coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin.z < minZ || coin.collected) {
        this.scene.remove(coin.mesh);
        this.coins.splice(i, 1);
      }
    }

    // Cleanup powerups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      if (pu.z < minZ || pu.collected) {
        this.scene.remove(pu.mesh);
        this.powerUps.splice(i, 1);
      }
    }
  }

  public reset() {
    // Remove all obstacles, coins, powerups
    this.obstacles.forEach(o => this.scene.remove(o.mesh));
    this.coins.forEach(c => this.scene.remove(c.mesh));
    this.powerUps.forEach(p => this.scene.remove(p.mesh));
    this.obstacles = [];
    this.coins = [];
    this.powerUps = [];

    // Reset segment positions
    for (let i = 0; i < this.segmentGroups.length; i++) {
      const zOffset = i * TrackManager.SEGMENT_LENGTH;
      this.segmentGroups[i].position.z = zOffset;
      if (i >= 2) {
        this.populateSegment(zOffset);
      }
    }
  }

  public dispose() {
    this.reset();
    this.segmentGroups.forEach(s => this.scene.remove(s));
    this.segmentGroups = [];
    this.railMaterial.dispose();
    this.tieMaterial.dispose();
    this.ballastMaterial.dispose();
    this.wallMaterial.dispose();
    this.gantryMaterial.dispose();
    this.coinGeometry.dispose();
    this.coinMaterial.dispose();
  }
}
