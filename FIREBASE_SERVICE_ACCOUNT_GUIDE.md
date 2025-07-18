# 🔑 GHID: Obținerea Firebase Service Account Key

## 🎯 **Pentru ce ai nevoie de această cheie?**

Firebase Service Account key-ul îți permite aplicației să:
- **Salveze înregistrările** în Firebase Storage
- **Acceseze Firestore** pentru metadata înregistrărilor  
- **Trimită email-uri** cu notificări când înregistrarea e gata

**Este esențial pentru sistemul simplu de înregistrare!** 🎥

---

## 📋 **PAȘI DETALIAȚI**

### **ETAPA 1: Accesează Firebase Console**

1. **Mergi la:** [https://console.firebase.google.com](https://console.firebase.google.com)
2. **Loghează-te** cu contul Google al proiectului
3. **Selectează proiectul** tău existent din listă

---

### **ETAPA 2: Accesează Project Settings**

1. **Click pe iconița ⚙️** din stânga sus (lângă "Project Overview")
2. **Selectează "Project settings"** din meniu

   ![Project Settings](https://i.imgur.com/example1.png)

---

### **ETAPA 3: Mergi la Service Accounts**

1. În **Project Settings**, click pe tab-ul **"Service Accounts"**
2. Vei vedea pagina cu opțiuni pentru Service Accounts

   ![Service Accounts Tab](https://i.imgur.com/example2.png)

---

### **ETAPA 4: Generează Private Key**

1. **Scroll down** până găsești secțiunea "Firebase Admin SDK"
2. **Selectează limba "Node.js"** (dacă nu e deja selectată)
3. **Click pe butonul "Generate new private key"**

   ![Generate Key Button](https://i.imgur.com/example3.png)

4. **Apare un modal de confirmare** - click "Generate key"

   ![Confirm Modal](https://i.imgur.com/example4.png)

---

### **ETAPA 5: Descarcă fișierul JSON**

1. **Se va descărca automat** un fișier `.json` cu un nume asemănător cu:
   ```
   your-project-name-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
   ```

2. **IMPORTANT:** Păstrează acest fișier sigur - conține credentiale sensibile! 🔒

---

## 📝 **ETAPA 6: Extrage informațiile necesare**

Deschide fișierul JSON descărcat într-un editor de text. Vei vedea ceva asemănător cu:

```json
{
  "type": "service_account",
  "project_id": "your-project-12345",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-12345.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### **Extrage acestea 3 valori:**

1. **`project_id`** - de exemplu: `"your-project-12345"`
2. **`client_email`** - de exemplu: `"firebase-adminsdk-xxxxx@your-project-12345.iam.gserviceaccount.com"`
3. **`private_key`** - întreaga valoare inclusiv `"-----BEGIN PRIVATE KEY-----\n...-----END PRIVATE KEY-----\n"`

---

## ⚙️ **ETAPA 7: Adaugă în .env.local**

Creează/actualizează fișierul `.env.local` din root-ul proiectului:

```bash
# Firebase Service Account pentru înregistrări
FIREBASE_PROJECT_ID=your-project-12345
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-12345.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Email pentru notificări (dacă nu le ai deja)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### **⚠️ IMPORTANT pentru PRIVATE_KEY:**
- **Păstrează ghilimelele** în jurul întregii chei
- **Păstrează `\n`** din string - sunt importante pentru formatare
- **NU înlocui `\n` cu line breaks reale**

---

## 🧪 **ETAPA 8: Testează configurația**

1. **Pornește aplicația:**
   ```bash
   npm run dev
   ```

2. **Accesează în browser:**
   ```
   http://localhost:3000/meeting?meetingCode=TEST
   ```

3. **Testează recording:**
   - Click pe butonul 🎥 Înregistrează
   - Permite partajarea ecranului
   - Verifică console-ul browser pentru logs de succes

4. **Logs de succes în console:**
   ```javascript
   ✅ Simple recording started with format: video/webm;codecs=vp9,opus
   📊 Recording progress: Uploading: 25%
   📊 Recording progress: Uploading: 100%
   ✅ Upload completed: https://firebasestorage...
   🎉 Recording process completed successfully
   ```

---

## 🚀 **DEPLOYMENT PE VERCEL**

Când ești gata pentru production:

1. **Vercel Dashboard** → proiectul tău → **Settings** → **Environment Variables**

2. **Adaugă toate variabilele:**
   ```
   FIREBASE_PROJECT_ID=your-project-12345
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-gmail-app-password
   ```

3. **Redeploy** aplicația

---

## ❓ **TROUBLESHOOTING**

### **Eroare: "Failed to save metadata"**
```bash
# Verifică că ai toate 3 variabile Firebase în .env.local
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL  
echo $FIREBASE_PRIVATE_KEY
```

### **Eroare: "Invalid private key format"**
- Verifică că private key începe cu `"-----BEGIN PRIVATE KEY-----\n`
- Verifică că se termină cu `\n-----END PRIVATE KEY-----\n"`
- Verifică că întreg string-ul este în ghilimele

### **Eroare: "Permission denied"**
- Verifică că Service Account key-ul e generat pentru proiectul corect
- Verifică că Firebase Storage e activat în console

---

## 🎉 **REZULTAT FINAL**

După configurarea corectă a Service Account key-ului:

✅ **Înregistrările se salvează automat în Firebase Storage**  
✅ **Metadata se salvează în Firestore**  
✅ **Email-uri se trimit automat când înregistrarea e gata**  
✅ **Zero costuri cloud externe**  
✅ **Control complet asupra datelor**  

**Sistem complet funcțional în ~15 minute!** 🚀

---

## 🔒 **SECURITATE**

⚠️ **NICIODATĂ nu include Service Account key-ul în:**
- Codul sursă (git repository)
- Frontend JavaScript 
- Public folders

✅ **ÎNTOTDEAUNA:**
- Ține-l în `.env.local` (care e în `.gitignore`)
- Folosește environment variables pe server
- Folosește doar în backend API calls 