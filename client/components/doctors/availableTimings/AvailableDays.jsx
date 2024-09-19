import Link from "next/link";
import React from "react";

const AvailableDays = ({ handleDaySelection, selectedDays }) => (
  <div className="available-tab">
    <label className="form-label">Select Available days</label>
    <ul className="nav">
      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
        <li key={day}>
          <Link
            href="#"
            onClick={() => handleDaySelection(day)}
            className={selectedDays.includes(day) ? "active" : ""}
            data-bs-toggle="tab"
            data-bs-target={`#${day.toLowerCase()}`}
          >
            {day}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default AvailableDays;
