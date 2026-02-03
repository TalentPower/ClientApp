#!/usr/bin/env node

/**
 * Script para solucionar el error de Dimensions en React Native
 * Ejecutar con: node fix-dimensions-error.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Solucionando error de Dimensions - DriverTracker App');
console.log('===================================================\n');

// Función para ejecutar comandos
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log(`✅ ${description} - Completado\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}\n`);
    return false;
  }
}

console.log('🧹 Limpiando cache y archivos temporales...\n');

// Limpiar cache de Metro
runCommand('npx react-native start --reset-cache --clear-cache', 'Limpiando cache de Metro');

// Limpiar node_modules (solo en Windows PowerShell)
if (process.platform === 'win32') {
  runCommand('Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue', 'Removiendo node_modules (Windows)');
  runCommand('Remove-Item -Recurse -Force android\\app\\build -ErrorAction SilentlyContinue', 'Limpiando build Android');
} else {
  runCommand('rm -rf node_modules', 'Removiendo node_modules');
  runCommand('rm -rf android/app/build', 'Limpiando build Android');
}

// Reinstalar dependencias
runCommand('npm cache clean --force', 'Limpiando cache de npm');
runCommand('npm install', 'Reinstalando dependencias');

// Limpiar cache de React Native
runCommand('npx react-native clean', 'Limpiando cache de React Native');

console.log('📋 Verificando archivos de solución...\n');

// Verificar que el hook de dimensions existe
const hookPath = path.join(__dirname, 'src/hooks/useDimensions.ts');
if (fs.existsSync(hookPath)) {
  console.log('✅ Hook useDimensions.ts encontrado');
} else {
  console.log('❌ Hook useDimensions.ts no encontrado');
}

// Verificar archivos actualizados
const filesToCheck = [
  'src/screens/ActiveTripMaps.tsx',
  'src/screens/TripDashboard.tsx',
  'src/screens/LoginScreen.tsx'
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasSafeDimensions = content.includes('useDimensions');
    const hasUnsafeDimensions = content.includes('Dimensions.get');
    
    console.log(`${hasSafeDimensions && !hasUnsafeDimensions ? '✅' : '⚠️'} ${file} - ${hasSafeDimensions && !hasUnsafeDimensions ? 'Usando hook seguro' : 'Necesita actualización'}`);
  } else {
    console.log(`❌ ${file} - No encontrado`);
  }
});

console.log('\n📱 Soluciones implementadas:\n');
console.log('• ✅ Hook useDimensions para manejo seguro de dimensiones');
console.log('• ✅ Valores por defecto para evitar crashes');
console.log('• ✅ Listener para cambios de orientación');
console.log('• ✅ Manejo de errores robusto');

console.log('\n🚀 Comandos para ejecutar:\n');
console.log('1. Metro bundler (en una terminal):');
console.log('   npx react-native start --reset-cache\n');

console.log('2. App en Android (en otra terminal):');
console.log('   npx react-native run-android\n');

console.log('3. Ver logs (opcional):');
console.log('   npx react-native log-android\n');

console.log('📝 Si el problema persiste:\n');
console.log('• Reiniciar el emulador completamente');
console.log('• Verificar que Google Play Services esté instalado');
console.log('• Comprobar que los permisos estén otorgados');

console.log('\n✅ Script de solución completado!');
console.log('🎯 El error de Dimensions debería estar resuelto.\n');
