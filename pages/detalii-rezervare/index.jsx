import dynamic from 'next/dynamic';

// Dynamic import pentru componenta care folosește Firebase
const DoctorUpcomingAppointment = dynamic(
  () => import("../../client/components/doctors/appointments/doctorUpcomingAppointment"),
  { 
    ssr: false, // Dezactivează SSR pentru această componentă
    loading: () => <div>Loading...</div>
  }
);

export default function DetaliiRezervare() {
  return (
    <>
      <DoctorUpcomingAppointment />
    </>
  );
}
