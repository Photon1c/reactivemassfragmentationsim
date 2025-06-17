import * as THREE from 'three';
import { createMelon, createMelonAsync, createFracturedMelonAsync } from './melon.js';
import { createBall } from './ball.js';
import * as CANNON from 'cannon-es';
import { createPhysicsWorld, syncMeshToBody } from './physics.js';
import { createSplatterEffect, updateSplatterEffect } from './effects.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
const splatters = [];

// Add a placeholder 'Git' link to the top right corner of the page (always visible)
const gitLink = document.createElement('a');
gitLink.href = '#'; // Replace with your repo URL when ready
gitLink.textContent = 'Git';
gitLink.style.position = 'fixed';
gitLink.style.top = '16px';
gitLink.style.right = '32px';
gitLink.style.zIndex = 1000;
gitLink.style.fontSize = '1.2em';
gitLink.style.fontWeight = 'bold';
gitLink.style.color = '#fff';
gitLink.style.textDecoration = 'none';
gitLink.style.background = 'rgba(30,30,30,0.97)';
gitLink.style.padding = '8px 18px';
gitLink.style.borderRadius = '10px';
gitLink.style.boxShadow = '0 2px 12px #0008';
gitLink.style.cursor = 'pointer';
document.body.appendChild(gitLink);

export async function buildWorld(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe0e0e0);
  const world = createPhysicsWorld();
  const timeStep = 1 / 60;

  const balls = [];
  let clock = new THREE.Clock();
  
  let isCharging = false;
  let chargeStart = 0;
  let charge = 0;
  let previewBall = null;

  // At the top of buildWorld, load parameters from parameters.json
  let simParams = {
    splatterSize: 1,
    splatterCount: 90,
    ballPower: 50,
    fragmentCount: 12,
    ruptureThreshold: 9,
    splatterLifetime: 5,
    splatterSpeed: 1.0
  };
  try {
    const resp = await fetch('parameters.json');
    if (resp.ok) {
      const data = await resp.json();
      simParams = { ...simParams, ...data };
    }
  } catch (e) {
    console.warn('Could not load parameters.json, using defaults.', e);
  }

  // Use simParams for all relevant parameters
  let splatterSize = simParams.splatterSize;
  let splatterCount = simParams.splatterCount;
  let ballPower = simParams.ballPower;
  let fragmentCount = simParams.fragmentCount;
  let ruptureThreshold = simParams.ruptureThreshold;
  let splatterLifetime = simParams.splatterLifetime;
  let splatterSpeed = simParams.splatterSpeed;
  let fragmentLifetime = simParams.fragmentLifetime !== undefined ? simParams.fragmentLifetime : 3.0;
  let melonRespawnDelay = simParams.melonRespawnDelay !== undefined ? simParams.melonRespawnDelay : 2.0;
  let melonRespawnTimer = 0;

  // Get slider elements
  const splatterSizeSlider = document.getElementById('splatter-size-slider');
  const splatterCountSlider = document.getElementById('splatter-count-slider');
  const ballPowerSlider = document.getElementById('ball-power-slider');
  const fragmentCountSlider = document.createElement('input');
  fragmentCountSlider.type = 'range';
  fragmentCountSlider.min = '2';
  fragmentCountSlider.max = '32';
  fragmentCountSlider.step = '1';
  fragmentCountSlider.value = fragmentCount;
  fragmentCountSlider.id = 'fragment-count-slider';
  const fragmentCountLabel = document.createElement('label');
  fragmentCountLabel.style.display = 'flex';
  fragmentCountLabel.style.flexDirection = 'column';
  fragmentCountLabel.style.gap = '2px';
  fragmentCountLabel.textContent = 'Fragment Count';
  fragmentCountLabel.appendChild(fragmentCountSlider);
  const splatterLifetimeSlider = document.createElement('input');
  splatterLifetimeSlider.type = 'range';
  splatterLifetimeSlider.min = '2';
  splatterLifetimeSlider.max = '30';
  splatterLifetimeSlider.step = '0.1';
  splatterLifetimeSlider.value = splatterLifetime;
  splatterLifetimeSlider.id = 'splatter-lifetime-slider';
  const splatterLifetimeLabel = document.createElement('label');
  splatterLifetimeLabel.style.display = 'flex';
  splatterLifetimeLabel.style.flexDirection = 'column';
  splatterLifetimeLabel.style.gap = '2px';
  splatterLifetimeLabel.textContent = 'Splatter Lifetime (s)';
  splatterLifetimeLabel.appendChild(splatterLifetimeSlider);
  const splatterSpeedSlider = document.createElement('input');
  splatterSpeedSlider.type = 'range';
  splatterSpeedSlider.min = '0.1';
  splatterSpeedSlider.max = '3.0';
  splatterSpeedSlider.step = '0.01';
  splatterSpeedSlider.value = splatterSpeed;
  splatterSpeedSlider.id = 'splatter-speed-slider';
  const splatterSpeedLabel = document.createElement('label');
  splatterSpeedLabel.style.display = 'flex';
  splatterSpeedLabel.style.flexDirection = 'column';
  splatterSpeedLabel.style.gap = '2px';
  splatterSpeedLabel.textContent = 'Splatter Speed';
  splatterSpeedLabel.appendChild(splatterSpeedSlider);
  const fragmentLifetimeSlider = document.createElement('input');
  fragmentLifetimeSlider.type = 'range';
  fragmentLifetimeSlider.min = '0.5';
  fragmentLifetimeSlider.max = '10.0';
  fragmentLifetimeSlider.step = '0.1';
  fragmentLifetimeSlider.value = fragmentLifetime;
  fragmentLifetimeSlider.id = 'fragment-lifetime-slider';
  const fragmentLifetimeLabel = document.createElement('label');
  fragmentLifetimeLabel.style.display = 'flex';
  fragmentLifetimeLabel.style.flexDirection = 'column';
  fragmentLifetimeLabel.style.gap = '2px';
  fragmentLifetimeLabel.textContent = 'Fragment Lifetime (s)';
  fragmentLifetimeLabel.appendChild(fragmentLifetimeSlider);
  const melonRespawnDelaySlider = document.createElement('input');
  melonRespawnDelaySlider.type = 'range';
  melonRespawnDelaySlider.min = '0.1';
  melonRespawnDelaySlider.max = '10.0';
  melonRespawnDelaySlider.step = '0.1';
  melonRespawnDelaySlider.value = melonRespawnDelay;
  melonRespawnDelaySlider.id = 'melon-respawn-delay-slider';
  const melonRespawnDelayLabel = document.createElement('label');
  melonRespawnDelayLabel.style.display = 'flex';
  melonRespawnDelayLabel.style.flexDirection = 'column';
  melonRespawnDelayLabel.style.gap = '2px';
  melonRespawnDelayLabel.textContent = 'Melon Respawn Delay (s)';
  melonRespawnDelayLabel.appendChild(melonRespawnDelaySlider);
  const panelContent = document.getElementById('panel-content');
  if (panelContent) {
    // Insert after splatterCountSlider if possible
    const splatterCountLabel = splatterCountSlider?.parentElement;
    if (splatterCountLabel && splatterCountLabel.nextSibling) {
      panelContent.insertBefore(fragmentCountLabel, splatterCountLabel.nextSibling);
    } else {
      panelContent.appendChild(fragmentCountLabel);
    }
    panelContent.appendChild(splatterLifetimeLabel);
    panelContent.appendChild(splatterSpeedLabel);
    panelContent.appendChild(fragmentLifetimeLabel);
    panelContent.appendChild(melonRespawnDelayLabel);
  }
  if (splatterSizeSlider) {
    splatterSizeSlider.addEventListener('input', e => {
      splatterSize = parseFloat(e.target.value);
    });
  }
  if (splatterCountSlider) {
    splatterCountSlider.addEventListener('input', e => {
      splatterCount = parseInt(e.target.value);
    });
  }
  if (ballPowerSlider) {
    ballPowerSlider.addEventListener('input', e => {
      ballPower = parseFloat(e.target.value);
    });
  }
  fragmentCountSlider.addEventListener('input', e => {
    fragmentCount = parseInt(e.target.value);
  });
  splatterLifetimeSlider.addEventListener('input', e => {
    splatterLifetime = parseFloat(e.target.value);
  });
  splatterSpeedSlider.addEventListener('input', e => {
    splatterSpeed = parseFloat(e.target.value);
  });
  fragmentLifetimeSlider.addEventListener('input', e => {
    fragmentLifetime = parseFloat(e.target.value);
  });
  melonRespawnDelaySlider.addEventListener('input', e => {
    melonRespawnDelay = parseFloat(e.target.value);
  });

  function lerpColor(a, b, t) {
    // a, b: THREE.Color; t: 0-1
    return a.clone().lerp(b, t);
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isCharging) {
      isCharging = true;
      chargeStart = performance.now();
      charge = 0;
      // Create preview ball
      previewBall = createBall(new THREE.Vector3(0, 0, 5), new CANNON.Vec3(0, 0, 0));
      // Set to emissive red for preview
      previewBall.material.color.set(0xffffff);
      previewBall.material.emissive = new THREE.Color(0x000000);
      scene.add(previewBall);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && isCharging) {
      isCharging = false;
      // Remove preview ball
      if (previewBall) {
        scene.remove(previewBall);
        previewBall = null;
      }
      // Clamp charge
      const maxCharge = 2.5; // seconds
      const minVel = 15;
      // Use ballPower as maxVel
      const maxVel = ballPower;
      const chargeTime = Math.min((performance.now() - chargeStart) / 1000, maxCharge);
      const t = Math.min(chargeTime / maxCharge, 1);
      const velocityValue = minVel + (maxVel - minVel) * t;
      const velocity = new CANNON.Vec3(0, 0, -velocityValue);
    const mesh = createBall(new THREE.Vector3(0, 0, 5), velocity);
      // Set color to match charge
      mesh.material.color.copy(lerpColor(new THREE.Color(0xffffff), new THREE.Color(0xff3300), t));
      mesh.material.emissive = lerpColor(new THREE.Color(0x000000), new THREE.Color(0xff2200), t);
    scene.add(mesh);
    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(0.2),
      position: new CANNON.Vec3(0, 0, 5),
    });
    body.velocity.copy(velocity);
    world.addBody(body);
    balls.push({ mesh, body });
    }
  });
  
  


  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // OrbitControls for camera navigation
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  };

  // Auto Mode logic
  let autoMode = false;
  let autoModeInterval = null;
  const autoBtn = document.getElementById('auto-mode-btn');
  if (autoBtn) {
    autoBtn.addEventListener('click', () => {
      autoMode = !autoMode;
      autoBtn.style.background = autoMode ? '#c33' : '#222';
      if (autoMode) {
        fireAutoBall();
        autoModeInterval = setInterval(fireAutoBall, 5000);
      } else {
        clearInterval(autoModeInterval);
      }
    });
  }
  function fireAutoBall() {
    const velocity = new CANNON.Vec3(0, 0, -ballPower); // use slider value
    const mesh = createBall(new THREE.Vector3(0, 0, 5), velocity);
    mesh.material.color.set(0xff3300);
    mesh.material.emissive = new THREE.Color(0xff2200);
    scene.add(mesh);
    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(0.2),
      position: new CANNON.Vec3(0, 0, 5),
    });
    body.velocity.copy(velocity);
    world.addBody(body);
    balls.push({ mesh, body });
  }

  // Light
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 5, 10);
  scene.add(light);
  // Add a second directional light from the opposite side
  const light2 = new THREE.DirectionalLight(0xffffff, 0.7);
  light2.position.set(-5, -5, 5);
  scene.add(light2);
  // Add a hemisphere light for ambient fill
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.6);
  hemiLight.position.set(0, 10, 0);
  scene.add(hemiLight);

  // --- Watermelon setup ---
  // Comment out GLB melon model loading
  // let melon = await createMelonAsync();
  // melon.position.set(0, 0, 0);
  // scene.add(melon);
  //
  // const melonBody = new CANNON.Body({
  //   mass: 0, // static
  //   shape: new CANNON.Sphere(1),
  //   position: new CANNON.Vec3(0, 0, 0),
  // });
  // world.addBody(melonBody);

  // Procedural watermelon (sphere) and stem
  const watermelonRadius = 1;
  const watermelonSegments = 32;

  // Create a canvas texture with thick, dark olive green vertical stripes
  const size = 1024;
  const stripesCanvas = document.createElement('canvas');
  stripesCanvas.width = size;
  stripesCanvas.height = size;
  const stripesCtx = stripesCanvas.getContext('2d');
  // Fill with bright green
  stripesCtx.fillStyle = '#2ecc40';
  stripesCtx.fillRect(0, 0, size, size);
  // Draw thick dark olive green vertical stripes
  stripesCtx.fillStyle = '#254117'; // dark olive green
  const stripeCount = 8;
  const stripeWidth = size / (stripeCount * 2);
  for (let i = 0; i < stripeCount; i++) {
    stripesCtx.beginPath();
    stripesCtx.rect(i * 2 * stripeWidth, 0, stripeWidth, size);
    stripesCtx.fill();
  }
  const stripesTexture = new THREE.CanvasTexture(stripesCanvas);
  stripesTexture.wrapS = THREE.RepeatWrapping;
  stripesTexture.wrapT = THREE.RepeatWrapping;
  stripesTexture.repeat.set(1, 1);

  const melonGeometry = new THREE.SphereGeometry(watermelonRadius, watermelonSegments, watermelonSegments);
  const melonMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x2ecc40, 
    map: stripesTexture,
    shininess: 30
  });
  const melon = new THREE.Mesh(melonGeometry, melonMaterial);
  melon.position.set(0, 0, 0);
  scene.add(melon);

  const stemGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16);
  const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x8d5524 });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.set(0, watermelonRadius, 0);
  scene.add(stem);

  // Watermelon rupture state
  let melonRuptured = false;
  let melonFragments = [];

  // Add a ground plane at the bottom for fragments/particles to accumulate
  const groundY = -1.2;
  const groundSize = 8;
  const groundGeometry = new THREE.CircleGeometry(groundSize, 64);
  const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xe0e0e0, shininess: 10 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = groundY;
  ground.receiveShadow = true;
  scene.add(ground);

  // Optionally, add a static physics body for the ground (future use)
  // const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), position: new CANNON.Vec3(0, groundY, 0) });
  // world.addBody(groundBody);

  function animate() {
    requestAnimationFrame(animate);
  
    const delta = clock.getDelta();
  
    world.step(timeStep);

    balls.forEach((pair, index) => {
      syncMeshToBody(pair.mesh, pair.body);
    
      const dist = pair.body.position.distanceTo(new THREE.Vector3(0, 0, 0));
      if (dist < 1.1 && !melonRuptured) {
        const impactSpeed = pair.body.velocity.length();
        console.log(`💥 Impact velocity: ${impactSpeed.toFixed(2)} vs threshold: ${ruptureThreshold}`);
        if (impactSpeed >= ruptureThreshold) {
            console.log("🍉 Melon ruptured!");
          // Hide base melon and stem
          melon.visible = false;
          stem.visible = false;
          melonRuptured = true;
          melonRespawnTimer = melonRespawnDelay;
          // Spawn fragments
          const sectionCount = 4;
          for (let i = 0; i < fragmentCount; i++) {
            // Create a unique geometry instance for each fragment
            const fragGeom = new THREE.SphereGeometry(0.4, 32, 32);
            // Assign a specific rotation based on section
            const section = i % sectionCount;
            let euler;
            if (section === 0) {
              // Top: no rotation
              euler = new THREE.Euler(0, 0, 0);
            } else if (section === 1) {
              // Bottom: rotate 180° around X
              euler = new THREE.Euler(Math.PI, 0, 0);
            } else if (section === 2) {
              // Left: rotate 90° around Y
              euler = new THREE.Euler(0, Math.PI / 2, 0);
            } else {
              // Right: rotate -90° around Y
              euler = new THREE.Euler(0, -Math.PI / 2, 0);
            }
            fragGeom.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(euler));
            // Generate a random dip axis for this fragment
            const dipAxis = new THREE.Vector3(
              Math.random() * 2 - 1,
              Math.random() * 2 - 1,
              Math.random() * 2 - 1
            ).normalize();
            // Assign groups for multi-materials: outer shell (green), thin rind (white), core (red), lower hemisphere (bright red)
            fragGeom.clearGroups();
            const indices = fragGeom.index.array;
            for (let j = 0; j < indices.length; j += 3) {
              const a = indices[j], b = indices[j+1], c = indices[j+2];
              const va = new THREE.Vector3().fromBufferAttribute(fragGeom.attributes.position, a);
              const vb = new THREE.Vector3().fromBufferAttribute(fragGeom.attributes.position, b);
              const vc = new THREE.Vector3().fromBufferAttribute(fragGeom.attributes.position, c);
              const avgR = (va.length() + vb.length() + vc.length()) / 3;
              const avgPos = va.clone().add(vb).add(vc).divideScalar(3);
              const dipValue = avgPos.dot(dipAxis);
              if (avgR > 0.38) {
                if (dipValue < 0) {
                  fragGeom.addGroup(j, 3, 3); // bright red-tinted green
                } else {
                  fragGeom.addGroup(j, 3, 0); // green
                }
              } else if (avgR > 0.36) {
                fragGeom.addGroup(j, 3, 1); // white
              } else {
                fragGeom.addGroup(j, 3, 2); // red
              }
            }
            // Randomly displace vertices for blobbiness (subtle)
            for (let v = 0; v < fragGeom.attributes.position.count; v++) {
              const pos = fragGeom.attributes.position;
              pos.setX(v, pos.getX(v) + (Math.random() - 0.5) * 0.08);
              pos.setY(v, pos.getY(v) + (Math.random() - 0.5) * 0.08);
              pos.setZ(v, pos.getZ(v) + (Math.random() - 0.5) * 0.08);
            }
            fragGeom.computeVertexNormals();
            // Materials: [green, white, red, bright red-tinted green]
            const matGreen = new THREE.MeshPhongMaterial({ color: 0x2ecc40, shininess: 30 });
            const matWhite = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 60, opacity: 0.95, transparent: true });
            const matRed = new THREE.MeshPhongMaterial({ color: 0xff0033, shininess: 10, opacity: 0.98, transparent: true });
            const matBrightRedTintedGreen = new THREE.MeshPhongMaterial({ color: 0xff3355, shininess: 20, opacity: 0.98, transparent: true });
            const fragment = new THREE.Mesh(fragGeom, [matGreen, matWhite, matRed, matBrightRedTintedGreen]);
            fragment.position.copy(melon.position);
            // Make the fragment a 'blob' by randomly scaling each axis
            const sx = 0.7 + Math.random() * 0.8;
            const sy = 0.7 + Math.random() * 0.8;
            const sz = 0.7 + Math.random() * 0.8;
            fragment.scale.set(sx, sy, sz);
            // Give each fragment a random outward velocity (uniformly distributed over a sphere)
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 3 + Math.random() * 2.5;
            const dir = new THREE.Vector3(
              Math.sin(phi) * Math.cos(theta),
              Math.cos(phi),
              Math.sin(phi) * Math.sin(theta)
            ).normalize().multiplyScalar(speed);
            fragment.userData.velocity = dir;
            fragment.userData.lifetime = fragmentLifetime; // seconds
            scene.add(fragment);
            melonFragments.push(fragment);
          }
          // --- Add black seeds that explode outward ---
          const seedCount = Math.floor(fragmentCount * 1.5);
          for (let i = 0; i < seedCount; i++) {
            const seedGeom = new THREE.SphereGeometry(0.06, 8, 8);
            // Make the seed an ellipsoid (flattened)
            seedGeom.scale(1, 0.6, 0.4 + Math.random() * 0.2);
            const seedMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 80 });
            const seed = new THREE.Mesh(seedGeom, seedMat);
            seed.position.copy(melon.position);
            // High velocity for seeds
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 7 + Math.random() * 3;
            const dir = new THREE.Vector3(
              Math.sin(phi) * Math.cos(theta),
              Math.cos(phi),
              Math.sin(phi) * Math.sin(theta)
            ).normalize().multiplyScalar(speed);
            seed.userData = { velocity: dir, lifetime: 2.2 };
            scene.add(seed);
            melonFragments.push(seed);
          }
          // Splatter Physics
          const splatter = createSplatterEffect(melon.position, scene, splatterSpeed * (impactSpeed / 2), splatterSize, splatterCount, splatterLifetime);
          splatters.push(splatter);
        }
        scene.remove(pair.mesh);
        world.removeBody(pair.body);
        balls.splice(index, 1);
      }
    
      // Optional: remove ball if too far away
      if (pair.body.position.z < -50) {
        scene.remove(pair.mesh);
        world.removeBody(pair.body);
        balls.splice(index, 1);
      }
    });
    splatters.forEach((group, i) => {
        updateSplatterEffect(group, delta, scene);
      });
      
    // Animate fractured melon explosion (procedural fragments)
    if (melonRuptured && melonFragments.length > 0) {
      let allGone = true;
      for (let j = melonFragments.length - 1; j >= 0; j--) {
        const frag = melonFragments[j];
        // --- PATCH: Accumulate on ground ---
        if (frag.position.y <= groundY) {
          frag.position.y = groundY;
          if (frag.userData.velocity) {
            frag.userData.velocity.y = 0;
            frag.userData.velocity.x *= 0.7; // dampen x
            frag.userData.velocity.z *= 0.7; // dampen z
            // Optionally, stop completely if very slow
            if (Math.abs(frag.userData.velocity.x) < 0.01) frag.userData.velocity.x = 0;
            if (Math.abs(frag.userData.velocity.z) < 0.01) frag.userData.velocity.z = 0;
          }
        } else if (frag.position.y > groundY && frag.userData.velocity && Math.abs(frag.userData.velocity.y) < 0.01) {
          // If fragment is just above ground and nearly stopped, snap to ground
          frag.position.y = groundY;
          frag.userData.velocity.y = 0;
        } else {
          frag.userData.velocity.y -= 6.0 * delta; // much stronger gravity
        }
        frag.userData.velocity.multiplyScalar(0.9995); // minimal drag
        // Nudge slow fragments above ground downward
        if (frag.position.y > groundY && Math.abs(frag.userData.velocity.y) < 0.02) {
          frag.userData.velocity.y = -0.08;
        }
        frag.position.addScaledVector(frag.userData.velocity, delta);
        frag.userData.lifetime -= delta;
        if (frag.userData.lifetime <= 0) {
          scene.remove(frag);
          melonFragments.splice(j, 1);
        } else {
          allGone = false;
        }
      }
    }
    // Melon respawn logic
    if (melonRespawnTimer > 0) {
      melonRespawnTimer -= delta;
      if (melonRespawnTimer <= 0) {
        melonFragments = [];
        melon.visible = true;
        stem.visible = true;
        melonRuptured = false;
        melonRespawnTimer = 0;
      }
    }

    // --- Enhance charge-up animation for the ball ---
    // In the animation loop, update previewBall with pulsing, color shift, and glow
    if (isCharging && previewBall) {
      const maxCharge = 2.5;
      const chargeTime = Math.min((performance.now() - chargeStart) / 1000, maxCharge);
      const t = Math.min(chargeTime / maxCharge, 1);
      // Pulsing scale
      const pulse = 1 + t * 1.2 + 0.08 * Math.sin(performance.now() * 0.012 + t * 6.28);
      previewBall.scale.set(pulse, pulse, pulse);
      // Shake
      previewBall.position.x = 0 + (Math.random() - 0.5) * 0.08 * t;
      previewBall.position.y = 0 + (Math.random() - 0.5) * 0.08 * t;
      // Color toward red-hot
      previewBall.material.color.copy(lerpColor(new THREE.Color(0xffffff), new THREE.Color(0xff3300), t));
      // Emissive intensity increases with charge
      const emissive = lerpColor(new THREE.Color(0x000000), new THREE.Color(0xff2200), t);
      previewBall.material.emissive = emissive;
      previewBall.material.emissiveIntensity = 0.2 + 0.8 * t;
    }

    controls.update();
    renderer.render(scene, camera);
  }
  
  




  animate();
}
