# Spring Boot - Endpoints para Rutas de Conductores

Este documento muestra cómo crear endpoints en Spring Boot para gestionar las rutas de los conductores.

## Estructura del Proyecto Spring Boot

```
src/
├── main/
│   ├── java/
│   │   └── com/
│   │       └── sipe/
│   │           └── driver/
│   │               ├── DriverTrackerApplication.java
│   │               ├── controller/
│   │               │   └── DriverRouteController.java
│   │               ├── service/
│   │               │   └── DriverRouteService.java
│   │               ├── repository/
│   │               │   └── DriverRouteRepository.java
│   │               ├── model/
│   │               │   ├── DriverRoute.java
│   │               │   └── Coordinate.java
│   │               └── dto/
│   │                   ├── CoordinateDTO.java
│   │                   ├── DriverRouteDTO.java
│   │                   └── AddCoordinateRequest.java
│   └── resources/
│       └── application.properties
```

## 1. Dependencias (pom.xml)

```xml
<dependencies>
    <!-- Spring Boot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- MySQL Driver (o PostgreSQL, según tu BD) -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Lombok (opcional, para reducir boilerplate) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

## 2. Modelos (Entities)

### Coordinate.java
```java
package com.sipe.driver.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "coordinates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Coordinate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Double latitude;
    
    @Column(nullable = false)
    private Double longitude;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    private Double accuracy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_route_id", nullable = false)
    private DriverRoute driverRoute;
}
```

### DriverRoute.java
```java
package com.sipe.driver.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "driver_routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverRoute {
    
    @Id
    @Column(name = "driver_id")
    private String driverId; // Usa el ID del usuario del login
    
    @Column(nullable = false)
    private String driverName;
    
    @OneToMany(mappedBy = "driverRoute", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Coordinate> coordinates = new ArrayList<>();
    
    @Column(nullable = false)
    private LocalDateTime lastUpdate;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastUpdate = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastUpdate = LocalDateTime.now();
    }
}
```

## 3. DTOs (Data Transfer Objects)

### CoordinateDTO.java
```java
package com.sipe.driver.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoordinateDTO {
    
    @NotNull(message = "Latitude is required")
    private Double latitude;
    
    @NotNull(message = "Longitude is required")
    private Double longitude;
    
    private LocalDateTime timestamp;
    
    private Double accuracy;
}
```

### DriverRouteDTO.java
```java
package com.sipe.driver.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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
}
```

### AddCoordinateRequest.java
```java
package com.sipe.driver.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddCoordinateRequest {
    
    @NotBlank(message = "Driver ID is required")
    private String driverId;
    
    @NotNull(message = "Coordinate is required")
    @Valid
    private CoordinateDTO coordinate;
}
```

## 4. Repository

### DriverRouteRepository.java
```java
package com.sipe.driver.repository;

import com.sipe.driver.model.DriverRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRouteRepository extends JpaRepository<DriverRoute, String> {
    
    Optional<DriverRoute> findByDriverId(String driverId);
    
    List<DriverRoute> findByIsActiveTrue();
    
    @Query("SELECT dr FROM DriverRoute dr WHERE dr.driverId = :driverId AND dr.isActive = true")
    Optional<DriverRoute> findActiveRouteByDriverId(@Param("driverId") String driverId);
    
    @Query("SELECT dr FROM DriverRoute dr WHERE dr.lastUpdate >= :since")
    List<DriverRoute> findRoutesUpdatedSince(@Param("since") LocalDateTime since);
}
```

## 5. Service

### DriverRouteService.java
```java
package com.sipe.driver.service;

import com.sipe.driver.dto.CoordinateDTO;
import com.sipe.driver.dto.DriverRouteDTO;
import com.sipe.driver.model.Coordinate;
import com.sipe.driver.model.DriverRoute;
import com.sipe.driver.repository.DriverRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverRouteService {
    
    private final DriverRouteRepository driverRouteRepository;
    
    /**
     * Inicializa o actualiza la ruta del conductor
     */
    @Transactional
    public DriverRouteDTO initializeDriverRoute(String driverId, String driverName) {
        DriverRoute route = driverRouteRepository.findByDriverId(driverId)
            .orElseGet(() -> {
                DriverRoute newRoute = new DriverRoute();
                newRoute.setDriverId(driverId);
                newRoute.setDriverName(driverName);
                newRoute.setCoordinates(new ArrayList<>());
                newRoute.setIsActive(true);
                return newRoute;
            });
        
        route.setDriverName(driverName);
        route.setLastUpdate(LocalDateTime.now());
        route.setIsActive(true);
        
        DriverRoute saved = driverRouteRepository.save(route);
        return mapToDTO(saved);
    }
    
    /**
     * Agrega una coordenada a la ruta del conductor
     */
    @Transactional
    public DriverRouteDTO addCoordinate(String driverId, CoordinateDTO coordinateDTO) {
        DriverRoute route = driverRouteRepository.findByDriverId(driverId)
            .orElseThrow(() -> new RuntimeException("Driver route not found for driver: " + driverId));
        
        Coordinate coordinate = new Coordinate();
        coordinate.setLatitude(coordinateDTO.getLatitude());
        coordinate.setLongitude(coordinateDTO.getLongitude());
        coordinate.setTimestamp(coordinateDTO.getTimestamp() != null 
            ? coordinateDTO.getTimestamp() 
            : LocalDateTime.now());
        coordinate.setAccuracy(coordinateDTO.getAccuracy());
        coordinate.setDriverRoute(route);
        
        route.getCoordinates().add(coordinate);
        route.setLastUpdate(LocalDateTime.now());
        
        DriverRoute saved = driverRouteRepository.save(route);
        return mapToDTO(saved);
    }
    
    /**
     * Obtiene la ruta del conductor
     */
    public DriverRouteDTO getDriverRoute(String driverId) {
        DriverRoute route = driverRouteRepository.findByDriverId(driverId)
            .orElseThrow(() -> new RuntimeException("Driver route not found for driver: " + driverId));
        
        return mapToDTO(route);
    }
    
    /**
     * Limpia las coordenadas de la ruta del conductor
     */
    @Transactional
    public DriverRouteDTO clearRoute(String driverId) {
        DriverRoute route = driverRouteRepository.findByDriverId(driverId)
            .orElseThrow(() -> new RuntimeException("Driver route not found for driver: " + driverId));
        
        route.getCoordinates().clear();
        route.setLastUpdate(LocalDateTime.now());
        
        DriverRoute saved = driverRouteRepository.save(route);
        return mapToDTO(saved);
    }
    
    /**
     * Marca el conductor como inactivo
     */
    @Transactional
    public DriverRouteDTO setDriverInactive(String driverId) {
        DriverRoute route = driverRouteRepository.findByDriverId(driverId)
            .orElseThrow(() -> new RuntimeException("Driver route not found for driver: " + driverId));
        
        route.setIsActive(false);
        route.setLastUpdate(LocalDateTime.now());
        
        DriverRoute saved = driverRouteRepository.save(route);
        return mapToDTO(saved);
    }
    
    /**
     * Marca el conductor como activo
     */
    @Transactional
    public DriverRouteDTO setDriverActive(String driverId) {
        DriverRoute route = driverRouteRepository.findByDriverId(driverId)
            .orElseThrow(() -> new RuntimeException("Driver route not found for driver: " + driverId));
        
        route.setIsActive(true);
        route.setLastUpdate(LocalDateTime.now());
        
        DriverRoute saved = driverRouteRepository.save(route);
        return mapToDTO(saved);
    }
    
    /**
     * Obtiene todas las rutas activas
     */
    public List<DriverRouteDTO> getActiveRoutes() {
        return driverRouteRepository.findByIsActiveTrue()
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
    
    // Mapeo de Entity a DTO
    private DriverRouteDTO mapToDTO(DriverRoute route) {
        DriverRouteDTO dto = new DriverRouteDTO();
        dto.setDriverId(route.getDriverId());
        dto.setDriverName(route.getDriverName());
        dto.setCoordinates(route.getCoordinates().stream()
            .map(this::mapCoordinateToDTO)
            .collect(Collectors.toList()));
        dto.setLastUpdate(route.getLastUpdate());
        dto.setCreatedAt(route.getCreatedAt());
        dto.setIsActive(route.getIsActive());
        return dto;
    }
    
    private CoordinateDTO mapCoordinateToDTO(Coordinate coordinate) {
        CoordinateDTO dto = new CoordinateDTO();
        dto.setLatitude(coordinate.getLatitude());
        dto.setLongitude(coordinate.getLongitude());
        dto.setTimestamp(coordinate.getTimestamp());
        dto.setAccuracy(coordinate.getAccuracy());
        return dto;
    }
}
```

## 6. Controller

### DriverRouteController.java
```java
package com.sipe.driver.controller;

import com.sipe.driver.dto.AddCoordinateRequest;
import com.sipe.driver.dto.CoordinateDTO;
import com.sipe.driver.dto.DriverRouteDTO;
import com.sipe.driver.service.DriverRouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/driver-routes")
@RequiredArgsConstructor
public class DriverRouteController {
    
    private final DriverRouteService driverRouteService;
    
    /**
     * POST /api/driver-routes/initialize
     * Inicializa o actualiza la ruta del conductor
     */
    @PostMapping("/initialize")
    public ResponseEntity<DriverRouteDTO> initializeRoute(
            @RequestParam String driverId,
            @RequestParam String driverName) {
        DriverRouteDTO route = driverRouteService.initializeDriverRoute(driverId, driverName);
        return ResponseEntity.status(HttpStatus.CREATED).body(route);
    }
    
    /**
     * POST /api/driver-routes/coordinates
     * Agrega una coordenada a la ruta del conductor
     */
    @PostMapping("/coordinates")
    public ResponseEntity<DriverRouteDTO> addCoordinate(
            @Valid @RequestBody AddCoordinateRequest request) {
        DriverRouteDTO route = driverRouteService.addCoordinate(
            request.getDriverId(), 
            request.getCoordinate()
        );
        return ResponseEntity.ok(route);
    }
    
    /**
     * GET /api/driver-routes/{driverId}
     * Obtiene la ruta del conductor
     */
    @GetMapping("/{driverId}")
    public ResponseEntity<DriverRouteDTO> getDriverRoute(@PathVariable String driverId) {
        DriverRouteDTO route = driverRouteService.getDriverRoute(driverId);
        return ResponseEntity.ok(route);
    }
    
    /**
     * DELETE /api/driver-routes/{driverId}/coordinates
     * Limpia las coordenadas de la ruta del conductor
     */
    @DeleteMapping("/{driverId}/coordinates")
    public ResponseEntity<DriverRouteDTO> clearRoute(@PathVariable String driverId) {
        DriverRouteDTO route = driverRouteService.clearRoute(driverId);
        return ResponseEntity.ok(route);
    }
    
    /**
     * PUT /api/driver-routes/{driverId}/inactive
     * Marca el conductor como inactivo
     */
    @PutMapping("/{driverId}/inactive")
    public ResponseEntity<DriverRouteDTO> setDriverInactive(@PathVariable String driverId) {
        DriverRouteDTO route = driverRouteService.setDriverInactive(driverId);
        return ResponseEntity.ok(route);
    }
    
    /**
     * PUT /api/driver-routes/{driverId}/active
     * Marca el conductor como activo
     */
    @PutMapping("/{driverId}/active")
    public ResponseEntity<DriverRouteDTO> setDriverActive(@PathVariable String driverId) {
        DriverRouteDTO route = driverRouteService.setDriverActive(driverId);
        return ResponseEntity.ok(route);
    }
    
    /**
     * GET /api/driver-routes/active
     * Obtiene todas las rutas activas
     */
    @GetMapping("/active")
    public ResponseEntity<List<DriverRouteDTO>> getActiveRoutes() {
        List<DriverRouteDTO> routes = driverRouteService.getActiveRoutes();
        return ResponseEntity.ok(routes);
    }
}
```

## 7. Configuración (application.properties)

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/driver_tracker?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=true

# Server Configuration
server.port=8080
spring.application.name=driver-tracker-api

# CORS Configuration (para permitir requests desde React Native)
spring.web.cors.allowed-origins=*
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
```

## 8. Configuración CORS (opcional)

### CorsConfig.java
```java
package com.sipe.driver.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {
    
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

## 9. Script SQL para crear las tablas

```sql
CREATE DATABASE IF NOT EXISTS driver_tracker;
USE driver_tracker;

CREATE TABLE IF NOT EXISTS driver_routes (
    driver_id VARCHAR(255) PRIMARY KEY,
    driver_name VARCHAR(255) NOT NULL,
    last_update DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS coordinates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    timestamp DATETIME NOT NULL,
    accuracy DOUBLE,
    driver_route_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (driver_route_id) REFERENCES driver_routes(driver_id) ON DELETE CASCADE,
    INDEX idx_driver_route (driver_route_id),
    INDEX idx_timestamp (timestamp)
);
```

## 10. Ejemplos de uso

### Inicializar ruta del conductor
```bash
POST http://localhost:8080/api/driver-routes/initialize?driverId=1&driverName=Antonio
```

### Agregar coordenada
```bash
POST http://localhost:8080/api/driver-routes/coordinates
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

### Obtener ruta del conductor
```bash
GET http://localhost:8080/api/driver-routes/1
```

### Limpiar ruta
```bash
DELETE http://localhost:8080/api/driver-routes/1/coordinates
```

### Marcar como inactivo
```bash
PUT http://localhost:8080/api/driver-routes/1/inactive
```

### Obtener todas las rutas activas
```bash
GET http://localhost:8080/api/driver-routes/active
```

## Notas importantes

1. **Autenticación**: Agrega autenticación JWT usando el token que recibes del login
2. **Validación**: Los DTOs ya incluyen validaciones básicas
3. **Manejo de errores**: Considera crear un `@ControllerAdvice` para manejo global de excepciones
4. **Paginación**: Para rutas con muchas coordenadas, considera agregar paginación
5. **Índices**: Los índices en la BD mejoran el rendimiento de las consultas

