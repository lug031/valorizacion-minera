# Escenarios A · B · C

## Comportamiento

- **Lote compartido:** código, fecha, MAT, TMH, H2O, leyes, REC, **factor**.
- **Por escenario:** maquila, RC oro/plata, consumos, flete, INTER oro/plata, otros costos.
- **Cálculo:** `calculateValuationSet()` → `calculateValuation()` con array de 3 escenarios.
- **UI:** tabs A/B/C, comparativo en nueva valorización y resultado.
- **Snapshot:** `scenarios[]`, `results.scenarios[]`, `activeScenarioIndex`, `appSettingsUsed.factor`.

## Compatibilidad

- Borradores antiguos con `factor` por escenario se normalizan con `normalizeValuationDraft()`.
- Historial antiguo con 1 escenario: al abrir se rellenan B/C desde A.
