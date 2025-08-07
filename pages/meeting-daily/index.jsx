import dynamic from "next/dynamic";

const DailyMeeting = dynamic(
  () => import("../../components/Daily/DailyMeeting"),
  { ssr: false }
);

export default function MeetingDaily() {
  return (
    <>
      <DailyMeeting />
    </>
  );
} 