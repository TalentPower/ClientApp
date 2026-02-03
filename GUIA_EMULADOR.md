# 🚀 Guía Rápida: Ejecutar el Proyecto en el Emulador

## 📋 Requisitos Previos

1. **Android Studio** instalado
2. **Emulador de Android** configurado
3. **Node.js** (versión >= 20)
4. **Java JDK** instalado

## 🎯 Pasos para Ejecutar el Proyecto

### Paso 1: Iniciar el Emulador de Android

#### Opción A: Desde Android Studio
1. Abre **Android Studio**
2. Ve a **Tools > Device Manager** (o **More Devices**)
3. Selecciona un emulador y haz clic en **▶️ Play**
4. Espera a que el emulador inicie completamente

#### Opción B: Desde la Línea de Comandos
```powershell
# Listar emuladores disponibles
emulator -list-avds

# Iniciar un emulador específico (reemplaza "nombre_emulador" con el nombre real)
emulator -avd nombre_emulador
```

### Paso 2: Verificar que el Emulador Esté Conectado

Abre una nueva terminal y ejecuta:
```powershell
adb devices
```

Deberías ver algo como:
```
List of devices attached
emulator-5554    device
```

### Paso 3: Instalar Dependencias (si es la primera vez)

```powershell
npm install
```

### Paso 4: Iniciar Metro Bundler

En una terminal, ejecuta:
```powershell
npm start
```

O con cache limpio (si tienes problemas):
```powershell
npm start -- --reset-cache
```

**⚠️ IMPORTANTE:** Deja esta terminal abierta. Metro debe seguir corriendo.

### Paso 5: Ejecutar la App en el Emulador

Abre una **nueva terminal** (con Metro corriendo en la otra) y ejecuta:

```powershell
npm run android
```

O directamente:
```powershell
npx react-native run-android
```

## 🎉 ¡Listo!

La aplicación debería compilarse e instalarse automáticamente en el emulador.

## 🔧 Configurar Ubicación en el Emulador (Importante para esta App)

Como esta app usa ubicación GPS, necesitas configurarla en el emulador:

### Método 1: Extended Controls (Recomendado)
1. En el emulador, haz clic en **"..."** (tres puntos) en el panel lateral
2. Ve a **"Location"**
3. En **"Single points"** ingresa:
   - **Latitud:** `19.4326`
   - **Longitud:** `-99.1332`
   - Haz clic en **"Send"**

### Método 2: Desde Settings del Emulador
1. Abre **Settings** en el emulador
2. Ve a **Location**
3. Activa **"Use location"**
4. Selecciona **"High accuracy"**

## 🐛 Solución de Problemas Comunes

### Error: "No devices/emulators found"
- Verifica que el emulador esté corriendo: `adb devices`
- Reinicia el servidor ADB: `adb kill-server && adb start-server`

### Error: "Metro bundler not found"
- Asegúrate de tener Metro corriendo en otra terminal: `npm start`

### Error: "Build failed"
- Limpia el proyecto:
  ```powershell
  cd android
  .\gradlew clean
  cd ..
  npm start -- --reset-cache
  npm run android
  ```

### La app se cierra inmediatamente
- Revisa los logs: `npx react-native log-android`
- Verifica que todas las dependencias estén instaladas: `npm install`

### Google Maps no se muestra
- Verifica que Google Play Services esté instalado en el emulador
- Reinicia el emulador
- Limpia el cache: `npm start -- --reset-cache`

## 📱 Comandos Útiles

```powershell
# Ver logs en tiempo real
npx react-native log-android

# Recargar la app (en el emulador presiona R dos veces o Ctrl+M)

# Limpiar todo y reinstalar
cd android
.\gradlew clean
cd ..
npm start -- --reset-cache
# En otra terminal:
npm run android
```

## 🎯 Atajos del Emulador

- **Ctrl + M** (Windows): Abre el menú de desarrollo
- **R** (dos veces): Recarga la app
- **Ctrl + R**: Recarga la app
- **Ctrl + Shift + Z**: Abre DevTools

## 📚 Recursos Adicionales

- Ver `EMULATOR_SETUP.md` para más detalles sobre configuración de Google Maps
- Ver `README.md` para información general del proyecto








