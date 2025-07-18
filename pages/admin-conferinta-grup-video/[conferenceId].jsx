import { useRouter } from "next/router";
import dynamic from "next/dynamic";

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

  if (!conferenceId) {
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

  return <AdminConferintaGrupVideo conferenceId={conferenceId} />;
} 