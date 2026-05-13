# ============================================
# Stage 1: Build — Compila la app React/Vite
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias primero (cacheo)
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Construir la app para producción
RUN npm run build

# ============================================
# Stage 2: Runtime — Servir con Nginx
# ============================================
FROM nginx:alpine AS runtime

# Copiar los archivos estáticos compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
