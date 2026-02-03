# DriverTracker App - Configuración del Proyecto

Esta es una aplicación React Native para rastrear conductores usando Google Maps API y Firebase.

## Requisitos Previos

- Node.js (versión 16 o superior)
- React Native CLI
- Android Studio
- Java Development Kit (JDK) 11 o superior
- Cuenta de Firebase
- API Key de Google Maps

## Configuración Inicial

### 1. Firebase Setup

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Agrega una app Android al proyecto
4. Descarga el archivo `google-services.json`
5. Coloca el archivo en `android/app/google-services.json`
6. Habilita los siguientes servicios:
   - Authentication (Email/Password)
   - Firestore Database
   - Functions (opcional)

### 2. Google Maps API Setup

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita las siguientes APIs:
   - Maps SDK for Android
   - Places API
   - Directions API
   - Geolocation API
3. Crea una API Key
4. Agrega la API Key al archivo `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="TU_API_KEY_AQUI"/>
</application>
```

### 3. Configuración de Firebase en build.gradle

Agrega al archivo `android/build.gradle` en el bloque `dependencies`:

```gradle
classpath 'com.google.gms:google-services:4.3.15'
```

Y al archivo `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
├── screens/            # Pantallas de la aplicación
├── services/           # Servicios (Firebase, Location, etc.)
├── navigation/         # Configuración de navegación
├── types/             # Tipos TypeScript
└── utils/             # Utilidades generales
```

## Instalación de Dependencias

```bash
npm install
```

## Configuración para Android

1. Asegúrate de tener Android Studio instalado
2. Configura las variables de entorno:
   - ANDROID_HOME
   - JAVA_HOME
3. Acepta las licencias de Android SDK:
   ```bash
   yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses
   ```

## Ejecutar la Aplicación

### Android

```bash
# Iniciar Metro bundler
npx react-native start

# En otra terminal, ejecutar en Android
npx react-native run-android
```

## Características Implementadas

- ✅ Configuración base de React Native con TypeScript
- ✅ Integración con Firebase (Auth, Firestore)
- ✅ Servicio de geolocalización
- ✅ Configuración para Google Maps
- ✅ Permisos de Android configurados
- ✅ Estructura de tipos TypeScript
- ✅ Servicios base para manejo de datos

## Próximos Pasos para el Desarrollo

1. Implementar pantallas de autenticación
2. Crear componente de mapa con Google Maps
3. Implementar rastreo en tiempo real
4. Crear dashboard para administradores
5. Implementar notificaciones push
6. Agregar funcionalidad de rutas optimizadas

## Troubleshooting

### Error de permisos en Android
- Asegúrate de que los permisos estén correctamente declarados en `AndroidManifest.xml`
- Solicita permisos en tiempo de ejecución para Android 6+

### Error de Google Maps
- Verifica que tu API Key esté correctamente configurada
- Asegúrate de que las APIs necesarias estén habilitadas en Google Cloud Console

### Error de Firebase
- Verifica que `google-services.json` esté en la ubicación correcta
- Asegúrate de que el package name coincida con el configurado en Firebase

## Contacto

Para soporte técnico o preguntas sobre la configuración, contacta al equipo de desarrollo.
