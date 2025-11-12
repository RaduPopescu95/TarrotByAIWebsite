/**
 * Script de migrație pentru a adăuga câmpul currentYear la rezervările existente
 * 
 * Acest script:
 * 1. Citește toate rezervările din Firestore
 * 2. Pentru fiecare rezervare fără currentYear, încearcă să determine anul
 * 3. Actualizează rezervarea în Firestore
 * 
 * Utilizare:
 * node scripts/migrateReservationsWithYear.js
 */

const admin = require('firebase-admin');
const moment = require('moment');

// Inițializează Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateReservations() {
  console.log('🚀 Începem migrația rezervărilor...\n');

  try {
    // 1. Obținem toate rezervările
    const snapshot = await db.collection('RezervariConsultatii').get();
    
    console.log(`📊 Total rezervări găsite: ${snapshot.size}\n`);

    let rezervariActualizate = 0;
    let rezervariCuAnDeja = 0;
    let rezervariEroare = 0;

    // 2. Procesăm fiecare rezervare
    for (const doc of snapshot.docs) {
      const rezervare = doc.data();
      const docId = doc.id;

      // Verificăm dacă rezervarea are deja currentYear
      if (rezervare.selectedSlot?.currentYear !== undefined && rezervare.selectedSlot?.currentYear !== null) {
        rezervariCuAnDeja++;
        continue;
      }

      // Încercăm să determinăm anul din selectedSlot
      if (!rezervare.selectedSlot || !rezervare.selectedSlot.day) {
        console.log(`⚠️  Rezervare ${docId} nu are selectedSlot.day, sărim peste`);
        rezervariEroare++;
        continue;
      }

      // Determinăm anul bazat pe data rezervării
      // Presupunem că rezervările vechi sunt din 2024 sau 2025
      let estimatedYear = 2025; // Anul implicit pentru rezervările vechi

      // Dacă avem un timestamp de creare, îl folosim
      if (rezervare.createdAt) {
        const createdDate = rezervare.createdAt.toDate ? rezervare.createdAt.toDate() : new Date(rezervare.createdAt);
        estimatedYear = createdDate.getFullYear();
      } else {
        // Altfel, încercăm să estimăm bazat pe luna din selectedSlot.day
        const [month] = rezervare.selectedSlot.day.split('-').map(Number);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Dacă luna rezervării este în viitor față de luna curentă, probabil e din anul viitor
        if (month > currentMonth + 1) {
          estimatedYear = currentYear - 1; // Probabil din anul trecut
        } else {
          estimatedYear = currentYear;
        }
      }

      console.log(`📝 Actualizez rezervarea ${docId} cu anul ${estimatedYear}`);

      // Actualizăm rezervarea
      try {
        await db.collection('RezervariConsultatii').doc(docId).update({
          'selectedSlot.currentYear': estimatedYear
        });
        rezervariActualizate++;
      } catch (error) {
        console.error(`❌ Eroare la actualizarea rezervării ${docId}:`, error.message);
        rezervariEroare++;
      }
    }

    console.log('\n✅ Migrație completă!\n');
    console.log(`📊 Statistici:`);
    console.log(`   - Total rezervări: ${snapshot.size}`);
    console.log(`   - Rezervări cu currentYear deja setat: ${rezervariCuAnDeja}`);
    console.log(`   - Rezervări actualizate: ${rezervariActualizate}`);
    console.log(`   - Rezervări cu erori: ${rezervariEroare}`);

  } catch (error) {
    console.error('❌ Eroare la migrație:', error);
    throw error;
  } finally {
    // Închide conexiunea
    await admin.app().delete();
  }
}

// Rulează migrația
migrateReservations()
  .then(() => {
    console.log('\n🎉 Script finalizat cu succes!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script finalizat cu erori:', error);
    process.exit(1);
  });

