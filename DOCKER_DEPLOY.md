# Docker Deployment Guide (mit Notifications)

## Schnellstart (komplette Lösung)

### 1. Firebase Cloud Function deployen (Einmalig, lokal)

```bash
# Token generieren:
TOKEN=$(openssl rand -hex 32)
echo "Dein Token: $TOKEN"

# In functions/.env speichern:
echo "CRON_SECRET=$TOKEN" > functions/.env

# Deployen:
firebase deploy --only functions

# URL notieren (erscheint nach Deploy):
# ✔ functions[checkSubscriptionsDaily(europe-west1)] https://...
```

### 2. Server vorbereiten

```bash
# Projekt klonen (falls noch nicht):
git clone https://github.com/mfrh89/moneyboy-pwa.git
cd moneyboy-pwa

# .env.docker erstellen (von Vorlage kopieren):
cp .env.docker.example .env.docker

# .env.docker bearbeiten:
nano .env.docker
```

**Trage ein:**
```bash
FUNCTION_URL=https://europe-west1-moneyboy-2f088.cloudfunctions.net/checkSubscriptionsDaily
CRON_TOKEN=dein-token-von-schritt-1
TZ=Europe/Berlin
```

### 3. Starten

```bash
docker-compose up -d
```

**Fertig!** 🚀

---

## Was läuft jetzt?

| Service | Port | Beschreibung |
|---------|------|--------------|
| `moneyboy` | 8085 | Die Web-App |
| `notifications-cron` | - | Cronjob Container (täglich 9 Uhr) |

---

## Logs ansehen

```bash
# App Logs:
docker-compose logs -f moneyboy

# Cronjob Logs:
docker-compose logs -f notifications-cron

# Beide zusammen:
docker-compose logs -f
```

---

## Cronjob manuell testen

```bash
# Container-Shell öffnen:
docker exec -it moneyboy-notifications sh

# Manuell ausführen:
curl -X POST "$FUNCTION_URL?token=$CRON_TOKEN"

# Exit:
exit
```

Oder direkt von außen:
```bash
docker-compose exec notifications-cron curl -X POST "$FUNCTION_URL?token=$CRON_TOKEN"
```

---

## Update auf neuen Server

### Variante A: Mit Git

```bash
# Auf neuem Server:
git clone https://github.com/mfrh89/moneyboy-pwa.git
cd moneyboy-pwa

# .env.docker vom alten Server kopieren
# ODER neu erstellen (siehe Schritt 2 oben)

docker-compose up -d
```

### Variante B: Nur docker-compose.yml + .env

```bash
# Diese 2 Dateien auf neuen Server kopieren:
# - docker-compose.yml
# - .env.docker

# Dann:
docker-compose up -d
```

**Das war's!** Komplette Migration in 2 Minuten.

---

## Troubleshooting

### Cronjob läuft nicht

```bash
# Container Status prüfen:
docker-compose ps

# Wenn notifications-cron nicht läuft:
docker-compose logs notifications-cron

# Häufiger Fehler: .env.docker fehlt
ls -la .env.docker
```

### Falscher Zeitpunkt

```bash
# Zeitzone im Container prüfen:
docker exec moneyboy-notifications date

# Sollte Europe/Berlin Zeitzone zeigen
```

### Keine Notifications

```bash
# 1. Function manuell testen:
docker-compose exec notifications-cron curl -X POST "$FUNCTION_URL?token=$CRON_TOKEN"

# 2. Antwort sollte sein:
# {"success":true,"notificationsSent":0,"timestamp":"..."}

# 3. Firebase Logs:
firebase functions:log --only checkSubscriptionsDaily
```

### Unauthorized (401)

→ Token in `.env.docker` stimmt nicht mit `functions/.env` überein

---

## Port ändern

```bash
# In docker-compose.yml:
ports:
  - "DEIN_PORT:80"  # z.B. "3000:80"

# Neu starten:
docker-compose up -d
```

---

## Stoppen & Aufräumen

```bash
# Stoppen (Daten bleiben):
docker-compose down

# Stoppen + Images löschen:
docker-compose down --rmi all

# Alles löschen inkl. Volumes:
docker-compose down -v
```

---

## Automatisches Update (Optional)

Erstelle `/etc/cron.daily/moneyboy-update`:

```bash
#!/bin/bash
cd /pfad/zu/moneyboy-pwa
docker-compose pull
docker-compose up -d
```

```bash
chmod +x /etc/cron.daily/moneyboy-update
```

Jetzt pullt der Server täglich das neueste Image von Docker Hub.

---

## Sicherheit

### .env.docker schützen

```bash
# Nur Owner kann lesen:
chmod 600 .env.docker

# Nicht in Git committen:
echo ".env.docker" >> .gitignore
```

### Token rotieren

```bash
# Neues Token generieren:
NEW_TOKEN=$(openssl rand -hex 32)

# In functions/.env ändern:
echo "CRON_SECRET=$NEW_TOKEN" > functions/.env

# Function neu deployen:
firebase deploy --only functions

# In .env.docker ändern:
nano .env.docker  # CRON_TOKEN aktualisieren

# Container neu starten:
docker-compose up -d
```

---

## Monitoring (Optional)

### Healthcheck hinzufügen

In `docker-compose.yml` unter `notifications-cron`:

```yaml
healthcheck:
  test: ["CMD", "pgrep", "crond"]
  interval: 1m
  timeout: 10s
  retries: 3
```

### Uptime Monitoring

Nutze Services wie:
- **UptimeRobot** (kostenlos)
- **Healthchecks.io** (kostenlos)

Richte sie ein, um deine App-URL zu pingen.

---

## Quick Commands

```bash
# Alles starten:
docker-compose up -d

# Status:
docker-compose ps

# Logs:
docker-compose logs -f

# Neustart:
docker-compose restart

# Update:
docker-compose pull && docker-compose up -d

# Cronjob manuell triggern:
docker-compose exec notifications-cron curl -X POST "$FUNCTION_URL?token=$CRON_TOKEN"
```
