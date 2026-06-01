# Checklist E2E — sincronización valorizaciones (piloto cerrado)

Dispositivo con build que incluye el slice de sync. Panel web desplegado con la misma API.

## Caso A — Offline → online → web

- [ ] Dispositivo activado y usuario con `cloud_user_id` (no seed local).
- [ ] Sin red: crear y guardar una valorización nueva.
- [ ] Historial: estado `pending` / badge «sin enviar».
- [ ] Conectar red; esperar envío automático o pulsar «Enviar al panel».
- [ ] Historial: estado `synced`.
- [ ] Panel web: aparece la cotización con mismo código y `mobileId` coherente.

## Caso B — Doble envío (idempotencia)

- [ ] Con una cotización `pending`, pulsar «Enviar al panel» dos veces seguidas.
- [ ] En web solo existe **un** registro para ese `mobileId`.
- [ ] En móvil queda `synced` sin error.

## Caso C — Dispositivo revocado

- [ ] Revocar dispositivo en panel web.
- [ ] En móvil, intentar enviar cotización pendiente.
- [ ] Resultado: error claro (teléfono no autorizado), estado local `error`, **no** `synced`.
- [ ] Web: no se crean cotizaciones nuevas tras revocación.

## Caso D — Usuario local seed

- [ ] Operar con usuario `local_seed` (sin paso «Sincronizar usuarios»).
- [ ] Guardar cotización: queda `pending` en SQLite.
- [ ] «Enviar al panel»: omitida con mensaje de sincronizar usuarios; contador «Omitidas (sin usuario central)» ≥ 1 en Configuración → paso 3.
- [ ] Tras sincronizar usuarios y login con usuario provisionado, reenviar: debe subir.

## Caso E — Recuperación `syncing` atascado

- [ ] Simular interrupción: forzar `sync_status = 'syncing'` en SQLite (o cerrar app durante envío).
- [ ] Iniciar envío de nuevo.
- [ ] La fila vuelve a `pending` y se reintenta; termina en `synced` o `error`, nunca permanece en `syncing`.

## Caso F — Diagnóstico en app

- [ ] Configuración → Sincronizar: bloque «Cola de envío» muestra pendientes, syncing, error y omitidas.
- [ ] Dashboard / Historial: aviso si hay cola pendiente.

## Registro de incidencias (piloto)

Anotar: hora, código cotización, `mobileId` (id local), estado en SQLite, mensaje `sync_error`, versión app.
