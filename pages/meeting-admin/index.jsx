import DoctorDashboard from "../../client/components/doctors/dashboard";
import LoginContainer from "../../client/components/login/login";
import LoginClient from "../../client/components/loginClient/LoginClient";
// import VideoCall from "../../client/components/pages/videocallAdmin";
import Booking from "../../client/components/patients/booking/booking1";
import dynamic from "next/dynamic";

const VideoCall = dynamic(
  () => import("../../client/components/pages/videocallAdmin"),
  { ssr: false }
);

export default function Meeting() {
  return (
    <>
      <VideoCall />
    </>
  );
}
