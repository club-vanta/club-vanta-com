# club-vanta.com: diseño

Fecha: 2026-11-23. Estado: aprobado.

Contexto del club, la voz y las fuentes: `docs/contexto.md`. Registro de cada decisión con su motivo: `docs/decisiones.md`. Mocks aprobados: `docs/mocks/home.html` y `docs/mocks/reglas.html` (son fragmentos para el visor de mocks; abrirlos desde `docs/mocks/` con un servidor local).

## Intención

Club Vanta es un club social sin fines de lucro que organiza alters (reuniones en bares de San Telmo) para la comunidad de mazmo.net. Tiene el dominio `club-vanta.com` sin usar. La página existe para aprovecharlo y para que alguien de mazmo que piensa "che, ¿y si voy a los alters de Vanta?" entienda qué es, cómo es el ambiente y cómo ir. También sirve a quien ya vino y vuelve por las reglas o la próxima fecha.

## Objetivos

1. Quien llega por primera vez entiende en una pantalla que Vanta es un **club social**, y sabe cómo venir.
2. El próximo alter aparece solo cuando el staff lo carga en Velvet, y desaparece solo cuando pasa. Nadie edita la página para eso.
3. `club-vanta.com/reglas` muestra las reglas de convivencia v0.2.
4. Toda la infraestructura de Cloudflare se declara en OpenTofu. Nadie toca la UI de Cloudflare.

## No objetivos

- No hay clientes, ventas, formularios ni login.
- No se menciona Velvet.
- No se explican términos de mazmo (qué es un alter, qué es mazmo): el público ya es de mazmo.
- No se buscan los flyers originales: se usan las portadas que guarda mazmo.

## Anti-objetivos (fracaso aunque funcione)

- **Exponer a alguien:** nombres, perfiles, fotos o cantidad de asistentes, o la dirección exacta del bar. Las reglas prohíben el doxeo y las fotos, y existe una lista discreta.
- **Verse como una página hecha por IA:** Inter o Georgia, etiquetas en monoespaciada mayúscula, gradientes violetas, grillas de tres tarjetas iguales, texto suelto sin nada que mirar.
- **Mostrar una fecha vieja** como si fuera la próxima.
- **Definir a Vanta por lo que no es** ("no secreto", "grupitos que te miden"): se rechazó explícitamente.

## Restricciones

- **Ritmo de los alters:** uno cada 1 a 2 meses, cargado en Velvet unas 3 semanas antes. Entre un tercio y dos tercios del tiempo no hay próxima fecha: **"sin fecha" es el estado normal** y la página se tiene que ver completa así.
- **Flyers:** la portada del evento de mazmo (`event.cover`) mide unos 303x404 px. El diseño los usa chicos o tratados (muro en blanco y negro, tiles, máscara de unos 400 px).
- **Privacidad de ubicación:** la respuesta de mazmo trae `event.showLocation`. Nunca se muestra dirección ni coordenadas, aunque `showLocation` sea true: el sitio dice solo "San Telmo".
- **Infra:** Cloudflare con el provider `cloudflare/cloudflare ~> 5`, siguiendo el patrón de `../velvet/infra/` y `../alter-tracker-backend/infra/cloudflare.tf` (zona `club-vanta.com` como `data`, registros con `proxied = true`). Universal SSL cubre un solo nivel de subdominio.
- **Copy:** español rioplatense con voseo, en la voz del club (ver `docs/contexto.md`). Sin em dashes.

## Enfoques considerados

| Enfoque | Resumen | Por qué sí o no |
|---|---|---|
| **A. Astro en Cloudflare, render en servidor (elegido)** | La home se arma en el edge con los datos del backend y caché corta; `/reglas` es estática. | Llega HTML completo, el dato siempre está fresco, poca carga para el backend y casi nada de JS. Elegido por el usuario. |
| B. Vite + React como Velvet | SPA estática que pide los datos en el navegador. | Mismo stack conocido, pero la home aparece sin el próximo alter hasta que cargan los datos, y es mucho JS para una página casi estática. |
| C. Astro estático con rebuild diario | Se construye una vez por día con los datos. | Lo más simple de hostear, pero un alter pasado sigue figurando hasta el rebuild: choca con "sin fecha es el estado normal". |

## Diseño decidido

### Sistema visual

- **Colores:** negro `#0d0d0d`, papel `#f1eee6`, y el rojo de mazmo `#e2574c` como único acento. Gris para texto secundario (`#a9a49a` en el mock).
- **Tipografías (Google Fonts):** League Gothic para "VANTA" vertical y números grandes; Sofia Sans Extra Condensed 800/900 en mayúsculas para títulos; Sofia Sans 400/700 para el texto.
- **Elementos propios:** "VANTA" vertical en rojo; el **muro** de afiches en blanco y negro; la **máscara** (el afiche visto a través del logo); el **carnet de socio**; la **cinta** con los nombres de los alters.
- **Logo:** `~/Downloads/vanta.jpg` (V blanca con corona, sobre negro). Hay que copiarlo al repo; idealmente vectorizarlo (ver "Lo que queda para el builder").
- **Radio:** 0 en todo (botones, franjas, tiles, bloques). La única excepción es el carnet: 18 px en escritorio, 14 px en mobile, porque imita una tarjeta física.
- **Espaciado:** una sola escala, `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96` px. Márgenes laterales: 16 px en mobile; en escritorio el contenido arranca después del riel de "VANTA" (150 px más 40). Separación entre secciones: 48 a 64 px en mobile, 64 a 96 px en escritorio.
- **Movimiento:** solo la cinta se mueve sola, y se frena con `prefers-reduced-motion`. Transiciones solo de `transform`, `opacity` y `filter`, con una curva propia (por ejemplo `cubic-bezier(0.16, 1, 0.3, 1)`), nunca `ease` por defecto.
- **Los tokens se escriben a mano primero** (colores, tipografías, radio, escala de espaciado) en un solo archivo, antes de construir ninguna sección. Todo lo demás los usa; no se inventan valores sueltos.

### Cómo se construye para que no parezca hecho por IA

Lo aprendido en los hilos de r/ClaudeCode, VibeCurb, unslop-ui y humanizer (resumen en `docs/decisiones.md`), convertido en pasos del trabajo:

1. **Los mocks son la referencia.** `docs/mocks/home.html`, `reglas.html` y `mobile.html` son la fuente de verdad visual. Se construye sección por sección contra ellos, no a partir de una descripción.
2. **Comparación por screenshot al mismo ancho.** Después de cada sección, captura del mock y del sitio a 1280 px y a 375 px, se listan las diferencias concretas y recién después se corrige. El mismo ancho importa: un salto de línea distinto corre todo lo que viene abajo.
3. **Decir qué se conserva, no solo qué se evita.** Las instrucciones al construir nombran los valores a respetar (hex, fuentes, escala); las listas de "no hagas X" se usan solo como control.
4. **Filtro final contra el look de IA**, antes de dar el sitio por terminado: sin Inter, Roboto ni Georgia; sin etiquetas en monoespaciada; sin gradientes violetas ni blobs; sin grillas de tres tarjetas iguales; sin emojis como íconos; sin `ease` por defecto; sin em dashes; sin texto de relleno ni frases "de marketing" (Elevate, Seamless, "Transformá tu...").
5. **Revisión del texto.** Todo texto que no venga literal de los posts o de las reglas se revisa contra los patrones de escritura de IA que lista humanizer (construcciones "no es X, es Y", remates de una línea, tríadas forzadas, negritas decorativas) y contra la voz de `docs/contexto.md`.
6. **Pasada a mano del equipo.** Antes de publicar, alguien de Club Vanta recorre el sitio en su celular y en una compu y marca lo que no le suena a ellos. El último ajuste de gusto lo hacen ustedes, no la IA.

### Home (`/`), en este orden (mock `docs/mocks/home.html`)

1. **Hero.** Columna izquierda negra con "VANTA" vertical en rojo. A la derecha, el muro: grilla rotada unos -4° de portadas de alters, en blanco y negro y oscurecida. Encima, "CLUB SOCIAL." gigante con `mix-blend-mode: difference`. Franja clara abajo: "Alters para la comunidad de mazmo · San Telmo, Buenos Aires" y "jueves · 20.30 · gratis".
2. **Próximo alter.** Dos estados:
   - *Con fecha:* "PRÓXIMO ALTER", nombre corto en grande, línea "JUE 19.11 · 20.30 · SAN TELMO · GRATIS", un extracto del post y el botón "Anotarme en mazmo" (link al post). A la derecha, la máscara: la portada del alter visible a través del logo.
   - *Sin fecha:* "Todavía no hay fecha", el texto "Hacemos un alter cada uno o dos meses y lo publicamos en mazmo unas tres semanas antes. El último fue <nombre>." y el botón "Enterate primero en Telegram" (canal de difusión). La máscara muestra la portada del último alter en gris.
3. **Qué es.** Fondo claro: "UN BAR. / UN JUEVES. / GENTE CHARLANDO." (la tercera línea en rojo) y "Nos juntamos a las 20.30 en un bar de San Telmo. Es gratis y es un espacio público: no se permiten prácticas."
4. **Un espacio humano + carnet.** Título en dos líneas fijas: "UN ESPACIO HUMANO" / "HECHO POR HUMANOS." (rojo), y un texto corto. A la derecha, el carnet de socio, grande (cerca de la mitad del ancho) y rotado -3°: logo, "CLUB VANTA · PARA VENIR AL ALTER", y tres pasos con número rojo y casillero: 1 Perfil en mazmo, 2 Anotate en el post (lista discreta por privado), 3 Leé las reglas, **con link a `/reglas`**. Sin sello.
5. **Cinta.** Una sola marquesina horizontal, de lado a lado, con los nombres cortos de los alters en condensada grande, alternando rojo y papel. Hace de título de la sección siguiente.
6. **Alters pasados.** Grilla de portadas en gris que recuperan el color al pasar el mouse, con nombre corto y fecha abajo.
7. **Pie.** Bloque rojo con "VANTA" vertical en negro, y tres columnas: mazmo (@ClubVanta), Telegram (canal y los contactos de la organización) y Reglas (**link a `/reglas`**, "versión 0.2 · leerlas es obligatorio").

### `/reglas` (mock `docs/mocks/reglas.html`)

"VANTA" vertical fijo al scrollear, link de vuelta a la home, "REGLAS DE CONVIVENCIA" y una insignia "v0.2". Franja roja "Leer este documento es obligatorio para entrar al alter." Texto de `docs/reglas-v0.2.md` **con la ortografía corregida y sin reescribir**, agrupado en Convivencia, Compromiso (la penalidad de 2 anotaciones en falso destacada) y En el lugar, más el cierre. Las reglas que están en negrita en el original llevan el número en rojo. El texto exacto aprobado es el del mock.

### Mobile (mock `docs/mocks/mobile.html`, opción B)

Diseñado a 375 px. El público llega desde mazmo, casi siempre desde el celular.

- **"VANTA" pasa a horizontal:** banda negra arriba del hero con "VANTA" gigante en rojo (League Gothic), cortada por el borde de abajo. Abajo, el muro y "CLUB SOCIAL." ocupando todo el ancho. Se descartó mantener un riel vertical angosto: le quitaba ancho a todo el contenido.
- **Barra fija abajo con el próximo alter**, en rojo: nombre corto, fecha y hora, y "Anotarme →" (link al post de mazmo). Solo existe cuando hay fecha; sin fecha no aparece.
- Todo apilado en una columna con 16 px de margen: próximo alter (texto, máscara de unos 260 px, botón a lo ancho), "Un bar. Un jueves. Gente charlando.", título en dos líneas más el carnet a todo el ancho (rotado -2°), la cinta, y los alters pasados.
- **Alters pasados como carrusel horizontal** (scroll con snap) y **a color**, porque en el celular no hay hover.
- **Pie:** banda roja con "VANTA" horizontal en negro, y las tres columnas apiladas.
- `/reglas` sigue el mismo criterio: "VANTA" horizontal arriba en lugar del riel fijo, y los bloques apilados (título del bloque arriba de la lista).

### Datos

**Backend (`../alter-tracker-backend`)**, cambios:

- Guardar la portada del evento al crear el meetup (y al sincronizar con mazmo): columna nueva en `meetups`, tomada de `event.cover` de la misma respuesta que hoy da la fecha (`MazmoClient.fetch_meetup_date` lee `api.mazmo.net/communities/<comunidad>/threads/<thread>`). Hace falta migración Alembic y completar las portadas de los meetups existentes.
- Endpoint público nuevo, sin auth, de solo lectura: `GET /public/alters`. **Solo publica a Club Vanta** (el backend es multi-organización): la URL no recibe organización, y la única publicada sale del setting `PUBLIC_ALTERS_ORG_SLUG` del backend. Sin el setting, el endpoint responde 404. Forma:

  ```json
  {
    "alters": [
      { "short_name": "Discreet", "title": "Alter San Telmo - D I S C R E E T",
        "date": "2026-11-19T23:30:00Z", "mazmo_url": "https://mazmo.net/...",
        "cover_url": "https://prod.mazmocdn.com/events/covers/....jpeg",
        "excerpt": "Recuperaremos las raíces..." }
    ]
  }
  ```

  Lista plana, de la fecha más nueva a la más vieja; `cover_url` y `excerpt` pueden ser `null`. **El sitio** decide cuál es el próximo: el más cercano cuya fecha más un margen de 12 horas todavía no pasó (el alter dura la noche: no desaparece a las 20.31). Se decide en el sitio y no en el backend porque el sitio puede estar usando una copia en caché (ver "Sitio") y tiene que recalcular con la hora actual.
- **Nunca** devuelve `location_label`, `latitude`, `longitude`, RSVPs, invitados, pagos ni nada de staff.
- **Nombre corto derivado del título, automático** (sin campo nuevo). Tiene que resolver al menos: "Alter San Telmo - D I S C R E E T" → "Discreet", "Alter Tan Selmo - Spring Break" → "Spring Break", "Alter Tan Selmo "Secret Face"" → "Secret Face", "Alter a la Vuelta - San Telmo" y "Alter a la Vuelta, San Telmo." → un nombre razonable (por ejemplo "A la Vuelta"). La regla vive en el backend, con tests sobre los títulos reales.
- Seguir las convenciones de `../alter-tracker-backend/CLAUDE.md` (routers, schemas, services; tipos de la API regenerados).

**Sitio:** la home pide ese endpoint al renderizar, con caché de unos 15 minutos en Cloudflare. El backend está siempre prendido, pero puede fallar un rato (deploy, reinicio). La caché (Cache API de Workers) guarda la última respuesta buena y el sitio la usa si el backend falla o tarda. Solo sin ninguna copia en caché la home se muestra en el estado "sin fecha" y sin archivo. Nunca con error.

### Infraestructura

- Astro con el adapter de Cloudflare, renderizando la home en el servidor; `/reglas` prerenderizada.
- **Todo lo de Cloudflare en OpenTofu**, en `infra/` de este repo, con el mismo patrón que Velvet: proyecto (Pages o Workers, según lo que soporte el adapter de Astro vigente), dominio `club-vanta.com` en el apex y `www.club-vanta.com` redirigiendo al apex, registros DNS, y variables de entorno (la URL del backend). Nada se configura a mano en la UI.
- Repo en GitHub en la organización `club-vanta`, como Velvet, con deploy desde `main`.

## Decisiones tomadas por Claude (a revisar)

- **Estado de OpenTofu:** en el bucket S3 que ya usa el backend (`alter-tracker-terraform-state`), con una key propia (`club-vanta-com.tfstate`) y `use_lockfile = true`. Velvet no declara backend remoto; este repo sí, para no depender de un estado local.
- **Extracto del próximo alter:** el backend guarda, junto con la portada, el primer párrafo de `event.description` de mazmo (texto plano, sin HTML) y lo devuelve como `excerpt`.
- **Organización publicada:** fija por config del backend (`PUBLIC_ALTERS_ORG_SLUG`), no por la URL, para que ninguna otra organización quede expuesta (pedido del usuario). El builder confirma el slug real de Club Vanta en la base.
- **El apex `club-vanta.com` puede tener registros existentes** (por ejemplo MX de correo; el backend usa `infra-alerts@club-vanta.com`). Antes de crear registros en el apex, el builder lista lo que hay y no pisa nada que no sea web.
- **Contenido fijo** (textos, links de Telegram y mazmo, contactos de la organización) vive en el código del sitio, no en el backend.

## Lo que queda para el builder

- Elegir entre Cloudflare Pages y Workers según lo que soporte el adapter de Astro actual (consultar la documentación vigente), manteniendo todo en OpenTofu.
- Cómo se cachea (Cache API, `Cache-Control` o caché de fetch) y el margen exacto para considerar que un alter ya pasó.
- La regla exacta para derivar el nombre corto, cumpliendo los ejemplos de arriba.
- Cómo se sirven las portadas (hotlink a `prod.mazmocdn.com` o pasadas por el sitio) y el tratamiento para que la baja resolución no se note.
- Vectorizar el logo a SVG o usar la imagen; la máscara necesita una versión con buen contraste.
- Los cortes intermedios entre mobile (375 px) y escritorio (desde unos 1280 px), por ejemplo tablet. Velvet revisa todo a 375 px: acá igual.
- Accesibilidad: `prefers-reduced-motion` frena la cinta; contraste del título del hero sobre el muro; textos alternativos de los flyers.
- Si al pedir los datos no hay ningún alter pasado todavía, el muro y la grilla usan lo que haya, o se ocultan.
