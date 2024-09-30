import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AgoraRTC from "agora-rtc-sdk-ng";
import { PhoneOff } from "feather-icons-react/build/IconComponents";
import Home1Header from "../../home/home-1/header";

const AGORA_APP_ID = 'e17715cba7c84bfc9dbd1b5231b6f86f';

const AdminVideoCall = () => {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [meetingActive, setMeetingActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const userVideoRef = useRef();
  const remoteVideoRef = useRef();
  const { meetingCode } = router.query;
  const [documentId, setDocumentId] = useState(null);

  // Extrage ID-ul documentului din codul întâlnirii
  useEffect(() => {
    if (meetingCode) {
      const extractedDocumentId = meetingCode.split("__")[1];
      setDocumentId(extractedDocumentId);
    }
  }, [meetingCode]);

  // Initializează Agora și setează clientul și fluxurile video/audio
  useEffect(() => {
    if (documentId) {
      document.body.classList.add("call-page");

      const initAgora = async () => {
        try {
          const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
          setClient(agoraClient);

          agoraClient.on("user-published", handleUserPublished);
          agoraClient.on("user-unpublished", handleUserUnpublished);

          const userId = Math.floor(Math.random() * 10000); // UID unic pentru fiecare sesiune
          await agoraClient.join(AGORA_APP_ID, documentId, null, userId);

          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          setLocalAudioTrack(audioTrack);
          setLocalVideoTrack(videoTrack);

          await agoraClient.publish([audioTrack, videoTrack]);

          videoTrack.play(userVideoRef.current);

          setLoading(false);
          setMeetingActive(true);
        } catch (error) {
          console.error("Eroare la inițializarea Agora:", error);
          setLoading(false);
        }
      };

      initAgora();

      // Curăță resursele Agora la demontarea componentei
      return () => {
        if (client) {
          client.leave();
        }
      };
    }
  }, [documentId]);

  // Gestionarea evenimentului de publicare a unui utilizator
  const handleUserPublished = async (user, mediaType) => {
    if (client) { // Verifică dacă `client` este definit înainte de a folosi `subscribe`
      await client.subscribe(user, mediaType);
      if (mediaType === "video") {
        user.videoTrack.play(remoteVideoRef.current);
      }
      setRemoteUsers((prevUsers) => [...prevUsers, user]);
    }
  };

  // Gestionarea evenimentului de dezabonare a unui utilizator
  const handleUserUnpublished = (user) => {
    setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
  };

  // Toggle video
  const handleVideoToggle = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(!videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  };

  // Toggle audio
  const handleAudioToggle = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!audioEnabled);
      setAudioEnabled(!audioEnabled);
    }
  };

  // Închide apelul
  const handleEndCall = async () => {
    if (client) {
      client.leave();
    }
    router.push("/consultatii");
  };

  // Formatează timpul apelului
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <>
      <Home1Header />
      <div className="content top-space">
        <div className="container">
          <div className="call-wrapper">
            <div className="call-main-row">
              <div className="call-main-wrapper">
                <div className="call-view">
                  <div className="call-window">
                  
                    <div className="call-contents">
                      <div className="call-content-wrap">
                        {/* Video-ul remote (client de pe cealaltă parte) */}
                        <div className="user-video">
                          {true ? (
                            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%" }}></video>
                          ) : (
                            <div className="text-center">
                              <h2>Întâlnirea nu a fost activată.</h2>
                              <p>Activează întâlnirea pentru a permite clientului să se alăture.</p>
                            </div>
                          )}
                        </div>
                   
                      </div>
                    </div>
                    <div className="call-footer">
                      <div className="call-icons">
                        {/* <span className="call-duration">{formatTime(callTime)}</span> */}
                        <ul className="call-items">
                          <li className="call-item">
                            <Link href="#" title="Enable Video" data-placement="top" data-bs-toggle="tooltip" onClick={handleVideoToggle}>
                              <i className="fas fa-video camera" style={{ color: !videoEnabled && "white" }} />
                            </Link>
                          </li>
                          <li className="call-item">
                            <Link href="#" title="Mute Audio" data-placement="top" data-bs-toggle="tooltip" onClick={handleAudioToggle}>
                              {audioEnabled ? <i className="fa fa-microphone microphone" /> : <i className="fa fa-microphone-slash microphone" />}
                            </Link>
                          </li>
                        </ul>
                        {/* <div className="end-call">
                          <Link href="#" onClick={handleShowModal}>
                            <PhoneOff />
                          </Link>
                        </div> */}
                      </div>
                    </div>
                    {showModal && (
                      <div className="modal show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                          <div className="modal-content">
                            <div className="modal-header">
                              <h5 className="modal-title">Închide Apelul</h5>
                              <button type="button" className="btn-close" onClick={handleEndCall}></button>
                            </div>
                            <div className="modal-body">
                              <p>Ești sigur că vrei să închizi apelul?</p>
                            </div>
                            <div className="modal-footer">
                              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Anulează
                              </button>
                              <button type="button" className="btn btn-danger" onClick={handleEndCall}>
                                Închide Apelul
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminVideoCall;
