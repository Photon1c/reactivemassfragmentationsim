// src/effects.js

import * as THREE from 'three';

export function createSplatterEffect(origin, scene, splatterSpeed = 1, splatterSize = 1, splatterCount = 90, splatterLifetime = 13.5) {
  const splatterGroup = new THREE.Group();

  // Make splatter more fluid-like: more particles, larger, additive blending
  const particleCount = Math.floor(splatterCount * 1.5); // more particles
  const geometry = new THREE.SphereGeometry(0.09, 8, 8); // larger droplets
  // Strong red for the main droplet, use NormalBlending for true color
  const material = new THREE.MeshBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.92, blending: THREE.NormalBlending });

  for (let i = 0; i < particleCount; i++) {
    // Red droplet only (no rim)
    const droplet = new THREE.Mesh(geometry, material);

    // Random direction burst (uniformly distributed over a sphere)
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.random() * (2.5 / 3) * splatterSpeed;
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    ).multiplyScalar(r);

    droplet.position.copy(origin);
    droplet.userData = {
      velocity: dir,
      lifetime: splatterLifetime
    };

    // Realistic but visible droplet size and shape
    let baseScale = 1 * (0.8 + Math.random() * 0.4);
    baseScale = Math.max(baseScale, 0.7);
    if (Math.random() < 0.3) {
      const elongation = 1 + Math.random() * 0.5;
      const axis = Math.floor(Math.random() * 3);
      if (axis === 0) {
        droplet.scale.set(baseScale * elongation * splatterSize, baseScale * splatterSize, baseScale * splatterSize);
      } else if (axis === 1) {
        droplet.scale.set(baseScale * splatterSize, baseScale * elongation * splatterSize, baseScale * splatterSize);
      } else {
        droplet.scale.set(baseScale * splatterSize, baseScale * splatterSize, baseScale * elongation * splatterSize);
      }
    } else {
      droplet.scale.set(baseScale * splatterSize, baseScale * splatterSize, baseScale * splatterSize);
    }

    splatterGroup.add(droplet);
  }

  scene.add(splatterGroup);
  return splatterGroup;
}

export function updateSplatterEffect(group, delta, scene) {
  if (!group) return;

  group.children.forEach((droplet) => {
    droplet.position.add(droplet.userData.velocity.clone().multiplyScalar(delta));
    if (droplet.position.y <= -1.2) {
      droplet.position.y = -1.2;
      droplet.userData.velocity.set(0, 0, 0);
    }
    droplet.userData.lifetime -= delta;

    if (droplet.userData.lifetime <= 0) {
      group.remove(droplet);
    }
  });

  if (group.children.length === 0) {
    scene.remove(group);
  }
}
