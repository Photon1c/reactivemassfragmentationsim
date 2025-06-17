import { buildWorld } from './world.js';
import { instructionsText } from './instructions.js';

let canvas = document.getElementById('canvas');
if (!canvas) {
  console.error("Canvas element with ID 'canvas' not found.");
  throw new Error("Canvas missing from HTML.");
}

// Build the 3D world (async for melon GLB loading)
(async () => {
  await buildWorld(canvas);
  // Add instructions popup
  let popup = document.createElement('div');
  popup.id = 'instructions-popup';
  popup.style.position = 'fixed';
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.background = 'rgba(255,255,255,0.98)';
  popup.style.color = '#222';
  popup.style.padding = '2em 2.5em';
  popup.style.borderRadius = '16px';
  popup.style.boxShadow = '0 4px 32px #0005';
  popup.style.zIndex = 1000;
  popup.style.display = 'none';
  popup.style.maxWidth = '90vw';
  popup.style.maxHeight = '80vh';
  popup.style.overflowY = 'auto';
  popup.innerHTML = instructionsText + '<br><br><button id="close-instructions" style="margin-top:1em;padding:0.5em 1.5em;font-size:1em;border-radius:8px;border:none;background:#222;color:#fff;cursor:pointer;">Close</button>';
  document.body.appendChild(popup);
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'i') {
      popup.style.display = (popup.style.display === 'none') ? 'block' : 'none';
    }
  });
  document.body.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'close-instructions') {
      popup.style.display = 'none';
    }
  });
})();
