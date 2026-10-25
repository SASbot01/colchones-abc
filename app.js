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
          : "rgba(236, 233, 227, " + p.a + ")";
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

  function alCargar() { animar(); secciones(); }
  if (document.readyState === "complete") alCargar();
  else window.addEventListener("load", alCargar);
})();
