# --- Сборка фронтенда ---
FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package.json .
RUN npm install
COPY frontend .
RUN npm run build

# --- Финальный образ ---
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend/app ./app
COPY --from=frontend-build /build/dist /app/static

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
