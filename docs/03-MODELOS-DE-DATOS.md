# Fase 3 — Modelos de datos

## TypeScript (`src/domain/models/`)

| Módulo | Contenido |
|--------|-----------|
| `enums.ts` | `GradeUnit`, `UserRole`, `ScenarioLabel` |
| `config.ts` | `MaquilaRange`, `MaterialType`, `Provider`, `ProviderDefaults`, `AppSettings` |
| `calculation.ts` | `LotInput`, `ScenarioCommercialParams`, resultados |
| `valuation.ts` | `Valuation`, `ValuationSnapshot` (inmutable) |
| `user.ts` | `User`, `DeviceRegistration`, `Session` |

## Snapshot histórico

Cada valorización guarda `snapshot_json` con:

- `formulaVersion` (ej. `v1`)
- `lot` + `scenarios` (inputs)
- `maquilaRangesUsed` + `appSettingsUsed`
- `results` calculados
- `calculatedAt`

Si cambian rangos de maquila globales, registros antiguos **no** se recalculan.

## SQLite (`src/data/db/schema.ts`)

| Tabla | Uso |
|-------|-----|
| `users` | Login MVP |
| `devices` | Expiración por dispositivo (futuro) |
| `material_types` | MSC, MOC, … |
| `maquila_ranges` | Tabla editable |
| `providers` / `provider_defaults` | Defaults comerciales |
| `app_settings` | FACTOR global, defaults |
| `valuations` | Historial + snapshot JSON |

Índices: `code`, `fecha`, `material_type_code`, `provider_name`.

## Repositorios (contratos)

- `ValuationRepository` — insert, search, snapshot
- `ConfigRepository` — tipos MAT, maquila, proveedores

Implementación con `expo-sqlite` en Fase 6.
