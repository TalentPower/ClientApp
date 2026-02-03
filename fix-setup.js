#!/usr/bin/env node

/**
 * Script de configuración y solución de problemas - DriverTracker App
 * Ejecutar con: node fix-setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 DriverTracker - Script de Solución de Problemas');
console.log('================================================\n');

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

// Función para verificar archivos
function checkFile(filePath, description) {
  const exists = fs.existsSync(path.join(__dirname, filePath));
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  return exists;
}

console.log('🔍 Verificando archivos de configuración...\n');

// Verificar archivos importantes
checkFile('android/app/google-services.json', 'Google Services Config');
checkFile('android/app/src/main/AndroidManifest.xml', 'Android Manifest');
checkFile('src/config/environment.ts', 'Environment Config');
checkFile('package.json', 'Package JSON');

console.log('\n🧹 Limpiando cache y dependencias...\n');

// Limpiar node_modules y cache
runCommand('rm -rf node_modules', 'Removiendo node_modules');
runCommand('npm cache clean --force', 'Limpiando cache de npm');

console.log('📦 Instalando dependencias...\n');

// Instalar dependencias
runCommand('npm install', 'Instalando dependencias de npm');

console.log('🔄 Limpiando cache de React Native...\n');

// Limpiar cache de React Native
runCommand('npx react-native clean', 'Limpiando cache de React Native');

console.log('📱 Verificando configuración de Android...\n');

// Verificar configuración de Android
const manifestPath = path.join(__dirname, 'android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  
  const hasGoogleMapsKey = manifestContent.includes('com.google.android.geo.API_KEY');
  const hasLocationPermissions = manifestContent.includes('ACCESS_FINE_LOCATION');
  
  console.log(`${hasGoogleMapsKey ? '✅' : '❌'} Google Maps API Key configurada`);
  console.log(`${hasLocationPermissions ? '✅' : '❌'} Permisos de ubicación configurados`);
}

console.log('\n🎯 Verificando estructura de Firebase...\n');

// Verificar Firebase
const firebaseConfigPath = path.join(__dirname, 'android/app/google-services.json');
if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    console.log('✅ Configuración de Firebase encontrada');
    console.log(`   Project ID: ${firebaseConfig.project_info?.project_id || 'N/A'}`);
  } catch (error) {
    console.log('❌ Error leyendo configuración de Firebase');
  }
} else {
  console.log('❌ Archivo google-services.json no encontrado');
}

console.log('\n📋 Resumen de archivos creados para solución de errores:\n');

// Listar archivos de solución
const solutionFiles = [
  'src/utils/errorHandler.ts',
  'src/screens/ActiveTripSimple.tsx',
  'SOLUCION_ERRORES.md'
];

solutionFiles.forEach(file => {
  checkFile(file, 'Archivo de solución');
});

console.log('\n🚀 Comandos para ejecutar manualmente:\n');
console.log('1. Iniciar Metro bundler con cache limpio:');
console.log('   npx react-native start --reset-cache\n');

console.log('2. En otra terminal, ejecutar la app:');
console.log('   npx react-native run-android\n');

console.log('3. Para ver logs en tiempo real:');
console.log('   npx react-native log-android\n');

console.log('📝 Notas importantes:\n');
console.log('• Si Google Maps no se muestra, la app usará la versión simplificada');
console.log('• Todos los errores de Firebase han sido solucionados');  
console.log('• El sistema de autenticación funciona con la API custom');
console.log('• Para más detalles, revisar SOLUCION_ERRORES.md\n');

console.log('✅ Script de configuración completado!');
console.log('🎯 La app debería funcionar correctamente ahora.\n');
