/* ============================================================
   ABC del Descanso — render 3D del colchón sobre somier
   Al bajar, la pieza se despieza capa a capa (sección fijada).
   Ilustración genérica: no reproduce ningún modelo ni marca.
   ============================================================ */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const raiz = document.documentElement;
const seccion = document.querySelector(".producto");
const pin = document.querySelector(".pin");
const canvas = document.getElementById("render");
const textoPortada = document.querySelector(".portada-texto");
const pista = document.querySelector(".pista");
const porDentro = document.querySelector(".por-dentro");
const escena2D = document.querySelector(".escena");
const etiquetas = [...document.querySelectorAll(".capas-etiquetas li")];
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- utilidades ---------------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function lienzo(tam, dibuja) {
  const c = document.createElement("canvas");
  c.width = c.height = tam;
  dibuja(c.getContext("2d"), tam);
  return c;
}
function textura(c, rx, ry, color = false) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------- texturas generadas ---------------- */
// Acolchado en rombos (mapa de relieve) para el tejido superior
const lienzoCapitone = lienzo(512, (g, s) => {
  g.fillStyle = "#6a6a6a";
  g.fillRect(0, 0, s, s);
  const paso = s / 2;
  for (let y = -1; y <= 2; y++) {
    for (let x = -1; x <= 2; x++) {
      const cx = x * paso + (y % 2 ? paso / 2 : 0);
      const cy = y * paso * 0.5;
      const r = g.createRadialGradient(cx, cy, 0, cx, cy, paso * 0.62);
      r.addColorStop(0, "#ffffff");
      r.addColorStop(0.7, "#9a9a9a");
      r.addColorStop(1, "#5a5a5a");
      g.fillStyle = r;
      g.beginPath();
      g.moveTo(cx, cy - paso * 0.5);
      g.lineTo(cx + paso * 0.5, cy);
      g.lineTo(cx, cy + paso * 0.5);
      g.lineTo(cx - paso * 0.5, cy);
      g.closePath();
      g.fill();
    }
  }
  // costuras
  g.strokeStyle = "#202020";
  g.lineWidth = 3;
  for (let k = -s; k <= 2 * s; k += paso / 2) {
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k + s, s); g.stroke();
    g.beginPath(); g.moveTo(k, s); g.lineTo(k + s, 0); g.stroke();
  }
});
// Trama fina de tela
const lienzoTrama = lienzo(256, (g, s) => {
  g.fillStyle = "#808080";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < s; i += 4) {
    g.fillStyle = i % 8 ? "#8c8c8c" : "#747474";
    g.fillRect(0, i, s, 2);
    g.fillStyle = "rgba(0,0,0,0.12)";
    g.fillRect(i, 0, 1, s);
  }
});
// Poro de espuma
const lienzoEspuma = lienzo(256, (g, s) => {
  g.fillStyle = "#909090";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 1600; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = 0.6 + Math.random() * 2.2;
    g.fillStyle = `rgba(40,40,40,${0.25 + Math.random() * 0.4})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
});
// Veta de madera para las láminas
const lienzoMadera = lienzo(256, (g, s) => {
  g.fillStyle = "#c9a37b";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * s;
    g.strokeStyle = `rgba(120,80,45,${0.08 + Math.random() * 0.18})`;
    g.lineWidth = 0.6 + Math.random() * 1.8;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= s; x += 16) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 2.5);
    g.stroke();
  }
});
// Sombra de contacto (mancha radial)
const lienzoSombra = lienzo(256, (g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  r.addColorStop(0, "rgba(0,0,0,0.75)");
  r.addColorStop(0.55, "rgba(0,0,0,0.35)");
  r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, s, s);
});

/* ---------------- arranque ---------------- */
function iniciar() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    raiz.classList.add("sin-3d");
    return;
  }
  if (!renderer.getContext()) { raiz.classList.add("sin-3d"); return; }

  const movil = () => window.innerWidth < 700 || window.innerWidth / window.innerHeight < 0.8;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil() ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const escena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  escena.environmentIntensity = 0.75;

  const camara = new THREE.PerspectiveCamera(28, 1, 0.1, 60);

  /* luces: clave cálida + contra fría + relleno bajo en el azul de la marca */
  const clave = new THREE.DirectionalLight(0xffe1bc, 2.6);
  clave.position.set(-2.2, 4.6, 2.8);
  clave.castShadow = true;
  clave.shadow.mapSize.set(1024, 1024);
  clave.shadow.camera.left = -2.6; clave.shadow.camera.right = 2.6;
  clave.shadow.camera.top = 2.6; clave.shadow.camera.bottom = -2.6;
  clave.shadow.camera.near = 0.5; clave.shadow.camera.far = 12;
  clave.shadow.bias = -0.0004;
  clave.shadow.normalBias = 0.02;
  clave.shadow.radius = 4;
  escena.add(clave);
  const contra = new THREE.DirectionalLight(0xc8d2ff, 1.1);
  contra.position.set(3, 2.2, -3.5);
  escena.add(contra);
  const azul = new THREE.PointLight(0x1a86cc, 1.0, 6, 2);
  azul.position.set(0, -0.4, 1.6);
  escena.add(azul);

  /* ---------------- materiales ---------------- */
  const matTejidoArriba = new THREE.MeshPhysicalMaterial({
    color: 0xf3f1ec, roughness: 0.92, sheen: 1, sheenRoughness: 0.55, sheenColor: 0xfff0dc,
    bumpMap: textura(lienzoCapitone, 3, 4), bumpScale: 5
  });
  const matTejidoLado = new THREE.MeshPhysicalMaterial({
    color: 0xa8a69f, roughness: 0.95, sheen: 0.7, sheenRoughness: 0.6, sheenColor: 0xffffff,
    bumpMap: textura(lienzoTrama, 10, 1.2), bumpScale: 0.8
  });
  const matEspuma = new THREE.MeshStandardMaterial({
    color: 0xe3dac8, roughness: 1, bumpMap: textura(lienzoEspuma, 4, 5), bumpScale: 1.4
  });
  const matBase = new THREE.MeshPhysicalMaterial({
    color: 0x2c2c2f, roughness: 0.95, sheen: 0.4, sheenColor: 0x9a9a9a,
    bumpMap: textura(lienzoTrama, 12, 14), bumpScale: 0.8
  });
  const matFieltro = new THREE.MeshStandardMaterial({ color: 0x3a3836, roughness: 1 });
  const matMuelle = new THREE.MeshStandardMaterial({ color: 0xcac6be, metalness: 1, roughness: 0.3 });
  const matMarco = new THREE.MeshStandardMaterial({ color: 0x232427, metalness: 0.6, roughness: 0.42 });
  const matMadera = new THREE.MeshStandardMaterial({ map: textura(lienzoMadera, 1, 1, true), roughness: 0.58 });
  const matTaco = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.7 });

  /* ---------------- geometría ---------------- */
  const ANCHO = 1.35, LARGO = 1.9;     // proporción de una cama de matrimonio
  const pieza = new THREE.Group();     // todo el conjunto (gira)
  escena.add(pieza);

  const sombra = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

  // --- Somier de láminas ---
  const somier = new THREE.Group();
  const ALTO_PATA = 0.17, RIEL = 0.06;
  const rielL = new THREE.BoxGeometry(0.045, RIEL, LARGO);
  const rielC = new THREE.BoxGeometry(ANCHO, RIEL, 0.045);
  [-1, 1].forEach((s) => {
    const l = sombra(new THREE.Mesh(rielL, matMarco));
    l.position.set(s * (ANCHO / 2 - 0.0225), ALTO_PATA + RIEL / 2, 0);
    somier.add(l);
    const c = sombra(new THREE.Mesh(rielC, matMarco));
    c.position.set(0, ALTO_PATA + RIEL / 2, s * (LARGO / 2 - 0.0225));
    somier.add(c);
  });
  const central = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.035, RIEL * 0.8, LARGO - 0.08), matMarco));
  central.position.set(0, ALTO_PATA + RIEL * 0.4, 0);
  somier.add(central);
  const pataG = new THREE.CylinderGeometry(0.024, 0.02, ALTO_PATA, 18);
  [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]].forEach(([sx, sz]) => {
    const p = sombra(new THREE.Mesh(pataG, matMarco));
    p.position.set(sx * (ANCHO / 2 - 0.06), ALTO_PATA / 2, sz * (LARGO / 2 - 0.08));
    somier.add(p);
  });
  // láminas curvadas
  const NUM_LAM = 17;
  const lamG = new THREE.BoxGeometry(ANCHO - 0.07, 0.012, 0.068, 24, 1, 1);
  const pos = lamG.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / ((ANCHO - 0.07) / 2);
    pos.setY(i, pos.getY(i) + 0.012 * (1 - x * x));
  }
  lamG.computeVertexNormals();
  const tacoG = new THREE.BoxGeometry(0.05, 0.022, 0.08);
  const Y_LAM = ALTO_PATA + RIEL + 0.008;
  for (let i = 0; i < NUM_LAM; i++) {
    const z = lerp(-LARGO / 2 + 0.09, LARGO / 2 - 0.09, i / (NUM_LAM - 1));
    const lam = sombra(new THREE.Mesh(lamG, matMadera));
    lam.position.set(0, Y_LAM, z);
    somier.add(lam);
    [-1, 1].forEach((s) => {
      const t = sombra(new THREE.Mesh(tacoG, matTaco));
      t.position.set(s * (ANCHO / 2 - 0.035), Y_LAM - 0.004, z);
      somier.add(t);
    });
  }
  const TOPE_SOMIER = Y_LAM + 0.022;

  // --- Capas del colchón (de abajo arriba) ---
  const ALTO_BASE = 0.03, ALTO_NUCLEO = 0.16, ALTO_ACOL = 0.055, ALTO_TEJ = 0.065;

  const base = new THREE.Group();
  base.add(sombra(new THREE.Mesh(new RoundedBoxGeometry(ANCHO, ALTO_BASE, LARGO, 3, 0.012), matBase)));
  base.position.y = TOPE_SOMIER + ALTO_BASE / 2;

  const nucleo = new THREE.Group();
  const fieltro = sombra(new THREE.Mesh(new THREE.BoxGeometry(ANCHO - 0.02, 0.006, LARGO - 0.02), matFieltro));
  fieltro.position.y = -ALTO_NUCLEO / 2 + 0.003;
  nucleo.add(fieltro);
  class Helice extends THREE.Curve {
    constructor(r, h, vueltas) { super(); this.r = r; this.h = h; this.v = vueltas; }
    getPoint(t, o = new THREE.Vector3()) {
      const a = t * this.v * Math.PI * 2;
      // espiras de los extremos algo más abiertas, centro más estrecho (muelle ensacado)
      const rr = this.r * (0.86 + 0.14 * Math.cos((t - 0.5) * Math.PI * 2));
      return o.set(Math.cos(a) * rr, (t - 0.5) * this.h, Math.sin(a) * rr);
    }
  }
  const NX = 9, NZ = 13;
  const muelleG = new THREE.TubeGeometry(new Helice(0.056, ALTO_NUCLEO - 0.014, 5.5), 170, 0.0042, 6, false);
  const muelles = new THREE.InstancedMesh(muelleG, matMuelle, NX * NZ);
  muelles.castShadow = muelles.receiveShadow = true;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  let n = 0;
  for (let ix = 0; ix < NX; ix++) {
    for (let iz = 0; iz < NZ; iz++) {
      const x = lerp(-ANCHO / 2 + 0.075, ANCHO / 2 - 0.075, ix / (NX - 1));
      const z = lerp(-LARGO / 2 + 0.073, LARGO / 2 - 0.073, iz / (NZ - 1));
      q.setFromEuler(e.set(0, (ix * 7 + iz * 3) % 6, 0));
      m4.compose(new THREE.Vector3(x, 0.004, z), q, new THREE.Vector3(1, 1, 1));
      muelles.setMatrixAt(n++, m4);
    }
  }
  nucleo.add(muelles);
  nucleo.position.y = base.position.y + ALTO_BASE / 2 + ALTO_NUCLEO / 2;

  const acolchado = new THREE.Group();
  acolchado.add(sombra(new THREE.Mesh(new RoundedBoxGeometry(ANCHO - 0.01, ALTO_ACOL, LARGO - 0.01, 4, 0.02), matEspuma)));
  acolchado.position.y = nucleo.position.y + ALTO_NUCLEO / 2 + ALTO_ACOL / 2;

  const tejido = new THREE.Group();
  // grupos de BoxGeometry: +x, -x, +y, -y, +z, -z
  tejido.add(sombra(new THREE.Mesh(
    new RoundedBoxGeometry(ANCHO, ALTO_TEJ, LARGO, 5, 0.03),
    [matTejidoLado, matTejidoLado, matTejidoArriba, matTejidoLado, matTejidoLado, matTejidoLado]
  )));
  tejido.position.y = acolchado.position.y + ALTO_ACOL / 2 + ALTO_TEJ / 2;

  // Funda lateral: cierra el colchón montado y se desvanece al despiezar
  const matFunda = matTejidoLado.clone();
  matFunda.transparent = true;
  const oculto = new THREE.MeshBasicMaterial({ visible: false });
  const ALTO_FUNDA = tejido.position.y - TOPE_SOMIER;
  const funda = sombra(new THREE.Mesh(
    new RoundedBoxGeometry(ANCHO + 0.006, ALTO_FUNDA, LARGO + 0.006, 5, 0.03),
    [matFunda, matFunda, oculto, oculto, matFunda, matFunda]
  ));
  funda.position.y = TOPE_SOMIER + ALTO_FUNDA / 2;

  // orden de abajo arriba; índice k = nivel en el despiece
  const capas = [
    { nombre: "somier", obj: somier, k: 0, yMedio: ALTO_PATA + RIEL / 2, y0: 0 },
    { nombre: "base", obj: base, k: 1, yMedio: base.position.y, y0: base.position.y },
    { nombre: "nucleo", obj: nucleo, k: 2, yMedio: nucleo.position.y, y0: nucleo.position.y },
    { nombre: "acolchado", obj: acolchado, k: 3, yMedio: acolchado.position.y, y0: acolchado.position.y },
    { nombre: "tejido", obj: tejido, k: 4, yMedio: tejido.position.y, y0: tejido.position.y }
  ];
  capas.forEach((c) => pieza.add(c.obj));
  pieza.add(funda);
  const HUECO = 0.3;

  // suelo que solo recibe sombra + mancha de contacto
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.18 }));
  suelo.rotation.x = -Math.PI / 2;
  suelo.receiveShadow = true;
  pieza.add(suelo);
  const mancha = new THREE.Mesh(
    new THREE.PlaneGeometry(ANCHO * 1.7, LARGO * 1.45),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(lienzoSombra), transparent: true, opacity: 0.45, depthWrite: false })
  );
  mancha.rotation.x = -Math.PI / 2;
  mancha.position.y = 0.002;
  pieza.add(mancha);

  /* ---------------- encuadre ---------------- */
  // Dos encuadres: portada (montado, abajo) y despiece (centrado, a la izquierda de las etiquetas)
  const ENC = {
    portada: { cy: 0.3, r: 1.18, llenado: 0.64, llenadoM: 0.9, offX: 0, offXM: 0, offY: 0.2, offYM: 0.21, elev: 0.36 },
    despiece: { cy: 0.92, r: 1.42, llenado: 0.76, llenadoM: 0.8, offX: 0.0, offXM: 0.15, offY: 0.03, offYM: 0.11, elev: 0.29 }
  };
  let W = 1, H = 1, esMovil = false;
  function redimensiona() {
    W = pin.clientWidth;
    H = pin.clientHeight;
    esMovil = movil();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, esMovil ? 1.5 : 1.75));
    renderer.setSize(W, H, false);
    camara.aspect = W / H;
  }
  redimensiona();
  window.addEventListener("resize", redimensiona);

  const centro = new THREE.Vector3();
  function encuadra(t) {
    const a = ENC.portada, b = ENC.despiece;
    const r = lerp(a.r, b.r, t);
    const llen = esMovil ? lerp(a.llenadoM, b.llenadoM, t) : lerp(a.llenado, b.llenado, t);
    const elev = lerp(a.elev, b.elev, t);
    const offX = esMovil ? lerp(a.offXM, b.offXM, t) : lerp(a.offX, b.offX, t);
    const offY = esMovil ? lerp(a.offYM, b.offYM, t) : lerp(a.offY, b.offY, t);
    centro.set(0, lerp(a.cy, b.cy, t), 0);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
    const tanLim = Math.min(tanV, tanV * camara.aspect);
    const dist = r / Math.sin(Math.atan(tanLim * llen));
    camara.position.set(0, centro.y + Math.sin(elev) * dist, Math.cos(elev) * dist);
    camara.lookAt(centro);
    // desplaza la imagen: +x → la pieza se ve más a la izquierda; -y → más abajo
    camara.setViewOffset(W, H, offX * W, -offY * H, W, H);
    camara.updateProjectionMatrix();
  }

  /* ---------------- progreso de scroll ---------------- */
  let objetivo = 0, prog = 0;
  function leeScroll() {
    const r = seccion.getBoundingClientRect();
    const recorrido = r.height - window.innerHeight;
    objetivo = recorrido > 0 ? clamp(-r.top / recorrido, 0, 1) : 0;
  }
  if (window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.create({
      trigger: seccion, start: "top top", end: "bottom bottom",
      onUpdate: (s) => { objetivo = s.progress; }
    });
  } else {
    window.addEventListener("scroll", leeScroll, { passive: true });
  }
  leeScroll();

  /* entrada: la pieza sube y aparece */
  // Por reloj real y no con un tween de GSAP: si los primeros fotogramas van lentos
  // (compilar sombreadores en un móvil modesto), GSAP frena el tiempo y el lienzo se queda a medias.
  const intro = { v: reduce ? 1 : 0, t0: 0 };
  const DURA_INTRO = 1800, ESPERA_INTRO = 300;
  // Espera a que se retire la pantalla de carga (app.js avisa con «abc:listo»); por si acaso, 4,5 s como mucho
  let introLista = !document.querySelector(".cargador");
  document.addEventListener("abc:listo", function () { introLista = true; });
  setTimeout(function () { introLista = true; }, 4500);
  function avanzaIntro(ahora) {
    if (intro.v >= 1 || !introLista) return;
    if (!intro.t0) intro.t0 = ahora + ESPERA_INTRO;
    const t = clamp((ahora - intro.t0) / DURA_INTRO, 0, 1);
    intro.v = 1 - Math.pow(1 - t, 3);   // power3.out
  }

  /* ---------------- etiquetas ---------------- */
  const esquinas = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const tmp = new THREE.Vector3();
  function colocaEtiquetas(p) {
    pieza.updateMatrixWorld();
    etiquetas.forEach((li) => {
      const capa = capas.find((c) => c.nombre === li.dataset.capa);
      if (!capa) return;
      const orden = 4 - capa.k;                      // de arriba abajo
      const op = ss(0.44 + orden * 0.035, 0.56 + orden * 0.035, p);
      li.style.opacity = op.toFixed(3);
      if (op <= 0.001) return;
      const y = capa.k === 0 ? capa.yMedio : capa.obj.position.y;
      esquinas[0].set(ANCHO / 2, y, LARGO / 2);
      esquinas[1].set(ANCHO / 2, y, -LARGO / 2);
      esquinas[2].set(-ANCHO / 2, y, LARGO / 2);
      esquinas[3].set(-ANCHO / 2, y, -LARGO / 2);
      let mejorX = -Infinity, mejorY = 0;
      esquinas.forEach((v) => {
        tmp.copy(v).applyMatrix4(pieza.matrixWorld).project(camara);
        const sx = (tmp.x * 0.5 + 0.5) * W;
        const sy = (-tmp.y * 0.5 + 0.5) * H;
        if (sx > mejorX) { mejorX = sx; mejorY = sy; }
      });
      const ancho = li.offsetWidth;
      const sep = esMovil ? 14 : 34;
      const izq = Math.min(mejorX + sep, W - ancho - (esMovil ? 10 : 28));
      li.style.transform = `translate(${izq.toFixed(1)}px, ${(mejorY - li.offsetHeight / 2).toFixed(1)}px)`;
      const linea = li.firstElementChild;
      const largo = Math.max(0, izq - mejorX - 6);
      linea.style.width = largo.toFixed(1) + "px";
      linea.style.left = (-largo - 6).toFixed(1) + "px";
    });
  }

  /* ---------------- bucle ---------------- */
  let visible = true, raf = null, previo = 0;
  function pinta(ahora) {
    raf = null;
    // suavizado independiente de los fps (igual en un móvil lento que a 120 Hz)
    const dt = previo ? Math.min(ahora - previo, 250) : 16.7;
    previo = ahora;
    prog += (objetivo - prog) * (reduce ? 1 : 1 - Math.pow(1 - 0.085, dt / 16.7));
    if (Math.abs(objetivo - prog) < 0.0001) prog = objetivo;
    const p = prog;
    const tCam = suave(ss(0.03, 0.44, p));
    const tTexto = ss(0, 0.11, p);

    // despiece escalonado: la capa de arriba se separa primero
    capas.forEach((c) => {
      if (c.k === 0) return;
      const ini = 0.1 + (4 - c.k) * 0.055;
      const t = suave(ss(ini, ini + 0.32, p));
      c.obj.position.y = c.y0 + c.k * HUECO * t;
    });
    const opFunda = 1 - ss(0.06, 0.16, p);
    matFunda.opacity = opFunda;
    funda.visible = opFunda > 0.002;
    funda.position.y = TOPE_SOMIER + ALTO_FUNDA / 2 + (1 - opFunda) * 0.08;

    avanzaIntro(ahora);
    const respira = reduce ? 0 : 1;
    pieza.rotation.y = lerp(-0.62, -0.34, ss(0, 0.85, p)) + Math.sin(ahora * 0.00035) * 0.035 * (1 - tCam) * respira;
    pieza.position.y = Math.sin(ahora * 0.0011) * 0.008 * (1 - tCam) * respira - (1 - intro.v) * 0.16;
    pieza.scale.setScalar(0.93 + 0.07 * intro.v);
    canvas.style.opacity = intro.v.toFixed(3);

    encuadra(tCam);

    if (textoPortada) {
      textoPortada.style.opacity = (1 - tTexto).toFixed(3);
      textoPortada.style.transform = `translate(-50%, ${(-tTexto * 46).toFixed(1)}px)`;
      textoPortada.style.visibility = tTexto >= 1 ? "hidden" : "visible";
    }
    if (pista) pista.style.opacity = (1 - ss(0, 0.05, p)).toFixed(3);
    if (porDentro) {
      const t = ss(0.38, 0.52, p);
      porDentro.style.opacity = t.toFixed(3);
      porDentro.style.transform = `translateY(${((1 - t) * 18).toFixed(1)}px)`;
    }
    if (escena2D) raiz.style.setProperty("--op-despiece", (1 - 0.6 * tCam).toFixed(3));

    renderer.render(escena, camara);
    colocaEtiquetas(p);

    if (visible && !document.hidden) raf = requestAnimationFrame(pinta);
  }
  function arranca() { if (!raf) { previo = 0; raf = requestAnimationFrame(pinta); } }

  new IntersectionObserver((ents) => {
    visible = ents[0].isIntersecting;
    if (visible) arranca();
  }).observe(seccion);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) arranca(); });
  arranca();
  raiz.classList.add("con-3d");
}

iniciar();
