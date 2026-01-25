# ===== STUFE 1: Bau der Anwendung =====
FROM node:18-alpine AS builder

# Arbeitsverzeichnis im Container setzen
WORKDIR /app

# package.json und package-lock.json kopieren und Abhängigkeiten installieren
# Dieser Schritt wird nur wiederholt, wenn sich diese Dateien ändern (Docker Cache)
COPY package*.json ./
RUN npm install

# Den gesamten restlichen Code kopieren
COPY . .

# Die Anwendung für die Produktion bauen
RUN npm run build

# ===== STUFE 2: Ausliefern der Anwendung mit Nginx =====
FROM nginx:stable-alpine

# Kopiere nur die gebauten Dateien aus der "builder"-Stufe
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiere unsere eigene Nginx-Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Den Port 80 des Containers nach außen freigeben
EXPOSE 80

# Kommando zum Starten von Nginx im Vordergrund
CMD ["nginx", "-g", "daemon off;"]
