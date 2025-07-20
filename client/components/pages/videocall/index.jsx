// Simplified import - only VideoCall component needed
// AgoraUIKit manages its own client internally, no need for separate provider
import VideoCall from "./video";

export default function Meeting() {
  // Direct export of VideoCall - AgoraUIKit handles all client management
  return <VideoCall />;
}
