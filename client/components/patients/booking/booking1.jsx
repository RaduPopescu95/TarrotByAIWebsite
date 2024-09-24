import React, { useEffect, useState } from "react";
import Link from "next/link";
import "bootstrap-daterangepicker/daterangepicker.css";

import Footer from "../../footer";
import Home1Header from "../../home/home-1/header";
import { handleGetFirestore } from "../../../../utils/firestoreUtils";

const Booking = (props) => {
  const [yearlySlots, setYearlySlots] = useState({}); // inițializăm cu null pentru a verifica dacă sloturile sunt generate
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdate, setIsUpdate] = useState(null);

  const handleGetYearlySlots = async ()  => {
    const data = await handleGetFirestore("YearlySlots")
    return data[0]
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await handleGetYearlySlots();
        const currentYear = moment().year();
        if (data?.yearlySlots && data?.currentYear === currentYear) {
          console.log("yes it is....", data);
          setYearlySlots(data.yearlySlots);
          setIsLoading(false)
          setIsUpdate(data.documentId)
        } else {
          console.log("no it is....", data);
          const emptyYearWithSlots = generateEmptyYearWithSlots(currentYear);
          setYearlySlots(emptyYearWithSlots);
          setIsLoading(false)
        }
        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
        console.error("Error fetching yearly slots:", error);
      }
      
    };
  
    fetchData();
  }, []);  // <- dependențele rămân goale pentru a executa doar o dată la montare

  
  return (
    <div>
      <Home1Header />
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <h2 className="breadcrumb-title">Rezervare</h2>
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-1">Consultatie spirituala</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Rezerva loc
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="row">
                <div className="col-12 col-sm-4 col-md-6">
                  <h4 className="mb-1">11-09-2024</h4>
                  <p className="text-muted">Luni</p>
                </div>
                <div className="col-12 col-sm-8 col-md-6 text-sm-end">
                  {/* <div className="datepicker-icon">
                    <DateRangePicker
                      initialSettings={{
                        endDate: new Date("2020-08-11T12:30:00.000Z"),
                        ranges: {
                          "Last 30 Days": [
                            new Date("2020-07-12T04:57:17.076Z"),
                            new Date("2020-08-10T04:57:17.076Z"),
                          ],
                          "Last 7 Days": [
                            new Date("2020-08-04T04:57:17.076Z"),
                            new Date("2020-08-10T04:57:17.076Z"),
                          ],
                          "Last Month": [
                            new Date("2020-06-30T18:30:00.000Z"),
                            new Date("2020-07-31T18:29:59.999Z"),
                          ],
                          "This Month": [
                            new Date("2020-07-31T18:30:00.000Z"),
                            new Date("2020-08-31T18:29:59.999Z"),
                          ],
                          Today: [
                            new Date("2020-08-10T04:57:17.076Z"),
                            new Date("2020-08-10T04:57:17.076Z"),
                          ],
                          Yesterday: [
                            new Date("2020-08-09T04:57:17.076Z"),
                            new Date("2020-08-09T04:57:17.076Z"),
                          ],
                        },
                        startDate: new Date("2020-08-10T04:30:00.000Z"),
                        timePicker: false,
                      }}
                    >
                      <input
                        className="form-control col-4 input-range"
                        type="text"
                        // custom="input-range"
                        style={{ width: 280, position: "relative", left: 250 }}
                      />
                    </DateRangePicker>
                  </div> */}
                  {/* 
					  <div className="bookingrange btn btn-white btn-sm mb-3">
						 <i className="far fa-calendar-alt me-2"></i>
						 <span></span>
						 <i className="fas fa-chevron-down ms-2"></i>
					  </div>
					  */}
                </div>
              </div>
              <div className="card booking-schedule schedule-widget">
                <div className="schedule-header">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="day-slot">
                        <ul>
                          <li className="left-arrow">
                            <Link href="#">
                              <i className="fa fa-chevron-left"></i>
                            </Link>
                          </li>
                          <li>
                            <span>Luni</span>
                            <span className="slot-date">
                              11 09 <small className="slot-year">2024</small>
                            </span>
                          </li>
                          <li>
                            <span>Marti</span>
                            <span className="slot-date">
                              12 09 <small className="slot-year">2024</small>
                            </span>
                          </li>
                          <li>
                            <span>Miercuri</span>
                            <span className="slot-date">
                              13 09 <small className="slot-year">2024</small>
                            </span>
                          </li>
                          <li>
                            <span>Joi</span>
                            <span className="slot-date">
                              14 09 <small className="slot-year">2024</small>
                            </span>
                          </li>
                          <li>
                            <span>Vineri</span>
                            <span className="slot-date">
                              15 09 <small className="slot-year">2024</small>
                            </span>
                          </li>
                          <li>
                            <span>Sambata</span>
                            <span className="slot-date">
                              16 09 <small className="slot-year">2024</small>
                            </span>
                          </li>
                          <li>
                            <span>Duminica</span>
                            <span className="slot-date">
                              17 09 <small className="slot-year">2024</small>
                            </span>
                          </li>
                          <li className="right-arrow">
                            <Link href="#">
                              <i className="fa fa-chevron-right"></i>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="schedule-cont">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="time-slot">
                        <ul className="clearfix">
                          <li>
                            <Link className="timing" href="#">
                              <span>9:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>10:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>11:00</span>
                            </Link>
                          </li>
                          <li>
                            <Link className="timing" href="#">
                              <span>9:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>10:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>11:00</span>
                            </Link>
                          </li>
                          <li>
                            <Link className="timing" href="#">
                              <span>9:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>10:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>11:00</span>
                            </Link>
                          </li>
                          <li>
                            <Link className="timing" href="#">
                              <span>9:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>10:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>11:00</span>
                            </Link>
                          </li>
                          <li>
                            <Link className="timing" href="#">
                              <span>9:00</span>
                            </Link>
                            <Link className="timing selected" href="#">
                              <span>10:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>11:00</span>
                            </Link>
                          </li>
                          <li>
                            <Link className="timing" href="#">
                              <span>9:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>10:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>11:00</span>
                            </Link>
                          </li>
                          <li>
                            <Link className="timing" href="#">
                              <span>9:00</span>
                            </Link>
                            <Link className="timing" href="#0">
                              <span>10:00</span>
                            </Link>
                            <Link className="timing" href="#">
                              <span>11:00</span>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div></div>
              <div className="submit-section proceed-btn text-end">
                <Link
                  href="/patient/checkout"
                  className="btn btn-primary submit-btn"
                >
                  Rezerva si plateste
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer {...props} />
    </div>
  );
};

export default Booking;
