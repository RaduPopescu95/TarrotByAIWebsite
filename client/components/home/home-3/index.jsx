import React, { useEffect, useState } from "react";
import Home3Footer from "./footer";
import Home3Header from "./header";
import Link from "next/link";
import ImageWithBasePath from "../../../../core/img/imagewithbasebath";
import AOS from "aos";
import "aos/dist/aos.css";
import OwlCarousel from "react-owl-carousel";
import "owl.carousel/dist/assets/owl.carousel.css";
import "owl.carousel/dist/assets/owl.theme.default.css";
import { Dropdown } from "primereact/dropdown";

const Home3 = () => {
  const selectValue = [
    { name: "Cardiology" },
    { name: "Neurology" },
    { name: "Urology" },
  ];
  const [selectedValue, setSelectedValue] = useState();
  const clinicSlider = {
    loop: true,
    margin: 15,
    dots: false,
    nav: true,
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
        items: 3,
      },
      1000: {
        items: 4,
      },
      1300: {
        items: 6,
      },
    },
  };
  const ourDoctorSlider = {
    loop: true,
    margin: 15,
    dots: false,
    nav: true,
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
      1200: {
        items: 4,
      },
    },
  };
  const clinicFeatureSlider = {
    loop: true,
    margin: 15,
    dots: false,
    nav: true,
    navContainer: ".slide-nav-3",
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
        items: 3,
      },
      1000: {
        items: 4,
      },
      1300: {
        items: 5,
      },
    },
  };
  const blogSlider = {
    loop: true,
    margin: 15,
    dots: false,
    nav: true,
    navContainer: ".slide-nav-4",
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

  AOS.init();
  useEffect(() => {
    AOS.init({
      duration: 1000,
    });
  }, []);
  const handleScroll = () => {
    AOS.refresh();
  };
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return (
    <div className="main-wrapper home-three">
      <Home3Header />
      {/* Home Banner */}
      <section className="doctor-search-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7 aos" data-aos="fade-up">
              <div className="doctor-search">
                <div className="banner-header">
                  <h2>
                    <span>Search Doctor,</span> Make an Appointment
                  </h2>
                  <p>
                    Access to expert physicians and surgeons, advanced
                    technologies and top-quality surgery facilities right here.
                  </p>
                </div>
                <div className="doctor-form">
                  <form action="#" className="doctor-search">
                    <div className="input-box-twelve">
                      <div className="search-input input-block">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Location"
                        />
                        <Link
                          className="current-loc-icon current_location"
                          href="#"
                        >
                          <i className="fa-solid fa-location-crosshairs" />
                        </Link>
                      </div>
                      <div className="search-input input-block">
                        <Dropdown
                          value={selectedValue}
                          onChange={(e) => setSelectedValue(e.value)}
                          options={selectValue}
                          optionLabel="name"
                          placeholder="Select Department"
                          className="custom-prime-select"
                        />

                        <Link
                          className="current-loc-icon current_location"
                          href="#"
                        >
                          <i className="fa-solid fa-user-check" />
                        </Link>
                      </div>
                      <div className="input-block">
                        <div className="search-btn-info">
                          <Link href="/patient/search-doctor2">
                            <i className="fa-solid fa-magnifying-glass" />
                            Search
                          </Link>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div className="col-lg-5 aos" data-aos="fade-up">
              <ImageWithBasePath
                src="assets/img/banner/doctor-banner.png"
                className="img-fluid dr-img"
                alt="doctor-image"
              />
            </div>
          </div>
        </div>
      </section>
      {/* /Home Banner */}
      {/* Clinic Section */}
      <section className="clinics-section">
        <div className="shapes">
          <ImageWithBasePath
            src="assets/img/shapes/shape-1.png"
            alt="shape-image"
            className="img-fluid shape-1"
          />
          <ImageWithBasePath
            src="assets/img/shapes/shape-2.png"
            alt="shape-image"
            className="img-fluid shape-2"
          />
        </div>
        <div className="container">
          <div className="row">
            <div className="col-md-6 aos" data-aos="fade-up">
              <div className="section-heading">
                <h2>Clinic &amp; Specialities</h2>
                <p>
                  Access to expert physicians and surgeons, advanced
                  technologies and top-quality surgery facilities right here.
                </p>
              </div>
            </div>
            <div className="col-md-6 text-end aos" data-aos="fade-up">
              <div className="owl-nav slide-nav-1 text-end nav-control" />
            </div>
          </div>
          <div className="clinics owl-theme aos" data-aos="fade-up">
            <OwlCarousel {...clinicSlider}>
              <div className="item">
                <div className="clinic-item">
                  <div className="clinics-card">
                    <div className="clinics-img">
                      <ImageWithBasePath
                        src="assets/img/clinic/clinic-1.jpg"
                        alt="clinic-image"
                        className="img-fluid"
                      />
                    </div>
                    <div className="clinics-info">
                      <span className="clinic-img">
                        <ImageWithBasePath
                          src="assets/img/category/category-01.svg"
                          alt="kidney-image"
                          className="img-fluid"
                        />
                      </span>
                      <Link href="#">
                        <span>Urology</span>
                      </Link>
                    </div>
                  </div>
                  <div className="clinics-icon">
                    <Link href="#">
                      <i className="fas fa-long-arrow-alt-right" />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="clinic-item">
                  <div className="clinics-card">
                    <div className="clinics-img">
                      <ImageWithBasePath
                        src="assets/img/clinic/clinic-2.jpg"
                        alt="clinic-image"
                        className="img-fluid"
                      />
                    </div>
                    <div className="clinics-info">
                      <span className="clinic-img">
                        <ImageWithBasePath
                          src="assets/img/category/category-02.svg"
                          alt="bone-image"
                          className="img-fluid"
                        />
                      </span>
                      <Link href="#">
                        <span>Orthopedic</span>
                      </Link>
                    </div>
                  </div>
                  <div className="clinics-icon">
                    <Link href="#">
                      <i className="fas fa-long-arrow-alt-right" />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="clinic-item">
                  <div className="clinics-card">
                    <div className="clinics-img">
                      <ImageWithBasePath
                        src="assets/img/clinic/clinic-4.jpg"
                        alt="client-image"
                        className="img-fluid"
                      />
                    </div>
                    <div className="clinics-info">
                      <span className="clinic-img">
                        <ImageWithBasePath
                          src="assets/img/category/category-03.svg"
                          alt="heart-image"
                          className="img-fluid"
                        />
                      </span>
                      <Link href="#">
                        <span>Cardiologist</span>
                      </Link>
                    </div>
                  </div>
                  <div className="clinics-icon">
                    <Link href="#">
                      <i className="fas fa-long-arrow-alt-right" />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="clinic-item">
                  <div className="clinics-card">
                    <div className="clinics-img">
                      <ImageWithBasePath
                        src="assets/img/clinic/clinic-3.jpg"
                        alt="client-image"
                        className="img-fluid"
                      />
                    </div>
                    <div className="clinics-info">
                      <span className="clinic-img">
                        <ImageWithBasePath
                          src="assets/img/category/category-04.svg"
                          alt="teeth-image"
                          className="img-fluid"
                        />
                      </span>
                      <Link href="#">
                        <span>Dentist</span>
                      </Link>
                    </div>
                  </div>
                  <div className="clinics-icon">
                    <Link href="#">
                      <i className="fas fa-long-arrow-alt-right" />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="clinic-item">
                  <div className="clinics-card">
                    <div className="clinics-img">
                      <ImageWithBasePath
                        src="assets/img/clinic/clinic-5.jpg"
                        alt="client-image"
                        className="img-fluid"
                      />
                    </div>
                    <div className="clinics-info">
                      <span className="clinic-img">
                        <ImageWithBasePath
                          src="assets/img/category/category-05.svg"
                          alt="brain-image"
                          className="img-fluid"
                        />
                      </span>
                      <Link href="#">
                        <span>Neurology</span>
                      </Link>
                    </div>
                  </div>
                  <div className="clinics-icon">
                    <Link href="#">
                      <i className="fas fa-long-arrow-alt-right" />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="clinic-item">
                  <div className="clinics-card">
                    <div className="clinics-img">
                      <ImageWithBasePath
                        src="assets/img/clinic/clinic-1.jpg"
                        alt="clinic-image"
                        className="img-fluid"
                      />
                    </div>
                    <div className="clinics-info">
                      <span className="clinic-img">
                        <ImageWithBasePath
                          src="assets/img/category/category-06.svg"
                          alt="heart-image"
                          className="img-fluid"
                        />
                      </span>
                      <Link href="#">
                        <span>Cardiologist</span>
                      </Link>
                    </div>
                  </div>
                  <div className="clinics-icon">
                    <Link href="#">
                      <i className="fas fa-long-arrow-alt-right" />
                    </Link>
                  </div>
                </div>
              </div>
            </OwlCarousel>
          </div>
        </div>
      </section>
      {/* /Clinic Section */}
      {/* Specialities Section */}
      <section className="specialities-section">
        <div className="shapes">
          <ImageWithBasePath
            src="assets/img/shapes/shape-3.png"
            alt="shape-image"
            className="img-fluid shape-3"
          />
        </div>
        <div className="container">
          <div className="row">
            <div className="col-md-6 aos" data-aos="fade-up">
              <div className="section-heading bg-area">
                <h2>Browse by Specialities</h2>
                <p>Find experienced doctors across all specialties</p>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-3 col-lg-4 col-md-6 aos" data-aos="fade-up">
              <div className="specialist-card d-flex">
                <div className="specialist-img">
                  <ImageWithBasePath
                    src="assets/img/category/1.png"
                    alt="kidney-image"
                    className="img-fluid"
                  />
                </div>
                <div className="specialist-info">
                  <Link href="#">
                    <h4>Urology</h4>
                  </Link>
                  <p>21 Doctors</p>
                </div>
                <div className="specialist-nav ms-auto">
                  <Link href="#">
                    <i className="fas fa-long-arrow-alt-right" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 aos" data-aos="fade-up">
              <div className="specialist-card d-flex">
                <div className="specialist-img">
                  <ImageWithBasePath
                    src="assets/img/category/2.png"
                    alt="bone-image"
                    className="img-fluid"
                  />
                </div>
                <div className="specialist-info">
                  <Link href="#">
                    <h4>Orthopedic</h4>
                  </Link>
                  <p>30 Doctors</p>
                </div>
                <div className="specialist-nav ms-auto">
                  <Link href="#">
                    <i className="fas fa-long-arrow-alt-right" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 aos" data-aos="fade-up">
              <div className="specialist-card d-flex">
                <div className="specialist-img">
                  <ImageWithBasePath
                    src="assets/img/category/4.png"
                    alt="heart-image"
                    className="img-fluid"
                  />
                </div>
                <div className="specialist-info">
                  <Link href="#">
                    <h4>Cardiologist</h4>
                  </Link>
                  <p>15 Doctors</p>
                </div>
                <div className="specialist-nav ms-auto">
                  <Link href="#">
                    <i className="fas fa-long-arrow-alt-right" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 aos" data-aos="fade-up">
              <div className="specialist-card d-flex">
                <div className="specialist-img">
                  <ImageWithBasePath
                    src="assets/img/category/5.png"
                    alt="brain-image"
                    className="img-fluid"
                  />
                </div>
                <div className="specialist-info">
                  <Link href="#">
                    <h4>Dentist</h4>
                  </Link>
                  <p>35 Doctors</p>
                </div>
                <div className="specialist-nav ms-auto">
                  <Link href="#">
                    <i className="fas fa-long-arrow-alt-right" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 aos" data-aos="fade-up">
              <div className="specialist-card d-flex">
                <div className="specialist-img">
                  <ImageWithBasePath
                    src="assets/img/category/3.png"
                    alt="brain-image"
                    className="img-fluid"
                  />
                </div>
                <div className="specialist-info">
                  <Link href="#">
                    <h4>Neurology</h4>
                  </Link>
                  <p>25 Doctors</p>
                </div>
                <div className="specialist-nav ms-auto">
                  <Link href="#">
                    <i className="fas fa-long-arrow-alt-right" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 aos" data-aos="fade-up">
              <div className="specialist-card d-flex">
                <div className="specialist-img">
                  <ImageWithBasePath
                    src="assets/img/category/6.png"
                    alt="bone-image"
                    className="img-fluid"
                  />
                </div>
                <div className="specialist-info">
                  <Link href="#">
                    <h4>Pediatrist</h4>
                  </Link>
                  <p>10 Doctors</p>
                </div>
                <div className="specialist-nav ms-auto">
                  <Link href="#">
                    <i className="fas fa-long-arrow-alt-right" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 aos" data-aos="fade-up">
              <div className="specialist-card d-flex">
                <div className="specialist-img">
                  <ImageWithBasePath
                    src="assets/img/category/7.png"
                    alt="heart-image"
                    className="img-fluid"
                  />
                </div>
                <div className="specialist-info">
                  <Link href="#">
                    <h4>Veterinary</h4>
                  </Link>
                  <p>20 Doctors</p>
                </div>
                <div className="specialist-nav ms-auto">
                  <Link href="#">
                    <i className="fas fa-long-arrow-alt-right" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 aos" data-aos="fade-up">
              <div className="specialist-card d-flex">
                <div className="specialist-img">
                  <ImageWithBasePath
                    src="assets/img/category/8.png"
                    alt="kidney-image"
                    className="img-fluid"
                  />
                </div>
                <div className="specialist-info">
                  <Link href="#">
                    <h4>Psychiatrist</h4>
                  </Link>
                  <p>12 Doctors</p>
                </div>
                <div className="specialist-nav ms-auto">
                  <Link href="#">
                    <i className="fas fa-long-arrow-alt-right" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /Specialities Section */}
      {/* Best Doctor Section */}
      <section className="our-doctors-section">
        <div className="container">
          <div className="row">
            <div className="col-md-6 aos" data-aos="fade-up">
              <div className="section-heading">
                <h2>Book Our Best Doctor</h2>
                <p>Meet our experts &amp; book online</p>
              </div>
            </div>
            <div className="col-md-6 text-end aos" data-aos="fade-up">
              <div className="owl-nav slide-nav-2 text-end nav-control" />
            </div>
          </div>
          <div className="our-doctors owl-theme aos" data-aos="fade-up">
            <OwlCarousel {...ourDoctorSlider}>
              <div className="item">
                <div className="our-doctors-card">
                  <div className="doctors-header">
                    <Link href="#">
                      <ImageWithBasePath
                        src="assets/img/doctors/doctor-01.jpg"
                        alt="Ruby Perrin"
                        className="img-fluid"
                      />
                    </Link>
                    <div className="img-overlay">
                      <span>$20 - $50</span>
                    </div>
                  </div>
                  <div className="doctors-body">
                    <div className="rating">
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <span className="d-inline-block average-ratings">
                        3.5
                      </span>
                    </div>
                    <Link href="/patient/doctor-profile">
                      <h4>Dr. Ruby Perrin</h4>
                    </Link>
                    <p>BDS, MDS - Oral &amp; Maxillofacial Surgery</p>
                    <div className="location d-flex">
                      <p>
                        <i className="fas fa-map-marker-alt" /> Georgia, USA
                      </p>
                      <p className="ms-auto">
                        <i className="fas fa-user-md" /> 450 Consultations
                      </p>
                    </div>
                    <div className="row row-sm">
                      <div className="col-6">
                        <Link
                          href="/patient/doctor-profile"
                          className="btn view-btn"
                          tabIndex={0}
                        >
                          View Profile
                        </Link>
                      </div>
                      <div className="col-6">
                        <Link
                          href="/patient/booking1"
                          className="btn book-btn"
                          tabIndex={0}
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="our-doctors-card">
                  <div className="doctors-header">
                    <Link href="#">
                      <ImageWithBasePath
                        src="assets/img/doctors/doctor-04.jpg"
                        alt="Deborah Angel"
                        className="img-fluid"
                      />
                    </Link>
                    <div className="img-overlay">
                      <span>$30 -$60</span>
                    </div>
                  </div>
                  <div className="doctors-body">
                    <div className="rating">
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star" />
                      <i className="fas fa-star" />
                      <span className="d-inline-block average-ratings">
                        3.0
                      </span>
                    </div>
                    <Link href="/patient/doctor-profile">
                      <h4>Dr. Lisa Graham</h4>
                    </Link>
                    <p>MBBS, MD - Cardialogist</p>
                    <div className="location d-flex">
                      <p>
                        <i className="fas fa-map-marker-alt" /> San Diego, USA
                      </p>
                      <p className="ms-auto">
                        <i className="fas fa-user-md" /> 120 Consultations
                      </p>
                    </div>
                    <div className="row row-sm">
                      <div className="col-6">
                        <Link
                          href="/patient/doctor-profile"
                          className="btn view-btn"
                          tabIndex={0}
                        >
                          View Profile
                        </Link>
                      </div>
                      <div className="col-6">
                        <Link
                          href="/patient/booking1"
                          className="btn book-btn"
                          tabIndex={0}
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="our-doctors-card">
                  <div className="doctors-header">
                    <Link href="#">
                      <ImageWithBasePath
                        src="assets/img/doctors/doctor-03.jpg"
                        alt="Sofia Brient"
                        className="img-fluid"
                      />
                    </Link>
                    <div className="img-overlay">
                      <span>$15 -$30</span>
                    </div>
                  </div>
                  <div className="doctors-body">
                    <div className="rating">
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star" />
                      <i className="fas fa-star" />
                      <span className="d-inline-block average-ratings">
                        3.0
                      </span>
                    </div>
                    <Link href="/patient/doctor-profile">
                      <h4>Dr. Carrie Soderberg</h4>
                    </Link>
                    <p>MBBS, DNB - Neurology</p>
                    <div className="location d-flex">
                      <p>
                        <i className="fas fa-map-marker-alt" /> Dallas, USA
                      </p>
                      <p className="ms-auto">
                        <i className="fas fa-user-md" /> 300 Consultations
                      </p>
                    </div>
                    <div className="row row-sm">
                      <div className="col-6">
                        <Link
                          href="/patient/doctor-profile"
                          className="btn view-btn"
                          tabIndex={0}
                        >
                          View Profile
                        </Link>
                      </div>
                      <div className="col-6">
                        <Link
                          href="/patient/booking1"
                          className="btn book-btn"
                          tabIndex={0}
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="our-doctors-card">
                  <div className="doctors-header">
                    <Link href="#">
                      <ImageWithBasePath
                        src="assets/img/doctors/doctor-02.jpg"
                        alt="Darren Elder"
                        className="img-fluid"
                      />
                    </Link>
                    <div className="img-overlay">
                      <span>$20 - $50</span>
                    </div>
                  </div>
                  <div className="doctors-body">
                    <div className="rating">
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <i className="fas fa-star filled" />
                      <span className="d-inline-block average-ratings">
                        4.0
                      </span>
                    </div>
                    <Link href="/patient/doctor-profile">
                      <h4>Dr. Matthew Ruiz</h4>
                    </Link>
                    <p>BDS, MDS - Oral &amp; Maxillofacial Surgery</p>
                    <div className="location d-flex">
                      <p>
                        <i className="fas fa-map-marker-alt" /> Georgia, USA
                      </p>
                      <p className="ms-auto">
                        <i className="fas fa-user-md" /> 450 Consultations
                      </p>
                    </div>
                    <div className="row row-sm">
                      <div className="col-6">
                        <Link
                          href="/patient/doctor-profile"
                          className="btn view-btn"
                          tabIndex={0}
                        >
                          View Profile
                        </Link>
                      </div>
                      <div className="col-6">
                        <Link
                          href="/patient/booking1"
                          className="btn book-btn"
                          tabIndex={0}
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </OwlCarousel>
          </div>
        </div>
      </section>
      {/* /Best Doctor Section */}
      {/* Clinic Features Section */}
      <section className="clinic-features-section">
        <div className="container">
          <div className="row">
            <div className="col-md-6 aos" data-aos="fade-up">
              <div className="section-heading">
                <h2>Availabe Features in Our Clinic</h2>
                <p>Meet our Experts &amp; Book Online</p>
              </div>
            </div>
            <div className="col-md-6 text-end aos" data-aos="fade-up">
              <div className="owl-nav slide-nav-3 text-end nav-control" />
            </div>
          </div>
          <div className="clinic-feature owl-theme aos" data-aos="fade-up">
            <OwlCarousel {...clinicFeatureSlider}>
              <div className="item">
                <div className="clinic-features">
                  <ImageWithBasePath
                    src="assets/img/clinic/clinic-6.jpg"
                    alt="clinic-image"
                    className="img-fluid"
                  />
                </div>
                <div className="clinic-feature-overlay">
                  <Link href="#" className="img-overlay">
                    Operation
                  </Link>
                </div>
              </div>
              <div className="item">
                <div className="clinic-features">
                  <ImageWithBasePath
                    src="assets/img/clinic/clinic-7.jpg"
                    alt="clinic-image"
                    className="img-fluid"
                  />
                </div>
                <div className="clinic-feature-overlay">
                  <Link href="#" className="img-overlay">
                    Medical
                  </Link>
                </div>
              </div>
              <div className="item">
                <div className="clinic-features">
                  <ImageWithBasePath
                    src="assets/img/clinic/clinic-8.jpg"
                    alt="clinic-image"
                    className="img-fluid"
                  />
                </div>
                <div className="clinic-feature-overlay">
                  <Link href="#" className="img-overlay">
                    Patient Ward
                  </Link>
                </div>
              </div>
              <div className="item">
                <div className="clinic-features">
                  <ImageWithBasePath
                    src="assets/img/clinic/clinic-9.jpg"
                    alt="clinic-image"
                    className="img-fluid"
                  />
                </div>
                <div className="clinic-feature-overlay">
                  <Link href="#" className="img-overlay">
                    Test Room
                  </Link>
                </div>
              </div>
              <div className="item">
                <div className="clinic-features">
                  <ImageWithBasePath
                    src="assets/img/clinic/clinic-10.jpg"
                    alt="clinic-image"
                    className="img-fluid"
                  />
                </div>
                <div className="clinic-feature-overlay">
                  <Link href="#" className="img-overlay">
                    ICU
                  </Link>
                </div>
              </div>
            </OwlCarousel>
          </div>
        </div>
      </section>
      {/* /Clinic Features Section */}
      {/* Blog Section */}
      <section className="our-blog-section blogs-three">
        <div className="container">
          <div className="row">
            <div className="col-md-6 aos" data-aos="fade-up">
              <div className="section-heading">
                <h2>Blogs and News</h2>
                <p>Read Professional Articles and Latest Articles</p>
              </div>
            </div>
            <div className="col-md-6 text-end aos" data-aos="fade-up">
              <div className="owl-nav slide-nav-4 text-end nav-control" />
            </div>
          </div>
          <div className="blogs owl-theme aos" data-aos="fade-up">
            <OwlCarousel {...blogSlider}>
              <div className="item">
                <div className="our-blogs">
                  <div className="blogs-img">
                    <Link href="/blog/blog-details">
                      <ImageWithBasePath
                        src="assets/img/blog/blog-26.jpg"
                        alt="blog-image"
                        className="img-fluid"
                      />
                    </Link>
                    <div className="blogs-overlay d-flex">
                      <ImageWithBasePath
                        src="assets/img/clients/client-11.jpg"
                        alt="Ruby Perrin"
                        className="img-fluid"
                      />
                      <span className="blogs-writter">Ruby Perrin</span>
                    </div>
                  </div>
                  <div className="blogs-info">
                    <span className="blog-slug">Urology</span>
                    <h4>
                      <Link href="/blog/blog-details">
                        Revolutionizing Healthcare: The Rise of Online Doctor
                        Booking
                      </Link>
                    </h4>
                    <p>
                      Explore how online doctor booking is revolutionize access
                      to healthcare efficiency.
                    </p>
                    <div className="blogs-nav d-flex align-items-center justify-content-between">
                      <span className="blogs-time">
                        <i className="fa-regular fa-calendar-days" /> 03 Apr
                        2024
                      </span>
                      <Link href="/blog/blog-details" className="blogs-btn">
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="our-blogs">
                  <div className="blogs-img">
                    <Link href="/blog/blog-details">
                      <ImageWithBasePath
                        src="assets/img/blog/blog-27.jpg"
                        alt="blog-image"
                        className="img-fluid"
                      />
                    </Link>
                    <div className="blogs-overlay d-flex">
                      <ImageWithBasePath
                        src="assets/img/clients/client-12.jpg"
                        alt="Ruby Perrin"
                        className="img-fluid"
                      />
                      <span className="blogs-writter">Lynette Williams</span>
                    </div>
                  </div>
                  <div className="blogs-info">
                    <span className="blog-slug">Neurology</span>
                    <h4>
                      <Link href="/blog/blog-details">
                        Neurology and Technology: A New Frontier in Brain Health
                      </Link>
                    </h4>
                    <p>
                      Discover the intersection of technology and neurology,
                      transforming treatments.
                    </p>
                    <div className="blogs-nav d-flex align-items-center justify-content-between">
                      <span className="blogs-time">
                        <i className="fa-regular fa-calendar-days" /> 10 Apr
                        2024
                      </span>
                      <Link href="/blog/blog-details" className="blogs-btn">
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="our-blogs">
                  <div className="blogs-img">
                    <Link href="/blog/blog-details">
                      <ImageWithBasePath
                        src="assets/img/blog/blog-28.jpg"
                        alt="blog-image"
                        className="img-fluid"
                      />
                    </Link>
                    <div className="blogs-overlay d-flex">
                      <ImageWithBasePath
                        src="assets/img/clients/client-03.jpg"
                        alt="Ruby Perrin"
                        className="img-fluid"
                      />
                      <span className="blogs-writter">Mathew Rulz</span>
                    </div>
                  </div>
                  <div className="blogs-info">
                    <span className="blog-slug">Orthopedic</span>
                    <h4>
                      <Link href="/blog/blog-details">
                        Beating Strong: The Digital Revolution in Cardiac Care
                      </Link>
                    </h4>
                    <p>
                      Discover how digital advancements are transforming cardiac
                      care, making heart health.
                    </p>
                    <div className="blogs-nav d-flex align-items-center justify-content-between">
                      <span className="blogs-time">
                        <i className="fa-regular fa-calendar-days" /> 15 Apr
                        2024
                      </span>
                      <Link href="/blog/blog-details" className="blogs-btn">
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="our-blogs">
                  <div className="blogs-img">
                    <Link href="/blog/blog-details">
                      <ImageWithBasePath
                        src="assets/img/blog/blog-29.jpg"
                        alt="blog-image"
                        className="img-fluid"
                      />
                    </Link>
                    <div className="blogs-overlay d-flex">
                      <ImageWithBasePath
                        src="assets/img/clients/client-09.jpg"
                        alt="Sofia Brient"
                        className="img-fluid"
                      />
                      <span className="blogs-writter">Sofia Brient</span>
                    </div>
                  </div>
                  <div className="blogs-info">
                    <span className="blog-slug">Ophthalmology</span>
                    <h4>
                      <Link href="/blog/blog-details">
                        Understanding and Preventing Glaucoma: A Detailed Guide
                      </Link>
                    </h4>
                    <p>
                      Glaucoma is a leading cause of blindness worldwide, yet
                      many do not realize they have it
                    </p>
                    <div className="blogs-nav d-flex align-items-center justify-content-between">
                      <span className="blogs-time">
                        <i className="fa-regular fa-calendar-days" /> 18 Apr
                        2024
                      </span>
                      <Link href="/blog/blog-details" className="blogs-btn">
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="our-blogs">
                  <div className="blogs-img">
                    <Link href="/blog/blog-details">
                      <ImageWithBasePath
                        src="assets/img/blog/blog-30.jpg"
                        alt="blog-image"
                        className="img-fluid"
                      />
                    </Link>
                    <div className="blogs-overlay d-flex">
                      <ImageWithBasePath
                        src="assets/img/clients/client-02.jpg"
                        alt="Olga Barlow"
                        className="img-fluid"
                      />
                      <span className="blogs-writter">Olga Barlow</span>
                    </div>
                  </div>
                  <div className="blogs-info">
                    <span className="blog-slug">Dental Care</span>
                    <h4>
                      <Link href="/blog/blog-details">
                        5 Essential Tips for Maintaining Optimal Oral Health
                      </Link>
                    </h4>
                    <p>
                      Learn the top five daily practices to keep your teeth and
                      gums healthy.{" "}
                    </p>
                    <div className="blogs-nav d-flex align-items-center justify-content-between">
                      <span className="blogs-time">
                        <i className="fa-regular fa-calendar-days" /> 18 Apr
                        2024
                      </span>
                      <Link href="/blog/blog-details" className="blogs-btn">
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="item">
                <div className="our-blogs">
                  <div className="blogs-img">
                    <Link href="/blog/blog-details">
                      <ImageWithBasePath
                        src="assets/img/blog/blog-31.jpg"
                        alt="blog-image"
                        className="img-fluid"
                      />
                    </Link>
                    <div className="blogs-overlay d-flex">
                      <ImageWithBasePath
                        src="assets/img/clients/client-04.jpg"
                        alt="Linda Tobin"
                        className="img-fluid"
                      />
                      <span className="blogs-writter">Linda Tobin</span>
                    </div>
                  </div>
                  <div className="blogs-info">
                    <span className="blog-slug">Veterinary</span>
                    <h4>
                      <Link href="/blog/blog-details">
                        Pet Emergencies: How to Recognize and React
                      </Link>
                    </h4>
                    <p>
                      This critical guide covers the most common emergencies
                      seen in pets, including choking.
                    </p>
                    <div className="blogs-nav d-flex align-items-center justify-content-between">
                      <span className="blogs-time">
                        <i className="fa-regular fa-calendar-days" /> 24 Apr
                        2024
                      </span>
                      <Link href="/blog/blog-details" className="blogs-btn">
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </OwlCarousel>
          </div>
        </div>
      </section>
      {/* /Blog Section */}
      <Home3Footer />
    </div>
  );
};

export default Home3;
