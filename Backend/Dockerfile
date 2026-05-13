# ============================================
# Stage 1: Build — Compila el proyecto con Maven
# ============================================
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copiar archivos de configuración de Maven primero (cacheo de dependencias)
COPY pom.xml .

# Descargar dependencias (se cachean si no cambian pom.xml)
RUN mvn dependency:go-offline -B

# Copiar el código fuente
COPY src/ src/

# Compilar el JAR sin ejecutar tests
RUN mvn package -DskipTests -B

# ============================================
# Stage 2: Runtime — Imagen final ultra-ligera
# ============================================
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar el JAR compilado desde la etapa de build
COPY --from=build /app/target/*.jar app.jar

# Cambiar al usuario no-root
USER appuser

# Exponer el puerto de la aplicación
EXPOSE 8090

# Configurar opciones de JVM para entorno de 4GB RAM
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Ejecutar la aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
