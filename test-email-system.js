// Script de test pentru sistemul de email
// Rulează cu: node test-email-system.js

const testEmailSystem = async () => {
  console.log("🧪 [TEST] Testez sistemul de email pentru conferințe...");

  const testData = {
    participantData: {
      nume: "Popescu",
      prenume: "Maria",
      email: "test@example.com" // Înlocuiește cu email-ul tău pentru test
    },
    conferintaData: {
      titlu: "Conferință Test - Ghidare Spirituală",
      descriere: "Aceasta este o conferință de test pentru sistemul de email.",
      tipConferinta: "single", // sau "course"
      dataInceput: "2024-01-15",
      dataFinal: null,
      oraInceput: "19:00",
      oraFinal: null,
      pretParticipare: 150
    },
    accessLink: "test_access_link_12345",
    isTestMode: true
  };

  try {
    console.log("📧 [TEST] Trimit request către API...");
    
    const response = await fetch('http://localhost:3000/api/send-email-conferinta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ [TEST] Email trimis cu succes!");
      console.log("✅ [TEST] Message ID:", result.messageId);
      console.log("✅ [TEST] Response:", result.message);
    } else {
      console.log("❌ [TEST] Eroare la trimiterea emailului:");
      console.log("❌ [TEST] Error:", result.error);
      console.log("❌ [TEST] Details:", result.details);
    }

  } catch (error) {
    console.error("💥 [TEST] Eroare la testarea sistemului:");
    console.error("💥 [TEST] Error:", error.message);
  }
};

// Testez și pentru un curs
const testCourseEmail = async () => {
  console.log("\n🧪 [TEST] Testez email pentru curs...");

  const courseData = {
    participantData: {
      nume: "Ionescu",
      prenume: "Ana",
      email: "test-course@example.com" // Înlocuiește cu email-ul tău pentru test
    },
    conferintaData: {
      titlu: "Curs Complet - Tarot și Intuiție",
      descriere: "Un curs complet de 5 zile despre dezvoltarea intuiției prin tarot.",
      tipConferinta: "course",
      dataInceput: "2024-01-20",
      dataFinal: "2024-01-24",
      oraInceput: "18:00",
      oraFinal: "21:00",
      pretParticipare: 450
    },
    accessLink: "test_course_access_link_67890",
    isTestMode: true
  };

  try {
    const response = await fetch('http://localhost:3000/api/send-email-conferinta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ [TEST COURSE] Email curs trimis cu succes!");
      console.log("✅ [TEST COURSE] Message ID:", result.messageId);
    } else {
      console.log("❌ [TEST COURSE] Eroare:", result.error);
    }

  } catch (error) {
    console.error("💥 [TEST COURSE] Eroare:", error.message);
  }
};

// Instrucțiuni de utilizare
console.log(`
🧪 SISTEM TEST EMAIL CONFERINȚE
================================

Pentru a testa sistemul:

1. Pornește serverul Next.js:
   npm run dev

2. Înlocuiește email-urile de test cu ale tale în acest fișier

3. Rulează testele:
   node test-email-system.js

4. Verifică inbox-ul pentru emailurile de test

ATENȚIE: Asigură-te că serverul rulează pe localhost:3000
`);

// Rulează testele dacă scriptul este executat direct
if (require.main === module) {
  (async () => {
    await testEmailSystem();
    await testCourseEmail();
  })();
}

module.exports = { testEmailSystem, testCourseEmail }; 