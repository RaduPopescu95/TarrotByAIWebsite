const axios = require('axios');

export async function sendEmailThroughFirebaseFunction({ fullName, email, finalMessage,phone }) {
    let message = finalMessage
  try {
    const response = await axios.post('https://us-central1-test-b2b-8262d.cloudfunctions.net/sendEmail', {
      fullName,
      email,
      message,
      phone
    });
    if (response.data.success) {
      console.log('Email sent successfully');
    } else {
      console.log('Failed to send email');
    }
  } catch (error) {
    console.error('There was an error sending the email', error);
  }
}
