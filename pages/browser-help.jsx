import React from 'react';
import Home1Header from '../client/components/home/home-1/header';

const BrowserHelp = () => {
  return (
    <div className="main-wrapper">
      <Home1Header />
      <div style={styles.container}>
        <div style={styles.content}>
          <h1>Ajutor pentru Video Call</h1>
          
          <div style={styles.section}>
            <h2>🌐 Browsere Recomandate</h2>
            <div style={styles.browserGrid}>
              <div style={styles.browserCard}>
                <h3>Google Chrome</h3>
                <p>Versiunea 74+ (Recomandat)</p>
                <p>✅ Suport complet WebRTC</p>
              </div>
              <div style={styles.browserCard}>
                <h3>Mozilla Firefox</h3>
                <p>Versiunea 67+</p>
                <p>✅ Suport complet WebRTC</p>
              </div>
              <div style={styles.browserCard}>
                <h3>Safari</h3>
                <p>Versiunea 12+</p>
                <p>⚠️ Suport limitat pe versiuni vechi</p>
              </div>
              <div style={styles.browserCard}>
                <h3>Microsoft Edge</h3>
                <p>Versiunea 79+</p>
                <p>✅ Suport complet WebRTC</p>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2>🔧 Rezolvarea Problemelor</h2>
            
            <div style={styles.problemSection}>
              <h3>❌ Nu se încarcă camera/microfonul</h3>
              <ol style={styles.stepsList}>
                <li>Verificați că browserul are permisiuni pentru cameră/microfon</li>
                <li>Apăsați pe iconița de cameră din bara de adrese</li>
                <li>Selectați "Permite întotdeauna" pentru acest site</li>
                <li>Reîncărcați pagina</li>
                <li>Verificați că alte aplicații nu folosesc camera</li>
              </ol>
            </div>

            <div style={styles.problemSection}>
              <h3>⚠️ Erori de conexiune</h3>
              <ol style={styles.stepsList}>
                <li>Verificați conexiunea la internet</li>
                <li>Dezactivați temporar extensiile (AdBlock, uBlock Origin)</li>
                <li>Încercați în modul incognito/privat</li>
                <li>Verificați că site-ul este accesat prin HTTPS</li>
              </ol>
            </div>

            <div style={styles.problemSection}>
              <h3>🚫 Browserul nu este compatibil</h3>
              <ol style={styles.stepsList}>
                <li>Actualizați browserul la ultima versiune</li>
                <li>Încercați un alt browser din lista recomandată</li>
                <li>Verificați că JavaScript este activat</li>
                <li>Dezactivați extensiile care pot bloca WebRTC</li>
              </ol>
            </div>
          </div>

          <div style={styles.section}>
            <h2>📱 Dispozitive Mobile</h2>
            <div style={styles.mobileSection}>
              <h3>iOS (iPhone/iPad)</h3>
              <ul style={styles.mobileList}>
                <li>Safari 12+ (recomandat)</li>
                <li>Chrome pentru iOS (cu limitări)</li>
                <li>Permisiuni necesare: Cameră, Microfon</li>
              </ul>
            </div>
            <div style={styles.mobileSection}>
              <h3>Android</h3>
              <ul style={styles.mobileList}>
                <li>Chrome 74+ (recomandat)</li>
                <li>Firefox 67+</li>
                <li>Samsung Internet 9+</li>
              </ul>
            </div>
          </div>

          <div style={styles.section}>
            <h2>🔍 Verificare Rapidă</h2>
            <div style={styles.checkSection}>
              <button 
                style={styles.checkButton}
                onClick={() => {
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                      .then(() => alert('✅ Browserul dumneavoastră suportă video call!'))
                      .catch(() => alert('❌ Vă rugăm să permiteți accesul la cameră și microfon.'));
                  } else {
                    alert('❌ Browserul dumneavoastră nu suportă video call. Vă rugăm să actualizați browserul.');
                  }
                }}
              >
                Testează Compatibilitatea
              </button>
              <p style={styles.checkNote}>
                Acest test va verifica dacă browserul dumneavoastră poate accesa camera și microfonul.
              </p>
            </div>
          </div>

          <div style={styles.section}>
            <h2>📞 Suport Tehnic</h2>
            <p>
              Dacă continuați să aveți probleme, vă rugăm să ne contactați cu următoarele informații:
            </p>
            <ul style={styles.supportList}>
              <li>Browserul și versiunea folosită</li>
              <li>Sistemul de operare</li>
              <li>Mesajul de eroare exact</li>
              <li>Pașii efectuați pentru a rezolva problema</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: '40px',
  },
  browserGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  browserCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  problemSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  stepsList: {
    paddingLeft: '20px',
    lineHeight: '1.6',
  },
  mobileSection: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#e9ecef',
    borderRadius: '6px',
  },
  mobileList: {
    paddingLeft: '20px',
    lineHeight: '1.6',
  },
  checkSection: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f0f8ff',
    borderRadius: '8px',
  },
  checkButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  checkNote: {
    color: '#666',
    fontSize: '14px',
    fontStyle: 'italic',
  },
  supportList: {
    paddingLeft: '20px',
    lineHeight: '1.6',
  },
};

export default BrowserHelp; 