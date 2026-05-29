# Fase 5 — UI Expo (decisiones)

## Estructura propuesta

```
app/                          # Expo Router (solo rutas)
  _layout.tsx                 # Providers: Paper, SafeArea, Auth
  index.tsx                   # Splash → redirect
  (auth)/login.tsx
  (app)/                      # Stack protegido
    dashboard.tsx
    valorizacion/nueva.tsx
    valorizacion/resultado.tsx
    historial.tsx
    configuracion.tsx

src/presentation/
  components/                 # UI presentacional
  forms/                      # Zod + defaults
  hooks/                      # useValuationCalculator → domain
  store/                      # Zustand: auth, draft, settings
  services/auth/              # Mock + SecureStore

src/domain/                   # Sin cambios de fórmulas en UI
src/data/repositories/        # fake-* hasta Fase 6
```

## Decisiones

| Decisión | Motivo |
|----------|--------|
| **Expo Router** | File-based, deep links, menos boilerplate que Navigation manual |
| **react-native-paper** | Inputs/buttons grandes, tema consistente, Android-first |
| **Zustand** | Draft de valorización sin prop drilling; auth/settings separados |
| **RHF + Zod** | Validación declarativa; pantalla no valida a mano |
| **`useValuationCalculator`** | Único puente form → `calculateValuation()` |
| **Repos fake** | Misma interfaz que SQLite en Fase 6 |
| **1 escenario activo, UI para 3** | `ScenarioTabs` preparado; store ya tiene array de 3 |
| **REC oro / plata separados** | Extensión mínima en dominio (mismo motor, distinto parámetro) |

## Flujo

Splash → (sesión?) Dashboard : Login → Dashboard → Nueva → Resultado

## Fuera de alcance Fase 5

SQLite real, PDF, login remoto, diseño premium.
