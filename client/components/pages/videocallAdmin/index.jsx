// Simplified import - only AdminVideoCall component needed
// AgoraUIKit manages its own client internally, no need for separate provider
import AdminVideoCall from "./video";

export default function Meeting() {
  // Direct export of AdminVideoCall - AgoraUIKit handles all client management
  return <AdminVideoCall />;
}
