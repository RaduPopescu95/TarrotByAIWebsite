import dynamic from "next/dynamic";

const DailyAdmin = dynamic(
  () => import("../../components/Daily/DailyAdmin"),
  { ssr: false }
);

export default function MeetingAdminDaily() {
  return (
    <>
      <DailyAdmin />
    </>
  );
} 