# 🎥 Sistema de Înregistrare Video Call

Acest document descrie configurarea și utilizarea sistemului de înregistrare pentru video call-uri.

## 📋 Caracteristici

- ✅ Înregistrare automată cu Agora Cloud Recording
- ✅ Stocare securizată în AWS S3
- ✅ Multiple formate (MP4, HLS)
- ✅ Notificări email automate
- ✅ Interface elegantă pentru descărcare
- ✅ Consimțământ pentru înregistrare
- ✅ Cronometru în timp real
- ✅ Stări de procesare

## 🛠️ Configurare

### 1. Variabile de mediu necesare

Creați un fișier `.env.local` cu următoarele variabile:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Agora Configuration
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-app-certificate
AGORA_REST_API_KEY=your-agora-rest-api-key
AGORA_REST_API_SECRET=your-agora-rest-api-secret

# AWS S3 Configuration
AWS_S3_BUCKET=your-s3-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Email Configuration
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-gmail-app-password

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2. Configurare Agora Cloud Recording

1. **Activați Cloud Recording în Agora Console:**
   - Mergeți la [Agora Console](https://console.agora.io)
   - Selectați proiectul
   - Activați "Cloud Recording"
   - Obțineți API Key și Secret

2. **Configurați webhook-ul:**
   - URL: `https://your-domain.com/api/recording/webhook`
   - Eveniment: "Recording completion"

### 3. Configurare AWS S3

1. **Creați un bucket S3:**
   ```bash
   aws s3 mb s3://your-recording-bucket
   ```

2. **Configurați permisiunile:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::AGORA-ACCOUNT:root"
         },
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-recording-bucket/*"
       }
     ]
   }
   ```

### 4. Configurare Email

1. **Activați 2FA pe Gmail**
2. **Generați App Password:**
   - Gmail → Securitate → App Passwords
   - Selectați "Mail" și "Other"
   - Copiați parola generată

## 🚀 Utilizare

### Pentru Utilizatori

1. **Pornirea înregistrării:**
   - Apăsați butonul de înregistrare 🔴
   - Confirmați consimțământul
   - Înregistrarea începe automat

2. **Oprirea înregistrării:**
   - Apăsați butonul stop ⏹️
   - Procesarea începe automat

3. **Descărcarea:**
   - Primiți email cu link
   - Accesați pagina de descărcare
   - Alegeți formatul dorit

### Pentru Dezvoltatori

#### API Endpoints

```javascript
// Start recording
POST /api/recording/start
{
  "channelId": "meeting-id",
  "meetingCode": "meeting-code",
  "userRole": "admin|client"
}

// Stop recording
POST /api/recording/stop
{
  "channelId": "meeting-id",
  "meetingCode": "meeting-code",
  "userRole": "admin|client"
}

// Webhook for completion
POST /api/recording/webhook
// Agora sends data when recording is ready
```

#### Firebase Collections

```javascript
// Recordings collection
{
  "meetingCode": "unique-meeting-code",
  "channelId": "agora-channel-id",
  "status": "recording|stopped|processing|ready|expired",
  "startTime": timestamp,
  "endTime": timestamp,
  "downloadLinks": {
    "mp4": "signed-s3-url",
    "hls": "signed-s3-url"
  },
  "initiatedBy": "admin|client",
  "storageLocation": "s3://bucket/path/"
}
```

## 🎨 UI/UX Features

### Butoane Elegante
- 🔴 Buton de înregistrare cu animație puls
- ⏱️ Cronometru în timp real
- 🎯 Indicatori vizuali de stare

### Modal de Consimțământ
- 📋 Explicații clare despre înregistrare
- 🔒 Informații despre confidențialitate
- ✅ Butoane de aprobare/respingere

### Pagina de Descărcare
- 📊 Starea procesării în timp real
- 📥 Multiple formate de descărcare
- 📈 Bară de progres pentru descărcare
- ℹ️ Informații detaliate despre înregistrare

### Notificări Email
- 🎉 Design modern și responsive
- 📧 Link-uri directe de descărcare
- ⏰ Informații despre expirare
- 🔐 Detalii despre securitate

## 🔧 Arhitectura Sistemului

```
[Video Call] → [Agora Cloud Recording] → [AWS S3] → [Email Notification]
     ↓                    ↓                  ↓             ↓
[UI Controls]        [API Endpoints]    [File Storage]  [User Links]
```

### Fluxul de Lucru

1. **Începerea înregistrării:**
   - Utilizatorul apasă "Record"
   - Se verifică consimțământul
   - API `/recording/start` → Agora
   - Statusul se salvează în Firebase

2. **Oprirea înregistrării:**
   - Utilizatorul apasă "Stop"
   - API `/recording/stop` → Agora
   - Statusul se actualizează

3. **Procesarea finalizată:**
   - Agora trimite webhook
   - Se generează link-uri signed
   - Se trimit email-uri de notificare

## 🛡️ Securitate

- 🔐 Link-uri signed S3 (valide 30 zile)
- 🔒 Autentificare Firebase pentru acces
- 📧 Notificări doar către participanți
- 🗑️ Ștergere automată după expirare

## 📊 Monitorizare

- 📈 Logs pentru toate operațiunile
- ⚠️ Erori captate și raportate
- 📧 Notificări pentru probleme
- 🔍 Tracking pentru utilizare

## 🐛 Troubleshooting

### Probleme comune:

1. **Înregistrarea nu pornește:**
   - Verificați credentialele Agora
   - Verificați permisiunile S3
   - Verificați network connectivity

2. **Email-urile nu se trimit:**
   - Verificați credentialele Gmail
   - Verificați 2FA și App Password
   - Verificați limitele de rate

3. **Descărcarea nu funcționează:**
   - Verificați link-urile signed
   - Verificați expirarea
   - Verificați permisiunile S3

## 🚀 Dezvoltare Viitoare

- [ ] Suport pentru multiple calități
- [ ] Integrace cu alte provideri de stocare
- [ ] Analytics pentru utilizare
- [ ] Opțiuni de partajare link-uri
- [ ] Subtitrări automate
- [ ] Integrace cu calendar 