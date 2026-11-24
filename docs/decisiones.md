# Decisiones

Registro de lo que se decidió para club-vanta.com, en orden. Cada entrada dice qué y por qué.

## 2026-11-23

### Propósito y público

- **Qué:** la página existe para aprovechar el dominio `club-vanta.com` y la suscripción de Claude. No hay clientes ni fines de lucro.
- **Público principal:** alguien de mazmo que está pensando "che, ¿y si voy a los alters de Vanta?".
- **Público secundario:** quien ya vino a un alter y vuelve a la página (por ejemplo, para las reglas).

### Contenido fijo

- `club-vanta.com/reglas` muestra las reglas de convivencia v0.2 (`reglas-v0.2.md`). Se corrige solo la ortografía; el contenido no cambia.

### Privacidad

- No se muestran nombres, perfiles ni fotos de asistentes. Motivo: las reglas prohíben el doxeo y las fotos, y existe una lista discreta.
- Los buscadores pueden indexar el sitio (decidido el 2026-11-23, ver "Cierre"). El sitio no muestra datos de personas.

### Dirección de diseño

- Estética "parecida a Velvet" quiere decir: oscuro, blanco y negro, con el logo como centro. No quiere decir copiar el tema de Velvet, que hoy es el tema por defecto de shadcn con Inter.
- Evitar el look genérico de IA. Método, según lo leído en r/ClaudeCode, VibeCurb y unslop-ui:
  - Decidir tokens a mano antes de construir (dos fuentes, pocos colores, un radio, una escala de espaciado) y decir qué se conserva, no solo qué se evita.
  - Una referencia real por sección y comparación por screenshots al mismo ancho.
  - Una "cosa rara" propia; el material ya existe: los conceptos y flyers de cada alter y la voz del club.
  - Contenido real, nada de stock ni blobs de gradiente.
  - Las listas de VibeCurb y unslop-ui sirven como filtro final, no como generador.
- Tipografía: nada de Georgia, Inter ni etiquetas en monoespaciada mayúscula. El usuario las ve "muy Claude" (feedback sobre el primer mock).
- El diseño tiene que ser creativo y visual, no una página de solo texto. Se exploran tres direcciones que salen de material propio: Terciopelo (luces tenues de Secret Face), Afiche (los flyers) y Corona (la geometría del logo). Mock: `.superpowers/brainstorm/*/content/direccion-visual.html`.
- De las tres direcciones, gustaron **Afiche** y **Corona**; Terciopelo queda descartada. Segunda ronda con cuatro variantes en esa línea: Noche de afiches, Muro, Corona en papel y Máscara (afiche visto a través del logo). Mock: `.superpowers/brainstorm/*/content/afiche-corona-v2.html`.
- Elegidos de la segunda ronda: el **Muro** (afiches en blanco y negro como pared, título que invierte colores), la **Máscara** (el afiche visto a través del logo) y el **"VANTA" vertical** de Noche de afiches. Se combinan en una sola home (mock `home-v3.html`).
- Textos rechazados del mock `home-v3.html`: "Club social. No secreto." (hero) y "...grupitos que te miden" (sección por qué Vanta). Motivo: definían a Vanta por lo que no es.
- **El foco del mensaje es "club social".** El hero dice solo "Club social." en grande. La sección "por qué Vanta" lleva "Un espacio humano hecho por humanos." (frase del post de Discreet).
- El público ya es de mazmo: no explicar términos de mazmo (qué es un alter, qué es mazmo). Se quitó "Alter es como mazmo llama a los afters".
- **El rojo de mazmo (`#e2574c`) se queda** como único color de acento, junto al blanco y negro del logo.
- **Flyers: no se buscan originales.** Se usa la portada del evento que guarda mazmo (`event.cover` en `api.mazmo.net/communities/<comunidad>/threads/<thread>`, por ejemplo `https://prod.mazmocdn.com/events/covers/wWYdwivkD.jpeg`). Es de unos 303x404 px, así que el diseño usa los flyers chicos o tratados (muro en blanco y negro, tiles de archivo, máscara de unos 400 px) para que la baja resolución no se note.
- La misma respuesta de mazmo trae `event.showLocation` (false en Discreet): se respeta, nunca se muestra la dirección.
- Las secciones "un espacio humano" y "cómo venir" de `home-v3.html` no gustaron (texto suelto, mitad derecha vacía, tres columnas genéricas). Se juntan en una sola sección; tres versiones en `porque-como-v1.html`: Carnet de socio, Códigos (marquesina) y Pegado en el muro.
- Elegido: **Carnet de socio** para "un espacio humano" + "cómo venir" (los 3 pasos como carnet del club, con casilleros y sello "Club social").
- Formato **cinta en movimiento** (marquesina): va **una sola cinta**, con los nombres de los alters (Spring Break, Discreet, Secret Face, Full Contact, Tan Selmo, San Telmo…), justo antes de alters pasados. La cinta diagonal sobre el hero se descartó. Mock: `home-v5.html`.
- Los nombres de la cinta son cortos ("Discreet"), pero en Velvet el nombre del meetup es el título completo del post ("Alter San Telmo - D I S C R E E T"). **Decidido: el nombre corto se deriva automáticamente del título**, sin campo nuevo en Velvet. Ejemplos reales que tiene que resolver: "Alter San Telmo - D I S C R E E T", "Alter Tan Selmo - Spring Break", "Alter a la Vuelta, San Telmo.", "Alter Tan Selmo "Secret Face"". La cinta también puede mostrar los nombres de lugar ("Tan Selmo", "San Telmo").
- Carnet de socio, ajustes: sin el sello circular "Club social", carnet más grande (alrededor de la mitad del ancho), y el título en dos líneas fijas: "Un espacio humano" / "hecho por humanos." (en rojo).
- **El link a `/reglas` es obligatorio** donde se mencionan las reglas: en el paso 3 del carnet y en el pie.
- Página `/reglas` (mock `reglas-v1.html`): mismo sistema visual (VANTA vertical fijo, títulos condensados, rojo). Franja roja "Leer este documento es obligatorio para entrar al alter", insignia de versión v0.2, y el texto agrupado en tres bloques: Convivencia, Compromiso (con la penalidad de 2 anotaciones en falso destacada) y En el lugar, más el cierre. Las reglas en negrita del original van resaltadas. Texto original con ortografía corregida, sin reescribir.
- Mock de `/reglas` aprobado.
- **Velvet no se menciona en la página**, por ahora.
- **Mobile:** se había dejado para el builder y se retomó (el público llega desde mazmo, casi seguro desde el celular). Mock `mobile-v1.html` a 375 px con dos opciones para "VANTA" vertical: A riel lateral angosto, B banda horizontal arriba con barra fija del próximo alter abajo. En ambas: todo apilado, máscara de unos 260 px, carnet a lo ancho, alters pasados en carrusel horizontal y a color (no hay hover). **Elegida B** (más ancho para el contenido, y la barra fija deja anotarse sin buscar el botón). Mock copiado a `docs/mocks/mobile.html` y sumado al documento de diseño.
- Auditoría contra lo aprendido en Reddit/VibeCurb/unslop-ui/humanizer: faltaban en el diseño la escala de espaciado, el radio, las reglas de movimiento, la comparación por screenshot al mismo ancho, el filtro final, la revisión del texto y la pasada a mano del equipo. Se sumaron al documento de diseño ("Sistema visual" y "Cómo se construye para que no parezca hecho por IA").
- Copy con la voz del club (ver `contexto.md`). El skill `humanizer` sirve para revisar texto generado.

### Próximo alter

- **Qué:** la página muestra el próximo alter de Club Vanta tomándolo de `alter-tracker-backend` (el backend de Velvet), con un endpoint público nuevo.
- **Por qué:** es lo que buscan los dos públicos, y el dato ya existe en Velvet. Cargarlo a mano en dos lados se desactualiza.
- No siempre hay fecha próxima. Sin fecha, la página lo dice y manda al perfil de mazmo y al canal de Telegram.
- Ritmo real: los alters se hacen cada 1 a 2 meses y se cargan en Velvet unas 3 semanas antes. O sea que entre un tercio y dos tercios del tiempo no hay fecha. **"Sin fecha" es el estado normal**, no un caso borde: la página tiene que verse completa y con sentido sin el bloque del próximo alter.
- Lo que hay en el backend hoy (tabla `meetups`): `name`, `date`, `mazmo_meetup_url`, `location_label`, `latitude`, `longitude`, `org_id`. El staff crea el meetup en Velvet pegando la URL de mazmo, y la fecha se trae de `api.mazmo.net/communities/<comunidad>/threads/<thread>`. Esa misma respuesta de mazmo trae el cuerpo del post.
- El endpoint público expone solo datos que ya son públicos en mazmo. Nunca dirección exacta ni coordenadas (algunas fechas dan la ubicación por privado), nunca nada de asistentes. Filtra por la organización Club Vanta: el backend es multi-organización.

### Infraestructura

- Hosting en Cloudflare, igual que Velvet.
- **Enfoque elegido: A, Astro en Cloudflare con render en servidor** para la home (datos del backend con caché corta) y `/reglas` estática. Descartados: Vite + React como Velvet (JS de más, la fecha aparece tarde) y Astro estático con rebuild diario (datos con hasta un día de atraso).
- **Todo lo de Cloudflare se declara en OpenTofu**, sin tocar la UI de Cloudflare. Patrón a seguir: `../velvet/infra/` y `../alter-tracker-backend/infra/cloudflare.tf`.
- Documento de diseño: `docs/superpowers/specs/2026-11-23-club-vanta-web-design.md`. Mocks aprobados copiados a `docs/mocks/`.

### Herramientas

- Grupo de plugins frontend activado en `.claude/settings.json` (frontend-design, a11y-audit, pw, apple-hig-expert, demo-video).

### Plan de implementación

- Dos planes, uno por repo: `docs/superpowers/plans/2026-11-23-backend-endpoint-publico.md` (se ejecuta en `../alter-tracker-backend`) y `docs/superpowers/plans/2026-11-23-sitio.md` (este repo). El backend va primero: el sitio genera sus tipos del `openapi.json`.
- **El endpoint público solo publica a Club Vanta.** Pedido del usuario: ninguna otra organización del backend lo tiene habilitado. Por eso la ruta es `GET /public/alters`, sin organización en la URL, y la organización sale del setting `PUBLIC_ALTERS_ORG_SLUG`. Sin el setting, 404. Descartado: `/public/organizations/{slug}/alters`, que dejaba pedir cualquier organización.
- **Lista plana en vez de `next` / `past`.** El sitio elige el próximo (margen de 12 horas después de la fecha). Motivo: si el backend falla, el sitio usa la última copia en caché y tiene que recalcular con la hora actual para no mostrar una fecha vieja como próxima.
- **Workers, no Pages.** El adapter de Astro 6 (`@astrojs/cloudflare` v13) apunta a Workers. OpenTofu declara el Worker (`cloudflare_worker`) y los dominios `club-vanta.com` y `www.club-vanta.com` (`cloudflare_workers_custom_domain`). El código lo sube `wrangler deploy` desde GitHub Actions en cada push a `main`: es código versionado, no configuración a mano en la UI. `www` redirige al apex desde el middleware de Astro.
- **Portadas por hotlink** a `prod.mazmocdn.com`, con `referrerpolicy="no-referrer"`, en blanco y negro con CSS.
- **Fecha bajo cada alter pasado:** el mock muestra "abr · máscaras y antifaces", pero el backend no tiene un subtítulo por alter. Va mes y año ("abr 2026").
- **E2E con Playwright** (grupo `pw` ya activo) contra `astro preview` (workerd) y un backend falso en Node. Sin el job `smoke` contra el backend real de Velvet: sobra para un solo endpoint de lectura.

### Logo y tokens

- **Logo vectorizado con potrace** desde `docs/mocks/vanta.jpg` (umbral 50 % sobre el doble de tamaño, `--turdsize 20`). Comparado lado a lado con el JPG: la V, la corona y el triángulo coinciden. `public/vanta.svg` y `public/vanta-mask.svg` son la silueta blanca sobre transparente (la máscara usa el canal alfa, no `mask-mode: luminance`); `public/favicon.svg` es el mismo trazo en rojo sobre negro.
- **Tokens que el mock usa y el plan no listaba:** `--white` (título del hero con `mix-blend-mode: difference`), `--line` (`#2a2a2a`, bordes de la cinta) y `--mute-ink` (`#555555`, texto chico del carnet). Las sombras también son tokens (`--shadow-diag`, `--shadow-carnet`).
- **Filtro anti look de IA:** `tests/anti-ai-look.test.ts` recorre `src/**/*.{astro,css,ts}` (sin `src/api/types.ts`). Los colores solo se permiten en `src/styles/tokens.css`.

### Hero y próximo alter

- **En mobile, la línea roja "jueves · 20.30 · gratis" va a 19 px y no a 14 px como en el mock.** A 14 px, el rojo sobre papel da 3,18:1 y no pasa WCAG AA para texto chico (axe lo marca como `serious`). A 19 px en negrita cuenta como texto grande (alcanza con 3:1), así que el acento rojo del mock se mantiene.
- **Los tiles del muro del hero son todos 3:4**, en lugar de alternar las proporciones del mock (423:655 y 360:480). Las portadas reales de mazmo miden unos 303x404 (3:4); forzarlas a otra proporción recortaría los costados del flyer.

### Resto de la home

- **Perfil de mazmo:** el pie linkea a `https://mazmo.net/@ClubVanta`. Se probó abriéndolo: `mazmo.net/@ClubVanta` muestra el perfil y `mazmo.net/ClubVanta` da "Página no encontrada".
- **Rojo sobre papel en el carnet.** El rojo sobre papel no llega a 4,5:1, así que el texto chico en rojo no pasa WCAG AA (axe lo marca como `serious`). En escritorio, "PARA VENIR AL ALTER" y el link a `/reglas` van a 19 px en negrita (texto grande, alcanza con 3:1) en lugar de 14 y 16 px. En mobile no hay lugar para agrandarlos dentro del carnet: van en negro, y el link conserva el rojo en el subrayado.
- **Links del pie subrayados**, todos, y no solo el de reglas como en el mock: los contactos de Telegram van en gris y sin subrayado no se distinguen del texto.
- **Carnet entre 900 y 1100 px:** el título y el carnet no entran lado a lado, así que el carnet baja debajo del título (hasta 640 px de ancho). Alters pasados pasa de 5 a 4 columnas en ese tramo.
- **Cinta:** si hay pocos nombres, la lista se repite hasta tener al menos 8 y un número par, para que el loop `translateX(-50%)` no deje hueco ni cambie de color al reiniciar. Es `aria-hidden`; el título accesible de la sección es un `h2` oculto "Alters pasados".
- **"← deslizá para ver más"** del mock mobile va debajo del carrusel solo en pantallas de menos de 600 px y con 3 alters o más; el resto de esa línea del mock era una nota para el diseño.
- Sin portada, el tile muestra el nombre corto sobre `--ink-2` con un borde `--line`, en la misma proporción 3:4.

### /reglas

- **Número de las reglas sin resaltar: `#7a7a7a` y no `#555`.** El gris del mock (`#555`) sobre negro da 2,6:1 y no llega a 3:1 ni siquiera como texto grande (38 px). Se subió a `--num` (`#7a7a7a`, 4,5:1) y se mantiene claramente más apagado que el rojo de las reglas en negrita.
- **Colores del mock que faltaban como token:** `--ink-3` (`#1a1a1a`, fondo de la penalidad) y `--paper-soft` (`#d8d3c8`, texto corriente). Los bordes entre reglas usan `--line` (`#2a2a2a`) en lugar de `#262626`: la diferencia no se ve.
- **Texto de cada regla dentro de un `<span>`.** En el mock, `li` es una grilla y el texto en negrita dentro de la regla (`claramente consensuadas`) caía como una celda aparte y rompía la regla de las fotos. El `<span>` mantiene el texto idéntico y la regla en una sola celda.
- **El número del bloque ("01") y el título se separan con un espacio** en el HTML (el mock los pegaba); las palabras y el orden son los mismos.
- **Mobile sin mock propio:** banda "VANTA" horizontal de 110 px arriba, títulos de bloque encima de su lista, números de regla de 32 px.

### Cierre

- **Buscadores: se permite indexar.** `public/robots.txt` con `User-agent: *` y `Allow: /`. Motivo: el club no es una organización secreta ("somos un club social, no una organización secreta") y el sitio no muestra nombres, conteos ni fotos de asistentes, así que indexarlo no expone a nadie. Se sirve como archivo estático del Worker.
- **Textos revisados contra el filtro de IA y la voz del club.** Cambios: `<title>` de la home pasa de "Club Vanta" a "Club Vanta · Alters en San Telmo" (dice qué es en la pestaña y en el resultado de búsqueda); la `description` de la home deja de repetir el eslogan y dice los datos (club sin fines de lucro, jueves a las 20.30, San Telmo, gratis); la de `/reglas` tenía "Leelas" sin tilde (voseo: "Leélas") y decía "son pocas", que no es cierto (son 18), y pasa a "Leerlas es obligatorio para entrar".
- **Foco en la barra fija mobile.** El contorno rojo de `:focus-visible` desaparecía sobre la barra roja: en ese link va en negro. Además `scroll-padding-bottom` en `html` para que la barra no tape el elemento enfocado al tabular.
- **Se deja como está:** CLS de 0,05 en mobile (cambio de fuente al cargar Google Fonts; el umbral "bueno" es 0,1) y el título "CLUB SOCIAL." con `mix-blend-mode: difference`, que sobre los puntos más claros del muro baja el contraste; es el diseño aprobado del mock y el muro está oscurecido a propósito.

### Ajustes de la revisión final (2026-11-23)

- **`/reglas` se renderiza en el servidor, no prerenderizada** (el diseño decía "prerenderizada"). Motivo: el sitio usa `output: "server"` y así el middleware que redirige `www` a apex también corre sobre `/reglas`. El costo es mínimo: es texto fijo. Los assets estáticos (`robots.txt`, `/_astro/*`) responden 200 también en `www`, porque Workers los sirve antes del middleware.
- **Sin bindings que no estén en OpenTofu.** El adapter de Cloudflare agrega por defecto un KV `SESSION` (sesiones de Astro) y un binding `IMAGES`. El sitio no usa ninguna de las dos cosas, así que `astro.config.mjs` desactiva ambas (`session` con driver en memoria e `imageService: "passthrough"`), y el CI falla si `wrangler deploy --dry-run` lista un binding que no sea `ASSETS` ni las dos variables.
- **Privacidad en el límite del backend.** `getAlters` copia solo `short_name`, `title`, `date`, `mazmo_url`, `cover_url` y `excerpt`, y acepta únicamente URLs `https://`. La copia de la caché pasa por el mismo filtro. Las URLs `http://127.0.0.1` y `http://localhost` solo valen si la API configurada es local (el backend falso del e2e).
- **Portada rota.** El logo queda detrás de la portada: si la portada falla, la máscara se ve igual que sin portada.

### Sin fecha, logo liso (2026-11-24)

- **Sin próximo alter, la máscara muestra el logo liso** y no la portada del último alter en gris, como decía el diseño. Motivo: visto en el celular con el sitio publicado, la portada de Discreet es casi toda negra y la silueta del logo desaparecía sobre el fondo negro. Esa portada ya aparece en "Alters pasados". Con fecha, la máscara sigue mostrando la portada del próximo alter.

### Primer despliegue (2026-11-24)

- **Se siguió el runbook de `infra/README.md` tal cual:** secrets en GitHub, Worker vacío con `tofu apply -target`, `npm run deploy`, `tofu apply` para los dos dominios. Funcionó sin importar nada ni tocar el panel.
- **`ignore_changes = [tags]` en `cloudflare_worker.site`.** Cada `wrangler deploy` agrega el tag `cf:service=club-vanta-com`, y sin esto `tofu plan` mostraba un cambio después de cada deploy. Se probó: deploy, plan con diferencia; con el `ignore_changes`, plan sin cambios.
- **Verificado en producción:** `www` redirige con 301 a apex (también en `/reglas`), la home y `/reglas` dan 200, una ruta inexistente da 404, y la home muestra los alters reales sin ningún campo privado. Lighthouse mobile sobre el sitio publicado: accesibilidad, buenas prácticas y SEO en 100 en las dos páginas; CLS de 0,04 en `/reglas` por el cambio de fuente, ya aceptado arriba.

### Barra del hero de borde a borde (2026-11-24)

- **En escritorio, la barra papel del hero ("Alters para la comunidad de mazmo...") ocupa todo el ancho**, también sobre el riel de "VANTA", en lugar de arrancar donde empieza el título como en el mock. Motivo: pedido después de verla publicada; cortada dejaba asomar el muro entre el riel y la barra. El texto sigue alineado con el título.

