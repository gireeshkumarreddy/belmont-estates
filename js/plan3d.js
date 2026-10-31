// The 3D master plan: the Blender model (assets/model/belmont.glb) in three.js, loaded on first use.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ease = t => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const VIEW = { polar: THREE.MathUtils.degToRad(52), azimuth: THREE.MathUtils.degToRad(-14) };
const ROOF = new THREE.Color('#45506B'), ROOF_HOT = new THREE.Color('#C7B36D');

export async function createViewer({ container, spots, tip }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'plan-3d-canvas';
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 2, 3000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa9a48f, 1.9));
  const sun = new THREE.DirectionalLight(0xfff4e2, 2.4);
  sun.position.set(-70, 130, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -115, right: 115, top: 85, bottom: -85, near: 10, far: 400 });
  sun.shadow.bias = -.0004;
  scene.add(sun);

  const gltf = await new GLTFLoader().loadAsync('assets/model/belmont.glb');
  const model = gltf.scene;
  model.updateMatrixWorld(true);

  // Hundreds of trees and 74 homes become a handful of instanced draws; homes stay pickable by instance.
  const batches = new Map(), removed = [];
  let homeCount = 0;
  model.traverse(node => {
    const match = /^(Tree|Home)_\d+$/.exec(node.name);
    if (!match) return;
    const meshes = node.isMesh ? [node] : node.children.filter(child => child.isMesh);
    for (const mesh of meshes) {
      const key = `${mesh.geometry.uuid}:${mesh.material.uuid}`;
      if (!batches.has(key)) batches.set(key, { geometry: mesh.geometry, material: mesh.material, kind: match[1], matrices: [] });
      batches.get(key).matrices.push(mesh.matrixWorld.clone());
    }
    if (match[1] === 'Home') homeCount++;
    removed.push(node);
  });
  removed.forEach(node => node.parent.remove(node));
  model.traverse(node => { if (node.isMesh) { node.receiveShadow = true; node.castShadow = /^Entry|Column/.test(node.name); } });

  const pickable = [];
  let roofs = null;
  for (const { geometry, material, kind, matrices } of batches.values()) {
    const isRoof = kind === 'Home' && /roof/i.test(material.name);
    const batchMaterial = isRoof ? material.clone() : material;
    if (isRoof) batchMaterial.color.set('#ffffff');
    const mesh = new THREE.InstancedMesh(geometry, batchMaterial, matrices.length);
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.castShadow = true;
    mesh.receiveShadow = kind === 'Home';
    if (isRoof) { for (let i = 0; i < matrices.length; i++) mesh.setColorAt(i, ROOF); roofs = mesh; }
    if (kind === 'Home') pickable.push(mesh);
    scene.add(mesh);
  }
  scene.add(model);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  controls.screenSpacePanning = false;
  controls.minDistance = 45;
  controls.maxDistance = 560;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(76);
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  // Plain scrolling belongs to the page (and its map stop); only pinch or Ctrl + scroll zooms the model.
  const zoomGate = event => { controls.enableZoom = event.ctrlKey; };
  addEventListener('wheel', zoomGate, { capture: true, passive: true });
  renderer.domElement.addEventListener('pointerdown', () => { controls.enableZoom = true; });
  controls.addEventListener('change', () => {
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, -100, 100);
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, -72, 72);
    controls.target.y = 0;
  });

  /* ----- framing ----- */
  let width = 1, height = 1;
  function fitDistance(polar) {
    // Far enough that the whole plinth sits inside the frame, with room for the controls.
    const vertical = THREE.MathUtils.degToRad(camera.fov) / 2, horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    const across = 106 / Math.tan(horizontal), along = (76 * Math.cos(polar) + 8) / Math.tan(vertical);
    return Math.max(across, along) * 1.12;
  }
  function place(polar, azimuth, distance, target = new THREE.Vector3()) {
    camera.position.set(
      target.x + distance * Math.sin(polar) * Math.sin(azimuth),
      target.y + distance * Math.cos(polar),
      target.z + distance * Math.sin(polar) * Math.cos(azimuth));
    camera.up.set(0, 1, 0);
    controls.target.copy(target);
    camera.lookAt(target);
  }
  let tween = null;
  function flyTo(toPolar, duration = 1300) {
    const fromTarget = controls.target.clone(), offset = camera.position.clone().sub(fromTarget);
    const fromDistance = offset.length(), fromPolar = Math.acos(THREE.MathUtils.clamp(offset.y / fromDistance, -1, 1));
    const fromAzimuth = Math.atan2(offset.x, offset.z), toDistance = fitDistance(toPolar);
    if (reducedMotion.matches) { place(toPolar, VIEW.azimuth, toDistance); return; }
    const start = performance.now();
    tween = now => {
      const t = Math.min(1, (now - start) / duration), k = ease(t);
      place(THREE.MathUtils.lerp(fromPolar, toPolar, k), THREE.MathUtils.lerp(fromAzimuth, VIEW.azimuth, k),
        THREE.MathUtils.lerp(fromDistance, toDistance, k), fromTarget.clone().lerp(new THREE.Vector3(), k));
      if (t >= 1) tween = null;
    };
  }
  function resize() {
    width = container.clientWidth || 1; height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();
  place(.0001, 0, fitDistance(0));

  /* ----- hotspots and homes ----- */
  const pinsBox = container.querySelector('.plan-3d-pins');
  pinsBox.innerHTML = spots.map(spot => `<button type="button" class="plan-pin${spot.x < 240 ? ' to-east' : ''}" data-spot="${spot.id}"><span>${spot.title}</span></button>`).join('');
  const pins = [...pinsBox.children].map((element, i) => ({ element, at: new THREE.Vector3((spots[i].x - 1000) / 10, 2.6, (spots[i].y - 722.5) / 10) }));
  const projected = new THREE.Vector3();
  function placePins() {
    for (const pin of pins) {
      projected.copy(pin.at).project(camera);
      const hidden = projected.z > 1 || Math.abs(projected.x) > 1.05 || Math.abs(projected.y) > 1.05;
      pin.element.style.visibility = hidden ? 'hidden' : '';
      pin.element.style.transform = `translate(${((projected.x + 1) / 2 * width).toFixed(1)}px, ${((1 - projected.y) / 2 * height).toFixed(1)}px)`;
    }
  }

  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let hot = -1, pointerAt = null;
  renderer.domElement.addEventListener('pointermove', event => {
    const box = renderer.domElement.getBoundingClientRect();
    pointerAt = { x: event.clientX - box.left, y: event.clientY - box.top, buttons: event.buttons };
  });
  renderer.domElement.addEventListener('pointerleave', () => { pointerAt = null; });
  function pick() {
    let next = -1;
    if (pointerAt && !pointerAt.buttons && roofs) {
      pointer.set(pointerAt.x / width * 2 - 1, -(pointerAt.y / height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickable, false)[0];
      if (hit) next = hit.instanceId;
    }
    if (next === hot) { if (next >= 0) moveTip(); return; }
    if (hot >= 0) roofs.setColorAt(hot, ROOF);
    if (next >= 0) roofs.setColorAt(next, ROOF_HOT);
    roofs.instanceColor.needsUpdate = true;
    hot = next;
    renderer.domElement.style.cursor = next >= 0 ? 'pointer' : '';
    tip.hidden = next < 0;
    if (next >= 0) { tip.textContent = 'Two-acre homesite'; moveTip(); }
  }
  const moveTip = () => { tip.style.transform = `translate(${pointerAt.x + 16}px, ${pointerAt.y - 34}px)`; };

  /* ----- render loop, only while the 3D view is on screen ----- */
  let active = false, raf = 0, first = true;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    tween?.(now);
    controls.update();
    renderer.render(scene, camera);
    placePins();
    pick();
    if (first) { first = false; container.classList.add('is-live'); }
  }
  function setActive(on) {
    if (on === active) return;
    active = on;
    if (on) raf = requestAnimationFrame(loop); else cancelAnimationFrame(raf);
  }

  return {
    enter() {
      setActive(true);
      // Start straight overhead, like the 2D plan, then tilt into the model.
      place(.0001, 0, fitDistance(0));
      flyTo(VIEW.polar);
    },
    leave() { tween = null; setTimeout(() => setActive(false), 650); },
    zoom(factor) {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() / factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
    },
    reset() { flyTo(VIEW.polar, 900); },
    setActive,
    resize,
    homes: homeCount
  };
}
