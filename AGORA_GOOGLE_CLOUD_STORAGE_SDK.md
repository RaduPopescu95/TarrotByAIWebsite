# 📦 Google Cloud Storage SDK pentru Signed URLs

## 🎯 **Pentru Signed URLs autentice în production**

Webhook-ul de recording folosește SDK-ul oficial `@google-cloud/storage` pentru a genera signed URLs autentice.

### 📥 **Instalare SDK**

```bash
npm install @google-cloud/storage
# SAU
yarn add @google-cloud/storage
```

### 🔐 **Configurare Service Account**

1. **Service Account deja există:** `tarrot-590ee-49961eacf1c9.json`
2. **Email:** `agora-recording-service@tarrot-590ee.iam.gserviceaccount.com`
3. **Path:** În root-ul proiectului

### ⚙️ **Environment Variables**

```bash
# Pentru SDK autentificare
GOOGLE_APPLICATION_CREDENTIALS=./tarrot-590ee-49961eacf1c9.json

# Firebase Project (deja setat)
FIREBASE_PROJECT_ID=tarrot-590ee
```

### 🧪 **Testare Signed URLs**

```javascript
// În webhook, functia generateGcsSignedUrl va încerca:

// 1. @google-cloud/storage SDK (PREFERAT)
const { Storage } = await import('@google-cloud/storage');
const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const [url] = await storage
  .bucket(GCS_BUCKET)
  .file(filePath)
  .getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
  });

// 2. Fallback URL (dacă SDK nu e disponibil)
const fallbackUrl = `https://storage.googleapis.com/${bucket}/${filePath}?token=...`;

// 3. Direct URL (ultimul resort)
const directUrl = `https://storage.googleapis.com/${bucket}/${filePath}`;
```

### ✅ **Avantaje SDK vs Fallback**

| Aspect | Cu SDK | Fără SDK |
|--------|--------|----------|
| **Securitate** | ✅ Signed URLs autentice | ❌ Token-uri random |
| **Acces Control** | ✅ Controlat de GCS | ❌ Bazat pe bucket public |
| **Expirare** | ✅ Garantată de Google | ❌ Doar verificare client |
| **Production Ready** | ✅ Da | ⚠️ Doar pentru test |

### 🚀 **În Production**

- SDK-ul se va încărca automat
- Signed URLs vor fi autentice 
- Bucket poate rămâne privat
- Zero configurare adițională

### 🧪 **Pentru Development**

Dacă SDK-ul nu e instalat, sistemul va folosi fallback-uri și va loga:
```
⚠️ @google-cloud/storage not available, using fallback
📋 Using fallback public URL (requires public bucket)
```

---

**📝 Nota:** Signed URLs sunt esențiale în production pentru securitate. Fallback-urile sunt doar pentru development/testing. 