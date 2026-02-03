# PowerShell script to fix React Native runtime errors on Windows
# Run with: powershell -ExecutionPolicy Bypass -File fix-windows.ps1

Write-Host "🚨 EMERGENCY FIX - React Native Runtime Error (Windows)" -ForegroundColor Red
Write-Host "========================================================" -ForegroundColor Red
Write-Host ""

# Stop Metro and Node processes
Write-Host "🛑 Paso 1: Detener procesos de React Native" -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Procesos Node detenidos" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No se encontraron procesos Node activos" -ForegroundColor Yellow
}

# Remove directories safely
Write-Host ""
Write-Host "🧹 Paso 2: Limpiar directorios" -ForegroundColor Yellow

$dirsToRemove = @(
    "node_modules",
    "android\app\build",
    "android\build",
    "android\.gradle"
)

foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        Write-Host "🗑️ Eliminando $dir..." -ForegroundColor Cyan
        try {
            Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
            Write-Host "✅ $dir eliminado" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Error eliminando $dir" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ $dir no existe" -ForegroundColor Green
    }
}

# Clean npm cache
Write-Host ""
Write-Host "🧽 Paso 3: Limpiar cache" -ForegroundColor Yellow
try {
    npm cache clean --force
    Write-Host "✅ Cache de npm limpiado" -ForegroundColor Green
} catch {
    Write-Host "❌ Error limpiando cache de npm" -ForegroundColor Red
}

# Clean temp directories
Write-Host ""
Write-Host "🧹 Paso 4: Limpiar archivos temporales" -ForegroundColor Yellow
try {
    Get-ChildItem -Path $env:TEMP -Filter "react-native*" -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $env:TEMP -Filter "metro*" -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Archivos temporales limpiados" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Error limpiando archivos temporales" -ForegroundColor Yellow
}

# Reinstall dependencies
Write-Host ""
Write-Host "📦 Paso 5: Reinstalar dependencias" -ForegroundColor Yellow
try {
    npm install --no-cache
    Write-Host "✅ Dependencias reinstaladas" -ForegroundColor Green
} catch {
    Write-Host "❌ Error reinstalando dependencias" -ForegroundColor Red
}

# Clean React Native cache
Write-Host ""
Write-Host "🔄 Paso 6: Limpiar cache de React Native" -ForegroundColor Yellow
try {
    npx react-native clean
    Write-Host "✅ Cache de React Native limpiado" -ForegroundColor Green
} catch {
    Write-Host "❌ Error limpiando cache de React Native" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 INSTRUCCIONES FINALES" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPCIÓN 1 - Probar versión simple:" -ForegroundColor White
Write-Host "1. Renombrar App.tsx a App.original.tsx" -ForegroundColor Gray
Write-Host "2. Renombrar AppSimple.tsx a App.tsx" -ForegroundColor Gray
Write-Host "3. npx react-native start --reset-cache" -ForegroundColor Gray
Write-Host "4. En otra terminal: npx react-native run-android" -ForegroundColor Gray
Write-Host ""

Write-Host "OPCIÓN 2 - Probar versión completa:" -ForegroundColor White
Write-Host "1. npx react-native start --reset-cache --clear-cache" -ForegroundColor Gray
Write-Host "2. Esperar 30 segundos" -ForegroundColor Gray
Write-Host "3. En otra terminal: npx react-native run-android" -ForegroundColor Gray
Write-Host ""

Write-Host "OPCIÓN 3 - Si persiste el error:" -ForegroundColor White
Write-Host "1. Reiniciar Android Studio completamente" -ForegroundColor Gray
Write-Host "2. Cold Boot el emulador (AVD Manager > Cold Boot Now)" -ForegroundColor Gray
Write-Host "3. Repetir OPCIÓN 1" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 Para debugging:" -ForegroundColor Cyan
Write-Host "npx react-native log-android | findstr /i ""error runtime""" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ LIMPIEZA COMPLETA TERMINADA!" -ForegroundColor Green
Write-Host "🎯 Ahora prueba las opciones de arriba." -ForegroundColor Green
