import Link from "next/link";
import React from "react";

const CalendarSlotComponent = ({ day, slots, onAddSlot, onDeleteAll, onDeleteSlot }) => (
  <div className="tab-pane active show" id={day.toLowerCase()}>
    <div className="slot-box">
      <div className="slot-header">
        <h5>{day}</h5>
        <ul>
          <li>
            <Link href="#" className="add-slot" onClick={onAddSlot}>
              Add Slots
            </Link>
          </li>
          <li>
            <Link href="#" className="del-slot" onClick={onDeleteAll}>
              Delete All
            </Link>
          </li>
        </ul>
      </div>
      <div className="slot-body">
        {slots.length > 0 ? (
          <ul className="time-slots">
            {slots.map((slot, index) => (
              <li key={index} onClick={() => onDeleteSlot(day, slot)}>
                <i className="fa-regular fa-clock" /> {slot}
              </li>
            ))}
          </ul>
        ) : (
          <p>No Slots Available</p>
        )}
      </div>
    </div>
  </div>
);

export default CalendarSlotComponent;
