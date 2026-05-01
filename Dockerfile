FROM node:20-alpine AS builder
WORKDIR /app

# Declaración de variables de entorno (args) al momento de hacer build
ARG MAPBOX_ACCESS_TOKEN
ARG API_BASE_URL
ARG PWA_APP_NAME
ARG PWA_SHORT_NAME
ARG PWA_THEME_COLOR
ARG PWA_BACKGROUND_COLOR

# Las mapeamos a ENV para que el script generate-config.js las detecte
ENV MAPBOX_ACCESS_TOKEN=$MAPBOX_ACCESS_TOKEN
ENV API_BASE_URL=$API_BASE_URL
ENV PWA_APP_NAME=$PWA_APP_NAME
ENV PWA_SHORT_NAME=$PWA_SHORT_NAME
ENV PWA_THEME_COLOR=$PWA_THEME_COLOR
ENV PWA_BACKGROUND_COLOR=$PWA_BACKGROUND_COLOR

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Servidor Nginx interno (para contener y servir la SPA)
FROM nginx:alpine
# Copia los archivos estáticos generados por Angular
COPY --from=builder /app/dist/bills-tracker/browser /usr/share/nginx/html
# Copia la configuración que asegura el correcto enrutamiento SPA
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
