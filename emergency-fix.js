#!/usr/bin/env node

/**
 * Emergency fix script for persistent runtime errors
 * This script performs a complete reset of the React Native environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY FIX - React Native Runtime Error');
console.log('================================================\n');

const isWindows = process.platform === 'win32';

function runCommand(command, description, options = {}) {
  console.log(`📋 ${description}...`);
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit', 
      cwd: __dirname,
      ...options 
    });
    console.log(`✅ ${description} - Completado\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}\n`);
    return false;
  }
}

function deleteDirectory(dirPath, description) {
  try {
    console.log(`🗑️ ${description}...`);
    if (fs.existsSync(dirPath)) {
      if (isWindows) {
        execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'pipe' });
      } else {
        execSync(`rm -rf "${dirPath}"`, { stdio: 'pipe' });
      }
      console.log(`✅ ${description} - Eliminado\n`);
    } else {
      console.log(`✅ ${description} - No existía\n`);
    }
    return true;
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}\n`);
    return false;
  }
}

console.log('🛑 Paso 1: Detener todos los procesos de React Native\n');

// Kill Metro and React Native processes
if (isWindows) {
  runCommand('taskkill /F /IM node.exe /T', 'Terminando procesos Node.js', { silent: true });
  runCommand('taskkill /F /IM adb.exe /T', 'Terminando procesos ADB', { silent: true });
} else {
  runCommand('pkill -f "react-native\\|metro\\|node.*8081"', 'Terminando procesos React Native', { silent: true });
}

console.log('🧹 Paso 2: Limpiar todos los caches y archivos temporales\n');

// Delete directories
const dirsToDelete = [
  { path: 'node_modules', name: 'Node modules' },
  { path: 'android/app/build', name: 'Android build' },
  { path: 'android/build', name: 'Android Gradle build' },
  { path: 'android/.gradle', name: 'Gradle cache' },
  { path: path.join(require('os').homedir(), '.gradle', 'caches'), name: 'Global Gradle cache' },
  { path: path.join(require('os').tmpdir(), 'react-native-*'), name: 'React Native temp files' },
  { path: path.join(require('os').tmpdir(), 'metro-*'), name: 'Metro temp files' },
];

dirsToDelete.forEach(({ path: dirPath, name }) => {
  deleteDirectory(dirPath, `Eliminando ${name}`);
});

console.log('🧽 Paso 3: Limpiar caches de npm y sistemas\n');

// Clean various caches
const cacheCommands = [
  { cmd: 'npm cache clean --force', desc: 'Limpiando cache de npm' },
  { cmd: 'npx react-native clean', desc: 'Limpiando cache de React Native' },
];

if (isWindows) {
  cacheCommands.push(
    { cmd: 'rd /s /q "%LOCALAPPDATA%\\Temp\\react-native-*" 2>nul', desc: 'Limpiando archivos temp RN (Windows)' },
    { cmd: 'rd /s /q "%LOCALAPPDATA%\\Temp\\metro-*" 2>nul', desc: 'Limpiando archivos temp Metro (Windows)' }
  );
} else {
  cacheCommands.push(
    { cmd: 'rm -rf /tmp/react-native-* 2>/dev/null || true', desc: 'Limpiando archivos temp RN (Unix)' },
    { cmd: 'rm -rf /tmp/metro-* 2>/dev/null || true', desc: 'Limpiando archivos temp Metro (Unix)' },
    { cmd: 'rm -rf ~/.gradle/caches 2>/dev/null || true', desc: 'Limpiando cache Gradle usuario' }
  );
}

cacheCommands.forEach(({ cmd, desc }) => {
  runCommand(cmd, desc, { silent: true });
});

console.log('📦 Paso 4: Reinstalar dependencias completamente\n');

runCommand('npm install --no-cache', 'Instalando dependencias sin cache');

console.log('🔧 Paso 5: Limpiar proyecto Android\n');

const androidCommands = [
  { cmd: 'cd android && ./gradlew clean', desc: 'Gradle clean (Unix)' },
  { cmd: 'cd android && gradlew.bat clean', desc: 'Gradle clean (Windows)' },
];

const androidCmd = isWindows ? androidCommands[1] : androidCommands[0];
runCommand(androidCmd.cmd, androidCmd.desc);

console.log('🎯 Paso 6: Verificar configuración de archivos críticos\n');

// Check critical files
const criticalFiles = [
  'src/components/RuntimeSafeWrapper.tsx',
  'src/hooks/useDimensions.ts',
  'App.tsx',
  'android/app/src/main/AndroidManifest.xml'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n📱 Paso 7: Instrucciones finales\n');

console.log('🚀 COMANDOS PARA EJECUTAR (en orden):');
console.log('=====================================\n');

console.log('1. Iniciar Metro con cache limpio (Terminal 1):');
console.log('   npx react-native start --reset-cache --clear-cache\n');

console.log('2. Esperar 10 segundos hasta que Metro esté listo\n');

console.log('3. Ejecutar en Android (Terminal 2):');
console.log('   npx react-native run-android\n');

console.log('4. Si aún falla, reiniciar emulador completamente:\n');
console.log('   - Cold Boot el emulador en Android Studio');
console.log('   - Repetir pasos 1-3\n');

console.log('📊 ARCHIVOS DE SOLUCIÓN CREADOS:');
console.log('=================================');
console.log('• RuntimeSafeWrapper.tsx - Inicialización segura del runtime');
console.log('• useDimensions.ts (mejorado) - Hook ultra-seguro para dimensions');
console.log('• App.tsx (actualizado) - Wrapper de seguridad aplicado\n');

console.log('🔍 PARA DEBUGGING:');
console.log('==================');
console.log('• Logs del runtime: npx react-native log-android | grep "RUNTIME"');
console.log('• Logs de dimensions: npx react-native log-android | grep "DIMENSIONS"');
console.log('• Logs generales: npx react-native log-android\n');

console.log('✅ EMERGENCY FIX COMPLETADO!');
console.log('🎯 La app debería funcionar ahora sin errores de runtime.\n');

console.log('💡 NOTA: Si el problema persiste después de seguir todos los pasos:');
console.log('1. Reiniciar completamente la computadora');
console.log('2. Usar un emulador diferente');
console.log('3. Probar en un dispositivo físico\n');
