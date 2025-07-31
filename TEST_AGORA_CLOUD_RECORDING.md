# 🧪 TEST AGORA CLOUD RECORDING - Google Cloud Storage

## 🎯 **Pasul Final: Testare Completă**

Odată ce ai configurat toate variabilele de environment, urmează acești pași pentru testare:

### **1. Verifică Configurația (1 min)**

```bash
# În terminal, din directorul proiectului:
npm run dev

# Verifică că toate variabilele sunt setate:
curl -X POST http://localhost:3000/api/recording/start \
  -H "Content-Type: application/json" \
  -d '{
    "meetingCode": "test-recording-123"
  }'

# Dacă vezi eroare "not configured", verifică .env.local
```

### **2. Test End-to-End (5 min)**

**2.1. Pornește o conferință:**
```bash
# Du-te pe: http://localhost:3000/admin-conferinte-grup
# Creează o conferință test
# Intră în conferința ca admin
```

**2.2. Testează recording-ul:**
```javascript
// În browser console (F12):

// Start recording
fetch('/api/recording/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    meetingCode: 'group_YOUR_CONFERENCE_ID'
  })
}).then(r => r.json()).then(console.log);

// Verifică status (așteaptă 30 sec)
fetch('/api/recording/status?sid=YOUR_SID_FROM_ABOVE')
  .then(r => r.json()).then(console.log);

// Stop recording (după 1-2 min)
fetch('/api/recording/stop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sid: 'YOUR_SID_FROM_START'
  })
}).then(r => r.json()).then(console.log);
```

### **3. Verifică Google Cloud Storage (2 min)**

```bash
# Du-te pe: https://console.cloud.google.com/storage
# Bucket: cristina-zurba-recordings
# Ar trebui să vezi fișiere .m3u8 și .ts
```

### **4. Monitorizează Logs (continuu)**

```bash
# În terminal unde rulează Next.js:
# Căută loguri precum:
# ✅ [AGORA CLOUD] Resource ID acquired: xxxxx
# ✅ [AGORA CLOUD] Cloud recording started with SID: xxxxx
# ✅ [AGORA CLOUD] Recording stopped successfully
```

## 🔧 **Troubleshooting Rapid**

### **Eroare: "not configured"**
```bash
# Verifică .env.local - toate variabilele Agora trebuie setate
AGORA_APP_CERTIFICATE=your-cert
AGORA_CUSTOMER_ID=your-id
AGORA_CUSTOMER_SECRET=your-secret
```

### **Eroare: "403 Forbidden"**
```bash
# Verifică Google Cloud Service Account permissions
# Trebuie "Storage Admin" role
```

### **Eroare: "404 Not Found" la stop**
```bash
# Recording-ul s-a oprit automat sau a expirat
# Verifică în Agora Console logs
```

### **Fișiere nu apar în bucket**
```bash
# Agora uploadă automat după stop
# Poate dura 1-2 minute pentru procesare
# Verifică în webhook logs pentru completion
```

## ✅ **Semne că Funcționează Perfect**

1. **API start** returnează `sid` și `resourceId`
2. **API status** arată `status: "recording"`
3. **API stop** returnează `fileList` array
4. **Google Cloud** arată fișiere .m3u8 și .ts
5. **Webhook** (dacă configurat) primește notificări

## 🎊 **Următorii Pași**

Odată ce testarea funcționează:

1. **Integrează în UI** - butoanele de recording să apeleze noile API-uri
2. **Configurează webhook** pentru notificări automate
3. **Adaugă email automation** când recording-ul e gata
4. **Implementează download securizat** pentru clienți

## 📞 **Support Rapid**

Dacă întâmpini probleme:
1. Verifică logs în browser console (F12)
2. Verifică logs în terminal Next.js
3. Verifică Agora Console pentru erori
4. Verifică Google Cloud pentru permissions

**Sistemul tău va fi 100x mai profesional cu Agora Cloud Recording!** 🚀 

**Adaugă în `.env.local`:**
```bash
# Agora Cloud Recording Configuration
AGORA_APP_ID=e17715cba7c84bfc9dbd1b5231b6f86f
AGORA_APP_CERTIFICATE=your-app-certificate-from-console
AGORA_CUSTOMER_ID=your-customer-id-from-console  
AGORA_CUSTOMER_SECRET=your-customer-secret-from-console

# Google Cloud Storage Configuration
AGORA_CLOUD_STORAGE_VENDOR=6  # 6 = Google Cloud Storage with HMAC
AGORA_CLOUD_STORAGE_BUCKET=cristina-zurba-recordings
GCS_HMAC_ACCESS_KEY=your-hmac-access-key
GCS_HMAC_SECRET_KEY=your-hmac-secret-key

# Recording Settings  
RECORDING_MAX_DURATION=7200  # 2 ore
RECORDING_AUDIO_PROFILE=0    # High quality
RECORDING_VIDEO_PROFILE=0    # High quality
``` 