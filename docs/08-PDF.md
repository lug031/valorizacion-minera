# Fase 8 — Exportación PDF

## Flujo (sin fórmulas en PDF)

```
Snapshot / draft + results
  → valuation-pdf-builder (formateo)
  → valuation-template (HTML)
  → expo-print.printToFileAsync
  → expo-sharing.shareAsync
```

## Estructura

```
src/services/pdf/
  pdf-config.ts          # branding, template version
  formatters.ts          # es-PE, escape HTML
  pdf-service.ts         # generar + compartir
  builders/              # snapshot → view model
  templates/             # HTML A4
  types/                 # view model
```

## Pantallas

- Resultado: exportar antes o después de guardar historial
- Historial detalle: exportar desde snapshot SQLite

## Tests

- formatters
- builder + HTML contiene valores del snapshot
