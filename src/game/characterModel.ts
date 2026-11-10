import * as THREE from 'three';
import { CharacterConfig, HoverboardConfig } from '../types/game';

/**
 * Procedural composite 3D character rigs for Subway Surfers:
 * - Runner (Jake / Tricky / Fresh) with animated limbs, backwards cap, hoodie, and shoes
 * - Inspector with police uniform, peaked cap, and mustache
 * - Pitbull Dog with spiked collar, wagging tail, and 4-legged gallop
 */

export interface RunnerRig {
  group: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftSneaker: THREE.Group;
  rightSneaker: THREE.Group;
  hoverboardMesh: THREE.Group;
  jetpackMesh: THREE.Group;
  superSneakersMesh: THREE.Group;
  sprayCanMesh: THREE.Group;
  update: (time: number, speed: number, state: 'RUN' | 'JUMP' | 'SLIDE' | 'HOVER' | 'CRASH', dt: number) => void;
  setHoverboardVisible: (visible: boolean, config?: HoverboardConfig) => void;
  setJetpackVisible: (visible: boolean) => void;
  setSuperSneakersVisible: (visible: boolean) => void;
  resetPose: () => void;
}

export interface InspectorRig {
  group: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  update: (time: number, speed: number, distanceBehind: number) => void;
}

export interface DogRig {
  group: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  tail: THREE.Group;
  frontLeftLeg: THREE.Group;
  frontRightLeg: THREE.Group;
  backLeftLeg: THREE.Group;
  backRightLeg: THREE.Group;
  update: (time: number, speed: number) => void;
}

/**
 * Creates the Surfer character rig
 */
export function createRunnerRig(config: CharacterConfig): RunnerRig {
  const root = new THREE.Group();
  root.name = 'RunnerRoot';

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: config.skinColor,
    roughness: 0.6,
    metalness: 0.05,
  });

  const hoodieMat = new THREE.MeshStandardMaterial({
    color: config.shirtColor,
    roughness: 0.7,
    metalness: 0.05,
  });

  const capMat = new THREE.MeshStandardMaterial({
    color: config.hatColor,
    roughness: 0.5,
    metalness: 0.1,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: config.pantsColor,
    roughness: 0.8,
    metalness: 0.05,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: config.shoesColor,
    roughness: 0.4,
    metalness: 0.1,
  });

  const whiteSoleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.05,
  });

  // Base pivot at ground (y=0)
  const pelvis = new THREE.Group();
  pelvis.position.y = 0.85; // Hip height
  root.add(pelvis);

  // 1. Torso
  const torso = new THREE.Group();
  pelvis.add(torso);

  // Hoodie body
  const bodyGeo = new THREE.BoxGeometry(0.52, 0.6, 0.32);
  const bodyMesh = new THREE.Mesh(bodyGeo, hoodieMat);
  bodyMesh.position.y = 0.3;
  bodyMesh.castShadow = true;
  torso.add(bodyMesh);

  // Hoodie pocket & zipper accent
  const pocketGeo = new THREE.BoxGeometry(0.38, 0.18, 0.04);
  const pocketMat = new THREE.MeshStandardMaterial({ color: config.shirtColor, roughness: 0.9 });
  const pocketMesh = new THREE.Mesh(pocketGeo, pocketMat);
  pocketMesh.position.set(0, 0.18, 0.17);
  torso.add(pocketMesh);

  // Collar / hood ring
  const hoodRingGeo = new THREE.TorusGeometry(0.2, 0.06, 8, 16);
  const hoodRing = new THREE.Mesh(hoodRingGeo, hoodieMat);
  hoodRing.rotation.x = Math.PI / 2;
  hoodRing.position.set(0, 0.6, -0.05);
  torso.add(hoodRing);

  // 2. Head & Cap
  const head = new THREE.Group();
  head.position.set(0, 0.68, 0);
  torso.add(head);

  // Stylized head
  const headGeo = new THREE.SphereGeometry(0.22, 16, 14);
  headGeo.scale(1, 1.1, 1);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Backwards baseball cap
  const capCrownGeo = new THREE.SphereGeometry(0.23, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const capCrown = new THREE.Mesh(capCrownGeo, capMat);
  capCrown.position.set(0, 0.08, 0);
  capCrown.rotation.x = 0.15; // tilted back
  head.add(capCrown);

  // Cap Visor pointing backward
  const visorShape = new THREE.Shape();
  visorShape.moveTo(-0.16, 0);
  visorShape.quadraticCurveTo(0, -0.22, 0.16, 0);
  visorShape.lineTo(-0.16, 0);
  const visorGeo = new THREE.ExtrudeGeometry(visorShape, { depth: 0.03, bevelEnabled: false });
  const visorMesh = new THREE.Mesh(visorGeo, capMat);
  visorMesh.rotation.x = Math.PI / 2 + 0.1;
  visorMesh.position.set(0, 0.06, -0.16);
  head.add(visorMesh);

  // Cute cartoon sunglasses / eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
  [-0.08, 0.08].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    eye.position.set(x, 0.04, 0.2);
    head.add(eye);
  });

  // 3. Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.32, 0.52, 0);
  torso.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.32, 0.52, 0);
  torso.add(rightArm);

  const armGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.45, 10);
  const leftArmMesh = new THREE.Mesh(armGeo, hoodieMat);
  leftArmMesh.position.y = -0.2;
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);

  const rightArmMesh = new THREE.Mesh(armGeo, hoodieMat);
  rightArmMesh.position.y = -0.2;
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  // Hands
  const handGeo = new THREE.SphereGeometry(0.07, 8, 8);
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.y = -0.44;
  leftArm.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.y = -0.44;
  rightArm.add(rightHand);

  // Spray can in right hand (iconic Subway Surfers graffiti prop)
  const sprayCanMesh = new THREE.Group();
  const canBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.16, 12),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.3 })
  );
  const canTip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.04, 8),
    new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.2, roughness: 0.4 })
  );
  canTip.position.y = 0.1;
  sprayCanMesh.add(canBody, canTip);
  sprayCanMesh.position.set(0, -0.44, 0.08);
  sprayCanMesh.rotation.x = Math.PI / 4;
  rightArm.add(sprayCanMesh);

  // 4. Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0, 0);
  pelvis.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0, 0);
  pelvis.add(rightLeg);

  const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.52, 10);
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
  leftLegMesh.position.y = -0.26;
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);

  const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
  rightLegMesh.position.y = -0.26;
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);

  // Chunky Sneakers
  function createSneaker(): THREE.Group {
    const sGroup = new THREE.Group();
    // Sole
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.34), whiteSoleMat);
    sole.position.set(0, 0.035, 0.05);
    sole.castShadow = true;
    sGroup.add(sole);

    // Upper
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.14, 0.26), shoeMat);
    upper.position.set(0, 0.12, 0.03);
    upper.castShadow = true;
    sGroup.add(upper);

    // Toe cap
    const toe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.17, 8, 1, false, 0, Math.PI), whiteSoleMat);
    toe.rotation.z = Math.PI / 2;
    toe.position.set(0, 0.09, 0.18);
    sGroup.add(toe);

    sGroup.position.y = -0.85; // Align to ground
    return sGroup;
  }

  const leftSneaker = createSneaker();
  leftLeg.add(leftSneaker);

  const rightSneaker = createSneaker();
  rightLeg.add(rightSneaker);

  // 5. Hoverboard (Equippable)
  const hoverboardMesh = new THREE.Group();
  const deckShape = new THREE.Shape();
  deckShape.moveTo(-0.35, -0.9);
  deckShape.lineTo(0.35, -0.9);
  deckShape.quadraticCurveTo(0.42, 0, 0.35, 0.9);
  deckShape.lineTo(-0.35, 0.9);
  deckShape.quadraticCurveTo(-0.42, 0, -0.35, -0.9);

  const boardGeo = new THREE.ExtrudeGeometry(deckShape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 });
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.6 });
  const boardMesh = new THREE.Mesh(boardGeo, boardMat);
  boardMesh.rotation.x = Math.PI / 2;
  boardMesh.position.y = 0.06;
  boardMesh.castShadow = true;
  hoverboardMesh.add(boardMesh);

  // Neon glowing trim around board
  const neonMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const neonGeo = new THREE.TorusGeometry(0.4, 0.03, 8, 32);
  const neonMesh = new THREE.Mesh(neonGeo, neonMat);
  neonMesh.rotation.x = Math.PI / 2;
  neonMesh.scale.set(0.8, 2.2, 1);
  neonMesh.position.y = 0.03;
  hoverboardMesh.add(neonMesh);

  hoverboardMesh.visible = false;
  root.add(hoverboardMesh);

  // 6. Jetpack (Equippable)
  const jetpackMesh = new THREE.Group();
  const jetTubeGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.55, 12);
  const jetMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 });
  const jetConeGeo = new THREE.ConeGeometry(0.11, 0.15, 12);
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.1 });

  [-0.14, 0.14].forEach(x => {
    const tube = new THREE.Mesh(jetTubeGeo, jetMat);
    tube.position.set(x, 0, 0);
    const nozzle = new THREE.Mesh(jetConeGeo, nozzleMat);
    nozzle.position.set(x, -0.32, 0);
    nozzle.rotation.x = Math.PI;
    jetpackMesh.add(tube, nozzle);
  });
  jetpackMesh.position.set(0, 0.35, -0.22);
  jetpackMesh.visible = false;
  torso.add(jetpackMesh);

  // 7. Super Sneakers (Giant spring shoes)
  const superSneakersMesh = new THREE.Group();
  const springMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.1 });
  const giantShoeMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3, metalness: 0.2 });

  [-0.16, 0.16].forEach(x => {
    const giantShoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.25, 0.45), giantShoeMat);
    giantShoe.position.set(x, 0.15, 0.05);
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 10), springMat);
    spring.position.set(x, 0, 0);
    superSneakersMesh.add(giantShoe, spring);
  });
  superSneakersMesh.visible = false;
  root.add(superSneakersMesh);

  // Kinematic update loop for character
  const update = (time: number, speed: number, state: 'RUN' | 'JUMP' | 'SLIDE' | 'HOVER' | 'CRASH', dt: number) => {
    if (state === 'CRASH') {
      pelvis.position.y = 0.3;
      pelvis.rotation.x = THREE.MathUtils.damp(pelvis.rotation.x, -Math.PI / 2.5, 8, dt);
      torso.rotation.z = Math.sin(time * 12) * 0.3;
      leftArm.rotation.x = 2.5;
      rightArm.rotation.x = 2.5;
      leftLeg.rotation.x = 0.8;
      rightLeg.rotation.x = -0.5;
      return;
    }

    if (state === 'SLIDE') {
      // Crouch / tuck down low for slide
      pelvis.position.y = THREE.MathUtils.damp(pelvis.position.y, 0.35, 15, dt);
      torso.rotation.x = THREE.MathUtils.damp(torso.rotation.x, 1.2, 15, dt);
      head.rotation.x = -0.8; // look forward
      leftLeg.rotation.x = -1.3;
      rightLeg.rotation.x = -1.1;
      leftArm.rotation.x = -1.2;
      rightArm.rotation.x = -1.2;
      return;
    }

    if (state === 'HOVER') {
      // Surfing pose on hoverboard
      pelvis.position.y = THREE.MathUtils.damp(pelvis.position.y, 1.0, 10, dt);
      torso.rotation.x = THREE.MathUtils.damp(torso.rotation.x, 0, 10, dt);
      torso.rotation.y = 0.45; // Angled stance
      leftArm.rotation.z = -0.8;
      rightArm.rotation.z = 0.8;
      leftArm.rotation.x = 0.2;
      rightArm.rotation.x = -0.2;
      leftLeg.rotation.x = 0.2;
      rightLeg.rotation.x = -0.2;

      // Gentle floating bob & board tilt
      hoverboardMesh.position.y = 0.12 + Math.sin(time * 6) * 0.04;
      hoverboardMesh.rotation.z = Math.sin(time * 4) * 0.08;
      return;
    }

    if (state === 'JUMP') {
      // Mid-air acrobatic leap
      pelvis.position.y = 0.85;
      torso.rotation.x = -0.15;
      head.rotation.x = 0.2;
      leftLeg.rotation.x = -0.7;
      rightLeg.rotation.x = 0.5;
      leftArm.rotation.x = 2.4;
      rightArm.rotation.x = 2.0;
      leftArm.rotation.z = -0.4;
      rightArm.rotation.z = 0.4;
      return;
    }

    // Default: High-energy Running Cycle
    const runFreq = Math.min(speed * 0.75, 18);
    const runCycle = time * runFreq;

    // Bobbing pelvis
    pelvis.position.y = 0.85 + Math.abs(Math.sin(runCycle)) * 0.08;
    torso.rotation.x = 0.15; // forward athletic lean
    torso.rotation.y = Math.sin(runCycle) * 0.12;
    head.rotation.y = -Math.sin(runCycle) * 0.08;

    // Legs pumping
    const legSwing = Math.sin(runCycle) * 0.85;
    leftLeg.rotation.x = legSwing;
    rightLeg.rotation.x = -legSwing;

    // Arms pumping counter to legs
    leftArm.rotation.x = -legSwing * 1.1;
    rightArm.rotation.x = legSwing * 1.1;
    leftArm.rotation.z = -0.15;
    rightArm.rotation.z = 0.15;

    // Subtle side sway
    root.rotation.z = Math.sin(runCycle) * 0.04;
  };

  const setHoverboardVisible = (visible: boolean, bConfig?: HoverboardConfig) => {
    hoverboardMesh.visible = visible;
    if (visible && bConfig) {
      boardMat.color.set(bConfig.deckColor);
      neonMat.color.set(bConfig.trailColor);
    }
  };

  const setJetpackVisible = (visible: boolean) => {
    jetpackMesh.visible = visible;
  };

  const setSuperSneakersVisible = (visible: boolean) => {
    superSneakersMesh.visible = visible;
  };

  const resetPose = () => {
    pelvis.position.set(0, 0.85, 0);
    pelvis.rotation.set(0, 0, 0);
    torso.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    leftArm.rotation.set(0, 0, 0);
    rightArm.rotation.set(0, 0, 0);
    leftLeg.rotation.set(0, 0, 0);
    rightLeg.rotation.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
  };

  return {
    group: root,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftSneaker,
    rightSneaker,
    hoverboardMesh,
    jetpackMesh,
    superSneakersMesh,
    sprayCanMesh,
    update,
    setHoverboardVisible,
    setJetpackVisible,
    setSuperSneakersVisible,
    resetPose,
  };
}

/**
 * Creates the Inspector rig (grumpy subway security guard)
 */
export function createInspectorRig(): InspectorRig {
  const root = new THREE.Group();
  root.name = 'InspectorRoot';

  const uniformMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6, metalness: 0.1 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.2 });

  const pelvis = new THREE.Group();
  pelvis.position.y = 0.9;
  root.add(pelvis);

  // Torso (burly guard)
  const torso = new THREE.Group();
  pelvis.add(torso);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.7, 0.42), uniformMat);
  body.position.y = 0.35;
  body.castShadow = true;
  torso.add(body);

  // Inspector Gold Badge
  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 6), goldMat);
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0.18, 0.5, 0.22);
  torso.add(badge);

  // Belt & Gold Buckle
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.44), bootMat);
  belt.position.y = 0.05;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), goldMat);
  buckle.position.set(0, 0.05, 0.23);
  torso.add(belt, buckle);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.78, 0);
  torso.add(head);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Walrus Mustache
  const stache = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.08), hairMat);
  stache.position.set(0, -0.04, 0.22);
  head.add(stache);

  // Police Peaked Cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.16, 14), uniformMat);
  cap.position.y = 0.18;
  const capPeak = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.18), bootMat);
  capPeak.position.set(0, 0.12, 0.22);
  capPeak.rotation.x = 0.2;
  head.add(cap, capPeak);

  // Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.42, 0.55, 0);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.42, 0.55, 0);
  torso.add(leftArm, rightArm);

  const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.5, 10);
  const leftMesh = new THREE.Mesh(armGeo, uniformMat);
  leftMesh.position.y = -0.25;
  leftMesh.castShadow = true;
  leftArm.add(leftMesh);

  const rightMesh = new THREE.Mesh(armGeo, uniformMat);
  rightMesh.position.y = -0.25;
  rightMesh.castShadow = true;
  rightArm.add(rightMesh);

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.2, 0, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.2, 0, 0);
  pelvis.add(leftLeg, rightLeg);

  const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.55, 10);
  const lLeg = new THREE.Mesh(legGeo, uniformMat);
  lLeg.position.y = -0.28;
  lLeg.castShadow = true;
  const rLeg = new THREE.Mesh(legGeo, uniformMat);
  rLeg.position.y = -0.28;
  rLeg.castShadow = true;
  leftLeg.add(lLeg);
  rightLeg.add(rLeg);

  // Boots
  [-0.2, 0.2].forEach((x, idx) => {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.32), bootMat);
    boot.position.set(0, -0.6, 0.05);
    boot.castShadow = true;
    (idx === 0 ? leftLeg : rightLeg).add(boot);
  });

  const update = (time: number, speed: number, distanceBehind: number) => {
    const runFreq = Math.min(speed * 0.75, 16);
    const runCycle = time * runFreq;

    pelvis.position.y = 0.9 + Math.abs(Math.sin(runCycle)) * 0.09;
    torso.rotation.x = 0.25; // Determined aggressive lean forward!

    const legSwing = Math.sin(runCycle) * 0.9;
    leftLeg.rotation.x = legSwing;
    rightLeg.rotation.x = -legSwing;

    leftArm.rotation.x = -legSwing * 1.2;
    rightArm.rotation.x = legSwing * 1.2;

    // If close behind (stumble condition), reach forward desperately!
    if (distanceBehind < 3.5) {
      torso.rotation.x = 0.45;
      rightArm.rotation.x = 1.8;
      leftArm.rotation.x = 1.6;
    }
  };

  return { group: root, torso, head, leftArm, rightArm, leftLeg, rightLeg, update };
}

/**
 * Creates the Dog rig (spotted Pitbull running alongside the Inspector)
 */
export function createDogRig(): DogRig {
  const root = new THREE.Group();
  root.name = 'DogRoot';

  const furMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4, metalness: 0.2 });
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

  const body = new THREE.Group();
  body.position.y = 0.45;
  root.add(body);

  // Stocky barrel chest
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.65), furMat);
  torsoMesh.castShadow = true;
  body.add(torsoMesh);

  // Head & Floppy Jowls
  const head = new THREE.Group();
  head.position.set(0, 0.22, 0.36);
  body.add(head);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.35), furMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Snout
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.2), bellyMat);
  snout.position.set(0, -0.06, 0.22);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0x09090b }));
  nose.position.set(0, 0.02, 0.32);
  head.add(snout, nose);

  // Spiked Collar
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.12), collarMat);
  collar.position.set(0, 0.12, 0.22);
  body.add(collar);

  // Wagging tail
  const tail = new THREE.Group();
  tail.position.set(0, 0.15, -0.32);
  const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.3, 8), furMat);
  tailMesh.rotation.x = -Math.PI / 3;
  tailMesh.position.set(0, 0.1, -0.1);
  tail.add(tailMesh);
  body.add(tail);

  // 4 Legs
  const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.35, 8);
  const flLeg = new THREE.Group();
  flLeg.position.set(-0.16, -0.18, 0.22);
  const frLeg = new THREE.Group();
  frLeg.position.set(0.16, -0.18, 0.22);
  const blLeg = new THREE.Group();
  blLeg.position.set(-0.16, -0.18, -0.22);
  const brLeg = new THREE.Group();
  brLeg.position.set(0.16, -0.18, -0.22);

  [flLeg, frLeg, blLeg, brLeg].forEach(leg => {
    const mesh = new THREE.Mesh(legGeo, furMat);
    mesh.position.y = -0.15;
    mesh.castShadow = true;
    leg.add(mesh);
    body.add(leg);
  });

  const update = (time: number, speed: number) => {
    const runFreq = Math.min(speed * 1.1, 22);
    const runCycle = time * runFreq;

    // Gallop motion
    body.position.y = 0.45 + Math.abs(Math.sin(runCycle)) * 0.08;
    body.rotation.x = Math.sin(runCycle) * 0.1;

    flLeg.rotation.x = Math.sin(runCycle) * 0.8;
    frLeg.rotation.x = -Math.sin(runCycle) * 0.8;
    blLeg.rotation.x = -Math.sin(runCycle + 0.5) * 0.8;
    brLeg.rotation.x = Math.sin(runCycle + 0.5) * 0.8;

    tail.rotation.y = Math.sin(time * 20) * 0.6; // Furious tail wag
  };

  return {
    group: root,
    body,
    head,
    tail,
    frontLeftLeg: flLeg,
    frontRightLeg: frLeg,
    backLeftLeg: blLeg,
    backRightLeg: brLeg,
    update
  };
}
