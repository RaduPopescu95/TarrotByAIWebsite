# Daily.co Webhook Events Update

## 🔄 **Actualizare importantă: `recording.ready-to-download`**

Conform [documentației Daily.co](https://docs.daily.co/reference/rest-api/webhooks/events/recording-ready-to-download), evenimentul corect pentru trimiterea email-urilor automate este `recording.ready-to-download`, nu `recording.finished`.

## 📊 **Diferența între evenimente:**

### ❌ **`recording.finished`** 
- Se declanșează când înregistrarea SE OPREȘTE
- **NU conține linkul de descărcare** încă
- Înregistrarea încă se procesează pe serverele Daily.co

### ✅ **`recording.ready-to-download`**
- Se declanșează când înregistrarea este **GATA DE DESCĂRCAT**
- **CONȚINE linkul de descărcare** (`download_url`)
- Înregistrarea este complet procesată și disponibilă

## 🔧 **Actualizări implementate:**

### 1. **Webhook Handler** (`/api/daily/webhook.js`)
```javascript
// ADĂUGAT: Handler nou pentru recording.ready-to-download
case 'recording.ready-to-download':
  await handleRecordingReadyToDownload(webhookData);
  break;

// Handler existent păstrat pentru compatibilitate
case 'recording.finished':
  await handleRecordingFinished(webhookData);
  break;
```

### 2. **Webhook Setup** (`/api/daily/setup-webhook.js`)
```javascript
events: {
  'recording.ready-to-download': true,  // ✅ ADĂUGAT
  'recording.finished': true,           // Păstrat pentru compatibilitate
  'recording.error': true,
  'room.exp': true
}
```

### 3. **Payload Structure** (`recording.ready-to-download`)
```javascript
{
  "type": "recording.ready-to-download",
  "room": {
    "name": "consultation-{documentId}"
  },
  "recording": {
    "id": "rec_12345",
    "download_url": "https://dl.daily.co/recordings/...",  // ✅ Link gata
    "playback_url": "https://play.daily.co/recordings/...", 
    "duration": 1800,
    "status": "finished"
  }
}
```

## 🎯 **Fluxul complet actualizat:**

1. **Admin** începe consultația în Daily.co
2. **Admin** pornește înregistrarea manual (buton în interface)
3. **Admin** oprește înregistrarea sau sesiunea se termină
4. **Daily.co** procesează înregistrarea (câteva minute)
5. **Daily.co** trimite `recording.ready-to-download` webhook ✅
6. **Server** extrage `download_url` din webhook
7. **Server** trimite email automat cu link către **client**

## 📧 **Email automat cu download link:**

Email-ul se trimite **DOAR când înregistrarea este gata**, nu imediat după oprire.

```javascript
// Webhook payload conține linkul direct
const downloadUrl = recording.download_url || recording.playback_url;

// Email se trimite automat către client
await fetch('/api/daily/send-recording-email', {
  body: JSON.stringify({
    documentId,
    recordingUrl: downloadUrl,  // Link functional
    roomName,
    duration: recording.duration
  })
});
```

## 🧪 **Pentru testare în producție:**

1. **Deploy** aplicația pe domeniul public
2. **Configurează webhook** prin `/api/daily/setup-webhook`
3. **Fă o consultație de test** cu înregistrare
4. **Verifică email-ul** automat după câteva minute

**Sistemul este optimizat pentru a trimite email-uri doar când înregistrarea este complet gata!** 🎉 