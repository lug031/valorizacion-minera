# Valorización Minera (MVP)

App Android privada offline para valorización de minerales (oro/plata), basada en lógica Excel.

## Estado del proyecto

| Fase | Estado |
|------|--------|
| 1. Dominio y supuestos | ✅ |
| 2. Arquitectura | ✅ |
| 3. Modelos + SQLite schema | ✅ |
| 4. Motor de cálculo + tests | ✅ |
| 5. Pantallas MVP (Expo) | ✅ Base |
| 6. Persistencia SQLite | ✅ |
| 7. Escenarios A/B/C comparativos | ✅ |
| 8. Exportación PDF | ✅ |
| 7. PDF | ⏳ |
| 8. Seguridad login | ⏳ |

## Ejecutar app (Expo SDK 54)

```bash
cd D:\appweb\apps\valorizacion-minera
npm install
npm start
```

Escanea el QR con **Expo Go** (iPhone/Android). El proyecto usa **SDK 54** para coincidir con la app Expo Go actual en iOS.

**Android emulador:** requiere Android Studio + `ANDROID_HOME` (o un dispositivo USB con depuración).

**APK privado (objetivo producción):** `npx expo prebuild` + EAS Build o Gradle local (no depende de Expo Go).

Login mock: `operador` / `operador123` o `admin` / `admin123`

## Motor de cálculo (verificado)

```bash
npm test
npm run typecheck
```

Documentación:
- [docs/03-MODELOS-DE-DATOS.md](./docs/03-MODELOS-DE-DATOS.md)
- [docs/04-MOTOR-DE-CALCULO.md](./docs/04-MOTOR-DE-CALCULO.md)
- [docs/06-PERSISTENCIA-SQLITE.md](./docs/06-PERSISTENCIA-SQLITE.md)
- [docs/07-ESCENARIOS-ABC.md](./docs/07-ESCENARIOS-ABC.md)
- [docs/08-PDF.md](./docs/08-PDF.md)

## Estructura

```
src/
  domain/calculation/   # Motor puro (decimal.js)
  domain/models/        # Tipos TypeScript
  data/db/              # Esquema SQLite + migraciones
  utils/                # Redondeo Excel-compatible
```

## Próximo paso

Inicializar Expo + pantallas que consuman `calculateValuation` sin duplicar fórmulas en UI.
