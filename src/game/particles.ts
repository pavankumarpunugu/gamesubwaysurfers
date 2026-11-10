import * as THREE from 'three';

/**
 * High-performance pooled particle system for Subway Surfers:
 * - Coin sparkle bursts
 * - Hoverboard light trail & sparks
 * - Jetpack fire & smoke exhaust
 * - Running foot dust
 * - Crash explosion debris
 */

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export class ParticleManager {
  private static MAX_PARTICLES = 350;
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  public points: THREE.Points;

  private positions: Float32Array;
  private colors: Float32Array;
  private tempVec = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(ParticleManager.MAX_PARTICLES * 3);
    this.colors = new Float32Array(ParticleManager.MAX_PARTICLES * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Circle point sprite texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 0.35,
      map: texture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);

    // Pre-initialize particle pool
    for (let i = 0; i < ParticleManager.MAX_PARTICLES; i++) {
      this.particles.push({
        pos: new THREE.Vector3(0, -999, 0),
        vel: new THREE.Vector3(),
        color: new THREE.Color(),
        size: 0.3,
        alpha: 0,
        life: 0,
        maxLife: 1,
      });
    }
  }

  private spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, hexColor: number, life: number) {
    // Find inactive particle
    const p = this.particles.find(pt => pt.life <= 0);
    if (!p) return;

    p.pos.set(x, y, z);
    p.vel.set(vx, vy, vz);
    p.color.setHex(hexColor);
    p.life = life;
    p.maxLife = life;
    p.alpha = 1;
  }

  public emitCoinSparkles(x: number, y: number, z: number) {
    const goldTones = [0xfde047, 0xfacc15, 0xf59e0b, 0xffffff];
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed + 2;
      const vz = (Math.random() - 0.5) * speed;
      const color = goldTones[Math.floor(Math.random() * goldTones.length)];
      this.spawn(x, y, z, vx, vy, vz, color, Math.random() * 0.35 + 0.2);
    }
  }

  public emitHoverboardSparks(x: number, y: number, z: number, trailHex: number = 0x06b6d4) {
    for (let i = 0; i < 3; i++) {
      const vx = (Math.random() - 0.5) * 1.5;
      const vy = Math.random() * 0.8 + 0.2;
      const vz = -Math.random() * 2 - 1;
      this.spawn(x + (Math.random() - 0.5) * 0.4, y + 0.05, z + (Math.random() - 0.5) * 0.4, vx, vy, vz, trailHex, 0.25);
    }
  }

  public emitJetpackThruster(x: number, y: number, z: number) {
    [-0.14, 0.14].forEach(offset => {
      const colors = [0xff4500, 0xffa500, 0xffff00, 0x60a5fa];
      const col = colors[Math.floor(Math.random() * colors.length)];
      const vx = (Math.random() - 0.5) * 0.6;
      const vy = -Math.random() * 6 - 4;
      const vz = -Math.random() * 4 - 2;
      this.spawn(x + offset, y, z, vx, vy, vz, col, 0.3);
    });
  }

  public emitFootDust(x: number, y: number, z: number) {
    for (let i = 0; i < 2; i++) {
      const vx = (Math.random() - 0.5) * 0.8;
      const vy = Math.random() * 0.4;
      const vz = -Math.random() * 1.5;
      this.spawn(x + (Math.random() - 0.5) * 0.2, y + 0.05, z, vx, vy, vz, 0x94a3b8, 0.2);
    }
  }

  public emitCrashBurst(x: number, y: number, z: number) {
    const crashColors = [0xef4444, 0xf97316, 0xfacc15, 0x38bdf8, 0xffffff];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.2) * Math.PI;
      const speed = Math.random() * 8 + 2;
      const vx = Math.cos(angle) * Math.cos(elevation) * speed;
      const vy = Math.abs(Math.sin(elevation) * speed) + 1.5;
      const vz = Math.sin(angle) * Math.cos(elevation) * speed;
      const color = crashColors[Math.floor(Math.random() * crashColors.length)];
      this.spawn(x, y, z, vx, vy, vz, color, Math.random() * 0.6 + 0.3);
    }
  }

  public update(dt: number) {
    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.geometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.life > 0) {
        p.life -= dt;
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;
        p.pos.z += p.vel.z * dt;

        // Apply slight gravity to non-jetpack particles
        p.vel.y -= 7.5 * dt;

        const progress = Math.max(0, p.life / p.maxLife);
        const idx = i * 3;

        this.positions[idx] = p.pos.x;
        this.positions[idx + 1] = p.pos.y;
        this.positions[idx + 2] = p.pos.z;

        this.colors[idx] = p.color.r * progress;
        this.colors[idx + 1] = p.color.g * progress;
        this.colors[idx + 2] = p.color.b * progress;
      } else {
        const idx = i * 3;
        this.positions[idx + 1] = -999;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
