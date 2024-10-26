import React from "react";
import Link from "next/link";
const TagsWidget = () => {
  return (
    <div className="card tags-widget">
      <div className="card-header">
        <h4 className="card-title">Tags</h4>
      </div>
      <div className="card-body">
        <ul className="tags">
          <li>
            <Link href="#" className="tag">
              Children
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Disease
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Appointment
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Booking
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Kids
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Health
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Family
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Tips
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Shedule
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Treatment
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Dr
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Clinic
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Online
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Health Care
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Consulting
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Doctors
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Neurology
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Dentists
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Specialist
            </Link>
          </li>
          <li>
            <Link href="#" className="tag">
              Doccure
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TagsWidget;
