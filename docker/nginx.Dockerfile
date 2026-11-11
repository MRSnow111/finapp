# --- Сборка фронтенда ---
FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package.json .
RUN npm install
COPY frontend .
RUN npm run build

# --- Nginx со статикой ---
FROM nginx:1.27-alpine
COPY nginx/nginx.prod.conf /etc/nginx/nginx.conf
COPY --from=frontend-build /build/dist /usr/share/nginx/html
