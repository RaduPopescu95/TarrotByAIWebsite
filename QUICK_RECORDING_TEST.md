# 🧪 TEST RAPID - Verificarea Înregistrărilor Agora

## 🎯 **SCOPUL ACESTUI TEST**

Acest ghid te va ajuta să testezi rapid dacă configurarea Agora Cloud Recording funcționează corect.

---

## **📋 VERIFICARE INIȚIALĂ**

### **1. Verifică dacă ai credentialele**
```bash
# Verifică fișierul .env.local
cat .env.local | grep AGORA

# Ar trebui să vezi:
AGORA_APP_ID=e17715cba7c84bfc9dbd1b5231b6f86f
AGORA_APP_CERTIFICATE=your-certificate
AGORA_REST_API_KEY=your-customer-id
AGORA_REST_API_SECRET=your-customer-secret
```

### **2. Verifică cloud storage**
```bash
# Pentru AWS S3
aws s3 ls s3://your-bucket-name/
```

---

## **🧪 TEST RAPID - CONSULTAȚII ONE-TO-ONE**

### **Pasul 1: Pornește aplicația**
```bash
npm run dev
# Sau
yarn dev
```

### **Pasul 2: Accesează o consultație**
1. Deschide: `http://localhost:3000/meeting?meetingCode=TEST123`
2. Vei vedea interfața video cu Agora
3. Caută butonul de Recording (🔴) în interfață

### **Pasul 3: Testează recording**
1. **Click pe butonul Record** (🔴)
2. **Verifică browser console** - ar trebui să vezi:
   ```
   ✅ Recording started successfully
   📊 ResourceId: xxx
   📊 SID: xxx
   ```
3. **Lasă să înregistreze ~30 secunde**
4. **Click Stop Recording** (⏹️)

### **Pasul 4: Verifică rezultatele**
1. **Browser console** - ar trebui să vezi:
   ```
   ✅ Recording stopped successfully
   📁 File location: s3://bucket/recordings/TEST123/
   ```

2. **Firebase Console:**
   - Mergi la Firestore
   - Verifică colecția `recordings`
   - Ar trebui să existe document cu `meetingCode: "TEST123"`

3. **S3 Bucket:**
   ```bash
   aws s3 ls s3://your-bucket/recordings/TEST123/
   ```

---

## **🧪 TEST RAPID - CONFERINȚE GRUP**

### **Pasul 1: Creează o conferință test**
1. Accesează: `http://localhost:3000/admin-conferinte-grup`
2. Creează o conferință pentru "acum"
3. Notează `conferenceId` din URL

### **Pasul 2: Accesează ca admin**
1. Mergi la: `http://localhost:3000/admin-conferinta-grup-video/[conferenceId]`
2. Click "Începe Conferința"
3. Vei vedea interfața Agora cu recording controls

### **Pasul 3: Testează recording**
- Urmează aceiași pași ca la consultații
- Verifică că recording se activează în interfața de grup

---

## **⚠️ DEPANARE RAPIDĂ**

### **Eroare: "Failed to acquire resource"**
```javascript
// Verifică în browser console Network tab
// POST /api/recording/start
// Response: 401 Unauthorized

// SOLUȚIE: Verifică AGORA_REST_API_KEY și AGORA_REST_API_SECRET
```

### **Eroare: "S3 access denied"**
```javascript
// SOLUȚIE: Verifică AWS credentials în .env.local
AWS_ACCESS_KEY_ID=correct-key
AWS_SECRET_ACCESS_KEY=correct-secret
```

### **Butonul Recording nu apare**
```javascript
// Verifică în browser console dacă există erori JavaScript
// Verifică că toate variabilele AGORA sunt setate
```

### **Recording pornește dar nu se salvează**
```javascript
// Verifică Agora Console → Cloud Recording → Records
// Verifică S3 bucket permissions
// Verifică logs în Network tab pentru API calls
```

---

## **✅ VERIFICĂRI FINALE**

### **1. Test de End-to-End**
- [ ] Recording pornește fără erori
- [ ] Timer afișează durata corect
- [ ] Recording se oprește cu butonul Stop
- [ ] Fișier apare în S3 în ~5 minute
- [ ] Email de notificare este trimis
- [ ] Pagina `/recording/TEST123` afișează înregistrarea

### **2. Verificare în Agora Console**
- [ ] Mergi la [console.agora.io](https://console.agora.io)
- [ ] **Projects → Usage** - vezi minutele înregistrate
- [ ] **Cloud Recording → Records** - vezi înregistrările

### **3. Verificare S3**
```bash
# Ar trebui să vezi fișiere .mp4 și .m3u8
aws s3 ls s3://your-bucket/recordings/TEST123/ --recursive

# Output așteptat:
# 2024-01-XX XX:XX:XX    xxx recording.mp4
# 2024-01-XX XX:XX:XX    xxx recording.m3u8
```

---

## **🎉 DUPĂ TEST REUȘIT**

Dacă toate verificările sunt ✅, **înregistrările sunt COMPLET FUNCȚIONALE!**

### **Pentru deployment pe Vercel:**
1. Adaugă toate variabilele din `.env.local` în **Vercel → Settings → Environment Variables**
2. Redeploy aplicația
3. Testează pe production domain

### **Pentru monitorizare:**
- Configurează alerte în Agora Console pentru usage limits
- Monitorizează storage space în S3
- Verifică periodic logs pentru erori

---

**🚀 SUCCES!** Sistemul tău de înregistrări este gata să fie folosit în producție! 