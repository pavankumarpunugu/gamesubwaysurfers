import * as THREE from 'three';

/**
 * Procedural Canvas Textures for Subway Surfers 3D.
 * Generated via HTML5 Canvas (100% offline, zero 404s, sharp & vibrant).
 */

export class ProceduralTextures {
  private static cachedTextures = new Map<string, THREE.CanvasTexture>();

  /**
   * Track Ballast (Gravel & stones between rails)
   */
  public static getBallastTexture(): THREE.CanvasTexture {
    if (this.cachedTextures.has('ballast')) {
      return this.cachedTextures.get('ballast')!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dark gravel tone
    ctx.fillStyle = '#2d2d34';
    ctx.fillRect(0, 0, 512, 512);

    // Stone flecks
    const colors = ['#3f3f46', '#27272a', '#52525b', '#18181b', '#71717a'];
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 3 + 1;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dirt & track oil streaks
    ctx.fillStyle = 'rgba(20, 20, 22, 0.4)';
    ctx.fillRect(100, 0, 40, 512);
    ctx.fillRect(372, 0, 40, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 8);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cachedTextures.set('ballast', texture);
    return texture;
  }

  /**
   * Wooden Ties & Metal Fasteners
   */
  public static getRailTiesTexture(): THREE.CanvasTexture {
    if (this.cachedTextures.has('ties')) {
      return this.cachedTextures.get('ties')!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Rich dark brown creosote wood
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(0, 0, 256, 256);

    // Woodgrain lines
    ctx.strokeStyle = '#271810';
    ctx.lineWidth = 1.5;
    for (let y = 10; y < 250; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y + (Math.random() * 4 - 2));
      ctx.bezierCurveTo(80, y + Math.random() * 6, 180, y - Math.random() * 6, 256, y);
      ctx.stroke();
    }

    // Steel plates under rail positions
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(35, 60, 30, 136);
    ctx.fillRect(191, 60, 30, 136);

    // Bolts
    ctx.fillStyle = '#78716c';
    [45, 201].forEach(x => {
      [80, 128, 176].forEach(y => {
        ctx.beginPath();
        ctx.arc(x + 5, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cachedTextures.set('ties', texture);
    return texture;
  }

  /**
   * Yellow & Black Hazard Caution Stripes
   */
  public static getCautionStripeTexture(): THREE.CanvasTexture {
    if (this.cachedTextures.has('caution')) {
      return this.cachedTextures.get('caution')!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#facc15'; // Bright hazard yellow
    ctx.fillRect(0, 0, 256, 128);

    ctx.fillStyle = '#18181b'; // Deep dark black
    const stripeWidth = 28;
    for (let x = -150; x < 400; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth + 64, 128);
      ctx.lineTo(x + 64, 128);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cachedTextures.set('caution', texture);
    return texture;
  }

  /**
   * Subway Train Side: Metallic brushed steel, colorful racing stripes, passenger windows, and graffiti!
   */
  public static getTrainSideTexture(theme: 'red' | 'green' | 'blue' = 'red'): THREE.CanvasTexture {
    const key = `train_side_${theme}`;
    if (this.cachedTextures.has(key)) {
      return this.cachedTextures.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Metallic silver / brushed stainless steel base
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#d1d5db');
    grad.addColorStop(0.3, '#f3f4f6');
    grad.addColorStop(0.7, '#9ca3af');
    grad.addColorStop(1, '#6b7280');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Corrugated metal horizontal ridges
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    for (let y = 140; y < 240; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Bold Subway Surfers racing stripe
    const primaryColor = theme === 'red' ? '#ef4444' : theme === 'green' ? '#10b981' : '#3b82f6';
    const accentColor = theme === 'red' ? '#f59e0b' : theme === 'green' ? '#eab308' : '#06b6d4';

    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 80, 512, 36);
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 116, 512, 10);

    // Passenger Windows
    for (let i = 0; i < 4; i++) {
      const wx = 30 + i * 115;
      // Window frame
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.roundRect(wx, 20, 80, 52, 6);
      ctx.fill();

      // Window glass (interior warm glow or cool tint reflection)
      const winGrad = ctx.createLinearGradient(wx, 22, wx, 70);
      winGrad.addColorStop(0, '#fef08a');
      winGrad.addColorStop(0.6, '#38bdf8');
      winGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = winGrad;
      ctx.beginPath();
      ctx.roundRect(wx + 4, 24, 72, 44, 4);
      ctx.fill();

      // Window reflection diagonal glint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(wx + 10, 24);
      ctx.lineTo(wx + 30, 24);
      ctx.lineTo(wx + 15, 68);
      ctx.lineTo(wx + 4, 68);
      ctx.closePath();
      ctx.fill();
    }

    // Subway Surfers Graffiti Art Tag!
    ctx.save();
    ctx.translate(140, 175);
    ctx.rotate(-0.06);

    // Spray drop shadows
    ctx.font = '900 38px "Titan One", "Arial Black", cursive';
    ctx.fillStyle = '#09090b';
    ctx.fillText('SUBWAY', 2, 2);
    ctx.fillText('SURF', 180, 2);

    // Colorful graffiti fill
    const textGrad = ctx.createLinearGradient(0, -30, 0, 10);
    textGrad.addColorStop(0, '#f43f5e');
    textGrad.addColorStop(0.5, '#fbbf24');
    textGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = textGrad;
    ctx.fillText('SUBWAY', 0, 0);
    ctx.fillText('SURF', 178, 0);

    // Crown tag
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(85, -40);
    ctx.lineTo(75, -28);
    ctx.lineTo(95, -34);
    ctx.lineTo(105, -28);
    ctx.lineTo(115, -34);
    ctx.lineTo(135, -28);
    ctx.lineTo(125, -40);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cachedTextures.set(key, texture);
    return texture;
  }

  /**
   * Train Front Cabin (windshield, destination sign, twin lights)
   */
  public static getTrainFrontTexture(theme: 'red' | 'green' | 'blue' = 'red'): THREE.CanvasTexture {
    const key = `train_front_${theme}`;
    if (this.cachedTextures.has(key)) {
      return this.cachedTextures.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Train cabin face
    const primaryColor = theme === 'red' ? '#dc2626' : theme === 'green' ? '#059669' : '#2563eb';
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, 256, 256);

    // Destination Sign (e.g. SUBWAY EXPRESS)
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.roundRect(40, 16, 176, 28, 4);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SURF CITY EXP', 128, 36);

    // Large windshield
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(28, 54, 200, 78, 8);
    ctx.fill();

    const glassGrad = ctx.createLinearGradient(28, 56, 28, 130);
    glassGrad.addColorStop(0, '#38bdf8');
    glassGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.roundRect(32, 58, 192, 70, 6);
    ctx.fill();

    // Twin High-Intensity Train Headlights
    [64, 192].forEach(lx => {
      // Chrome casing
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(lx, 175, 20, 0, Math.PI * 2);
      ctx.fill();

      // Glowing lens
      const lightGrad = ctx.createRadialGradient(lx, 175, 2, lx, 175, 17);
      lightGrad.addColorStop(0, '#ffffff');
      lightGrad.addColorStop(0.6, '#fef08a');
      lightGrad.addColorStop(1, '#eab308');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(lx, 175, 16, 0, Math.PI * 2);
      ctx.fill();
    });

    // Lower front grill / cowcatcher warning stripes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(30, 215, 196, 30);
    ctx.fillStyle = '#18181b';
    for (let x = 30; x < 226; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 215);
      ctx.lineTo(x + 12, 215);
      ctx.lineTo(x + 22, 245);
      ctx.lineTo(x + 10, 245);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cachedTextures.set(key, texture);
    return texture;
  }

  /**
   * Shiny Embossed Golden Coin Texture
   */
  public static getCoinTexture(): THREE.CanvasTexture {
    if (this.cachedTextures.has('coin')) {
      return this.cachedTextures.get('coin')!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Gold rim
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.5, '#fbbf24');
    grad.addColorStop(0.85, '#d97706');
    grad.addColorStop(1, '#92400e');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    // Inner bevel ring
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 64, 48, 0, Math.PI * 2);
    ctx.stroke();

    // Embossed Star in center
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    const cx = 64, cy = 64, spikes = 5, outerR = 30, innerR = 14;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cachedTextures.set('coin', texture);
    return texture;
  }

  /**
   * Tunnel Brick Wall with Urban Graffiti
   */
  public static getBrickWallTexture(): THREE.CanvasTexture {
    if (this.cachedTextures.has('brick_wall')) {
      return this.cachedTextures.get('brick_wall')!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Mortar color
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, 512, 256);

    // Bricks
    const brickH = 22;
    const brickW = 48;
    for (let y = 2; y < 256; y += brickH + 3) {
      const row = Math.floor(y / (brickH + 3));
      const offsetX = (row % 2 === 0) ? 0 : -(brickW / 2);
      for (let x = offsetX; x < 512 + brickW; x += brickW + 3) {
        // Natural brick variation
        const shade = Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgb(${140 + shade}, ${45 + shade / 2}, ${35 + shade / 2})`;
        ctx.fillRect(x, y, brickW, brickH);
      }
    }

    // Graffiti mural on brick
    ctx.save();
    ctx.font = 'bold 36px "Titan One", Impact, sans-serif';
    ctx.fillStyle = 'rgba(234, 179, 8, 0.85)';
    ctx.fillText('STAY WILD', 40, 120);

    ctx.font = 'bold 28px "Titan One", Impact, sans-serif';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.fillText('SURF!', 290, 160);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cachedTextures.set('brick_wall', texture);
    return texture;
  }
}
