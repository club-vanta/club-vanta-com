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
- Pendiente: decidir si buscadores pueden indexar el sitio.

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
