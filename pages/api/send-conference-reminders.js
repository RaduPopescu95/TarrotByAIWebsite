import { handleGetFirestore } from '../../utils/firestoreUtils';
import moment from 'moment';
import 'moment/locale/ro';

moment.locale('ro');

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Suportă atât POST body cât și query parameters pentru Vercel cron
    let { type } = req.method === 'POST' ? req.body : req.query;
    
    if (!type || !['day', 'hour'].includes(type)) {
      return res.status(400).json({ error: 'Invalid reminder type. Use "day" or "hour"' });
    }

    console.log(`🔔 Starting ${type} reminder process...`);

    // Fetch toate conferințele active
    const conferinte = await handleGetFirestore('ConferinteGrup');
    const activeConferinte = conferinte.filter(c => c.status === 'activa');

    const now = moment();
    const remindersToSend = [];

    // Identifica conferințele care necesită reminder-uri
    for (const conferinta of activeConferinte) {
      if (!conferinta.participanti || conferinta.participanti.length === 0) {
        continue; // Skip conferințele fără participanți
      }

      const conferenceStart = moment(`${conferinta.dataInceput} ${conferinta.oraInceput}`, 'YYYY-MM-DD HH:mm');
      let shouldSendReminder = false;

      if (type === 'day') {
        // Trimite cu 24 ore înainte
        const oneDayBefore = conferenceStart.clone().subtract(1, 'day');
        const reminderWindow = moment.duration(1, 'hour'); // Fereastra de 1 oră pentru a nu trimite de mai multe ori
        
        if (now.isBetween(oneDayBefore.clone().subtract(reminderWindow), oneDayBefore.clone().add(reminderWindow))) {
          shouldSendReminder = true;
        }
      } else if (type === 'hour') {
        // Trimite cu 1 oră înainte
        const oneHourBefore = conferenceStart.clone().subtract(1, 'hour');
        const reminderWindow = moment.duration(15, 'minutes'); // Fereastra de 15 minute
        
        if (now.isBetween(oneHourBefore.clone().subtract(reminderWindow), oneHourBefore.clone().add(reminderWindow))) {
          shouldSendReminder = true;
        }
      }

      if (shouldSendReminder) {
        // Adaugă toți participanții pentru reminder
        for (const participant of conferinta.participanti) {
          if (participant.status === 'confirmed' && participant.email) {
            remindersToSend.push({
              conferinta: conferinta,
              participant: participant,
              reminderType: type
            });
          }
        }
      }
    }

    console.log(`📧 Found ${remindersToSend.length} reminders to send`);

    // Trimite reminder-urile
    const results = [];
    for (const reminder of remindersToSend) {
      try {
        const emailType = reminder.reminderType === 'day' ? 'reminder_day' : 'reminder_hour';
        
        const emailData = {
          to: reminder.participant.email,
          participantName: reminder.participant.nume,
          conferintaTitle: reminder.conferinta.titlu,
          conferintaType: reminder.conferinta.tipConferinta === 'course' ? 'Curs' : 'Conferință',
          dataInceput: reminder.conferinta.dataInceput,
          dataFinal: reminder.conferinta.dataFinal,
          oraInceput: reminder.conferinta.oraInceput,
          oraFinal: reminder.conferinta.oraFinal,
          accessLink: `${process.env.NEXT_PUBLIC_SITE_URL}/conferinta-grup/${reminder.participant.uniqueAccessLink}`,
          description: reminder.conferinta.descriere,
          emailType: emailType
        };

        // Trimite email-ul prin API-ul nostru
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email-conferinta`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        if (response.ok) {
          results.push({
            success: true,
            email: reminder.participant.email,
            conference: reminder.conferinta.titlu,
            type: reminder.reminderType
          });
          console.log(`✅ Reminder sent to ${reminder.participant.email} for ${reminder.conferinta.titlu}`);
        } else {
          results.push({
            success: false,
            email: reminder.participant.email,
            conference: reminder.conferinta.titlu,
            type: reminder.reminderType,
            error: 'Failed to send email'
          });
          console.error(`❌ Failed to send reminder to ${reminder.participant.email}`);
        }

        // Pauză mică între email-uri pentru a nu overwhelm serverul de email
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        results.push({
          success: false,
          email: reminder.participant.email,
          conference: reminder.conferinta.titlu,
          type: reminder.reminderType,
          error: error.message
        });
        console.error(`❌ Error sending reminder to ${reminder.participant.email}:`, error);
      }
    }

    // Raportează rezultatele
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`🎉 Reminder process completed: ${successCount} successful, ${failureCount} failed`);

    res.status(200).json({
      success: true,
      message: `Reminder process completed`,
      statistics: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      },
      details: results
    });

  } catch (error) {
    console.error('Error in reminder process:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Funcție utilitară pentru testare manuală
export async function testReminders() {
  console.log('🧪 Testing reminder system...');
  
  // Simulează apelul API
  const testPayload = { type: 'day' };
  
  try {
    const response = await fetch('/api/send-conference-reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    console.log('Test result:', result);
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    return { error: error.message };
  }
} 