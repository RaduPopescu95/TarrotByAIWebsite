import { useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const DailyMeeting = dynamic(
  () => import("../../components/Daily/DailyMeeting"),
  { ssr: false }
);

export default function Meeting() {
  const router = useRouter();
  const { meetingCode, useDaily } = router.query;

  // Check if we should use Daily.co or fallback to Agora
  // Default to Daily.co if Daily credentials are available, unless explicitly disabled
  const shouldUseDaily = useDaily !== 'false' && (useDaily === 'true' || process.env.NEXT_PUBLIC_USE_DAILY_BY_DEFAULT === 'true' || process.env.NEXT_PUBLIC_DAILY_DOMAIN);

  useEffect(() => {
    // If meetingCode is present and we should use Daily, redirect to Daily meeting
    if (meetingCode && shouldUseDaily) {
      // Use Daily.co - render DailyMeeting component
      return;
    } else if (meetingCode && !shouldUseDaily) {
      // Use legacy Agora system - redirect to existing meeting page
      router.push(`/meeting-agora?meetingCode=${meetingCode}`);
      return;
    }
  }, [meetingCode, shouldUseDaily, router]);

  if (meetingCode && shouldUseDaily) {
    return <DailyMeeting />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h3>Se încarcă interfața video...</h3>
        <p>Vă rugăm să așteptați</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8f9fa',
  },
  content: {
    textAlign: 'center',
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
};
