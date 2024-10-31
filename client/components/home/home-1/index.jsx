"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic"; // pentru încărcare dinamică
import Home1Header from "./header";
import AOS from "aos";
import "aos/dist/aos.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Calendar } from "primereact/calendar";
import Image from "next/image";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../../../../context/AuthContext";

// Încărcarea dinamică a componentelor dependente de DOM
const OwlCarousel = dynamic(() => import("react-owl-carousel"), { ssr: false });
const Slider = dynamic(() => import("react-slick"), { ssr: false });

const Home1 = () => {
  const [date1, setDate1] = useState(null);
  const { currentUser, userData, loading, setLoading } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Execută acest cod doar pe client
      AOS.init({
        duration: 1000,
      });

      const handleScroll = () => {
        AOS.refresh();
      };

      // Adaugă un event listener pentru scroll
      window.addEventListener("scroll", handleScroll);

      // Elimină event listener-ul când componenta se demontează
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  // if(loading){
  //   return (    <Box
  //     sx={{
  //       display: "flex",
  //       justifyContent: "center", // Center horizontally
  //       alignItems: "center", // Center vertically
  //       height: "100vh", // Optional: Set a specific height for the centering container
  //     }}
  //   >
  //     <CircularProgress />
  //   </Box>)
  // }

  return (
    <div className="main-wrapper home-one">
      <Home1Header />
      {/* Home Banner */}
      <section className="banner-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 order-2 order-lg-1">
              <div className="banner-content aos" data-aos="fade-up">
                <h1>
                  Ghidare spirituală <span>personalizată</span> pentru
                  echilibrul tău.
                </h1>
                {/* <ImageWithBasePath
                  src="assets/img/icons/header-icon.svg"
                  className="header-icon"
                  alt="header-icon"
                /> */}
                <p>
                  Cristina Zurba – Îndrumare spirituală autentică pentru o viață
                  armonioasă
                </p>
                {/* Daca nu este autentificat functioneaza si fara */}
                <Link href="/calendar" className="btn btn-consult-start">
                  începe consultul
                </Link>
                {/* <div className="banner-arrow-img mt10">
                  <ImageWithBasePath
                    src="assets/img/down-arrow-img.png"
                    className="img-fluid"
                    alt="down-arrow"
                  />
                </div> */}
              </div>
            </div>
            <div className="col-lg-6 order-1 order-lg-2">
              {/* <div className="banner-img aos" data-aos="fade-up"> */}
              <div className="aos" data-aos="fade-up">
                <Image
                  src="/img/banner-image.png" // Calea relativă din folderul public
                  alt="Cristina Zurba"
                  width={512} // Lățimea originală a imaginii
                  height={672} // Înălțimea originală a imaginii
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <Home1Footer /> */}
    </div>
  );
};

export default Home1;
