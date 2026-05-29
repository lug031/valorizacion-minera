# Fase 4 — Motor de cálculo

## Módulos (`src/domain/calculation/`)

| Archivo | Función |
|---------|---------|
| `tms.ts` | `calculateTms` — REDONDEAR.MENOS 3 dec |
| `grade-conversion.ts` | gr/tm ↔ oz/tc (34.28571) |
| `rec-factor.ts` | UI 90 → 0.9 |
| `maquila-suggestion.ts` | Tabla rangos + ley > 1.901 → 190 |
| `valuation-gold.ts` | Fórmula AU confirmada |
| `valuation-silver.ts` | Fórmula AG (sin maquila/consumos/flete) |
| `valuation-engine.ts` | Orquestación + 3 escenarios |

## Decimales

- `decimal.js` en todo el motor
- `roundDown` = REDONDEAR.MENOS
- `roundHalfUp` = resultados monetarios a 2 dec
- Sin redondeo en pasos intermedios (salvo TMS)

## Fórmulas implementadas

```
TMS = REDONDEAR.MENOS(TMH - TMH*H2O/100, 3)

valorAu = round2(((((INTER-RC)*LEY*REC)-MAQUILA)*FACTOR)-CONSUMOS-FLETE-OTROS)

valorAg = round2((INTER-RC)*LEY*REC*FACTOR)

valorFinal = round2(valorAu + valorAg)
total = round2(valorFinal * TMS)
```

## Tests

```bash
npm test
```

Casos clave: TMS 15/1→14.850, AU ejemplo 1605, AG 102, total 25348.95.
