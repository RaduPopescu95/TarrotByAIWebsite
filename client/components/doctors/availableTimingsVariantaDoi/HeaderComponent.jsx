import Link from "next/link";
import React, { useState } from "react";
import DoctorSidebar from "../sidebar";
import DoctorFooter from "../../common/doctorFooter";
import { TimePicker } from "antd";
import Select from "react-select";



const HeaderComponent = () => (
    <div className="breadcrumb-bar-two">
    <div className="container">
      <div className="row align-items-center inner-banner">
        <div className="col-md-12 col-12 text-center">
          <h2 className="breadcrumb-title">Available Timings</h2>
          <nav aria-label="breadcrumb" className="page-breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link href="/home-1">Home</Link>
              </li>
              <li className="breadcrumb-item" aria-current="page">
                Available Timings
              </li>
            </ol>
          </nav>
        </div>
      </div>
    </div>
  </div>
);

export default HeaderComponent;
