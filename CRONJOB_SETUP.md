# Server Cronjob Setup (Ohne Blaze Plan!)

## Übersicht

Statt Firebase Scheduled Functions (Blaze Plan) nutzen wir:
1. **HTTP Cloud Function** (kostenlos im Firebase Free Tier)
2. **Cronjob auf deinem Server** (ruft die Function täglich auf)

---

## Schritt 1: HTTP Function deployen

### 1.1 Secret Token festlegen

Erstelle eine `.env` Datei im `functions/` Verzeichnis:

```bash
cd functions
echo "CRON_SECRET=dein-sehr-geheimer-token-hier-12345" > .env
```

**Wichtig:** Ändere `dein-sehr-geheimer-token-hier-12345` zu einem zufälligen String!

### 1.2 Function deployen

```bash
# Im Projekt-Root:
firebase deploy --only functions

# Oder nur Firestore Rules (falls noch nicht):
firebase deploy --only firestore:rules
```

### 1.3 Function URL notieren

Nach dem Deploy siehst du:
```
✔ functions[checkSubscriptionsDaily(europe-west1)] https://europe-west1-moneyboy-2f088.cloudfunctions.net/checkSubscriptionsDaily
```

**Speichere diese URL!**

---

## Schritt 2: Cronjob auf deinem Server einrichten

### Option A: Linux Server mit crontab

```bash
# Crontab öffnen:
crontab -e

# Folgende Zeile hinzufügen (täglich um 9:00 Uhr):
0 9 * * * curl -X POST "https://europe-west1-moneyboy-2f088.cloudfunctions.net/checkSubscriptionsDaily?token=dein-sehr-geheimer-token-hier-12345" >> /var/log/moneyboy-notifications.log 2>&1
```

**Ersetze:**
- Die URL mit deiner Function URL
- `dein-sehr-geheimer-token-hier-12345` mit deinem Token aus `.env`

### Option B: Docker Container mit Cronjob

Erweitere deine `docker-compose.yml`:

```yaml
version: '3.8'
services:
  moneyboy:
    image: mfrh/moneyboy:latest
    ports:
      - "80:80"
  
  # Neuer Cron-Service:
  cronjob:
    image: alpine:latest
    command: >
      sh -c "echo '0 9 * * * wget -q -O- \"https://europe-west1-moneyboy-2f088.cloudfunctions.net/checkSubscriptionsDaily?token=dein-sehr-geheimer-token-hier-12345\"' | crontab - && crond -f -l 2"
    restart: unless-stopped
```

Dann:
```bash
docker-compose up -d
```

### Option C: Systemd Timer (Modern Linux)

Erstelle `/etc/systemd/system/moneyboy-notifications.service`:

```ini
[Unit]
Description=Moneyboy Subscription Notifications Check

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -X POST "https://europe-west1-moneyboy-2f088.cloudfunctions.net/checkSubscriptionsDaily?token=dein-sehr-geheimer-token-hier-12345"
```

Erstelle `/etc/systemd/system/moneyboy-notifications.timer`:

```ini
[Unit]
Description=Daily Moneyboy Subscription Check
Requires=moneyboy-notifications.service

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 09:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Aktivieren:
```bash
sudo systemctl enable moneyboy-notifications.timer
sudo systemctl start moneyboy-notifications.timer
```

---

## Schritt 3: Testen

### Manueller Test:

```bash
curl -X POST "https://europe-west1-moneyboy-2f088.cloudfunctions.net/checkSubscriptionsDaily?token=dein-sehr-geheimer-token-hier-12345"
```

**Erwartete Antwort:**
```json
{
  "success": true,
  "notificationsSent": 0,
  "timestamp": "2026-03-15T10:30:00.000Z"
}
```

### Cronjob testen:

```bash
# Logs ansehen (crontab):
tail -f /var/log/moneyboy-notifications.log

# Logs ansehen (systemd):
journalctl -u moneyboy-notifications.service -f

# Firebase Function Logs:
firebase functions:log --only checkSubscriptionsDaily
```

---

## Sicherheit

### Token-Schutz:

1. ✅ Verwende ein langes, zufälliges Token
2. ✅ Speichere Token nur auf deinem Server + Firebase .env
3. ✅ Teile das Token niemals öffentlich

### Generiere sicheres Token:

```bash
# Linux/Mac:
openssl rand -hex 32

# Oder:
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1
```

---

## Kosten-Übersicht

| Service | Plan | Kosten |
|---------|------|--------|
| Firebase HTTP Functions | Free Tier | **0€** (2M Aufrufe/Monat) |
| Firestore | Free Tier | **0€** (50k Reads/Tag) |
| Cloud Messaging | Unbegrenzt | **0€** |
| Dein Server Cron | - | **0€** (läuft eh schon) |

**Total:** 0€/Monat

---

## Troubleshooting

### "Unauthorized" bei Aufruf
→ Token falsch oder nicht gesetzt. Prüfe `.env` und URL.

### Function wird nicht gefunden
→ Noch nicht deployed: `firebase deploy --only functions`

### Keine Notifications
→ Prüfe:
1. Sind Abos mit Datum in 1-2 Tagen vorhanden?
2. Hat User Push-Notifications aktiviert?
3. Firebase Logs: `firebase functions:log`

### Cronjob läuft nicht
```bash
# Crontab syntax prüfen:
crontab -l

# Cron Service Status:
sudo systemctl status cron  # Debian/Ubuntu
sudo systemctl status crond # CentOS/RHEL
```

---

## Alternative: Noch einfacher mit curl

Wenn du keinen dauerhaft laufenden Server hast, nutze einen **kostenlosen Cron-Service**:

### cron-job.org (kostenlos)

1. Registriere auf https://cron-job.org
2. "Create cronjob"
3. **Title:** Moneyboy Notifications
4. **URL:** `https://europe-west1-moneyboy-2f088.cloudfunctions.net/checkSubscriptionsDaily?token=DEIN_TOKEN`
5. **Schedule:** Every day at 9:00 AM
6. **Timezone:** Europe/Berlin
7. Save

**Fertig!** Der Service ruft täglich deine Function auf.

---

## Quick Start (TL;DR)

```bash
# 1. Token generieren:
TOKEN=$(openssl rand -hex 32)
echo "Token: $TOKEN"

# 2. In functions/.env speichern:
echo "CRON_SECRET=$TOKEN" > functions/.env

# 3. Deployen:
firebase deploy --only functions

# 4. Cronjob einrichten (wähle eine Option oben)

# 5. Testen:
curl -X POST "https://DEINE-URL/checkSubscriptionsDaily?token=$TOKEN"
```
