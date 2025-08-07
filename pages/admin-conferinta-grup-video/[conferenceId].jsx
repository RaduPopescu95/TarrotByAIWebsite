import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// Debug function that only logs in development
const debugLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Import Daily.co component for conference admin
const DailyAdmin = dynamic(
  () => import("../../components/Daily/DailyAdmin"),
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
        <p className="mt-3">Se pregătește conferința video...</p>
      </div>
    )
  }
);

export default function AdminConferintaGrupVideoPage() {
  const router = useRouter();
  const { conferenceId } = router.query;

  debugLog("=== DAILY CONFERENCE ADMIN PAGE LOADED ===");
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

  debugLog("🌟 [DAILY-CONFERENCE] === ADMIN CONFERENCE PAGE INIT ===");
  debugLog("🌟 [DAILY-CONFERENCE] Router query:", router.query);
  debugLog("🌟 [DAILY-CONFERENCE] conferenceId from query:", conferenceId);
  debugLog("🌟 [DAILY-CONFERENCE] conferenceId type:", typeof conferenceId);
  debugLog("🌟 [DAILY-CONFERENCE] Router isReady:", router.isReady);
  debugLog("🌟 [DAILY-CONFERENCE] Router pathname:", router.pathname);
  debugLog("🌟 [DAILY-CONFERENCE] Router asPath:", router.asPath);

  if (!conferenceId) {
    debugLog("⚠️ [DAILY-CONFERENCE] No conferenceId, showing spinner...");
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

  debugLog("✅ [DAILY-CONFERENCE] Conference ID found, rendering Daily.co admin with:", conferenceId);
  
  // Mock meetingCode structure similar to consultations
  const mockMeetingCode = `conference-${conferenceId}__${conferenceId}`;
  
  // Add meetingCode to router query so DailyAdmin can use it
  if (typeof window !== 'undefined' && router.isReady && !router.query.meetingCode) {
    router.replace({
      pathname: router.pathname,
      query: { ...router.query, meetingCode: mockMeetingCode }
    }, undefined, { shallow: true });
  }
  
  return <DailyAdmin />;
} 