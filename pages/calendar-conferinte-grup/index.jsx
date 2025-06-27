import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Import dinamic pentru a evita problema SSR
const CalendarConferinteGrup = dynamic(
  () => import("../../client/components/calendar-conferinte-grup"),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Se încarcă...</span>
        </div>
        <p className="mt-3">Se încarcă calendarul...</p>
      </div>
    )
  }
);

export default function CalendarConferinteGrupPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(true); // TEMPORAR: direct autentificat
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // useEffect(() => {
  //   // Verifică dacă există deja o sesiune validă pentru testing
  //   const testingAuth = localStorage.getItem('conferinte_calendar_testing_auth');
  //   if (testingAuth === 'authenticated') {
  //     setIsAuthenticated(true);
  //   }
  //   setIsLoading(false);
  // }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const correctPassword = "1234567890";
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setError("");
      // Salvează autentificarea în localStorage pentru această sesiune
      localStorage.setItem('conferinte_calendar_testing_auth', 'authenticated');
    } else {
      setError("Parolă incorectă");
      // Redirecționează la /consultatii după 2 secunde
      setTimeout(() => {
        router.push('/consultatii');
      }, 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('conferinte_calendar_testing_auth');
    setIsAuthenticated(false);
    setPassword("");
    router.push('/consultatii');
  };

  // Loading state
  // if (isLoading) {
  //   return (
  //     <div style={{ 
  //       display: 'flex', 
  //       justifyContent: 'center', 
  //       alignItems: 'center', 
  //       height: '100vh',
  //       flexDirection: 'column'
  //     }}>
  //       <div className="spinner-border text-primary" role="status">
  //         <span className="visually-hidden">Se verifică accesul...</span>
  //       </div>
  //       <p className="mt-3">Se verifică accesul...</p>
  //     </div>
  //   );
  // }

  // TEMPORAR DEZACTIVAT: Password protection screen
  /*
  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div className="card shadow-lg" style={{ maxWidth: '400px', width: '100%', margin: '20px' }}>
          <div className="card-header bg-primary text-white text-center">
            <h4 className="mb-0">
              <i className="fa fa-lock me-2"></i>
              Acces Protejat - Calendar Conferințe
            </h4>
          </div>
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <i className="fa fa-calendar-alt fa-3x text-primary mb-3"></i>
              <p className="text-muted">
                Calendarul conferințelor este protejat pentru testarea funcționalităților live.
                Introdu parola de acces pentru a continua.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  <i className="fa fa-key me-2"></i>
                  Parolă de acces:
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introdu parola..."
                  required
                  autoFocus
                  style={{
                    padding: '12px',
                    fontSize: '16px',
                    borderRadius: '8px'
                  }}
                />
              </div>

              {error && (
                <div className="alert alert-danger text-center">
                  <i className="fa fa-exclamation-triangle me-2"></i>
                  {error}
                  <br />
                  <small>Vei fi redirecționat în câteva secunde...</small>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary w-100"
                style={{
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                <i className="fa fa-sign-in-alt me-2"></i>
                Acces la Calendar
              </button>
            </form>

            <div className="text-center mt-4">
              <small className="text-muted">
                <i className="fa fa-info-circle me-1"></i>
                Această protecție este temporară pentru testarea live
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }
  */

  // Main calendar interface with logout option
  return (
    <div>
      {/* Logout button în colțul din dreapta sus */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999
      }}>
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger btn-sm"
          title="Ieși din modul de testare"
        >
          <i className="fa fa-sign-out-alt me-2"></i>
          Ieși din Testare
        </button>
      </div>

      <CalendarConferinteGrup />
    </div>
  );
} 