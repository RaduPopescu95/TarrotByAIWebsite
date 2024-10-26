import React from "react";
import Link from "next/link";
import Header from "../../header";
import Footer from "../../footer";

const PricingPlan = (props) => {
  return (
    <>
      <Header {...props} />
      {/* Breadcrumb */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Pricing</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/home-2">Home</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Pricing
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {/* /Breadcrumb */}
      {/* <Priceingplan /> */}
      <Footer {...props} />
    </>
  );
};

export default PricingPlan;
