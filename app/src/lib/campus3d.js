// The landing page's 3D campus: real satellite imagery laid on the ground,
// a glowing beam rising at every mapped place, signboard labels, and arcs
// from DSU Main Campus to each destination. The page drives it with one
// number, `progress` (0 to 1, from scrolling), plus the pointer position.
//
// Loaded on demand from Home.jsx, so three.js never reaches the map app.

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const TILE_URL = (z, x, y) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

const tileX = (lng, z) => ((lng + 180) / 360) * 2 ** z;
const tileY = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
};
const tileLng = (x, z) => (x / 2 ** z) * 360 - 180;
const tileLat = (y, z) => {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
};

const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

// Camera stops along the scroll, in metres around the campus centre
// (x east, z south, y up). Between stops the camera eases.
const WIDE_SHOTS = [
  { at: 0.0, pos: [0, 2300, 260], look: [0, 0, 0] },      // map view, from high up
  { at: 0.3, pos: [-1050, 820, 1150], look: [-60, 0, 60] }, // tilt down from the south-west
  { at: 0.62, pos: [1150, 620, 780], look: [-80, 0, 40] },  // swing round to the east
  { at: 1.0, pos: [260, 430, 820], look: [-120, 0, -20] }   // settle low over the core
];
// Portrait screens are tall and narrow, so the camera looks down more
// steeply there; otherwise half the screen is sky.
const TALL_SHOTS = [
  { at: 0.0, pos: [-80, 2900, 200], look: [-80, 0, 60] },
  { at: 0.3, pos: [-700, 1500, 1150], look: [-140, 0, 120] },
  { at: 0.62, pos: [900, 1250, 850], look: [-120, 0, 60] },
  { at: 1.0, pos: [120, 1050, 950], look: [-160, 0, 20] }
];

function cameraAt(p, tall) {
  const SHOTS = tall ? TALL_SHOTS : WIDE_SHOTS;
  let i = 0;
  while (i < SHOTS.length - 2 && p > SHOTS[i + 1].at) i++;
  const a = SHOTS[i], b = SHOTS[i + 1];
  const t = smooth(a.at, b.at, p);
  return {
    pos: a.pos.map((v, k) => lerp(v, b.pos[k], t)),
    look: a.look.map((v, k) => lerp(v, b.look[k], t))
  };
}

export function createCampus3D({ container, labelLayer, places, center, originId, colorFor, lite = false, still = false }) {
  const W = () => container.clientWidth;
  const H = () => container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: !lite, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.5 : 2));
  renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer({ element: labelLayer });
  labels.setSize(W(), H());

  const scene = new THREE.Scene();
  const NAVY = new THREE.Color('#0a1b33');
  scene.background = NAVY;
  scene.fog = new THREE.Fog(NAVY, 1500, 4300);

  const camera = new THREE.PerspectiveCamera(42, W() / H(), 5, 9000);

  // Local metres from lat/lng, flat around the campus centre. At 2 km
  // across, the error from ignoring the earth's curve is a few centimetres.
  const kx = 111320 * Math.cos((center.lat * Math.PI) / 180);
  const ky = 110540;
  const toLocal = (lat, lng) => new THREE.Vector3((lng - center.lng) * kx, 0, -(lat - center.lat) * ky);

  // ---- Ground: satellite tiles stitched into textures ----------------
  // A sharp inner square (zoom 17) over the campus, and a wide, softer
  // outer square (zoom 14) so the campus sits in a landscape that fades
  // into the night instead of ending in a hard edge.
  let disposed = false;
  let pending = 0;

  // Opaque in the middle, fading to clear at the edges.
  function fadeMask(inner) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 128 * inner, 128, 128, 128);
    grd.addColorStop(0, '#fff'); grd.addColorStop(1, '#000');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  function tilePlane(z, spanLat, y, tint, inner) {
    const spanLng = spanLat * 1.1;
    const tx0 = Math.floor(tileX(center.lng - spanLng, z)), tx1 = Math.floor(tileX(center.lng + spanLng, z));
    const ty0 = Math.floor(tileY(center.lat + spanLat, z)), ty1 = Math.floor(tileY(center.lat - spanLat, z));
    const cols = tx1 - tx0 + 1, rows = ty1 - ty0 + 1;
    const canvas = document.createElement('canvas');
    canvas.width = cols * 256; canvas.height = rows * 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1b2a1f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const a = toLocal(tileLat(ty0, z), tileLng(tx0, z));
    const b = toLocal(tileLat(ty1 + 1, z), tileLng(tx1 + 1, z));
    const w = b.x - a.x, d = b.z - a.z;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ map: tex, color: tint, alphaMap: fadeMask(inner), transparent: true, depthWrite: y >= 0 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(a.x + w / 2, y, a.z + d / 2);
    // The ground is see-through at its edges, which would otherwise let
    // it be sorted after (and painted over) the beams and arcs.
    mesh.renderOrder = y < 0 ? -2 : -1;
    scene.add(mesh);

    for (let x = tx0; x <= tx1; x++) {
      for (let yy = ty0; yy <= ty1; yy++) {
        pending++;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          pending--;
          if (disposed) return;
          ctx.drawImage(img, (x - tx0) * 256, (yy - ty0) * 256);
          tex.needsUpdate = true;
        };
        img.onerror = () => { pending--; };
        img.src = TILE_URL(z, x, yy);
      }
    }
    return { w, d };
  }

  tilePlane(14, 0.05, -1, new THREE.Color(0.55, 0.62, 0.78), 0.45);
  const { w: groundW, d: groundD } = tilePlane(17, 0.011, 0, new THREE.Color(0.88, 0.92, 1.0), 0.72);

  // A survey grid laid just above the imagery, fading out with distance.
  const grid = new THREE.GridHelper(6000, 60, 0xffc72c, 0x3b6db8);
  grid.position.y = 1.5;
  grid.material.transparent = true;
  grid.material.opacity = 0.0;
  grid.material.depthWrite = false;
  scene.add(grid);

  // ---- Places: beam, glow, ring, head, label ---------------------------
  const origin = places.find(p => p.id === originId) ?? places[0];
  const originPos = toLocal(origin.lat, origin.lng);
  const shown = places.filter(p => {
    const v = toLocal(p.lat, p.lng);
    return Math.abs(v.x) < groundW / 2 - 50 && Math.abs(v.z) < groundD / 2 - 50;
  });

  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.25, 'rgba(255,255,255,.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  const markers = shown.map((p, i) => {
    const color = new THREE.Color(colorFor(p.category));
    const base = toLocal(p.lat, p.lng);
    // Heights vary so neighbouring labels sit at different levels.
    const height = p.id === originId ? 210 : 95 + (i % 4) * 48;
    const group = new THREE.Group();
    group.position.copy(base);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 5.5, 1, 12, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    beam.geometry.translate(0, 0.5, 0);
    group.add(beam);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(9, 20, 14),
      new THREE.MeshBasicMaterial({ color })
    );
    group.add(head);

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    glow.scale.set(70, 70, 1);
    group.add(glow);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(14, 18, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 2;
    group.add(ring);

    // The renderer owns the outer element's transform, so the label's own
    // scale and fade go on an inner element.
    const outer = document.createElement('div');
    const el = document.createElement('div');
    el.className = 'label3d' + (p.confidence !== 'confirmed' ? ' label3d-unv' : '');
    el.textContent = p.name.replace(/ — .*/, '');
    el.style.setProperty('--pin', colorFor(p.category));
    outer.appendChild(el);
    const label = new CSS2DObject(outer);
    group.add(label);

    scene.add(group);
    return { p, group, beam, head, glow, ring, label, el, height, delay: i * 0.035 };
  });

  // ---- Arcs from the origin to every other place -----------------------
  const arcs = markers.filter(m => m.p.id !== originId).map(m => {
    const a = originPos.clone(), b = m.group.position.clone();
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y = 70 + a.distanceTo(b) * 0.38;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.TubeGeometry(curve, 80, 2.4, 6, false);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffc72c, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.geometry.setDrawRange(0, 0);
    scene.add(mesh);

    // A spark that travels along each arc once it is drawn.
    const spark = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xfff1b8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    spark.scale.set(34, 34, 1);
    spark.visible = false;
    scene.add(spark);
    return { curve, mesh, spark, total: geo.index.count, offset: Math.random() };
  });

  // ---- Drifting dust in the air, catching the light --------------------
  const dustCount = lite ? 300 : 900;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 3200;
    dustPos[i * 3 + 1] = 40 + Math.random() * 900;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 3200;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    map: glowTex, color: 0x9fc4ff, size: lite ? 9 : 7, transparent: true, opacity: 0.0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }));
  scene.add(dust);

  // ---- Driving it -------------------------------------------------------
  let progress = still ? 0.8 : 0;
  let shown_p = progress;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const clock = new THREE.Clock();
  const look = new THREE.Vector3();

  function frame() {
    if (disposed) return;
    const t = clock.getElapsedTime();
    // Ease towards the scroll position so the camera glides, not jumps.
    shown_p += (progress - shown_p) * (still ? 1 : 0.08);
    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;
    const p = shown_p;

    const shot = cameraAt(p, camera.aspect < 0.8);
    const drift = still ? 0 : Math.sin(t * 0.15) * 40;
    camera.position.set(
      shot.pos[0] + drift + pointer.sx * 120,
      shot.pos[1] - pointer.sy * 60,
      shot.pos[2] + Math.cos(t * 0.12) * 30
    );
    look.set(...shot.look);
    camera.lookAt(look);

    grid.material.opacity = 0.18 * smooth(0.08, 0.35, p);
    dust.material.opacity = 0.5 * smooth(0.1, 0.4, p);
    if (!still) dust.rotation.y = t * 0.01;

    // Beams rise between 12% and 45% of the scroll, one after another.
    const labelsOn = smooth(0.3, 0.42, p);
    markers.forEach(m => {
      const rise = smooth(0.12 + m.delay, 0.36 + m.delay, p);
      const h = Math.max(0.001, m.height * rise);
      m.beam.scale.y = h;
      m.head.position.y = h;
      m.glow.position.y = h;
      m.label.position.y = h + 26;
      const pulse = still ? 1 : 1 + Math.sin(t * 2.2 + m.delay * 40) * 0.12;
      m.head.scale.setScalar(Math.max(0.01, rise) * pulse);
      m.glow.material.opacity = 0.9 * rise;
      const ringT = still ? 0.5 : (t * 0.6 + m.delay * 10) % 1;
      m.ring.scale.setScalar(0.6 + ringT * 1.8 * Math.max(rise, 0.25));
      m.ring.material.opacity = (1 - ringT) * 0.85;
      m.el.style.opacity = String(labelsOn);
      m.el.style.transform = `translateY(${(1 - labelsOn) * 12}px) scale(${0.85 + 0.15 * labelsOn})`;
    });

    // Arcs draw between 50% and 80%, then sparks run along them.
    arcs.forEach((a, i) => {
      const draw = smooth(0.48 + i * 0.02, 0.72 + i * 0.02, p);
      a.mesh.geometry.setDrawRange(0, Math.floor(a.total * draw / 3) * 3);
      a.spark.visible = draw > 0.99 && !still;
      if (a.spark.visible) a.spark.position.copy(a.curve.getPoint((t * 0.25 + a.offset) % 1));
    });

    renderer.render(scene, camera);
    labels.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  let raf = requestAnimationFrame(frame);

  function resize() {
    renderer.setSize(W(), H());
    labels.setSize(W(), H());
    camera.aspect = W() / H();
    // Narrow screens need a wider lens to keep the campus in frame.
    camera.fov = camera.aspect < 0.8 ? 62 : 42;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  return {
    setProgress(v) { if (!still) progress = Math.min(1, Math.max(0, v)); },
    setPointer(x, y) { pointer.x = x; pointer.y = y; },
    // Pause rendering while the hero is off screen, to spare the battery.
    setActive(on) {
      if (disposed) return;
      cancelAnimationFrame(raf);
      if (on) raf = requestAnimationFrame(frame);
    },
    loading: () => pending > 0,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse(o => {
        o.geometry?.dispose();
        if (o.material) [].concat(o.material).forEach(m => { m.map?.dispose(); m.dispose(); });
      });
      renderer.dispose();
      renderer.domElement.remove();
      labelLayer.replaceChildren();
    }
  };
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
