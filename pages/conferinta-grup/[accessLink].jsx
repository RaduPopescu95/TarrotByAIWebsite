import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// Import Daily.co component for conference guests
const DailyConferenceGuest = dynamic(
  () => import("../../components/Daily/DailyConferenceGuest"),
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
        <p className="mt-3">Se pregătește accesul la conferința grup...</p>
      </div>
    )
  }
);

export default function ConferintaGrupAccessPage() {
  const router = useRouter();
  const { accessLink } = router.query;

  console.log('🎥 [DAILY-CONFERENCE-ACCESS] Page loaded with accessLink:', accessLink);

  return (
    <>
      <DailyConferenceGuest />
    </>
  );
} 