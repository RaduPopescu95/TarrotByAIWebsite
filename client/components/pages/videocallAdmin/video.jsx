import React, { useEffect, useState } from "react";
import AgoraUIKit, { layout } from "agora-react-uikit";
import "agora-react-uikit/dist/index.css";
import { useRouter } from "next/router";
import { CallEnd } from "@mui/icons-material";
import Home1Header from "../../home/home-1/header";

const AdminVideoCall = () => {
  const [videocall, setVideocall] = useState(true);
  const [isHost, setHost] = useState(true);
  const [isPinned, setPinned] = useState(false);
  const [username, setUsername] = useState("");
  const appID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const [documentId, setDocumentId] = useState(null);
  const router = useRouter();
  const { meetingCode } = router.query;
  useEffect(() => {
    if (meetingCode) {
      const extractedDocumentId = meetingCode.split("__")[1];
      setDocumentId(extractedDocumentId);
    }
  }, [meetingCode]);
  const customEndCallIcon =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiPgogIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KICA8cGF0aCBkPSJNMjEgMTUuNDZsLTUuMjctNS4yN2MuMDMtLjMuMDUtLjYxLjA1LS45NCAwLTQuNDItMy41OC04LTgtOC0uMzMgMC0uNjUuMDItLjk3LjA1TDguNTQgMy41QzguMTkgMy4zNiA3LjgyIDMuMjcgNy40NCAzLjI3Yy0uNDggMC0uOTcuMTgtMS4zNC41NUwzLjUgNi40M2MtLjM3LjM3LS41NC44Ni0uNTQgMS4zNCAwIC4zOC4wOS43NS4yMyAxLjA5bC41MSAxLjFjLjIxLjQ2LjU4Ljg1IDEuMDQgMS4wOGwyLjIgMS4wNWMuNTEuMjQgMS4wOS4yNiAxLjYxLjA1LjQ4LS4xOC44OC0uNTggMS4wOS0xLjA0bC41Mi0xLjFjLjM0LS43Mi45NC0xLjI4IDEuNjQtMS41Ny41Mi0uMjIgMS4wOC0uMjEgMS41OS4wNWwyLjIgMS4wNWMuNDYuMjIuODUuNiAxLjA4IDEuMDUuMjEuNTIuMjMgMS4xLjA1IDEuNi0uMjkuNy0uODUgMS4zLTEuNTcgMS42NGwtMS4wOS41MWMtLjQ0LjIxLS44MS41OC0xLjA0IDEuMDQtLjIzLjUyLS4yMSAxLjA4LjA1IDEuNTlsMS4wNSAyLjJjLjIzLjQ2LjYuODUgMS4wNSAxLjA4bDEuMS41MWMuMzQuMTUuNy4yMiAxLjA2LjIyLjQ4IDAgLjk3LS4xNyAxLjM0LS41NGwyLjYxLTIuNjFjLjM3LS4zNy41NS0uODYuNTUtMS4zNC0uMDEtLjM5LS4xLS43NS0uMjQtMS4wOXpNMy41IDMuNWwxOCAxOC0xLjQxIDEuNDEtMTgtMThMMy41IDMuNXoiLz4KPC9zdmc+Cg==";

  return (
    <>
      <div className="main-wrapper home-one">
        <Home1Header />
        <div style={styles.container}>
          <div style={styles.videoContainer}>
            {/* <h1 style={styles.heading}>Agora React Web UI Kit</h1> */}
            {videocall ? (
              <>
                {/* <div style={styles.nav}>
              <p style={{ fontSize: 20, width: 200 }}>
                You're {isHost ? "a host" : "an audience"}
              </p>
              <p style={styles.btn} onClick={() => setHost(!isHost)}>
                Change Role
              </p>
              <p style={styles.btn} onClick={() => setPinned(!isPinned)}>
                Change Layout
              </p>
            </div> */}
                <AgoraUIKit
                  rtcProps={{
                    appId: "e17715cba7c84bfc9dbd1b5231b6f86f", // Folosește propriul tău appId
                    channel: documentId,
                    token: null, // Adaugă token-ul tău dacă folosești aplicația în mod securizat
                    role: isHost ? "host" : "audience",
                    layout: isPinned ? layout.pin : layout.grid,
                    enableScreensharing: true,
                  }}
                  rtmProps={{ username: username, displayUsername: true }}
                  callbacks={{
                    EndCall: () => setVideocall(false),
                  }}
                  styleProps={{
                    //   customIcon: {
                    //     callEnd: customEndCallIcon,
                    //   },
                    // Personalizează bara de control
                    // Alte stiluri pentru Agora UIKit
                    localBtnContainer: {
                      backgroundColor: "#ffffff", // Fundal pentru containerul butoanelor locale
                      borderRadius: "8px",
                      border: "2px solid #ffffff",
                      padding: "10px",
                      margin: "10px",
                    },
                    // localBtnStyles: {
                    //   color: "#777777", // Culoarea iconiței
                    // },
                    BtnTemplateStyles: {
                      backgroundColor: "transparent", // Fundal transparent
                      color: "#777777", // Culoarea iconiței
                      borderRadius: "50%", // Colțuri complet rotunde
                      border: "2px solid #f0f0f0", // Bordura albastră
                      //   padding: "12px", // Spațiere pentru a forma un cerc
                      margin: "0 10px", // Spațiere între butoane
                      fontSize: "28px", // Dimensiune mai mare pentru iconițe
                      fontWeight: "bold", // Text îngroșat pentru iconițe
                      transition: "all 0.3s ease-in-out",
                      height: "60px",
                      width: "60px",
                    },
                    UIKitContainer: {
                      backgroundColor: "transparent", // Fundal transparent
                      color: "#f0f0f0", // Culoarea iconiței
                      //   borderRadius: "50%", // Colțuri complet rotunde
                      border: "2px solid #f0f0f0", // Bordura albastră
                      padding: "12px", // Spațiere pentru a forma un cerc
                      margin: "0 10px", // Spațiere între butoane
                      fontSize: "28px", // Dimensiune mai mare pentru iconițe
                      fontWeight: "bold", // Text îngroșat pentru iconițe
                      transition: "all 0.3s ease-in-out",
                    },
                    // gridVideoContainer: {
                    //   backgroundColor: "transparent", // Fundal transparent
                    //   color: "#f0f0f0", // Culoarea iconiței
                    //   //   borderRadius: "50%", // Colțuri complet rotunde
                    //   border: "2px solid #f0f0f0", // Bordura albastră
                    //   padding: "12px", // Spațiere pentru a forma un cerc
                    //   margin: "0 10px", // Spațiere între butoane
                    //   fontSize: "28px", // Dimensiune mai mare pentru iconițe
                    //   fontWeight: "bold", // Text îngroșat pentru iconițe
                    //   transition: "all 0.3s ease-in-out",
                    // },
                    maxViewContainer: {
                      backgroundColor: "#f0f0f0", // Fundal transparent
                      color: "#f0f0f0", // Culoarea iconiței
                      //   borderRadius: "50%", // Colțuri complet rotunde
                      border: "2px solid #f0f0f0", // Bordura albastră
                      padding: "12px", // Spațiere pentru a forma un cerc
                      margin: "0 10px", // Spațiere între butoane
                      fontSize: "28px", // Dimensiune mai mare pentru iconițe
                      fontWeight: "bold", // Text îngroșat pentru iconițe
                      transition: "all 0.3s ease-in-out",
                    },
                    gridVideoCells: {
                      padding: "12px", // Spațiere pentru a forma un cerc
                      margin: "0 10px", // Spațiere între butoane
                      fontSize: "28px", // Dimensiune mai mare pentru iconițe
                      fontWeight: "bold", // Text îngroșat pentru iconițe
                      transition: "all 0.3s ease-in-out",
                    },
                    iconSize: 35,
                    theme: "#777777",
                  }}
                />
              </>
            ) : (
              <div style={styles.nav}>
                <input
                  style={styles.input}
                  placeholder="nickname"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                  }}
                />
                <h3 style={styles.btn} onClick={() => setVideocall(true)}>
                  Start Call
                </h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flex: 1,
    backgroundColor: "#ffffff",
    padding: "12px", // Spațiere pentru a forma un cerc
    paddingTop: "150px",
  },
  heading: { textAlign: "center", marginBottom: 0 },
  videoContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  nav: {
    display: "flex",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
  },
  btn: {
    backgroundColor: "#007bff",
    cursor: "pointer",
    borderRadius: 5,
    padding: "4px 8px",
    color: "#ffffff",
    fontSize: 20,
  },
  input: { display: "flex", height: 24, alignSelf: "center" },
};

export default AdminVideoCall;
