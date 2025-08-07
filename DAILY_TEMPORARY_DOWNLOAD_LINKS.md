# Daily.co Temporary Download Links System

## 🎯 Overview

This system implements **secure temporary download links** for Daily.co recordings using the [Daily.co `/recordings/:id/access-link` API](https://docs.daily.co/reference/rest-api/recordings/get-recording-link). Links are valid for **12 hours only** and are generated fresh for each recording completion.

## 🔗 How It Works

### 1. **Recording Completion Flow**
```
📹 Recording Finished
    ↓
🪝 Daily.co Webhook: `recording.ready-to-download`
    ↓
🔗 Generate Temporary Link (12h validity)
    ↓
📧 Send Email with Secure Link
    ↓
⏰ Link Expires After 12 Hours
```

### 2. **API Endpoints**

#### `/api/daily/get-recording-link` (NEW)
- **Method**: `POST`
- **Purpose**: Generate temporary download links
- **Input**: `{ recordingId: "recording-id" }`
- **Output**: 
```json
{
  "success": true,
  "downloadLink": "https://...",
  "expires": 1754598400,
  "expiresAt": "2025-08-07T20:00:00.000Z",
  "validForHours": 12,
  "recordingId": "recording-id"
}
```

#### `/api/daily/webhook` (UPDATED)
- Now generates temporary links instead of using direct URLs
- Calls `/get-recording-link` for each recording
- Includes expiry information in email data

#### `/api/daily/send-recording-email` (UPDATED)
- **New Parameter**: `linkExpires` (unix timestamp)
- Updates email template with expiry warnings
- Shows formatted expiry date in Romanian

## 📧 Email Template Updates

### ⚠️ **New Expiry Warning Section**
```html
<div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px;">
  <p style="color: #721c24; font-weight: 600;">
    ⏰ <strong>ATENȚIE - LINK TEMPORAR!</strong><br/>
    Link-ul expiră pe <strong>7 august 2025, 23:00</strong> (în 12 ore).<br/>
    După această dată nu vei mai putea descărca înregistrarea.
  </p>
</div>
```

### 🔒 **Updated Security Information**
- ✅ Link expires in 12 hours (not 30 days)
- ✅ Can download multiple times within valid period
- ✅ Clear expiry date and time shown
- ✅ Urgent download recommendation

## 🎯 Supported Session Types

| Session Type | Recording Admin | Max Duration | Email Sent To |
|-------------|----------------|--------------|---------------|
| **Consultații** | ✅ Admin (Cristina) | No limit | Client |
| **Conferințe Grup** | ✅ Admin (Cristina) | No limit | Depends on implementation |

## 🔧 Configuration

### Environment Variables
```bash
# Daily.co API Key (required)
DAILY_API_KEY=your_daily_api_key

# Site URL for internal API calls
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Email configuration (existing)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Webhook Configuration
Daily.co webhook should point to:
```
https://your-domain.com/api/daily/webhook
```

Events to listen for:
- `recording.ready-to-download` ✅ **Primary event**
- `recording.finished` ✅ **Backup event**
- `recording.error` ✅ **Error handling**

## 🚀 Benefits

### 🔒 **Enhanced Security**
- **12-hour expiry**: Links automatically become invalid
- **Cryptographically signed**: Can't be guessed or forged
- **Single-use generation**: Fresh link for each recording

### 📱 **Better User Experience**
- **Clear expiry warnings**: Users know exactly when link expires
- **Multiple downloads**: Can download same file multiple times
- **No account needed**: Direct download without Daily.co login

### 🛡️ **Compliance & Control**
- **Automatic cleanup**: Links expire automatically
- **No permanent URLs**: Reduces long-term security risk
- **Audit trail**: Firebase tracks link generation and expiry

## 🧪 Testing

### Test Temporary Link Generation
```bash
curl -X POST http://localhost:3000/api/daily/get-recording-link \
  -H "Content-Type: application/json" \
  -d '{"recordingId": "real-recording-id"}'
```

### Test Complete Webhook Flow
```bash
curl -X POST http://localhost:3000/api/daily/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "recording.ready-to-download",
    "room": {"name": "consultation-test-123"},
    "recording": {"id": "rec-456", "duration": 1800}
  }'
```

### Test Email with Expiry
```bash
curl -X POST http://localhost:3000/api/daily/test-recording-email \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-expiry",
    "recordingUrl": "https://example.com/rec.mp4",
    "linkExpires": 1754598400
  }'
```

## 📊 Firebase Schema Updates

### New Fields in `RezervariConsultatii`
```javascript
{
  recording: {
    status: 'ready',
    dailyRecordingId: 'rec-12345',
    downloadUrl: 'https://...', // Temporary link
    linkExpires: new Date(), // When link expires
    duration: 1800,
    readyAt: new Date(),
    webhookProcessed: true
  }
}
```

## 🔄 Migration Notes

### ✅ **What Changed**
- Webhook now generates temporary links
- Email template includes expiry warnings
- Firebase stores link expiry time
- Links are valid for 12 hours only

### ✅ **What Stayed Same**
- Same webhook events supported
- Same email trigger flow
- Same recording permissions (admin only)
- Same Firebase collection structure

### ⚠️ **Important Notes**
- **Old permanent links** (if any) will still work until Daily.co removes them
- **12-hour limit** is enforced by Daily.co (max allowed)
- **Multiple downloads** are allowed within the 12-hour window
- **Link regeneration** is not automatic - each recording gets one temporary link

## 🆘 Troubleshooting

### Link Generation Fails
1. Check `DAILY_API_KEY` is valid
2. Verify recording ID exists in Daily.co
3. Check Daily.co API rate limits
4. Review webhook logs in console

### Email Not Sent
1. Check temporary link was generated successfully
2. Verify Firebase reservation data exists
3. Check email configuration
4. Review email sending logs

### Link Expired
- Links expire after 12 hours automatically
- **No way to extend** - must create new recording
- **No regeneration** - one link per recording

## 🎯 Future Enhancements

### Possible Improvements
- [ ] Email reminder 2 hours before expiry
- [ ] Multiple link generation for same recording
- [ ] Custom expiry duration (if Daily.co supports it)
- [ ] Download analytics and tracking

### Current Limitations
- ⏰ **12-hour max validity** (Daily.co limitation)
- 🔄 **No link regeneration** (one chance per recording)
- 📧 **Single email notification** (no reminders)

---

**Last Updated**: August 7, 2025  
**System Status**: ✅ **ACTIVE** - Temporary download links enabled for all recordings 