# Fase 6 — Persistencia SQLite

## Esquema (v1)

| Tabla | Rol |
|-------|-----|
| `users` | Login local, `password_hash` SHA-256 |
| `sessions` | Auditoría sesión (token vivo en SecureStore) |
| `material_types` | MSC, MOC, … |
| `maquila_ranges` | Rangos editables |
| `providers` / `provider_defaults` | Defaults por proveedor |
| `app_settings` | Factor, REC, RC, consumos, flete, INTER |
| `valuations` | Historial + `snapshot_json` **inmutable** |
| `valuation_drafts` | Borrador opcional por usuario |
| `audit_logs` | Alta/baja/edición (preparado sync) |

## Archivos nuevos

```
src/data/db/
  sql-executor.ts      # Contrato queries + transacciones
  expo-database.ts     # expo-sqlite
  database.ts          # init singleton
  seed.ts              # users, settings, proveedor demo
src/data/repositories/
  sqlite-valuation-repository.ts
  sqlite-config-repository.ts
  sqlite-user-repository.ts
  sqlite-draft-repository.ts
  index.ts             # initDataLayer + exports
src/data/mappers/
  snapshot-to-draft.ts
src/data/security/
  password-hash.ts
```

## Decisiones

- **Snapshot JSON** = fuente de verdad histórica; tablas normalizadas de escenarios solo si hace falta sync (futuro).
- **Token en SecureStore**; `sessions` para trazabilidad offline.
- **Repos inyectables** en tests vía `TestSqlExecutor` (better-sqlite3).
- **UI** importa solo `@data/repositories`, nunca SQL.
