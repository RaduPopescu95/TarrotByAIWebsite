# Daily.co Integration Setup

Această integrare adaugă suport pentru Daily.co ca alternativă la sistemul Agora existent pentru video call-uri și înregistrări.

## Caracteristici

- ✅ Video call-uri 1-on-1 între admin și client
- ✅ Înregistrări cloud automate 
- ✅ Chat integrat (folosind sistemul existent)
- ✅ Controluri video/audio
- ✅ Screen sharing
- ✅ Cronometru pentru sesiuni
- ✅ Fallback la sistemul Agora existent
- ✅ Păstrarea componentelor existente intacte

## Configurare

### 1. Obține credențialele Daily.co

1. Mergi la [Daily.co Dashboard](https://dashboard.daily.co/)
2. Creează un cont sau log in
3. Copiază **API Key** din secțiunea API
4. Notează domeniul tău Daily.co (ex: `your-domain.daily.co`)

### 2. Configurează variabilele de mediu

Adaugă următoarele variabile în fișierul `.env.local`:

```bash
# Daily.co Configuration
DAILY_API_KEY=your_daily_api_key_here
DAILY_DOMAIN=your-domain.daily.co
NEXT_PUBLIC_DAILY_DOMAIN=your-domain.daily.co
NEXT_PUBLIC_USE_DAILY_BY_DEFAULT=true
```

### 3. Restart aplicația

```bash
npm run dev
```

## Utilizare

### Activarea Daily.co

Există 3 moduri de a activa Daily.co:

1. **Global (recomandat)**: Setează `NEXT_PUBLIC_USE_DAILY_BY_DEFAULT=true` în `.env.local`
2. **Per URL**: Adaugă `?useDaily=true` la URL-ul de meeting
3. **Per pagină**: Accesează direct `/meeting-daily` sau `/meeting-admin-daily`

### URL-uri disponibile

| URL | Descriere | Sistem |
|-----|-----------|---------|
| `/meeting?meetingCode=X` | Auto-detect (Daily sau Agora) | Configurat prin env |
| `/meeting?meetingCode=X&useDaily=true` | Forțează Daily.co | Daily.co |
| `/meeting?meetingCode=X&useDaily=false` | Forțează Agora | Agora |
| `/meeting-daily?meetingCode=X` | Daily.co direct | Daily.co |
| `/meeting-agora?meetingCode=X` | Agora direct | Agora |

Același pattern se aplică și pentru admin:
- `/meeting-admin?meetingCode=X`
- `/meeting-admin-daily?meetingCode=X` 
- `/meeting-admin-agora?meetingCode=X`

### Exemple de URL-uri

```
# Daily.co cu meetingCode
http://localhost:3000/meeting?meetingCode=05b5fdae-91a2-456c-ba1a-82238ba7d548__4IWu3u6PWWhi5IVBpSYC&useDaily=true

# Admin Daily.co
http://localhost:3000/meeting-admin?meetingCode=05b5fdae-91a2-456c-ba1a-82238ba7d548__4IWu3u6PWWhi5IVBpSYC&useDaily=true

# Direct Daily.co (recomandat pentru testing)
http://localhost:3000/meeting-daily?meetingCode=05b5fdae-91a2-456c-ba1a-82238ba7d548__4IWu3u6PWWhi5IVBpSYC
```

## Funcționalități

### Pentru Client (`/meeting`)
- Video/audio call cu admin
- Controluri mute/unmute
- Screen sharing
- Chat integrat
- Cronometru sesiune
- Notificări timp rămas

### Pentru Admin (`/meeting-admin`)
- Toate funcționalitățile client-ului +
- Control înregistrări (start/stop)
- Indicator înregistrare activă
- Acces la înregistrări în dashboard

### Înregistrări

Înregistrările sunt salvate automat în cloud-ul Daily.co și pot fi accesate prin:
- API endpoint: `/api/daily/recordings`
- Dashboard Daily.co

#### API Recordings

```javascript
// GET - Lista înregistrări
GET /api/daily/recordings?roomName=consultation-documentId&limit=10

// POST - Start înregistrare
POST /api/daily/recordings
{
  "roomName": "consultation-documentId"
}

// DELETE - Stop înregistrare  
DELETE /api/daily/recordings
{
  "roomName": "consultation-documentId"
}
```

## Componente

### Structura fișierelor

```
components/Daily/
├── DailyMeeting.jsx          # Container pentru client
├── DailyAdmin.jsx            # Container pentru admin
└── DailyVideoCallComponent.jsx # Componenta principală

pages/
├── meeting/index.jsx         # Redirect logic (Daily/Agora)
├── meeting-admin/index.jsx   # Redirect logic admin
├── meeting-daily/index.jsx   # Direct Daily.co client
├── meeting-admin-daily/index.jsx # Direct Daily.co admin
├── meeting-agora/index.jsx   # Fallback Agora client
└── meeting-admin-agora/index.jsx # Fallback Agora admin

pages/api/daily/
├── create-room.js           # Creare camere și token-uri
└── recordings.js            # Gestionare înregistrări
```

### Componente principale

1. **DailyMeeting** - Container pentru client
2. **DailyAdmin** - Container pentru admin  
3. **DailyVideoCallComponent** - Logica principală video call

## Integrare cu sistemul existent

### Firebase Integration
- Monitorizează presence în `RezervariConsultatii`
- Sincronizează cronometrul între admin/client
- Gestionează chat cleanup

### Chat Integration
- Folosește componentele existente `RealtimeChat` și `ChatFAB`
- ID-ul chat-ului: `consultation_${documentId}`

### Fallback la Agora
- Sistemul Agora rămâne complet funcțional
- Switch automat sau manual între sisteme
- Zero impact asupra funcționalității existente

## Testing

### 1. Test Basic Call
```bash
# Client
http://localhost:3000/meeting-daily?meetingCode=test123__documentId

# Admin (în alt browser/tab)
http://localhost:3000/meeting-admin-daily?meetingCode=test123__documentId
```

### 2. Test Recording (doar admin)
1. Accesează pagina admin
2. Click pe butonul record (roșu)
3. Verifică indicator "Se înregistrează"
4. Stop înregistrarea

### 3. Test Fallback
```bash
# Forțează Agora
http://localhost:3000/meeting?meetingCode=test123__documentId&useDaily=false
```

## Troubleshooting

### Erori comune

1. **"Daily.co API key not configured"**
   - Verifică că `DAILY_API_KEY` este setat în `.env.local`
   - Restart aplicația

2. **"Daily.co domain not configured"**
   - Verifică că `DAILY_DOMAIN` și `NEXT_PUBLIC_DAILY_DOMAIN` sunt setate
   - Verifică că domeniul este corect (fără https://)

3. **"Failed to create video room"**
   - Verifică că API key-ul este valid
   - Verifică limitele contului Daily.co

4. **Video nu se încarcă**
   - Verifică permisiunile browser pentru cameră/microfon
   - Testează în browser diferit
   - Verifică console pentru erori

### Logs

Pentru debugging, verifică:
```bash
# Browser console
F12 -> Console

# Server logs  
npm run dev # vezi output-ul în terminal
```

## Limitări

- Maxim 2 participanți per cameră (admin + client)
- Înregistrările sunt salvate în cloud-ul Daily.co
- Necesită HTTPS în producție
- Browser support: Chrome 74+, Firefox 67+, Safari 12+

## Migrare graduală

Pentru a migra gradual de la Agora la Daily.co:

1. **Fase 1**: Setează `NEXT_PUBLIC_USE_DAILY_BY_DEFAULT=false` (implicit Agora)
2. **Fase 2**: Testează Daily.co cu `?useDaily=true` pe URL-uri specifice  
3. **Fase 3**: Setează `NEXT_PUBLIC_USE_DAILY_BY_DEFAULT=true` (implicit Daily.co)
4. **Fase 4**: Păstrează Agora ca fallback pentru cazurile problematice

## Support

Pentru probleme:
1. Verifică logs-urile browser și server
2. Testează cu pagini direct (`/meeting-daily`, `/meeting-admin-daily`)
3. Verifică documentația Daily.co: https://docs.daily.co/
4. Contactează echipa de dezvoltare 