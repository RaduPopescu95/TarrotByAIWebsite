import React, { useState } from "react";
import CalendarSlotComponent from "./CalendarSlotComponent";
import moment from "moment";
import "moment/locale/ro"; // Importăm localizarea în română

// Setăm moment la limba română
moment.locale("ro");
const CalendarComponent = ({
  handleUpdateSubmitInfo,
  handleSubmitInfo,
  selectedDay,
  setSelectedDay,
  selectedMonth,
  setSelectedMonth,
  yearlySlots,
  onEditDaySlots,
  openAddSlotModal,
  openDeleteAllSlotsModal,
  onDeleteSlot,
  repeatDay,
  isLoading,
  isUpdate,
}) => {
  const currentYear = new Date().getFullYear();

  const today = new Date();
  const isToday = (day, month) =>
    day === today.getDate() && month === today.getMonth();

  const daysOfWeek = ["L", "Ma", "Mi", "J", "V", "S", "D"];

  const generateDaysInMonth = (year, month) => {
    const startOfMonth = moment(`${year}-${month + 1}`, "YYYY-MM").startOf(
      "month"
    );
    const daysInMonth = startOfMonth.daysInMonth();
    const firstDayOfMonth = startOfMonth.day();

    const daysArray = [];
    const emptyDaysCount = (firstDayOfMonth + 6) % 7;

    for (let i = 0; i < emptyDaysCount; i++) {
      daysArray.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const daySlots =
        yearlySlots[month]?.find((slot) => slot.day === day)?.slots || [];
      daysArray.push({ day, slots: daySlots });
    }

    return daysArray;
  };

  const daysInSelectedMonth = generateDaysInMonth(currentYear, selectedMonth);

  const handleDayClick = (dayObj) => {
    if (!dayObj) return;
    setSelectedDay(dayObj);
  };

  const handleEditSlotsForDay = (newSlots) => {
    if (selectedDay) {
      const dayKey = `${selectedMonth}-${selectedDay.day}`;
      onEditDaySlots(dayKey, newSlots);
    }
  };

  return (
    <div className="card custom-card">
      <div className="card-body">
        <div className="card-header">
          <h3>Calendar disponibilitati</h3>
        </div>
        {isLoading ? (
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        ) : (
          <div className="calendar-component">
            <div className="month-selector">
              <select
                className="form-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {[
                  "Ianuarie",
                  "Februarie",
                  "Martie",
                  "Aprilie",
                  "Mai",
                  "Iunie",
                  "Iulie",
                  "August",
                  "Septembrie",
                  "Octombrie",
                  "Noiembrie",
                  "Decembrie",
                ].map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div className="calendar-grid">
              {/* Afișarea zilelor săptămânii */}
              {daysOfWeek.map((dayName, index) => (
                <div key={index} className="day-header">
                  {dayName}
                </div>
              ))}

              {/* Afișarea zilelor din luna selectată cu aliniere corectă */}
              {daysInSelectedMonth.map((dayObj, index) => (
                <div
                  key={index}
                  className={`calendar-day ${
                    dayObj?.slots.length > 0 ? "has-slots" : ""
                  } 
                    ${dayObj === null ? "empty-day" : ""} 
                    ${isToday(dayObj?.day, selectedMonth) ? "today" : ""} 
                    ${
                      dayObj && selectedDay?.day === dayObj.day
                        ? "selected"
                        : ""
                    }`}
                  onClick={() => handleDayClick(dayObj)}
                >
                  {dayObj ? dayObj.day : ""}
                </div>
              ))}
            </div>

            {/* Afișarea sloturilor pentru ziua selectată */}
            {selectedDay && (
              <div className="slots-grid">
                <CalendarSlotComponent
                  day={`${selectedDay.day}`}
                  slots={selectedDay.slots}
                  onAddSlot={() =>
                    openAddSlotModal(`${selectedMonth}-${selectedDay.day}`)
                  }
                  onDeleteAll={() =>
                    openDeleteAllSlotsModal(
                      `${selectedMonth}-${selectedDay.day}`
                    )
                  }
                  onDeleteSlot={(day, slot) =>
                    onDeleteSlot(`${selectedMonth}-${selectedDay.day}`, slot)
                  }
                  repeatDay={repeatDay}
                />
              </div>
            )}

            <style jsx>{`
              .calendar-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 10px;
                margin-top: 20px;
              }

              .day-header {
                background-color: #007bff;
                color: white;
                text-align: center;
                padding: 10px;
                border-radius: 5px;
              }

              .calendar-day {
                background-color: #f0f0f0;
                padding: 10px;
                text-align: center;
                border-radius: 5px;
                cursor: pointer;
              }

              .calendar-day.empty-day {
                background-color: #e0e0e0;
                cursor: default;
                color: #c0c0c0; /* Culoare gri */
              }

              .calendar-day:hover:not(.empty-day),
              .calendar-day.selected:not(.empty-day) {
                background-color: #007bff;
                color: white;
              }

              .calendar-day.today {
                border: 2px solid #007bff;
              }

              .calendar-day.has-slots {
                background-color: #66b2ff;
                color: white;
              }

              .calendar-day.selected {
                background-color: #007bff !important; /* Asigură-te că selected are prioritate */
                color: white;
              }

              .calendar-day.empty-day.selected {
                background-color: #e0e0e0 !important; /* Asigură-te că selected nu schimbă stilul */
                color: #c0c0c0;
              }

              .slots-grid {
                display: grid;
                grid-template-columns: repeat(1, 1fr);
                gap: 10px;
                margin-top: 20px;
              }

              .month-selector {
                margin-bottom: 20px;
              }
            `}</style>
          </div>
        )}
      </div>
      <div className="modal-btn text-end">
        {/* <Link href="#" className="btn btn-gray">
                                Anuleaza
                              </Link> */}
        {isUpdate ? (
          <button
            style={{ marginRight: "20px", marginBottom: "20px" }}
            className="btn btn-primary prime-btn"
            onClick={handleSubmitInfo}
          >
            Actualizeaza
          </button>
        ) : (
          <button
            style={{ marginRight: "20px", marginBottom: "20px" }}
            className="btn btn-primary prime-btn"
            onClick={handleUpdateSubmitInfo}
          >
            Salveaza
          </button>
        )}
      </div>
    </div>
  );
};

export default CalendarComponent;
