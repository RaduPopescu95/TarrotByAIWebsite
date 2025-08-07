# Daily.co Recording Email System

Sistema automată pentru trimiterea email-urilor cu înregistrări de la Daily.co către clienți.

## 🔄 Fluxul complet

```mermaid
sequenceDiagram
    participant Client as Client
    participant Server as Server
    participant Daily as Daily.co
    participant Email as Email System
    participant Firebase as Firebase

    Client->>Server: Accesează /meeting?meetingCode=...
    Server->>Daily: Create room + enable recording
    Daily-->>Server: Room URL + Token
    Server->>Client: Redirect la Daily.co Prebuilt
    
    Note over Client,Daily: Video call în desfășurare
    
    Daily->>Daily: Recording se termină
    Daily->>Server: Webhook: recording.finished
    Server->>Firebase: Update recording status
    Server->>Email: Send recording email
    Email->>Client: Email cu link descărcare
```

## 📧 Sistemul de Email

### 1. API Endpoint pentru Email-uri
**File**: `pages/api/daily/send-recording-email.js`

```bash
POST /api/daily/send-recording-email
Content-Type: application/json

{
  "documentId": "4IWu3u6PWWhi5IVBpSYC",
  "recordingUrl": "https://daily.co/recordings/...",
  "roomName": "consultation-4IWu3u6PWWhi5IVBpSYC",
  "duration": 1800
}
```

**Funcționalități**:
- ✅ Găsește detaliile rezervării din Firebase
- ✅ Creează email HTML frumos cu brand-ing
- ✅ Trimite email către clientul rezervării
- ✅ Actualizează statusul în Firebase

### 2. Webhook Handler
**File**: `pages/api/daily/webhook.js`

**URL Webhook**: `https://yoursite.com/api/daily/webhook`

**Evenimente procesate**:
- `recording.finished` - Înregistrarea este gata
- `recording.error` - Eroare în înregistrare
- `room.exp` - Camera a expirat

### 3. Configurare în Daily.co
**File**: `pages/api/daily/create-room.js`

```javascript
{
  enable_recording: 'cloud',
  webhook: {
    url: 'https://yoursite.com/api/daily/webhook',
    events: ['recording.finished', 'recording.error', 'room.exp']
  }
}
```

## 🎨 Template Email

Email-ul include:
- **Header brand** cu gradient colorat
- **Detalii consultație** (dată, durată, tip)
- **Buton descărcare** prominent
- **Instrucțiuni** pas cu pas
- **Notificare securitate** și confidențialitate
- **Support contact** pentru ajutor

## 🧪 Testare

### Test Manual Email
```bash
POST /api/daily/test-recording-email
Content-Type: application/json

{
  "documentId": "4IWu3u6PWWhi5IVBpSYC"
}
```

### Test Webhook Local
```bash
POST /api/daily/webhook
Content-Type: application/json

{
  "type": "recording.finished",
  "room": {
    "name": "consultation-4IWu3u6PWWhi5IVBpSYC"
  },
  "recording": {
    "id": "rec_123",
    "download_url": "https://test-recording.mp4",
    "duration": 1800
  }
}
```

## ⚙️ Configurare Environment Variables

Asigură-te că ai următoarele variabile în `.env.local`:

```env
# Daily.co
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your_domain.daily.co
NEXT_PUBLIC_USE_DAILY_BY_DEFAULT=true

# Email (Gmail)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your_project.iam.gserviceaccount.com

# Site URL (for webhooks)
NEXT_PUBLIC_SITE_URL=https://www.cristinazurba.com
```

## 🔍 Logging și Debug

Toate API-urile folosesc logging detaliat:

```javascript
logWithDetails('INFO', 'Message', { data });
```

**Emoji-uri pentru loguri**:
- 🔵 INFO
- ✅ SUCCESS  
- ⚠️ WARNING
- ❌ ERROR
- 🔍 DEBUG

## 📊 Firebase Structure

```javascript
// RezervariConsultatii/{documentId}
{
  email: "client@example.com",
  nume: "Ion",
  prenume: "Popescu",
  categorie: {
    nume: "Consultație Tarot"
  },
  recording: {
    status: "ready",           // "ready" | "error" | "processing"
    dailyRecordingId: "rec_123",
    downloadUrl: "https://...",
    duration: 1800,
    readyAt: timestamp,
    emailSent: true,
    emailSentAt: timestamp,
    webhookProcessed: true
  }
}
```

## 🚀 Deploy și Configurare Webhook

### 1. Deploy la producție
```bash
npm run build
npm run start
```

### 2. Configurare webhook în Daily.co Dashboard
- URL: `https://yoursite.com/api/daily/webhook`
- Events: `recording.finished`, `recording.error`, `room.exp`

### 3. Test final
1. Creează o consultație test
2. Accesează link-ul Daily.co
3. Înregistrează câteva minute
4. Termină call-ul
5. Verifică că email-ul sosește automat

## 🛠️ Troubleshooting

### Email nu sosește
- Verifică `EMAIL_USER` și `EMAIL_PASS`
- Verifică spam folder
- Check logs pentru erori SMTP

### Webhook nu funcționează
- Verifică `NEXT_PUBLIC_SITE_URL` 
- Test webhook manual cu Postman
- Verifică că domenul este accesibil public

### Recording nu se salvează
- Verifică `enable_recording: 'cloud'` în create-room
- Check Daily.co dashboard pentru înregistrări
- Verifică limitele planului Daily.co

## 📈 Monitorizare

Pentru producție, recomand:
- **Sentry** pentru error tracking
- **LogRocket** pentru session replay  
- **DataDog** pentru metrics
- **Webhook.site** pentru debug webhook-uri

---

## 🎊 Rezultat Final

Clientul va primi automat un email frumos cu:
- ✅ Link direct de descărcare
- ✅ Detalii complete despre consultație  
- ✅ Instrucțiuni claire
- ✅ Support contact
- ✅ Notificări de securitate

**Zero intervenție manuală necesară!** 🚀 