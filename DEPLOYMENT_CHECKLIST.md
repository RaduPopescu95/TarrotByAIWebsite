# 🚀 Checklist Deployment - Conferințe de Grup

## 📋 Pre-Deployment

### **1. Dependințe**
- [ ] Verifică că `nodemailer` este în `package.json` ✅
- [ ] Rulează `npm install` pentru a instala dependințele noi
- [ ] Verifică că Agora SDK este functional
- [ ] Testează conexiunea la Firebase

### **2. Variabile de Mediu (.env.local)**

```env
# Stripe - OBLIGATORIU
STRIPE_SECRET_KEY=sk_live_... (sau sk_test_ pentru testare)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (sau pk_test_)
STRIPE_WEBHOOK_SECRET_CONFERINTA=whsec_... (creat în Stripe Dashboard)

# Email - OBLIGATORIU pentru confirmări
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@cristinazurba.ro

# Site - OBLIGATORIU
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Existente (verifică că sunt setate)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

### **3. Configurări Stripe**
- [ ] Creează webhook în Stripe Dashboard
- [ ] URL webhook: `https://yourdomain.com/api/stripe-webhook-conferinta`
- [ ] Evenimente: `checkout.session.completed`, `payment_intent.succeeded`
- [ ] Copiază webhook secret în `.env`

### **4. Configurări Email**
- [ ] Configurează SMTP (Gmail, SendGrid, etc.)
- [ ] Testează trimiterea unui email
- [ ] Verifică că template-urile se afișează corect

## 🧪 Testing Pre-Production

### **Fluxul Complet de Testare:**

1. **Admin Dashboard:**
   - [ ] Accesează `/admin-conferinte-grup`
   - [ ] Creează o conferință de test
   - [ ] Verifică că se salvează în Firestore

2. **Calendar Public:**
   - [ ] Accesează `/calendar-conferinte-grup`
   - [ ] Verifică că conferința apare
   - [ ] Testează filtrele de căutare

3. **Procesul de Plată:**
   - [ ] Click "Înscrie-te" pe o conferință
   - [ ] Completează formularul de checkout
   - [ ] Procesează o plată de test cu Stripe
   - [ ] Verifică că ajungi la pagina de success

4. **Email și Access:**
   - [ ] Verifică că primești email de confirmare
   - [ ] Click pe link-ul din email
   - [ ] Verifică că accesezi waiting room-ul

5. **Video Conferencing:**
   - [ ] Testează butonul "Alătură-te conferinței"
   - [ ] Verifică că Agora se încarcă corect
   - [ ] Testează controlurile video (mute, camera, etc.)

## 🔄 Deployment Steps

### **1. Code Deploy**
```bash
# Build pentru producție
npm run build

# Deploy pe serverul tau (Vercel, Netlify, etc.)
git add .
git commit -m "feat: Add group conferences functionality"
git push origin main
```

### **2. Webhook Configuration**
- [ ] Configurează webhook-ul Stripe în production
- [ ] Testează că webhook-ul funcționează
- [ ] Verifică logs pentru erori

### **3. Database Setup**
- [ ] Verifică că Firestore rules permit accesul la noile colecții
- [ ] Testează read/write pe `ConferinteGrup`
- [ ] Testează `PlatiConferinteGrup` și `ConferinteGrupPresence`

### **4. Email Setup**
- [ ] Configurează email-ul pentru producție
- [ ] Testează trimiterea email-urilor
- [ ] Verifică că link-urile din email funcționează

## ✅ Post-Deployment Verification

### **Testare în Producție:**
- [ ] Creează o conferință reală de test
- [ ] Procesează o plată reală (mică sumă)
- [ ] Verifică că totul funcționează end-to-end
- [ ] Testează pe mobile și desktop
- [ ] Verifică că email-urile se trimit corect

### **Monitoring:**
- [ ] Verifică logs pentru erori
- [ ] Monitorizează Stripe webhooks
- [ ] Verifică că participanții se adaugă corect
- [ ] Testează presenza în timp real

## 🚨 Probleme Comune și Soluții

### **Stripe Webhook nu funcționează:**
- Verifică URL-ul webhook în Stripe Dashboard
- Verifică că webhook secret este corect în `.env`
- Verifică logs serverului pentru erori

### **Email-uri nu se trimit:**
- Verifică configurațiile SMTP
- Pentru Gmail, activează "App Passwords"
- Verifică că nu sunt blocate de firewall

### **Agora nu se conectează:**
- Verifică App ID Agora
- Verifică că channel name este corect
- Testează cu un channel simplu primul

### **Firestore Permissions:**
```javascript
// Adaugă aceste rules în Firestore
match /ConferinteGrup/{document} {
  allow read, write: if request.auth != null;
}
match /PlatiConferinteGrup/{document} {
  allow read, write: if request.auth != null;
}
match /ConferinteGrupPresence/{document} {
  allow read, write: if request.auth != null;
}
```

## 📞 Support

Dacă întâmpini probleme:
1. Verifică logs și console pentru erori
2. Testează fiecare componentă separat
3. Contactează pentru support tehnic

---
**Checklist completat:** ___/___  
**Data deployment:** ________  
**Testat de:** ________ 