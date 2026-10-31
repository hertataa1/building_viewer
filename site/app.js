import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { IfcAPI } from './vendor/web-ifc-api.js';

const $ = id => document.getElementById(id);
const view = $('viewport');
const localServer = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
let renderer, controls, camera, scene, model, api, busy = false, hostedPath = null;
const status = (message, error = false) => { $('status').textContent = message; $('status').className = error ? 'error' : ''; $('status').hidden = !message; };
function initScene() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  view.prepend(renderer.domElement);
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x687766, 2.5));
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(20, 40, 25); scene.add(sun);
  camera = new THREE.PerspectiveCamera(45, 1, .01, 10000);
  controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
  new ResizeObserver(() => { const w = view.clientWidth, h = view.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }).observe(view);
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); status('The 3D display ran out of resources. Reload this page and try a smaller model.', true); });
}
try { initScene(); } catch (error) { status('This browser could not start 3D graphics. Try a recent browser with hardware acceleration enabled.', true); }
function fit(top = false) {
  if (!model) return;
  const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.length() / 2, .1);
  const angle = Math.min(THREE.MathUtils.degToRad(camera.fov) / 2, Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect));
  const distance = radius / Math.sin(angle) * 1.15;
  camera.near = Math.max(radius / 10000, .001); camera.far = radius * 1000;
  camera.position.copy(center).add(new THREE.Vector3(...(top ? [0, 1, .0001] : [1, .75, 1])).normalize().multiplyScalar(distance));
  controls.target.copy(center); controls.minDistance = radius * .01; controls.maxDistance = radius * 100;
  camera.updateProjectionMatrix(); controls.update();
}
function dispose(group) { group.traverse(o => { o.geometry?.dispose(); if (o.material) o.material.dispose(); }); }
function setBusy(value) { busy = value; $('file').disabled = value; $('hosted').querySelector('button').disabled = value; $('path').disabled = value; $('emptyopen').disabled = value; $('share').disabled = value || !hostedPath; }
async function load(getData, name, published = null) {
  if (busy || !renderer) return;
  setBusy(true); let candidate = new THREE.Group(), modelID;
  status('Opening ' + name + '…');
  try {
    const data = await getData();
    if (!new TextDecoder().decode(data.subarray(0, 4096)).includes('ISO-10303-21')) throw new Error('This does not look like an IFC STEP file. Choose an uncompressed .ifc file.');
    status('Reading building geometry… Large models may take a while.');
    await new Promise(resolve => setTimeout(resolve, 50));
    if (!api) { api = new IfcAPI(); api.SetWasmPath(new URL('./vendor/', location.href).href, true); await api.Init(); }
    modelID = api.OpenModel(data, { COORDINATE_TO_ORIGIN: true });
    if (modelID < 0) throw new Error('The IFC reader could not open this model.');
    let elements = 0;
    api.StreamAllMeshes(modelID, flat => {
      if (flat.geometries.size()) elements++;
      for (let i = 0; i < flat.geometries.size(); i++) {
        const placed = flat.geometries.get(i), geom = api.GetGeometry(modelID, placed.geometryExpressID);
        try {
          const vertices = api.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize());
          const indices = api.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize()).slice();
          if (!indices.length) continue;
          const positions = new Float32Array(vertices.length / 2), normals = new Float32Array(vertices.length / 2);
          for (let j = 0, k = 0; j < vertices.length; j += 6, k += 3) { positions.set(vertices.subarray(j, j + 3), k); normals.set(vertices.subarray(j + 3, j + 6), k); }
          const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3)); geometry.setIndex(new THREE.BufferAttribute(indices, 1));
          const c = placed.color;
          const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(c.x, c.y, c.z), opacity: c.w, transparent: c.w < 1, roughness: .8, metalness: 0, side: THREE.DoubleSide, depthWrite: c.w >= 1 });
          const mesh = new THREE.Mesh(geometry, material); mesh.applyMatrix4(new THREE.Matrix4().fromArray(placed.flatTransformation)); candidate.add(mesh);
        } finally { geom.delete(); }
      }
    });
    if (!candidate.children.length) throw new Error('No displayable 3D geometry was found in this IFC file.');
    const box = new THREE.Box3().setFromObject(candidate);
    if (!Number.isFinite(box.getSize(new THREE.Vector3()).length())) throw new Error('This model contains invalid geometry.');
    candidate.position.sub(box.getCenter(new THREE.Vector3()));
    if (model) { scene.remove(model); dispose(model); }
    model = candidate; scene.add(model); hostedPath = published;
    $('edges').checked = false; $('empty').hidden = true;
    $('modelname').textContent = name; $('source').textContent = published ? 'PUBLISHED MODEL' : 'LOCAL PREVIEW';
    $('details').textContent = elements.toLocaleString() + ' elements · ' + (data.byteLength / 1048576).toFixed(1) + ' MB';
    $('sharehint').textContent = published ? (localServer ? 'Local server only. Use your GitHub Pages website to copy a link for friends.' : 'This link opens the published file for your friends.') : 'This file stays on your device. Publish it with the site before sharing.';
    for (const id of ['fit', 'top', 'reset']) $(id).disabled = false;
    const url = new URL(location.href); url.search = ''; if (published) url.searchParams.set('model', published); history.replaceState(null, '', url);
    fit(); status('');
  } catch (error) { if (candidate !== model) dispose(candidate); status('Couldn’t open this model. ' + error.message + (published ? ' Check that the file is published at this path, including matching capital letters.' : ''), true); }
  finally { if (modelID !== undefined && modelID >= 0) api.CloseModel(modelID); setBusy(false); }
}
function publishedURL(path) {
  const url = new URL(path, location.href), base = new URL('./', location.href);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || !url.pathname.toLowerCase().endsWith('.ifc') || url.search || url.hash) throw new Error('Use an .ifc path inside this website, such as models/building.ifc.');
  return url;
}
async function loadHosted(path) {
  let url; try { url = publishedURL(path); } catch (error) { status(error.message, true); return; }
  const relative = url.pathname.slice(new URL('./', location.href).pathname.length);
  $('path').value = relative;
  await load(async () => { const response = await fetch(url); if (!response.ok) throw new Error('The published file could not be downloaded (HTTP ' + response.status + ').'); return new Uint8Array(await response.arrayBuffer()); }, decodeURIComponent(url.pathname.split('/').pop()), relative);
}
$('file').addEventListener('change', event => { const file = event.target.files[0]; if (file) load(async () => new Uint8Array(await file.arrayBuffer()), file.name); event.target.value = ''; });
$('emptyopen').onclick = () => $('file').click();
$('hosted').onsubmit = event => { event.preventDefault(); loadHosted($('path').value.trim()); };
$('fit').onclick = () => fit(); $('reset').onclick = () => fit(); $('top').onclick = () => fit(true);
$('edges').onchange = () => { if (!model) return; const meshes = model.children.filter(o => o.isMesh); for (const mesh of meshes) { if (!mesh.userData.edges) { const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 30), new THREE.LineBasicMaterial({ color: 0x354637, transparent: true, opacity: .35 })); mesh.add(lines); mesh.userData.edges = lines; } mesh.userData.edges.visible = $('edges').checked; } };
$('share').onclick = async () => { if (!hostedPath) return; const url = new URL('./', location.href); url.searchParams.set('model', hostedPath); try { await navigator.clipboard.writeText(url.href); status(localServer ? 'Local preview link copied. This address works only on your device. Publish on GitHub Pages for a link your friends can use.' : 'Model link copied. Your friends can open this published model.'); setTimeout(() => status(''), 7000); } catch { status('Copy this model link: ' + url.href + (localServer ? ' — Local device only; use GitHub Pages to share with friends.' : '')); } };
$('help').onclick = () => $('guide').showModal(); $('closeguide').onclick = () => $('guide').close();
$('demo').onclick = () => { $('guide').close(); loadHosted('models/pavilion.ifc'); };
const initial = new URL(location.href).searchParams.get('model'); if (initial) loadHosted(initial);
