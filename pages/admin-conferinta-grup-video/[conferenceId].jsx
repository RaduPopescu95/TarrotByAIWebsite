import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// Debug function that only logs in development
const debugLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Import dinamic pentru a evita problema SSR cu Agora
const AdminConferintaGrupVideo = dynamic(
  () => import("../../client/components/admin-conferinta-grup-video"),
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
        <p className="mt-3">Se încarcă interfața video...</p>
      </div>
    )
  }
);

export default function AdminConferintaGrupVideoPage() {
  const router = useRouter();
  const { conferenceId } = router.query;

  debugLog("=== PAGE LOADED ===");
  debugLog("conferenceId from router:", conferenceId);
  debugLog("DEBUGGING: Router isReady:", router.isReady);
  debugLog("DEBUGGING: Router query:", router.query);
  
  // Use client-side alert only
  if (typeof window !== 'undefined') {
    if (conferenceId) {
      debugLog(`✅ PAGE: Conference ID found: ${conferenceId}`);
    } else {
      debugLog("⚠️ PAGE: No conference ID yet");
    }
  }

  debugLog("🌟 [PAGE] === ADMIN CONFERENCE PAGE INIT ===");
  debugLog("🌟 [PAGE] Router query:", router.query);
  debugLog("🌟 [PAGE] conferenceId from query:", conferenceId);
  debugLog("🌟 [PAGE] conferenceId type:", typeof conferenceId);
  debugLog("🌟 [PAGE] Router isReady:", router.isReady);
  debugLog("🌟 [PAGE] Router pathname:", router.pathname);
  debugLog("🌟 [PAGE] Router asPath:", router.asPath);

  if (!conferenceId) {
    debugLog("⚠️ [PAGE] No conferenceId, showing spinner...");
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  debugLog("✅ [PAGE] Conference ID found, rendering component with:", conferenceId);
  return <AdminConferintaGrupVideo conferenceId={conferenceId} />;
} 