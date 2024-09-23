import React, { useEffect, useRef, useState } from "react";

// import { Tooltip, OverlayTrigger } from "react-bootstrap";
import Link from "next/link";
// import Header from "../../header";
import { PhoneOff } from "feather-icons-react/build/IconComponents";
import Home1Header from "../../home/home-1/header";
import { useRouter } from "next/router";

const VideoCall = (props) => {
  const [stream, setStream] = useState(null); // Salvează fluxul video
  const [videoEnabled, setVideoEnabled] = useState(true); // Starea pentru video activ/inactiv
  const [audioEnabled, setAudioEnabled] = useState(true); // Starea pentru audio activ/inactiv
  const [showModal, setShowModal] = useState(true); // Starea pentru audio activ/inactiv
  const [callTime, setCallTime] = useState(0); // Starea pentru durata apelului în secunde
  const userVideoRef = useRef(); // Referință pentru video-ul utilizatorului
  const router = useRouter()

  useEffect(() => {
    document.body.classList.add("call-page");

    // Accesează camera și microfonul utilizatorului
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream); // Stochează fluxul video/audio
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream; // Afișează fluxul utilizatorului
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

    // Start timer pentru apel
    const timer = setInterval(() => {
      setCallTime((prevTime) => prevTime + 1); // Actualizează timpul apelului la fiecare secundă
    }, 1000);

    return () => {
      document.body.classList.remove("call-page");
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      clearInterval(timer); // Oprește timer-ul când componenta este demontată
    };
  }, []);

  const handleVideoToggle = (e) => {
    e.preventDefault();

    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled; // Activează sau dezactivează fluxul video
        setVideoEnabled(videoTrack.enabled); // Actualizează starea locală
      }
    }
  };

  const handleAudioToggle = (e) => {
    e.preventDefault();

    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled; // Activează sau dezactivează fluxul audio
        setAudioEnabled(audioTrack.enabled); // Actualizează starea locală
      }
    }
  };

  // Formatează durata apelului în minute și secunde
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };


  // Afișează modalul pentru confirmarea închiderii apelului
  const handleShowModal = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  // Confirmă închiderea apelului
  const handleEndCall = () => {
    // Închide fluxurile și resetează starea
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setShowModal(false); // Închide modalul
    router.push("/consultatii")
    // Aici poți adăuga logica pentru a redirecționa sau a închide întâlnirea
  };

  // Anulează închiderea apelului
  const handleCloseModal = () => {
    setShowModal(false); // Închide modalul fără a încheia apelul
  };


  return (
    <>
 <Home1Header />
      <>
        {/* Page Content */}
        <div className="content top-space">
          <div className="container">
            {/* Call Wrapper */}
            <div className="call-wrapper">
              <div className="call-main-row">
                <div className="call-main-wrapper">
                  <div className="call-view">
                    <div className="call-window">
                      {/* Call Header */}
                      {/* <div className="fixed-header">
                        <div className="navbar">
                          <div className="user-details">
                            <div className="float-start user-img">
                              <Link
                                className="avatar avatar-sm me-2"
                                href="doctor/patient-profile"
                                title="Charlene Reed"
                              >
                                <img
                                  src={"/img/userprofile.png"}
                                  alt="User Image"
                                  className="rounded-circle"
                                />
                                <span className="status online" />
                              </Link>
                            </div>
                            <div className="user-info float-start">
                              <Link href="doctor/patient-profile">
                                <span>Charlene Reed</span>
                              </Link>
                              <span className="last-seen">Online</span>
                            </div>
                          </div>
                          <ul className="nav float-end custom-menu">
                            <li className="nav-item dropdown dropdown-action">
                              <Link
                                href="#"
                                className="nav-link dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <i className="fa fa-cog" />
                              </Link>
                              <div className="dropdown-menu dropdown-menu-end">
                                <Link href="#" className="dropdown-item">
                                  Settings
                                </Link>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div> */}
                      {/* /Call Header */}
                      {/* Call Contents */}
                      <div className="call-contents">
                        <div className="call-content-wrap">
                          <div className="user-video">
                          {/* <video
                            ref={userVideoRef}
                            autoPlay
                            playsInline
                            style={{ width: "100%" }}
                          ></video>                       */}
                              </div>
                          <div className="my-video">
                            <ul>
                              <li>
                              <video
                            ref={userVideoRef}
                            autoPlay
                            playsInline
                            style={{ width: "100%" }}
                          ></video>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      {/* Call Contents */}
                      {/* Call Footer */}
                      <div className="call-footer">
                        <div className="call-icons">
                        <span className="call-duration">
                          {formatTime(callTime)}
                        </span>
                          <ul className="call-items">
                            <li className="call-item">
                              <Link
                                href="#"
                                title="Enable Video"
                                data-placement="top"
                                data-bs-toggle="tooltip"
                                style={{  backgroundColor: videoEnabled ? "transparent" :"red" }} 

                                onClick={handleVideoToggle} // Funcție pentru gestionarea clicului
                              >
                                <i className="fas fa-video camera" 
                                                                style={{  color: !videoEnabled && "white" }} 

                                />
                              </Link>
                            </li>
                            <li className="call-item"   >
                              <Link
                                href="#"
                                title="Mute Audio"
                                data-placement="top"
                                data-bs-toggle="tooltip"
                                onClick={handleAudioToggle}
                                style={{  backgroundColor: audioEnabled ? "transparent" :"red" }} 
                              >
                                {audioEnabled
                                ?
                                <i className="fa fa-microphone microphone" />
                                :
                                <i 
  className="fa fa-microphone-slash microphone" 
  style={{ position: 'relative', right: '3px', color:"white" }} 
/>
                                }

                              </Link>
                            </li>
                            {/* <li className="call-item">
                              <Link
                                href="#"
                                title="Add User"
                                data-placement="top"
                                data-bs-toggle="tooltip"
                              >
                                <i className="fa fa-user-plus" />
                              </Link>
                            </li> */}
                            {/* <li className="call-item">
                              <Link
                                href="#"
                                title="Full Screen"
                                data-placement="top"
                                data-bs-toggle="tooltip"
                              >
                                <i className="fas fa-arrows-alt-v full-screen" />
                              </Link>
                            </li> */}
                          </ul>
                          <div className="end-call">
                            <Link href="#" onClick={handleShowModal}>
                              <PhoneOff />
                            </Link>
                          </div>
                        </div>
                      </div>
                      {/* /Call Footer */}
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
            {/* /Call Wrapper */}
            
          </div>
          
        </div>
        {/* /Page Content */}
          {/* Modal pentru confirmarea închiderii apelului */}
          {showModal && (
    <div className="modal show d-block" tabIndex="-1">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Închide Apelul</h5>
          <button
            type="button"
            className="btn-close"
            onClick={handleCloseModal}
          ></button>
        </div>
        <div className="modal-body">
          <p>Ești sigur că vrei să închizi apelul?</p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCloseModal}
          >
            Anulează
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleEndCall}
          >
            Închide Apelul
          </button>
        </div>
      </div>
    </div>
  </div>
  
      )}
      </>
    </>
  );
};

export default VideoCall;
