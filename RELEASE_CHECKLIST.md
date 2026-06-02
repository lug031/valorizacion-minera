# Release checklist (piloto/producción)

## 1) Validar entorno antes del build

Ejecutar:

```bash
npm run validate:release-env
```

La validación falla si:

- falta una variable crítica de `EXPO_PUBLIC_*`
- `EXPO_PUBLIC_ENABLE_DEV_SEED=true`
- `EXPO_PUBLIC_REQUIRE_DEVICE_ENROLLMENT=false`
- se detectan valores demo/test en credenciales críticas

## 2) Build release con guardrail

```bash
npm run android:release:check
```

## 3) Verificaciones operativas rápidas

- Activación de dispositivo nueva (usuario/código válidos)
- Login offline después de activar
- Sync de configuración comercial
- Sync de valorización create-only

