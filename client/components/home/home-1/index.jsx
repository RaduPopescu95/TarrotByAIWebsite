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

// Încărcarea dinamică a componentelor dependente de DOM
const OwlCarousel = dynamic(() => import("react-owl-carousel"), { ssr: false });
const Slider = dynamic(() => import("react-slick"), { ssr: false });

const Home1 = () => {
  const [date1, setDate1] = useState(null);

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

  const specialitiesSlider = {
    loop: true,
    margin: 24,
    dots: false,
    nav: true,
    smartSpeed: 2000,
    navContainer: ".slide-nav-1",
    navText: [
      '<i class="fas fa-chevron-left custom-arrow"></i>',
      '<i class="fas fa-chevron-right custom-arrow"></i>',
    ],
    responsive: {
      0: {
        items: 1,
      },
      500: {
        items: 1,
      },
      768: {
        items: 2,
      },
      1000: {
        items: 3,
      },
      1300: {
        items: 6,
      },
    },
  };

  const bestDoctorsSlider = {
    loop: true,
    margin: 24,
    dots: false,
    nav: true,
    smartSpeed: 2000,
    navContainer: ".slide-nav-2",
    navText: [
      '<i class="fas fa-chevron-left custom-arrow"></i>',
      '<i class="fas fa-chevron-right custom-arrow"></i>',
    ],
    responsive: {
      0: {
        items: 1,
      },
      500: {
        items: 1,
      },
      768: {
        items: 2,
      },
      1000: {
        items: 3,
      },
      1300: {
        items: 4,
      },
    },
  };

  const partnersSlider = {
    loop: true,
    margin: 24,
    nav: true,
    autoplay: true,
    smartSpeed: 2000,
    responsive: {
      0: {
        items: 1,
      },
      550: {
        items: 1,
      },
      700: {
        items: 4,
      },
      1000: {
        items: 6,
      },
    },
  };

  const testimonialSlider = {
    dots: false,
    autoplay: false,
    infinite: true,
    speed: 2000,
    variableWidth: false,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 500,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="main-wrapper home-one">
      <Home1Header />
      {/* Home Banner */}
      <section className="banner-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
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
                <Link
                  href="/calendar"
                  className="btn btn-consult-start"
                >
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
              {/* <div className="search-box-one aos" data-aos="fade-up">
                <form action="search-2.html">
                  <div className="search-input search-line">
                    <i className="feather icon-search bficon" />
                    <div className=" mb-0">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search doctors, clinics, hospitals, etc"
                      />
                    </div>
                  </div>
                  <div className="search-input search-map-line">
                    <i className="feather icon-map-pin" />
                    <div className=" mb-0">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Location"
                      />
                      <Link
                        className="current-loc-icon current_location"
                        href="#"
                      >
                        <i className="feather icon-crosshair" />
                      </Link>
                    </div>
                  </div>
                  <div className="search-input search-calendar-line">
                    <i className="feather icon-calendar" />
                    <div className=" mb-0">
                      <Calendar
                        value={date1}
                        onChange={(e) => setDate1(e.value)}
                        placeholder="From"
                        className="custom-date-picker"
                      />
                    </div>
                  </div>
                  <div className="form-search-btn">
                    <button className="btn" type="submit">
                      Search
                    </button>
                  </div>
                </form>
              </div> */}
            </div>
            <div className="col-lg-6">
              <div className="banner-img aos" data-aos="fade-up">
                <Image
                  src="/img/banner-image.png" // Calea relativă din folderul public
                  alt="Cristina Zurba"
                  width={512} // Lățimea originală a imaginii
                  height={672} // Înălțimea originală a imaginii
                />
                {/* <div className="banner-img1">
                  <ImageWithBasePath
                    src="assets/img/banner/banner-img1.svg"
                    className="img-fluid"
                    alt="checkup-image"
                  />
                </div>
                <div className="banner-img2">
                  <ImageWithBasePath
                    src="assets/img/banner/banner-img2.svg"
                    className="img-fluid"
                    alt="doctor-slide"
                  />
                </div>
                <div className="banner-img3">
                  <ImageWithBasePath
                    src="assets/img/banner/banner-img3.svg"
                    className="img-fluid"
                    alt="doctors-list"
                  />
                </div> */}
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
