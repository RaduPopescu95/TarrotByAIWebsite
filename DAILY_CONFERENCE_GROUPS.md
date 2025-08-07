# Daily.co Conference Groups Integration

## 🎯 **Overview**

Conferințele grup au fost migrated de la Agora la Daily.co, cu configurări specifice pentru admin (Cristina Zurba) și participanți (guests).

## 👥 **Tipuri de utilizatori pentru conferințe grup:**

### 🔴 **Admin Conferință (Cristina Zurba)**
- **URL**: `/admin-conferinta-grup-video/{conferenceId}`
- **Cameră**: `conference-{conferenceId}`
- **Nume**: "Cristina Zurba" (predefinit)
- **Recording**: ❌ DEZACTIVAT (nu sunt necesare pentru conferințe)
- **Permissions**: Full control (screenshare, chat, etc.)

### 👤 **Participanți Conferință (Guests)**
- **URL**: `/conferinta-grup/{accessLink}`
- **Cameră**: Se conectează la camera existentă
- **Nume**: Forțați să își introducă numele (prejoin UI)
- **Recording**: ❌ NU pot controla
- **Permissions**: Limited (audio, video, chat - fără screenshare)

## 🔧 **Implementare tehnică:**

### **Admin Conference Page:**
```javascript
// /pages/admin-conferinta-grup-video/[conferenceId].jsx
import DailyAdmin from "../../components/Daily/DailyAdmin";

// Mock meetingCode pentru compatibilitate
const mockMeetingCode = `conference-${conferenceId}__${conferenceId}`;
```

### **Guest Conference Page:**
```javascript
// /pages/conferinta-grup/[accessLink].jsx
import DailyConferenceGuest from "../../components/Daily/DailyConferenceGuest";

// Extract conferenceId from accessLink format:
// grup_{conferenceId}_guest_{guestId}_{timestamp}_{randomId}
```

### **Token Configuration:**

#### **Admin Conference Token:**
```json
{
  "u": "Cristina Zurba",     // ✅ Nume predefinit
  "o": true,                 // ✅ Owner
  "erui": false,            // ❌ NU vede recording (corect pentru conferințe)
  "p": {"cs": "a,v,sv,sa"} // ✅ Full permissions
}
```

#### **Guest Conference Token:**
```json
{
  // ❌ NU are "u" - va introduce numele în prejoin
  "o": false,               // ❌ Nu este owner
  "erui": false,           // ❌ NU vede recording
  "p": {"cs": "a,v"}      // ❌ Limited (fără screenshare)
}
```

## 🎭 **Diferențe vs Consultații:**

| Feature | Consultații | Conferințe Grup |
|---------|-------------|------------------|
| **Recording** | ✅ Admin poate înregistra | ❌ Fără înregistrare |
| **Screenshare** | ✅ Doar admin | ✅ Doar admin |
| **Chat** | ✅ Ambii | ✅ Toți participanții |
| **Email automat** | ✅ Cu înregistrarea | ❌ Nu se înregistrează |
| **Max participanți** | 2 (admin + client) | Multiple (admin + guests) |

## 🔄 **URL Migration:**

### **Admin URLs:**
```
VECHI: /admin-conferinta-grup-video/KlCbrq0eeOvf5lX1ztVT (Agora)
NOU:   /admin-conferinta-grup-video/KlCbrq0eeOvf5lX1ztVT (Daily.co)
```

### **Guest URLs:**
```
VECHI: /conferinta-grup/grup_KlCbrq0eeOvf5lX1ztVT_guest_... (Agora)
NOU:   /conferinta-grup/grup_KlCbrq0eeOvf5lX1ztVT_guest_... (Daily.co)
```

## 🎯 **Flux complet conferință grup:**

1. **Admin** accesează `/admin-conferinta-grup-video/{conferenceId}`
2. **Daily.co** creează camera `conference-{conferenceId}`
3. **Admin** intră direct cu numele "Cristina Zurba"
4. **Guests** accesează `/conferinta-grup/{accessLink}`
5. **Guests** sunt forțați să își introducă numele (prejoin UI)
6. **Toți** se întâlnesc în aceeași cameră Daily.co
7. **Chat** disponibil pentru toți
8. **NU se înregistrează** automat

## 🧪 **Pentru testare:**

### **Test Admin Conference:**
```
URL: http://localhost:3000/admin-conferinta-grup-video/KlCbrq0eeOvf5lX1ztVT
Rezultat: Daily.co cu numele "Cristina Zurba", fără recording buttons
```

### **Test Guest Conference:**
```
URL: http://localhost:3000/conferinta-grup/grup_KlCbrq0eeOvf5lX1ztVT_guest_uwupmgr9_1754470719081_v8wqoyd7dp
Rezultat: Prejoin UI pentru nume, apoi Daily.co fără recording/screenshare
```

## 💬 **Chat Experience în conferințe:**

```
Cristina Zurba: Bună ziua tuturor! Bine ați venit la conferința de grup.
Maria Popescu: Bună ziua, doctora!
Ion Ionescu: Mulțumim pentru invitație!
Ana Dumitrescu: Sunt foarte bucuroasă să particip.
```

## 🔒 **Beneficii migare Daily.co:**

- ✅ **Stabilitate îmbunătățită** vs Agora
- ✅ **Chat avansat** cu emoji și reactions
- ✅ **Interfață uniformă** cu consultațiile
- ✅ **Securitate îmbunătățită** prin token permissions
- ✅ **Prejoin UI** pentru control nume participanți
- ✅ **Scalabilitate** pentru multiple participante

**Conferințele grup sunt acum complet migrate la Daily.co!** 🎉✨ 