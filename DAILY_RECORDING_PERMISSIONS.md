# Daily.co Recording Permissions System

## 🎯 Overview

Sistemul de permisiuni pentru înregistrare este configurat să permită controlul înregistrării doar pentru administratori, în funcție de tipul de sesiune.

## 👥 User Types & Permissions

### 🔴 **Admin Consultații** (`/meeting-admin`)
- **Cameră**: `consultation-{documentId}`
- **Recording**: ✅ ACTIVAT automat
- **UI Controls**: ✅ Butoane de start/stop recording vizibile
- **Token**: `is_owner: true`, `start_cloud_recording: true`
- **URL Params**: `showRecordingSetup=true&showStartStopRecordingButton=true`
- **Email automat**: ✅ După înregistrare

### 🔵 **Admin Conferințe Grup** (`/admin-conferinta-grup-video`)
- **Cameră**: `conference-{documentId}`
- **Recording**: ❌ DEZACTIVAT
- **UI Controls**: ❌ Butoane recording ascunse
- **Token**: `is_owner: true`, fără `start_cloud_recording`
- **URL Params**: `showRecordingSetup=false&showStartStopRecordingButton=false`
- **Email automat**: ❌ Nu se înregistrează

### 👤 **Client** (`/meeting`)
- **Cameră**: Se conectează la camera existentă
- **Recording**: ❌ NU poate controla
- **UI Controls**: ❌ Butoane recording ascunse
- **Token**: `is_owner: false`, `enable_screenshare: false`
- **URL Params**: `showRecordingSetup=false&showStartStopRecordingButton=false`
- **Email automat**: ✅ Primește email cu înregistrarea

## 🔧 Technical Implementation

### Camera Creation
```javascript
// Recording enabled only for consultation sessions
...(sessionType !== 'conference' && { enable_recording: 'cloud' })
```

### Token Permissions
```javascript
// Admin gets recording control for consultations
...(userRole === 'admin' && sessionType !== 'conference' && {
  start_cloud_recording: true
})

// Client gets restricted access
enable_screenshare: userRole === 'admin' // Only admin can screenshare
```

### URL Parameters
```javascript
// Client - Hide recording controls
urlParams.set('showRecordingSetup', 'false');
urlParams.set('showStartStopRecordingButton', 'false');

// Admin Consultation - Show recording controls  
urlParams.set('showRecordingSetup', 'true');
urlParams.set('showStartStopRecordingButton', 'true');

// Admin Conference - Hide recording controls
urlParams.set('showRecordingSetup', 'false');
urlParams.set('showStartStopRecordingButton', 'false');
```

## 🎮 Manual Recording Control API

Adminii pot controla înregistrarea manual prin API:

```bash
# Start recording
curl -X POST http://localhost:3000/api/daily/recording-control \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "roomName": "consultation-xxx"}'

# Stop recording  
curl -X POST http://localhost:3000/api/daily/recording-control \
  -H "Content-Type: application/json" \
  -d '{"action": "stop", "roomName": "consultation-xxx"}'
```

## 📧 Email System Flow

1. **Admin** începe consultația (recording pornește automat)
2. **Daily.co** finalizează înregistrarea 
3. **Webhook** (`/api/daily/webhook`) primește `recording.finished`
4. **Server** trimite email automat către **client** cu link descărcare
5. **Client** primește email cu înregistrarea

## 🧪 Testing

### Test Client URL (fără recording controls):
```
http://localhost:3000/meeting?meetingCode=05b5fdae-91a2-456c-ba1a-82238ba7d548__4IWu3u6PWWhi5IVBpSYC
```

### Test Admin Consultation (cu recording controls):
```
http://localhost:3000/meeting-admin?meetingCode=05b5fdae-91a2-456c-ba1a-82238ba7d548__4IWu3u6PWWhi5IVBpSYC
```

### Test Admin Conference (fără recording):
```
http://localhost:3000/admin-conferinta-grup-video/KlCbrq0eeOvf5lX1ztVT
```

## ✅ Expected Behavior

- **Client**: NU vede butoane de recording în Daily.co interface
- **Admin Consultation**: VEDE butoane de recording și poate controla
- **Admin Conference**: NU vede butoane de recording (nu sunt necesare)
- **Emails**: Doar consultațiile generează email-uri cu înregistrări

## 🚨 Security Notes

- Clientul nu poate porni/opri înregistrări prin interfață
- Doar adminii de consultații au control asupra înregistrării
- Conference adminii nu au acces la înregistrare
- Token-urile expiră în 4 ore
- Webhook-urile sunt securizate la nivel de domeniu 