# 🔴 LIVE TESTING - Sistem Înregistrări Agora Cloud Recording

## 📋 Pregătire pentru testare

### 1. Verifică Environment Variables
```bash
# Verifică că ai toate variabilele setate:
echo $PUBLIC_AGORA_APP_ID
echo $AGORA_CUSTOMER_ID  
echo $AGORA_CUSTOMER_SECRET
echo $GCS_HMAC_ACCESS_KEY
echo $GCS_HMAC_SECRET_KEY
echo $AGORA_CLOUD_STORAGE_BUCKET
```

### 2. Pornește aplicația
```bash
npm run dev
# sau
yarn dev
```

## 🔍 Activarea Monitorizării Live

### Opțiunea 1: În Browser Console (Recomandat)
1. Deschide Developer Tools (F12)
2. Du-te la Console
3. Rulează comenzile:

```javascript
// Începe monitorizarea tuturor logurilor
startLogs()

// SAU specifice pentru înregistrări
showRecordingLogs()

// SAU doar API-uri
showApiLogs()

// SAU doar client-side
showClientLogs()

// Pentru a vedea doar erorile
showErrorsOnly()
```

### Opțiunea 2: Server-side Logs în Terminal
```bash
# În terminal separat, urmărește logurile server:
npm run dev | grep -E "(AGORA|RECORDING|ERROR|WARN)"

# SAU pentru toate logurile colorate:
npm run dev
```

## 🧪 Secvențe de Testare

### Test 1: One-to-One Video Call Recording

1. **Accesează:**
   ```
   http://localhost:3000/meeting-admin/[meetingCode]
   ```

2. **În Console (Browser):**
   ```javascript
   startLogs()  // Începe monitorizarea
   ```

3. **Testează secvența:**
   - Click "Pornește înregistrarea"
   - Verifică în Console: vezi logurile de start
   - Verifică în Terminal: vezi API call-urile la Agora
   - Lasă să înregistreze 30-60 secunde
   - Click "Oprește înregistrarea"
   - Completează email-ul pentru notificare
   - Click "Oprește și trimite"

4. **Ce să monitorizezi:**
   ```
   🎥 Recording start event
   🔗 API call to /api/recording/start
   ✅ SID and ResourceID received
   📊 Status checks every 10 seconds
   🛑 Recording stop event
   🔗 API call to /api/recording/stop
   📧 Email notification sent
   ```

### Test 2: Group Conference Recording

1. **Accesează:**
   ```
   http://localhost:3000/admin-conferinta-grup-video/[conferenceId]
   ```

2. **Similar cu Test 1** dar verifică:
   - Multiple participant emails
   - Group recording logic

### Test 3: API Testing Direct

```bash
# Test START
curl -X POST http://localhost:3000/api/recording/start \
  -H "Content-Type: application/json" \
  -d '{"meetingCode":"test123", "recordingType":"one_to_one"}'

# Test STATUS (folosește SID din răspunsul de mai sus)
curl -X POST http://localhost:3000/api/recording/status \
  -H "Content-Type: application/json" \
  -d '{"sid":"YOUR_SID_HERE"}'

# Test STOP (folosește SID din răspunsul de mai sus)
curl -X POST http://localhost:3000/api/recording/stop \
  -H "Content-Type: application/json" \
  -d '{"sid":"YOUR_SID_HERE", "recipientEmail":"test@example.com"}'
```

## 📊 Tipuri de Loguri care le vei vedea

### 🎥 Recording Logs (Client-side)
```
🎥 [RecordingLogger] Recording start initiated
🎥 [RecordingLogger] SID received: abc123...
🎥 [RecordingLogger] Status check: recording active
```

### 🔗 API Logs (Server-side)
```
🔗 [START] Recording start request received
🔗 [START] Agora acquire API call successful
🔗 [START] Agora start API call successful
🔗 [STOP] Recording stop request received
```

### 💻 Client Logs (UI Events)
```
💻 [ONE_TO_ONE_VIDEO] Component initialized
💻 [ONE_TO_ONE_VIDEO] Client email auto-filled
💻 [ONE_TO_ONE_VIDEO] Recording button clicked
```

## 🚨 Troubleshooting în Timp Real

### Dacă nu vezi loguri:
```javascript
// Verifică dacă monitorul funcționează:
window.LogMonitor.isActive  // Should be true

// Restart manual:
stopLogs()
startLogs()
```

### Dacă înregistrarea eșuează:
1. Verifică în Console pentru erori client-side
2. Verifică în Terminal pentru erori server-side
3. Verifică Network tab pentru failed requests
4. Verifică Google Cloud Storage pentru fișiere

### Comenzi rapide pentru debugging:
```javascript
// Vezi doar erorile din ultimele 5 minute
showErrorsOnly()

// Vezi toate logurile de înregistrare
showRecordingLogs()

// Reset complet
stopLogs()
window.LogMonitor = new RealTimeLogMonitor()
startLogs()
```

## 📈 Monitorizare Performance

### Verifică timpii de răspuns:
```javascript
// În console, vezi pentru fiecare operație:
// - Acquisition time
// - Start time  
// - Stop time
// - Processing time
```

### Verifică Google Cloud Storage:
1. Du-te la Google Cloud Console
2. Navighează la Storage > Browser
3. Găsește bucket-ul: `cristina-zurba-recordings`
4. Verifică că fișierele apar după stop

## ⚡ Comenzi Rapide pentru Testare

```javascript
// Quick start pentru testare înregistrări
showRecordingLogs()

// Quick start pentru testare API-uri
showApiLogs()

// Vezi tot ce se întâmplă
startLogs()

// Stop când termini
stopLogs()
```

## 🎯 Checklist de Validare

- [ ] Logurile client apar în Console
- [ ] Logurile server apar în Terminal  
- [ ] Recording start returnează SID + ResourceID
- [ ] Status checks se fac la fiecare 10 secunde
- [ ] Recording stop returnează file list
- [ ] Email se trimite cu succes
- [ ] Fișierul apare în Google Cloud Storage
- [ ] Nu există erori în Console sau Terminal

---

**💡 Sfat:** Țineți deschise simultan:
1. Browser cu aplicația
2. Console (F12) cu `startLogs()`
3. Terminal cu `npm run dev`
4. Google Cloud Storage console

Astfel vezi tot fluxul în timp real! 