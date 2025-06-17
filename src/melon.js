// src/melon.js

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export function createMelon() {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0x2ecc71,
    roughness: 0.8,
    metalness: 0.1,
  });
  const velocity = new THREE.Vector3(0, 0, -25);

  const melon = new THREE.Mesh(geometry, material);
  melon.name = "melon";
  melon.userData = {
    isRipe: true,
    ruptureThreshold: 9, // Placeholder impact velocity threshold
  };

  return melon;
}

export async function createMelonAsync() {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load('/models/watermelon_base.glb', (gltf) => {
      // Assume the first mesh is the melon
      let melon = null;
      gltf.scene.traverse((child) => {
        if (child.isMesh && !melon) {
          melon = child;
        }
      });
      if (!melon) return reject('No mesh found in GLB');
      melon.name = 'melon';
      melon.userData = {
        isRipe: true,
        ruptureThreshold: 9,
      };
      // Create a procedural stripes texture using canvas
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      // Fill with bright green
      ctx.fillStyle = '#b6ff7a';
      ctx.fillRect(0, 0, size, size);
      // Draw dark green horizontal stripes (so they appear vertical on the sphere)
      ctx.fillStyle = '#176a1a';
      const stripeCount = 12;
      const stripeWidth = size / (stripeCount * 2);
      for (let i = 0; i < stripeCount; i++) {
        ctx.beginPath();
        ctx.rect(0, i * 2 * stripeWidth, size, stripeWidth);
        ctx.fill();
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      // Assign new material with the stripes texture
      melon.material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.5,
        metalness: 0.1,
      });
      resolve(melon);
    }, undefined, reject);
  });
}

export async function createFracturedMelonAsync() {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load('/models/watermelon_fractured.glb', (gltf) => {
      // Collect all mesh children as fractured pieces
      const pieces = [];
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          pieces.push(child);
        }
      });
      if (pieces.length === 0) return reject('No mesh found in fractured GLB');
      // Create procedural stripes texture
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#b6ff7a';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#176a1a';
      const stripeCount = 12;
      const stripeWidth = size / (stripeCount * 2);
      for (let i = 0; i < stripeCount; i++) {
        ctx.beginPath();
        ctx.rect(0, i * 2 * stripeWidth, size, stripeWidth);
        ctx.fill();
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      // Assign new material with the stripes texture to all pieces
      for (const mesh of pieces) {
        mesh.material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.5,
          metalness: 0.1,
        });
      }
      // Return the group of fractured pieces
      resolve(gltf.scene);
    }, undefined, reject);
  });
}
