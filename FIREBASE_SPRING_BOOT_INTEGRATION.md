# Integración de Firebase con Spring Boot

Esta guía muestra cómo conectar Firebase Firestore con Spring Boot usando Firebase Admin SDK.

## 1. Dependencias (pom.xml)

Agrega las siguientes dependencias a tu `pom.xml`:

```xml
<dependencies>
    <!-- Spring Boot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Firebase Admin SDK -->
    <dependency>
        <groupId>com.google.firebase</groupId>
        <artifactId>firebase-admin</artifactId>
        <version>9.2.0</version>
    </dependency>
    
    <!-- Google Cloud Firestore (incluido en firebase-admin, pero puedes especificarlo) -->
    <dependency>
        <groupId>com.google.cloud</groupId>
        <artifactId>google-cloud-firestore</artifactId>
        <version>3.11.0</version>
    </dependency>
    
    <!-- Lombok (opcional) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

## 2. Configuración de Firebase

### Opción A: Usando archivo JSON de credenciales (Recomendado para producción)

1. **Descarga el archivo de credenciales de Firebase:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Selecciona tu proyecto
   - Ve a **Configuración del proyecto** (ícono de engranaje)
   - En la pestaña **Cuentas de servicio**, haz clic en **Generar nueva clave privada**
   - Descarga el archivo JSON

2. **Coloca el archivo en tu proyecto:**
   ```
   src/
   └── main/
       └── resources/
           └── firebase-service-account.json
   ```

3. **Agrega a `.gitignore`:**
   ```
   firebase-service-account.json
   ```

### Opción B: Usando variables de entorno (Recomendado para desarrollo)

Puedes configurar las credenciales usando variables de entorno o el archivo JSON.

## 3. Configuración de Spring Boot

### application.properties

```properties
# Firebase Configuration
firebase.credentials.path=classpath:firebase-service-account.json
# O usar variable de entorno:
# firebase.credentials.path=${FIREBASE_CREDENTIALS_PATH:classpath:firebase-service-account.json}

# Firebase Project ID (opcional, se puede obtener del JSON)
firebase.project.id=apprutas-d7efc

# Server Configuration
server.port=8080
spring.application.name=driver-tracker-api
```

### application.yml (alternativa)

```yaml
firebase:
  credentials:
    path: classpath:firebase-service-account.json
  project:
    id: apprutas-d7efc

server:
  port: 8080

spring:
  application:
    name: driver-tracker-api
```

## 4. Clase de Configuración de Firebase

### FirebaseConfig.java

```java
package com.sipe.driver.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials.path}")
    private Resource credentialsResource;

    @Value("${firebase.project.id:}")
    private String projectId;

    @PostConstruct
    public void initialize() {
        try {
            InputStream serviceAccount = credentialsResource.getInputStream();
            
            FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount));
            
            // Si el projectId está configurado, úsalo
            if (projectId != null && !projectId.isEmpty()) {
                optionsBuilder.setProjectId(projectId);
            }
            
            FirebaseOptions options = optionsBuilder.build();
            
            // Verificar si Firebase ya está inicializado
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("✅ Firebase initialized successfully");
            } else {
                log.info("⚠️ Firebase already initialized");
            }
        } catch (IOException e) {
            log.error("❌ Error initializing Firebase: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize Firebase", e);
        }
    }

    @Bean
    public Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }
}
```

## 5. Modelos (DTOs)

### CoordinateDTO.java

```java
package com.sipe.driver.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoordinateDTO {
    private Double latitude;
    private Double longitude;
    private LocalDateTime timestamp;
    private Double accuracy;

    // Método para convertir a Map para Firestore
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("latitude", latitude);
        map.put("longitude", longitude);
        map.put("timestamp", timestamp != null ? timestamp.toString() : null);
        map.put("accuracy", accuracy);
        return map;
    }

    // Método para crear desde Map de Firestore
    public static CoordinateDTO fromMap(Map<String, Object> map) {
        CoordinateDTO dto = new CoordinateDTO();
        dto.setLatitude(((Number) map.get("latitude")).doubleValue());
        dto.setLongitude(((Number) map.get("longitude")).doubleValue());
        if (map.get("timestamp") != null) {
            dto.setTimestamp(LocalDateTime.parse(map.get("timestamp").toString()));
        }
        if (map.get("accuracy") != null) {
            dto.setAccuracy(((Number) map.get("accuracy")).doubleValue());
        }
        return dto;
    }
}
```

### DriverRouteDTO.java

```java
package com.sipe.driver.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverRouteDTO {
    private String driverId;
    private String driverName;
    private List<CoordinateDTO> coordinates;
    private LocalDateTime lastUpdate;
    private LocalDateTime createdAt;
    private Boolean isActive;

    // Método para convertir a Map para Firestore
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("driverId", driverId);
        map.put("driverName", driverName);
        map.put("isActive", isActive != null ? isActive : true);
        map.put("lastUpdate", lastUpdate != null ? lastUpdate.toString() : null);
        map.put("createdAt", createdAt != null ? createdAt.toString() : null);
        
        // Convertir lista de coordenadas
        List<Map<String, Object>> coordinatesList = new ArrayList<>();
        if (coordinates != null) {
            for (CoordinateDTO coord : coordinates) {
                coordinatesList.add(coord.toMap());
            }
        }
        map.put("coordinates", coordinatesList);
        
        return map;
    }

    // Método para crear desde Map de Firestore
    @SuppressWarnings("unchecked")
    public static DriverRouteDTO fromMap(String documentId, Map<String, Object> map) {
        DriverRouteDTO dto = new DriverRouteDTO();
        dto.setDriverId(documentId);
        dto.setDriverName((String) map.get("driverName"));
        dto.setIsActive((Boolean) map.getOrDefault("isActive", true));
        
        if (map.get("lastUpdate") != null) {
            dto.setLastUpdate(LocalDateTime.parse(map.get("lastUpdate").toString()));
        }
        if (map.get("createdAt") != null) {
            dto.setCreatedAt(LocalDateTime.parse(map.get("createdAt").toString()));
        }
        
        // Convertir lista de coordenadas
        List<Map<String, Object>> coordinatesList = (List<Map<String, Object>>) map.get("coordinates");
        if (coordinatesList != null) {
            List<CoordinateDTO> coordinates = new ArrayList<>();
            for (Map<String, Object> coordMap : coordinatesList) {
                coordinates.add(CoordinateDTO.fromMap(coordMap));
            }
            dto.setCoordinates(coordinates);
        } else {
            dto.setCoordinates(new ArrayList<>());
        }
        
        return dto;
    }
}
```

## 6. Servicio de Firebase

### FirebaseDriverRouteService.java

```java
package com.sipe.driver.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.sipe.driver.dto.CoordinateDTO;
import com.sipe.driver.dto.DriverRouteDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FirebaseDriverRouteService {

    private static final String COLLECTION_NAME = "driver_routes";
    
    private final Firestore firestore;

    /**
     * Inicializa o actualiza la ruta del conductor en Firebase
     */
    public DriverRouteDTO initializeDriverRoute(String driverId, String driverName) {
        try {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(driverId);
            DocumentSnapshot document = docRef.get().get();

            Map<String, Object> data = new HashMap<>();
            data.put("driverId", driverId);
            data.put("driverName", driverName);
            data.put("isActive", true);
            data.put("lastUpdate", LocalDateTime.now().toString());
            
            if (!document.exists()) {
                // Crear nuevo documento
                data.put("createdAt", LocalDateTime.now().toString());
                data.put("coordinates", new ArrayList<>());
                docRef.set(data).get();
                log.info("✅ Created new driver route for driver: {}", driverId);
            } else {
                // Actualizar documento existente
                docRef.update(data).get();
                log.info("✅ Updated driver route for driver: {}", driverId);
            }

            return getDriverRoute(driverId);
        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Error initializing driver route: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize driver route", e);
        }
    }

    /**
     * Agrega una coordenada a la ruta del conductor
     */
    public DriverRouteDTO addCoordinate(String driverId, CoordinateDTO coordinateDTO) {
        try {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(driverId);
            DocumentSnapshot document = docRef.get().get();

            if (!document.exists()) {
                throw new RuntimeException("Driver route not found for driver: " + driverId);
            }

            // Obtener coordenadas existentes
            List<Map<String, Object>> coordinates = 
                (List<Map<String, Object>>) document.get("coordinates");
            if (coordinates == null) {
                coordinates = new ArrayList<>();
            }

            // Agregar nueva coordenada
            Map<String, Object> newCoordinate = coordinateDTO.toMap();
            if (newCoordinate.get("timestamp") == null) {
                newCoordinate.put("timestamp", LocalDateTime.now().toString());
            }
            coordinates.add(newCoordinate);

            // Actualizar documento
            Map<String, Object> updates = new HashMap<>();
            updates.put("coordinates", coordinates);
            updates.put("lastUpdate", LocalDateTime.now().toString());

            docRef.update(updates).get();
            log.info("✅ Added coordinate to driver route: {}", driverId);

            return getDriverRoute(driverId);
        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Error adding coordinate: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to add coordinate", e);
        }
    }

    /**
     * Obtiene la ruta del conductor
     */
    public DriverRouteDTO getDriverRoute(String driverId) {
        try {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(driverId);
            DocumentSnapshot document = docRef.get().get();

            if (!document.exists()) {
                throw new RuntimeException("Driver route not found for driver: " + driverId);
            }

            return DriverRouteDTO.fromMap(driverId, document.getData());
        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Error getting driver route: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get driver route", e);
        }
    }

    /**
     * Limpia las coordenadas de la ruta del conductor
     */
    public DriverRouteDTO clearRoute(String driverId) {
        try {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(driverId);
            DocumentSnapshot document = docRef.get().get();

            if (!document.exists()) {
                throw new RuntimeException("Driver route not found for driver: " + driverId);
            }

            Map<String, Object> updates = new HashMap<>();
            updates.put("coordinates", new ArrayList<>());
            updates.put("lastUpdate", LocalDateTime.now().toString());

            docRef.update(updates).get();
            log.info("✅ Cleared route for driver: {}", driverId);

            return getDriverRoute(driverId);
        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Error clearing route: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to clear route", e);
        }
    }

    /**
     * Marca el conductor como inactivo
     */
    public DriverRouteDTO setDriverInactive(String driverId) {
        try {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(driverId);
            DocumentSnapshot document = docRef.get().get();

            if (!document.exists()) {
                throw new RuntimeException("Driver route not found for driver: " + driverId);
            }

            Map<String, Object> updates = new HashMap<>();
            updates.put("isActive", false);
            updates.put("lastUpdate", LocalDateTime.now().toString());

            docRef.update(updates).get();
            log.info("✅ Set driver as inactive: {}", driverId);

            return getDriverRoute(driverId);
        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Error setting driver inactive: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to set driver inactive", e);
        }
    }

    /**
     * Marca el conductor como activo
     */
    public DriverRouteDTO setDriverActive(String driverId) {
        try {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(driverId);
            DocumentSnapshot document = docRef.get().get();

            if (!document.exists()) {
                throw new RuntimeException("Driver route not found for driver: " + driverId);
            }

            Map<String, Object> updates = new HashMap<>();
            updates.put("isActive", true);
            updates.put("lastUpdate", LocalDateTime.now().toString());

            docRef.update(updates).get();
            log.info("✅ Set driver as active: {}", driverId);

            return getDriverRoute(driverId);
        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Error setting driver active: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to set driver active", e);
        }
    }

    /**
     * Obtiene todas las rutas activas
     */
    public List<DriverRouteDTO> getActiveRoutes() {
        try {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("isActive", true)
                    .get();

            QuerySnapshot querySnapshot = future.get();
            List<DriverRouteDTO> routes = new ArrayList<>();

            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                routes.add(DriverRouteDTO.fromMap(document.getId(), document.getData()));
            }

            log.info("✅ Retrieved {} active routes", routes.size());
            return routes;
        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Error getting active routes: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get active routes", e);
        }
    }

    /**
     * Escucha cambios en tiempo real (opcional)
     */
    public void listenToDriverRoute(String driverId, 
                                     EventListener<DocumentSnapshot> listener) {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(driverId);
        docRef.addSnapshotListener(listener);
    }
}
```

## 7. Controller

### FirebaseDriverRouteController.java

```java
package com.sipe.driver.controller;

import com.sipe.driver.dto.AddCoordinateRequest;
import com.sipe.driver.dto.CoordinateDTO;
import com.sipe.driver.dto.DriverRouteDTO;
import com.sipe.driver.service.FirebaseDriverRouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/firebase/driver-routes")
@RequiredArgsConstructor
public class FirebaseDriverRouteController {
    
    private final FirebaseDriverRouteService firebaseDriverRouteService;
    
    /**
     * POST /api/firebase/driver-routes/initialize
     * Inicializa o actualiza la ruta del conductor
     */
    @PostMapping("/initialize")
    public ResponseEntity<DriverRouteDTO> initializeRoute(
            @RequestParam String driverId,
            @RequestParam String driverName) {
        DriverRouteDTO route = firebaseDriverRouteService.initializeDriverRoute(driverId, driverName);
        return ResponseEntity.status(HttpStatus.CREATED).body(route);
    }
    
    /**
     * POST /api/firebase/driver-routes/coordinates
     * Agrega una coordenada a la ruta del conductor
     */
    @PostMapping("/coordinates")
    public ResponseEntity<DriverRouteDTO> addCoordinate(
            @Valid @RequestBody AddCoordinateRequest request) {
        DriverRouteDTO route = firebaseDriverRouteService.addCoordinate(
            request.getDriverId(), 
            request.getCoordinate()
        );
        return ResponseEntity.ok(route);
    }
    
    /**
     * GET /api/firebase/driver-routes/{driverId}
     * Obtiene la ruta del conductor
     */
    @GetMapping("/{driverId}")
    public ResponseEntity<DriverRouteDTO> getDriverRoute(@PathVariable String driverId) {
        DriverRouteDTO route = firebaseDriverRouteService.getDriverRoute(driverId);
        return ResponseEntity.ok(route);
    }
    
    /**
     * DELETE /api/firebase/driver-routes/{driverId}/coordinates
     * Limpia las coordenadas de la ruta del conductor
     */
    @DeleteMapping("/{driverId}/coordinates")
    public ResponseEntity<DriverRouteDTO> clearRoute(@PathVariable String driverId) {
        DriverRouteDTO route = firebaseDriverRouteService.clearRoute(driverId);
        return ResponseEntity.ok(route);
    }
    
    /**
     * PUT /api/firebase/driver-routes/{driverId}/inactive
     * Marca el conductor como inactivo
     */
    @PutMapping("/{driverId}/inactive")
    public ResponseEntity<DriverRouteDTO> setDriverInactive(@PathVariable String driverId) {
        DriverRouteDTO route = firebaseDriverRouteService.setDriverInactive(driverId);
        return ResponseEntity.ok(route);
    }
    
    /**
     * PUT /api/firebase/driver-routes/{driverId}/active
     * Marca el conductor como activo
     */
    @PutMapping("/{driverId}/active")
    public ResponseEntity<DriverRouteDTO> setDriverActive(@PathVariable String driverId) {
        DriverRouteDTO route = firebaseDriverRouteService.setDriverActive(driverId);
        return ResponseEntity.ok(route);
    }
    
    /**
     * GET /api/firebase/driver-routes/active
     * Obtiene todas las rutas activas
     */
    @GetMapping("/active")
    public ResponseEntity<List<DriverRouteDTO>> getActiveRoutes() {
        List<DriverRouteDTO> routes = firebaseDriverRouteService.getActiveRoutes();
        return ResponseEntity.ok(routes);
    }
}
```

## 8. Manejo de Errores Global

### GlobalExceptionHandler.java

```java
package com.sipe.driver.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException e) {
        log.error("Runtime exception: {}", e.getMessage(), e);
        
        Map<String, Object> error = new HashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        error.put("error", "Internal Server Error");
        error.put("message", e.getMessage());
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        log.error("Unexpected exception: {}", e.getMessage(), e);
        
        Map<String, Object> error = new HashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        error.put("error", "Internal Server Error");
        error.put("message", "An unexpected error occurred");
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

## 9. Configuración de Seguridad (Opcional)

Si quieres agregar autenticación JWT:

### SecurityConfig.java

```java
package com.sipe.driver.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/firebase/driver-routes/**").permitAll() // Temporalmente permitido
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
}
```

## 10. Ejemplos de Uso

### Inicializar ruta
```bash
POST http://localhost:8080/api/firebase/driver-routes/initialize?driverId=1&driverName=Antonio
```

### Agregar coordenada
```bash
POST http://localhost:8080/api/firebase/driver-routes/coordinates
Content-Type: application/json

{
  "driverId": "1",
  "coordinate": {
    "latitude": 19.4326,
    "longitude": -99.1332,
    "timestamp": "2024-01-15T10:30:00",
    "accuracy": 10.0
  }
}
```

### Obtener ruta
```bash
GET http://localhost:8080/api/firebase/driver-routes/1
```

## 11. Notas Importantes

1. **Credenciales**: Nunca subas el archivo JSON de credenciales a Git
2. **Permisos**: Asegúrate de que la cuenta de servicio tenga permisos de Firestore
3. **Conexión**: Firebase Admin SDK se conecta directamente a Firestore sin necesidad de autenticación de usuario
4. **Rendimiento**: Considera usar conexiones persistentes y pooling para mejor rendimiento
5. **Errores**: Implementa retry logic para operaciones críticas

## 12. Estructura del Proyecto Final

```
src/
├── main/
│   ├── java/
│   │   └── com/
│   │       └── sipe/
│   │           └── driver/
│   │               ├── DriverTrackerApplication.java
│   │               ├── config/
│   │               │   ├── FirebaseConfig.java
│   │               │   └── SecurityConfig.java
│   │               ├── controller/
│   │               │   └── FirebaseDriverRouteController.java
│   │               ├── service/
│   │               │   └── FirebaseDriverRouteService.java
│   │               ├── dto/
│   │               │   ├── CoordinateDTO.java
│   │               │   ├── DriverRouteDTO.java
│   │               │   └── AddCoordinateRequest.java
│   │               └── exception/
│   │                   └── GlobalExceptionHandler.java
│   └── resources/
│       ├── application.properties
│       └── firebase-service-account.json (NO SUBIR A GIT)
```

## 13. Variables de Entorno (Alternativa)

Si prefieres usar variables de entorno en lugar del archivo JSON:

```properties
# application.properties
firebase.credentials.type=service_account
firebase.credentials.project_id=${FIREBASE_PROJECT_ID}
firebase.credentials.private_key_id=${FIREBASE_PRIVATE_KEY_ID}
firebase.credentials.private_key=${FIREBASE_PRIVATE_KEY}
firebase.credentials.client_email=${FIREBASE_CLIENT_EMAIL}
firebase.credentials.client_id=${FIREBASE_CLIENT_ID}
```

Y modifica `FirebaseConfig.java` para construir las credenciales desde variables de entorno.



