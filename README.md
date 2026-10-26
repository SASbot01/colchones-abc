# ABC del Descanso — Lorca

Web estática (HTML + CSS + JS) para **ABC del Descanso** (ABC Colchones Lorca),
colchonería en Calle Nogalte, 7, 30800 Lorca (Murcia). Tel. 968 47 93 47.

Estructura de referencia: **iyO One** (tipográfica, con producto despiezado); color claro al estilo **Kave Home**.
Tipografías **Geist** y **Geist Mono** alojadas en local. Movimiento con **GSAP 3.12.5
+ ScrollTrigger** (local). Ondas de partículas en `<canvas>`. Render 3D del colchón sobre
somier con **Three.js r165** (local, `js/three/`, cargado con import map) en `render.js`.

## Estado
- [x] Portada: nombre, lema real «La tienda del descanso», píldora con la nube del logo y 1 botón (Llamar).
- [x] Colchón sobre somier en 3D que se despieza al bajar (ilustración genérica, no un modelo concreto).
- [x] Manifiesto que se ilumina palabra a palabra.
- [x] Qué encontrarás: colchones, canapés, somieres y bases, almohadas y ropa de cama (fotos reales).
- [x] Montajes reales: fila horizontal (escritorio) / carrusel (móvil) con fotos de su Instagram.
- [x] Asistente «Tu colchón ideal»: 5 preguntas → tipo, firmeza y medida orientativos + llamar o enviar
      las respuestas por email (no guarda datos; criterios generales, no modelos concretos).
- [x] Ficha de la tienda (solo datos confirmados).
- [x] Preguntas frecuentes (solo respuestas confirmadas) con datos estructurados FAQPage.
- [x] Visítanos: «Abierto ahora» en vivo (hora de Madrid, horario habitual), llamar, cómo llegar,
      email y mapa de Google que solo se carga al pulsar.
- [x] Pantalla de carga con la nube del logo y scroll suave (Lenis 1.3.25, local).
- [x] Aviso legal, privacidad y cookies (titular y NIF PENDIENTE), robots.txt e imagen social 1200×630.
- [ ] Opiniones: FUERA a propósito (Google 3,4/5, 16 reseñas mixtas y sin verificar).

## Fuentes de datos y fotos (todo real)
- CRM de Ocean Digital Services: dirección, teléfono, email, servicios publicados.
- Ficha de Google: horario L–V 10:00–13:30 y 17:30–20:30, sábado 10:00–13:30, domingo cerrado; coordenadas.
- Página de Facebook «ABC Descanso LORCA»: logo (nube azul + «abcdescanso»), lema, fotos de la tienda.
- Instagram @abcdescansolorca: productos (Karibian Descanso, canapé Koala con mando, muelle ensacado,
  colchón Eleva, colchas bouti, cojines, pijamas) y fotos de montajes en casa de clientes.
- Colores: fondo claro de estudio al estilo Kave Home (#F0EFEB, blanco, texto negro y gris oliva #53534C,
  botón negro) con el azul de la nube del logo (#0F5A9C → #1A86CC → #2FA6E4) como acento.

## PENDIENTE de confirmar con el propietario
- Catálogo y marcas vigentes (los posts de Karibian son de 2018–2024).
- Zonas y condiciones de entrega y montaje.
- Horario de verano (el dueño dijo en Google que lo cambian).
- ¿Sigue abierta la tienda de Avenida Europa? (la menciona el dueño en una respuesta de Google).
- Precios y ofertas (no se publica ninguno).
- Si quiere mostrar reseñas y cuáles, con su permiso.
- Dominio definitivo (abcdescanso.es no responde): canonical y og:url.
- Titular y NIF para aviso legal y privacidad.

## Vista previa local
Servidor estático en el puerto 8791 (ver `.claude/launch.json`, entrada «abc-colchones»).
