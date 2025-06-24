import dynamic from "next/dynamic";

// Import dinamic pentru a evita problema SSR
const AdminConferinteGrup = dynamic(
  () => import("../../client/components/admin-conferinte-grup"),
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
        <p className="mt-3">Se încarcă panoul de administrare...</p>
      </div>
    )
  }
);

export default function AdminConferinteGrupPage() {
  return <AdminConferinteGrup />;
} 