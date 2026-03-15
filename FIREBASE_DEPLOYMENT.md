# Firebase Cloud Functions & Firestore Rules Deployment

## Vorbereitung (einmalig)

### 1. Firebase CLI Login

```bash
# Falls noch nicht eingeloggt:
firebase login

# Projekt verifizieren:
firebase projects:list
```

### 2. Projekt auswählen

```bash
firebase use moneyboy-2f088
```

### 3. Dependencies installieren

```bash
cd functions
npm install
cd ..
```

## Deployment

### Option A: Alles deployen (Functions + Rules)

```bash
firebase deploy
```

### Option B: Nur Functions deployen

```bash
firebase deploy --only functions
```

### Option C: Nur Firestore Rules deployen

```bash
firebase deploy --only firestore:rules
```

## Was macht die Cloud Function?

**Name:** `checkSubscriptionsDaily`

**Zeitplan:** Täglich um 9:00 Uhr (Europe/Berlin)

**Funktion:**
1. Durchsucht alle User-Accounts
2. Findet Abos mit `subscriptionNextBilling` oder `subscriptionCancellationDeadline` in den nächsten 2 Tagen
3. Sendet Push-Notification an die FCM-Tokens des Users
4. Löscht ungültige Tokens automatisch

**Notification-Format:**
- **Titel:** "⚠️ Kündigungsfrist läuft ab!" oder "💳 Abo-Verlängerung"
- **Body:** "[Abo-Name] muss [heute/morgen/in X Tagen] gekündigt werden"
- **Bei mehreren Abos:** "+ X weitere" wird angehängt

## Firestore Rules Änderungen

Erweitert die Security Rules um:

```javascript
match /fcmTokens/{tokenId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**Erlaubt:**
- User kann seine eigenen FCM Tokens speichern und lesen
- Andere User haben keinen Zugriff

## Kosten

**Cloud Functions:**
- Scheduled Functions: 2M Aufrufe/Monat im Free Tier
- Täglicher Run = 30 Aufrufe/Monat → **Kostenlos**

**Firestore:**
- Reads/Writes im Free Tier: 50k/Tag
- Bei 100 Usern mit je 10 Abos = 1.000 Reads/Tag → **Kostenlos**

**Cloud Messaging:**
- Unbegrenzt kostenlos

## Logs ansehen

```bash
# Letzte Logs anzeigen:
firebase functions:log

# Live-Logs:
firebase functions:log --only checkSubscriptionsDaily
```

## Testing

### Lokaler Emulator (optional)

```bash
firebase emulators:start --only functions
```

### Manuelle Trigger (Testing)

Du kannst die Function manuell triggern in der Firebase Console:
1. Functions → checkSubscriptionsDaily
2. Tab "Logs"
3. Button "Test function"

## Troubleshooting

### "Billing account required"

Scheduled Functions brauchen den **Blaze Plan** (Pay-as-you-go).
- Keine Sorge: Mit geringer Nutzung bleibt es kostenlos
- Kreditkarte erforderlich, aber nur Abrechnung bei Überschreitung der Free Tier Limits

**Upgrade:**
```bash
# In Firebase Console:
# Project Settings → Usage and billing → Modify plan → Blaze
```

### "Permission denied" beim Deploy

```bash
# Neu einloggen:
firebase logout
firebase login

# Projektrechte prüfen in Firebase Console → Project Settings → Users and permissions
```

### Function startet nicht automatisch

**Schedule prüfen:**
```bash
# In Firebase Console:
# Functions → checkSubscriptionsDaily → Details
# Sollte "Schedule: 0 9 * * *" zeigen
```

## Nach dem Deployment

✅ **Firestore Rules:** Sofort aktiv  
✅ **Cloud Function:** Läuft ab dem nächsten Tag um 9:00 Uhr  

**Testen:**
1. In der App: Settings → Push-Benachrichtigungen aktivieren
2. Abo erstellen mit Datum "übermorgen"
3. Warten bis 9:00 Uhr nächsten Tag ODER manuell triggern in Console

---

## Quick Commands

```bash
# Alles auf einmal:
cd functions && npm install && cd .. && firebase deploy

# Nur Rules (schnell):
firebase deploy --only firestore:rules

# Function-Logs live:
firebase functions:log --only checkSubscriptionsDaily
```
