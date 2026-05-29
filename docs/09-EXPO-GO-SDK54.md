# Compatibilidad Expo Go (SDK 54)

## Problema

Expo Go en **iPhone** solo soporta la última versión del SDK (actualmente **54**). No se puede instalar Expo Go antiguo para SDK 52 en iOS.

## Solución aplicada

El proyecto se actualizó de SDK 52 → **SDK 54** (Expo ~54, React 19, React Native 0.81, Expo Router 6).

## Cómo probar en iPhone

1. Misma red Wi‑Fi que el PC.
2. `npm start`
3. Escanear QR con la app **Expo Go** (App Store).
4. Login: `operador` / `operador123`

## Android emulador (`a` en terminal)

Requiere Android Studio instalado y variable `ANDROID_HOME` apuntando al SDK. Sin eso verás error de `adb`.

## Alternativa sin Expo Go

Para APK privado en campo (objetivo del MVP):

```bash
npx expo prebuild
npx expo run:android
```

o EAS Build → APK instalable manualmente.
