// src/ball.js

import * as THREE from 'three';

export function createBall(startPos, velocity) {
  const geometry = new THREE.SphereGeometry(0.2, 16, 16);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const ball = new THREE.Mesh(geometry, material);

  ball.position.copy(startPos);
  ball.userData = {
    velocity: velocity.clone(),
    lifetime: 5, // seconds before auto-delete
  };

  return ball;
}
