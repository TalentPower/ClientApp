# Plan de Desarrollo: appClienteTracker

Este documento define la arquitectura, las fases de desarrollo y la configuración base para la aplicación móvil **appClienteTracker**, construida con **React Native** usando **Expo SDK 52/51** y **Expo Router**.

## 1. Visión General del Proyecto

- **Nombre:** appClienteTracker
- **Plataforma:** iOS y Android (vía Expo Prebuild / EAS Build)
- **Framework Principal:** React Native + Expo
- **Navegación:** Expo Router (File-based routing)
- **Mapa y Localización:** `react-native-maps`, `expo-location`, `expo-task-manager`
- **Notificaciones (Push):** `expo-notifications` (y opcionalmente `@react-native-firebase/messaging`)
- **Backend/Auth:** Firebase (Nativo mediante Config Plugins) o API REST (dependiendo del backend existente)

## 2. Decisiones Arquitectónicas (Compatibilidad con Hero-DriverTracker-App)

1. **Mapas:** Uso de `react-native-maps` integrado vía `app.json` con la API Key de Google Maps para mantener consistencia visual y de polígonos/rutas.
2. **Localización Background/Foreground:** Migración de `react-native-geolocation-service` a las soluciones nativas de Expo (`expo-location` + `expo-task-manager`) para garantizar que el sistema operativo no mate la app al rastrear la ruta en segundo plano.
3. **Navegación:** `Expo Router` ofrece soporte nativo para `Deep Links` (esencial para cuando el usuario presiona una notificación push en su teléfono).
4. **Firebase:** Mantenimiento de los paquetes nativos (`@react-native-firebase/app`, etc.) mediante los Plugins de Configuración de Expo, obteniendo el máximo rendimiento para notificaciones en segundo plano.

## 3. Estructura de Directorios Recomendada

```text
appClienteTracker/
├── app/                      # Rutas de navegación (Expo Router)
│   ├── _layout.tsx           # Configuración global del Root Stack / Tabs
│   ├── index.tsx             # Pantalla base / Mapa de seguimiento (RouteTracking)
│   └── (modals)/             # Pantallas modales (Ej. Confirmación de eventos)
│       └── event-modal.tsx
├── src/
│   ├── components/           # Componentes reutilizables de UI (Ej. EventCard)
│   ├── services/             # Lógica de negocio, llamadas API, Firebase, Notificaciones
│   ├── hooks/                # Custom hooks (Ej. useLocationTracking)
│   ├── constants/            # Colores, configuraciones de la app, URLs
│   └── types/                # Interfaces y tipos TypeScript
├── assets/                   # Imágenes, fuentes, iconos
├── app.json                  # Archivo de configuración maestro (Sustituye AndroidManifest / Info.plist)
├── package.json
└── tsconfig.json
```

## 4. Fases de Desarrollo

### Fase 1: Inicialización y Configuración Base
- [ ] Ejecutar `npx create-expo-app@latest appClienteTracker`.
- [ ] Instalar dependencias core (`expo-location`, `react-native-maps`, `expo-router`).
- [ ] Configurar TypeScript estrictamente.
- [ ] Incorporar las variables de entorno para API Keys (Google Maps) con `.env.local`.
- [ ] Configurar el archivo `app.json` registrando los **Config Plugins** requeridos y permisos de localización (Foreground/Background).

### Fase 2: Módulo de Mapas y Rutas (Core)
- [ ] Integrar `react-native-maps` en `app/index.tsx`.
- [ ] Desarrollar `useLocationTracking` hook para solicitar permisos e iniciar el Foreground Service.
- [ ] Configurar `TaskManager.defineTask` en el scope global para el registro persistente en segundo plano de la latitud/longitud.
- [ ] Trazar la ruta (Polyline) de manera dinámica conectando origen (cliente) y destino (Hero Driver).

### Fase 3: Avisos y Notificaciones Push
- [ ] Configurar permisos de notificaciones usando `expo-notifications`.
- [ ] Obtener el _Device Token_ (Expo push token o FCM Token de Firebase).
- [ ] Manejar _listeners_ en foreground y background cuando llega una nueva notificación desde el dashboard/driver.
- [ ] Configurar los Deep Links en Expo Router para abrir pantallas específicas al tocar la notificación.

### Fase 4: Flujo de Interfaz - Citas y Eventos
- [ ] Implementar el componente visual `EventCard` (UI para Confirmar / Declinar).
- [ ] Desarrollar un Modal (`app/(modals)/event-modal.tsx`) que intercepte peticiones en tiempo real exigiendo la atención del cliente.
- [ ] Enlazar el flujo con tu backend, enviando el status HTTP actualizado una vez que el usuario declina o confirma la asistencia.

### Fase 5: Testing Nativo y Compilación 
- [ ] Ejecutar `npx expo prebuild --clean` para generar las carpetas `android` y `ios` con código nativo compilable (si es necesario revisar manualmente).
- [ ] Probar la persistencia de ubicación cerrando la app en el emulador o dispositivo físico haciendo build local (`npx expo run:android` / `npx expo run:ios`).
- [ ] Construir en la nube vía **EAS Build** para generar entregables (APK / AAB / IPA).

## 5. Prerrequisitos del Entorno Local

1. Tener Node.js instalado (v18 o superior).
2. Tener configurado el entorno de desarrollo local (Android Studio con un Emulador o Xcode en macOS).
3. Archivos `google-services.json` y `GoogleService-Info.plist` de la consola de Firebase.

---
**Nota para el equipo de desarrollo:** Al basarnos en componentes funcionales modernos, previene siempre fugas de memoria limpiando las suscripciones de ubicación (`Location.watchPositionAsync`) y listeners push en los bloques de limpieza (`cleanup`) de `useEffect`.
