import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// Import dinamic pentru a evita problema SSR cu Agora
const ConferintaGrupAccess = dynamic(
  () => import("../../client/components/conferinta-grup-access"),
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
        <p className="mt-3">Se verifică accesul la conferință...</p>
      </div>
    )
  }
);

export default function ConferintaGrupAccessPage() {
  const router = useRouter();
  const { accessLink } = router.query;

  return (
    <>
      <ConferintaGrupAccess accessLink={accessLink} />
    </>
  );
} 