# 🍉 RMF: Melon Protocol  
*Splatter Engine for Soft-Body Rupture Dynamics*

This all is now live [here](https://rmfmelonprotocol.netlify.app/).

![sample](media/sample.gif)

Three.js simulator of rigid and soft body physics using simple melon and ball as base templates.

---

## What is RMF?

<b>RMF stands for <i>Reactive Mass Fragmentation</i></b>.

It refers to the simulated physics behavior of soft-bodied organic matter (like a melon) breaking apart under high-velocity impact — capturing the reactivity, mass inertia, and fragmentation dynamics of the rupture. This simulation models how force propagates through and destroys squishy matter in real-time.

---

## Features

- ✅ Realistic impact physics (Cannon.js)
- ✅ Threshold-based rupture logic
- ✅ Modular projectile system
- ✅ Procedural splatter burst (THREE.js)
- ✅ Scaled splatter based on impact speed
- ✅ Fully procedural watermelon with realistic skin, rind, and flesh
- ✅ Fragments and seeds with robust physics, always accumulate on the ground
- ✅ Adjustable splatter size, count, speed, and lifetime (GUI + parameters.json)
- ✅ Adjustable fragment count, fragment lifetime, and melon respawn delay (GUI + parameters.json)
- ✅ Ground plane for debris and splatter accumulation
- ✅ Auto mode for continuous firing
- ✅ All controls update simulation in real time
- ✅ Logs track progress and pending features

---

## Getting Started

```bash
npm install
npm run dev
```

### File Structure  

/public
  /models        // GLB fractured models (future)
  /textures      // Splatter and surface maps

/src
  main.js        // App entry point
  world.js       // Scene + physics orchestration
  melon.js       // Melon logic + properties
  ball.js        // Ball creation and motion
  physics.js     // Physics world (Cannon.js)
  effects.js     // Splatter particles
  instructions.js // User instructions popup (shown with 'i' key)

### Notes

- Watermelon texture/material baking is currently paused and tracked in `log/pending.log`.
- User instructions are available in-app via the 'i' button.
- Progress and pending features are tracked in the `log/` folder.
