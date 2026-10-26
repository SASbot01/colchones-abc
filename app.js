/* ============================================================
   ABC del Descanso — portada
   - Arcos concéntricos (SVG) alineados con el disco
   - Ondas suaves de partículas (canvas)
   - Entrada tipográfica + parallax con GSAP / ScrollTrigger
   ============================================================ */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svg = document.querySelector(".arcos");
  const disco = document.querySelector(".disco");

  /* -------- Arcos concéntricos alineados con el centro del disco -------- */
  function dibujarArcos() {
    if (!svg || !disco) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    svg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const r = disco.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const base = r.width / 2;
    const gap = Math.max(46, Math.min(vw, vh) * 0.082);

    svg.innerHTML = "";
    const total = 7;
    for (let i = 0; i < total; i++) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", cx.toFixed(1));
      c.setAttribute("cy", cy.toFixed(1));
      c.setAttribute("r", (base + gap * (i + 1)).toFixed(1));
      c.style.opacity = Math.max(0.12, 1 - i * 0.14).toFixed(2);
      if (i === 2) c.classList.add("acento");
      svg.appendChild(c);
    }
    return svg.querySelectorAll("circle");
  }

  let circulos = dibujarArcos();

  // Redibujar en resize (con rebote)
  let t;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(function () {
      circulos = dibujarArcos();
    }, 150);
  });

  /* -------------------- Ondas de partículas (canvas) -------------------- */
  (function ondas() {
    const canvas = document.getElementById("ondas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    let W = 0, H = 0, dpr = 1;
    let particulas = [];
    let raf = null;
    let activo = true;

    function redim() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      crear();
    }

    function crear() {
      // nº de partículas acotado por superficie (ligero en móvil)
      const objetivo = Math.min(140, Math.round((W * H) / 14000));
      const bandas = 4;
      particulas = [];
      for (let b = 0; b < bandas; b++) {
        // bandas en la mitad inferior, donde vive el disco
        const baseY = H * (0.52 + b * 0.12);
        const amp = H * (0.03 + b * 0.012);
        const n = Math.round(objetivo / bandas);
        for (let i = 0; i < n; i++) {
          particulas.push({
            x: Math.random() * W,
            baseY: baseY,
            amp: amp,
            fase: Math.random() * Math.PI * 2,
            vel: 0.08 + Math.random() * 0.14,        // deriva horizontal
            freq: 0.004 + Math.random() * 0.003,
            r: 0.6 + Math.random() * 1.3,
            a: 0.05 + Math.random() * 0.12,
            calido: Math.random() < 0.22               // algunas con el azul de la marca
          });
        }
      }
    }

    function pinta(time) {
      ctx.clearRect(0, 0, W, H);
      const ts = time * 0.001;
      for (let i = 0; i < particulas.length; i++) {
        const p = particulas[i];
        p.x += p.vel;
        if (p.x > W + 4) p.x = -4;
        const y = p.baseY + Math.sin(p.x * p.freq + p.fase + ts) * p.amp;
        ctx.beginPath();
        ctx.arc(p.x, y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.calido
          ? "rgba(47, 166, 228, " + p.a + ")"
          : "rgba(40, 40, 36, " + p.a + ")";
        ctx.fill();
      }
      if (activo) raf = requestAnimationFrame(pinta);
    }

    function arranca() {
      if (reduce) { // una sola pasada estática
        pinta(0);
        return;
      }
      if (!raf) { activo = true; raf = requestAnimationFrame(pinta); }
    }
    function para() {
      activo = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    redim();
    arranca();

    let rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(redim, 150);
    });
    // pausar cuando la pestaña no está visible
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) para(); else arranca();
    });
  })();

  /* ----------------------- Entrada + parallax (GSAP) ----------------------- */
  document.body.classList.add("js-anim");

  function animar() {
    if (typeof window.gsap === "undefined") {
      // sin GSAP: mostrar todo
      document.body.classList.remove("js-anim");
      return;
    }
    const gsap = window.gsap;

    if (reduce) {
      document.body.classList.remove("js-anim");
      return;
    }

    // El scroll (opacidad del bloque) lo lleva render.js; aquí solo la entrada de cada línea
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".portada-texto .etiqueta", { y: 14, opacity: 0, duration: 0.8 }, 0.15)
      .from(".nombre-abc", { y: 46, opacity: 0, duration: 1.05 }, 0.28)
      .from(".nombre-dd", { y: 46, opacity: 0, duration: 1.05 }, 0.40)
      .from(".frase", { y: 20, opacity: 0, duration: 0.9 }, 0.62)
      .from(".pista-texto, .pista-linea", { opacity: 0, duration: 0.8 }, 0.9);

    // Arcos: crecen desde el disco
    if (circulos && circulos.length) {
      gsap.from(circulos, {
        scale: 0.82,
        opacity: 0,
        transformOrigin: "center center",
        duration: 1.6,
        ease: "power2.out",
        stagger: 0.09
      });
    }
    // los .from() ya han dejado cada línea en opacidad 0: se puede quitar el estado CSS
    document.body.classList.remove("js-anim");
  }

  /* ----------------- Secciones: revelados al bajar ----------------- */
  function secciones() {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;

    // Manifiesto: una palabra por <span> para encenderlas una a una
    const manifiesto = document.querySelector("[data-revela-palabras]");
    if (manifiesto) {
      manifiesto.innerHTML = manifiesto.textContent.trim().split(/\s+/)
        .map(function (w) { return '<span class="palabra">' + w + "</span>"; }).join(" ");
    }
    if (!gsap || !ST || reduce) {
      document.querySelectorAll(".palabra").forEach(function (p) { p.style.opacity = 1; });
      return;
    }
    gsap.registerPlugin(ST);

    // Montajes: en escritorio la fila avanza en horizontal mientras la sección queda fijada.
    // Se crea antes que el resto para que los disparadores de debajo cuenten con su espacio.
    const mm = gsap.matchMedia();
    mm.add("(min-width: 701px)", function () {
      const pin = document.querySelector(".montajes-pin");
      if (!pin) return;
      const dist = function () { return Math.max(0, pin.scrollWidth - window.innerWidth); };
      gsap.to(pin.children, {
        x: function () { return -dist(); },
        ease: "none",
        scrollTrigger: {
          trigger: pin, start: "top top", end: function () { return "+=" + dist(); },
          pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
    });

    // Al llegar al contenido, el disco, los arcos y las ondas se retiran y queda el fondo limpio
    gsap.fromTo(document.documentElement, { "--op-salida": 1 }, {
      "--op-salida": 0, ease: "none",
      scrollTrigger: { trigger: ".manifiesto", start: "top bottom", end: "top 35%", scrub: true }
    });

    // Manifiesto: cada palabra se enciende con el scroll
    gsap.to(".palabra", {
      opacity: 1, ease: "none", stagger: 0.08,
      scrollTrigger: { trigger: ".manifiesto", start: "top 72%", end: "bottom 62%", scrub: 0.5 }
    });

    // Cabeceras, tarjetas y filas: entran desde abajo
    gsap.utils.toArray(".cabecera, .revela").forEach(function (el) {
      gsap.from(el, {
        y: 44, opacity: 0, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      });
    });

    // Fotos: ligero zoom al cruzar la pantalla
    gsap.utils.toArray(".foto img").forEach(function (img) {
      gsap.fromTo(img, { scale: 1.12 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    // Recalcular cuando estén las fuentes (cambian la altura de los textos)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  }

  /* ----------------- Scroll suave (Lenis) sincronizado con ScrollTrigger ----------------- */
  let lenis = null;
  function scrollSuave() {
    if (reduce || !window.Lenis || !window.gsap || !window.ScrollTrigger) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    window.gsap.ticker.lagSmoothing(0);
  }

  // Enlaces internos (#asistente, #portada…) con el mismo scroll suave
  document.addEventListener("click", function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    const destino = id.length > 1 && document.querySelector(id);
    if (!destino) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(destino, { offset: -24 });
    else destino.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", id);
  });

  /* ----------------- Pantalla de carga ----------------- */
  function quitaCargador(siguiente) {
    const c = document.querySelector(".cargador");
    function listo() {
      document.dispatchEvent(new Event("abc:listo"));   // render.js arranca la entrada del 3D
      siguiente();
    }
    if (!c || reduce) { if (c) c.remove(); listo(); return; }
    setTimeout(function () {
      c.classList.add("fuera");
      setTimeout(function () { c.remove(); }, 700);
      listo();
    }, Math.max(0, 700 - performance.now()));
  }

  /* ----------------- Asistente: tu colchón ideal ----------------- */
  // Criterios generales de descanso, no datos de ningún modelo concreto.
  function recomienda(r) {
    let muelles = 0, visco = 0;
    const motivos = [];
    if (r.pareja === "pareja") {
      muelles += 2;
      motivos.push("Al dormir en pareja, el muelle ensacado hace que se note menos el movimiento del otro: cada muelle trabaja por separado.");
    }
    if (r.calor === "si") {
      muelles += 2;
      motivos.push("Si pasas calor, un núcleo de muelles deja circular más el aire que uno solo de espuma.");
    } else if (r.calor === "aveces") {
      muelles += 1;
    }
    if (r.postura === "lado") {
      visco += 2;
      motivos.push("De lado, conviene una capa de confort que acoja hombro y cadera; la viscoelástica se adapta bien a esa forma.");
    } else if (r.postura === "abajo") {
      muelles += 1;
      motivos.push("Boca abajo conviene un apoyo más firme para que la cadera no se hunda.");
    } else if (r.postura === "arriba") {
      muelles += 1; visco += 1;
      motivos.push("Boca arriba busca un apoyo uniforme que mantenga la espalda recta.");
    } else if (r.postura === "variado") {
      muelles += 1;
      motivos.push("Si te mueves mucho, ayuda un colchón con buena respuesta al cambiar de postura.");
    }
    if (r.firmeza === "blando") visco += 1;
    if (r.firmeza === "firme") muelles += 1;

    let tipo = "Muelle ensacado con viscoelástica";
    if (muelles - visco > 1) tipo = "Muelle ensacado";
    else if (visco - muelles > 1) tipo = "Viscoelástico";

    const porPostura = { lado: "Intermedia", arriba: "Intermedia a firme", abajo: "Firme", variado: "Intermedia" };
    const preferida = { blando: "Más blanda", intermedio: "Intermedia", firme: "Firme" };
    const firmeza = preferida[r.firmeza] || porPostura[r.postura] || "Intermedia";
    if (r.firmeza === "nose") motivos.push("La firmeza la hemos orientado por tu postura; en la tienda la ajustas probando.");

    const medida = r.medida && r.medida !== "otra" ? r.medida : "La vemos contigo";
    return { tipo: tipo, firmeza: firmeza, medida: medida, motivos: motivos.slice(0, 3) };
  }

  function asistente() {
    const test = document.querySelector("[data-test]");
    if (!test) return;
    const pasos = Array.prototype.slice.call(test.querySelectorAll(".paso"));
    const resultado = test.querySelector("[data-resultado]");
    const barra = test.querySelector("[data-test-progreso]");
    const atras = test.querySelector("[data-test-atras]");
    const aviso = test.querySelector("[data-test-aviso]");
    const resp = {}, textos = {};
    let actual = 0;

    function muestra(i, enfocar) {
      actual = i;
      pasos.forEach(function (p, k) { p.hidden = k !== i; });
      resultado.hidden = i < pasos.length;
      const visible = i < pasos.length ? pasos[i] : resultado;
      visible.classList.remove("entra");
      void visible.offsetWidth;            // reinicia la animación de entrada
      visible.classList.add("entra");
      barra.style.width = Math.round(Math.min(i, pasos.length) / pasos.length * 100) + "%";
      atras.hidden = i === 0;
      aviso.textContent = i < pasos.length ? "Pregunta " + (i + 1) + " de " + pasos.length : "Ya tienes tu punto de partida.";
      if (enfocar) {
        const foco = i < pasos.length
          ? visible.querySelector('.opcion[aria-pressed="true"]') || visible.querySelector(".opcion")
          : resultado;
        foco.focus({ preventScroll: true });
      }
    }

    function pinta() {
      const r = recomienda(resp);
      resultado.querySelector('[data-r="tipo"]').textContent = r.tipo;
      resultado.querySelector('[data-r="firmeza"]').textContent = r.firmeza;
      resultado.querySelector('[data-r="medida"]').textContent = r.medida;
      const lista = resultado.querySelector('[data-r="motivos"]');
      lista.innerHTML = "";
      r.motivos.forEach(function (m) {
        const li = document.createElement("li");
        li.textContent = m;
        lista.appendChild(li);
      });
      const cuerpo = [
        "Hola, he hecho el test de la web y me gustaría que me aconsejarais.",
        "",
        "· Cómo duermo: " + textos.postura,
        "· Solo o en pareja: " + textos.pareja,
        "· Calor por la noche: " + textos.calor,
        "· Cómo me gusta el colchón: " + textos.firmeza,
        "· Medida: " + textos.medida,
        "",
        "Orientación de la web: " + r.tipo + ", firmeza " + r.firmeza.toLowerCase() + ".",
        "",
        "Gracias."
      ].join("\n");
      resultado.querySelector('[data-r="email"]').href = "mailto:abcdeldescansolorca@yahoo.es?subject=" +
        encodeURIComponent("Consulta desde la web: mi colchón ideal") + "&body=" + encodeURIComponent(cuerpo);
    }

    pasos.forEach(function (paso, i) {
      const opciones = paso.querySelectorAll(".opcion");
      opciones.forEach(function (b) {
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          opciones.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
          resp[paso.dataset.paso] = b.dataset.valor;
          textos[paso.dataset.paso] = b.textContent.trim();
          setTimeout(function () {
            if (i + 1 < pasos.length) { muestra(i + 1, true); return; }
            pinta();
            muestra(pasos.length, true);
          }, reduce ? 0 : 220);
        });
      });
    });
    atras.addEventListener("click", function () { if (actual > 0) muestra(actual - 1, true); });
    test.querySelector("[data-test-reiniciar]").addEventListener("click", function () {
      Object.keys(resp).forEach(function (k) { delete resp[k]; delete textos[k]; });
      test.querySelectorAll(".opcion").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
      muestra(0, true);
    });
    muestra(0, false);
  }

  /* ----------------- Abierto ahora (hora de Madrid, horario habitual) ----------------- */
  function estadoTienda() {
    const el = document.querySelector("[data-estado]");
    if (!el || !window.Intl) return;
    // minutos desde medianoche; 0 = domingo
    const HORARIO = {
      0: [], 1: [[600, 810], [1050, 1230]], 2: [[600, 810], [1050, 1230]], 3: [[600, 810], [1050, 1230]],
      4: [[600, 810], [1050, 1230]], 5: [[600, 810], [1050, 1230]], 6: [[600, 810]]
    };
    const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    function hhmm(m) { return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
    function ahora() {
      const p = {};
      new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return { dia: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), min: (Number(p.hour) % 24) * 60 + Number(p.minute) };
    }
    function actualiza() {
      const t = ahora();
      const hoy = HORARIO[t.dia] || [];
      const tramo = hoy.find(function (h) { return t.min >= h[0] && t.min < h[1]; });
      let texto = "";
      if (tramo) texto = "Abierto ahora · cierra a las " + hhmm(tramo[1]);
      else {
        const luego = hoy.find(function (h) { return h[0] > t.min; });
        if (luego) texto = "Cerrado ahora · abre hoy a las " + hhmm(luego[0]);
        else {
          for (let k = 1; k <= 7; k++) {
            const d = (t.dia + k) % 7;
            if (HORARIO[d].length) {
              texto = "Cerrado ahora · abre " + (k === 1 ? "mañana" : "el " + DIAS[d]) + " a las " + hhmm(HORARIO[d][0][0]);
              break;
            }
          }
        }
      }
      el.querySelector("[data-estado-texto]").textContent = texto;
      el.classList.toggle("abierto", Boolean(tramo));
      el.hidden = false;
    }
    actualiza();
    setInterval(actualiza, 60000);
  }

  /* ----------------- Mapa: Google Maps solo si se pide ----------------- */
  function mapa() {
    const caja = document.querySelector("[data-mapa]");
    const boton = caja && caja.querySelector("[data-cargar-mapa]");
    if (!boton) return;
    boton.addEventListener("click", function () {
      const f = document.createElement("iframe");
      f.src = "https://www.google.com/maps?q=" + encodeURIComponent("ABC Descanso, Calle Nogalte 7, 30800 Lorca") + "&output=embed";
      f.title = "Mapa de ABC Descanso en Google Maps";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      f.allowFullscreen = true;
      caja.appendChild(f);
      caja.querySelector(".mapa-portada").remove();
    });
  }

  asistente();
  estadoTienda();
  mapa();

  function alCargar() {
    scrollSuave();
    secciones();
    quitaCargador(animar);
  }
  if (document.readyState === "complete") alCargar();
  else window.addEventListener("load", alCargar);
})();
