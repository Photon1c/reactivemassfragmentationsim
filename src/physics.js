// src/physics.js

import * as CANNON from 'cannon-es';

export function createPhysicsWorld() {
  const world = new CANNON.World();
  world.gravity.set(0, -9.82, 0); // Standard earth gravity
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  return world;
}

export function syncMeshToBody(mesh, body) {
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
}
