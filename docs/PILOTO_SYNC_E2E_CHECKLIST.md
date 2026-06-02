# Checklist E2E — sincronización valorizaciones (piloto cerrado)

Dispositivo con build que incluye el slice de sync. Panel web desplegado con la misma API.

## Caso A — Config maestra (admin y operador)

- [ ] Dispositivo activado y red: sync automática al abrir app / primer plano / recuperar conexión (sin pantalla «Sincronizar configuración»).
- [ ] Sin red: banner pide activar internet.
- [ ] **Actualizaciones comerciales**: tras sync con cambios, lista valor anterior/nuevo y fechas (INTER, factor, MAT, maquila).
- [ ] Nueva cotización usa defaults post-sync; edición conserva valores guardados + hints «Valor actual» si difieren.

## Caso B — Offline → online → web (cotizaciones)

- [ ] Dispositivo activado y usuario con `cloud_user_id` (no seed local).
- [ ] Sin red: crear y guardar una valorización nueva.
- [ ] Historial: estado `pending` / badge «sin enviar».
- [ ] Conectar red; esperar envío automático o pulsar «Enviar al panel».
- [ ] Historial: estado `synced`.
- [ ] Panel web: aparece la cotización con mismo código y `mobileId` coherente.

## Caso C — Doble envío (idempotencia)

- [ ] Con una cotización `pending`, pulsar «Enviar al panel» dos veces seguidas.
- [ ] En web solo existe **un** registro para ese `mobileId`.
- [ ] En móvil queda `synced` sin error.

## Caso D — Dispositivo revocado

- [ ] Revocar dispositivo en panel web.
- [ ] En móvil, intentar enviar cotización pendiente.
- [ ] Resultado: error claro (teléfono no autorizado), estado local `error`, **no** `synced`.
- [ ] Web: no se crean cotizaciones nuevas tras revocación.

## Caso E — Usuario local seed (solo desarrollo)

- [ ] Operar con usuario `local_seed` (sin `cloud_user_id`).
- [ ] Guardar cotización: queda `pending` en SQLite.
- [ ] Envío omitido: mensaje en Historial indicando usuario no vinculado al sistema central.

## Caso F — Recuperación `syncing` atascado

- [ ] Simular interrupción: forzar `sync_status = 'syncing'` en SQLite (o cerrar app durante envío).
- [ ] Iniciar envío de nuevo.
- [ ] La fila vuelve a `pending` y se reintenta; termina en `synced` o `error`, nunca permanece en `syncing`.

## Caso G — Diagnóstico en app

- [ ] Dashboard: banners unificados (config + cola de envío, máx. 2).
- [ ] Botón «Actualizaciones comerciales» muestra contador si hay changelog no visto.
- [ ] Segunda sync sin cambios en web: no reescribe SQLite (checksum igual).

## Caso H — Post-activación

- [ ] Tras activar dispositivo con red: primera cotización usa valores de la web (no solo seed).

## Caso I — Piloto real (no seed)

- [ ] Probar siempre con usuario creado en web + código de activación, no cuenta `local_seed`.

## Registro de incidencias (piloto)

Anotar: hora, código cotización, `mobileId` (id local), estado en SQLite, mensaje `sync_error`, versión app.
