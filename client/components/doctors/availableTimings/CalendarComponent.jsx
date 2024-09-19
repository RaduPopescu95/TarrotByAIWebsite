import React, { useState } from "react";
import CalendarSlotComponent from "./CalendarSlotComponent"; // Importăm noua componentă pentru sloturi

const CalendarComponent = ({ weeklySlots, onEditDaySlots, editedDaySlots }) => {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null); // Starea pentru ziua selectată

  // Determinăm ziua curentă
  const today = new Date();
  const isToday = (day, month) => day === today.getDate() && month === today.getMonth();

  // Zilele săptămânii în română
  const daysOfWeek = ["L", "Ma", "Mi", "J", "V", "S", "D"];

  // Funcție pentru generarea zilelor dintr-o lună și repetarea sloturilor
  const generateDaysInMonth = (year, month) => {
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // Ziua săptămânii în care începe luna
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Numărul total de zile din lună

    const daysArray = [];
    // Adăugăm zile goale pentru a alinia prima zi a lunii sub ziua corectă din săptămână
    const emptyDaysCount = (firstDayOfMonth + 6) % 7; // Transformăm ziua în care începe luna astfel încât Luni = 0, ..., Duminică = 6
    for (let i = 0; i < emptyDaysCount; i++) {
      daysArray.push(null); // Zile goale
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      daysArray.push({ day, weekday: date.toLocaleDateString("en-US", { weekday: "long" }) });
    }

    return daysArray;
  };

  const daysInSelectedMonth = generateDaysInMonth(currentYear, selectedMonth);

  const handleDayClick = (day, weekday) => {
    if (!day) return;
    const defaultSlots = weeklySlots[weekday] || [];
    const specificDaySlots = editedDaySlots[`${selectedMonth}-${day}`] || defaultSlots;
    setSelectedDay({ day, slots: specificDaySlots, weekday });
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
    <div className="calendar-component">
      <div className="month-selector">
        <select
          className="form-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
        >
          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, index) => (
            <option key={index} value={index}>{month}</option>
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
            className={`calendar-day ${dayObj?.weekday === "Saturday" || dayObj?.weekday === "Sunday" ? "weekend" : ""} 
            ${isToday(dayObj?.day, selectedMonth) ? "today" : ""} 
            ${selectedDay?.day === dayObj?.day ? "selected" : ""}`}
            onClick={() => handleDayClick(dayObj?.day, dayObj?.weekday)}
          >
            {dayObj ? dayObj.day : ""}
          </div>
        ))}
      </div>

      {/* Afișarea sloturilor pentru ziua selectată */}
      {selectedDay && (
        <div className="slots-grid">
          <CalendarSlotComponent
            day={`${selectedDay.weekday}, ${selectedDay.day}`}
            slots={selectedDay.slots}
            onAddSlot={() => handleEditSlotsForDay([...selectedDay.slots, "New Slot"])}
            onDeleteAll={() => handleEditSlotsForDay([])}
            onDeleteSlot={(day, slot) =>
              handleEditSlotsForDay(selectedDay.slots.filter((s) => s !== slot))
            }
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

        .calendar-day:hover,
        .calendar-day.selected {
          background-color: #007bff;
          color: white;
        }

        .calendar-day.today {
          border: 2px solid #007bff;
        }

        .calendar-day.weekend {
          background-color: #ffcccb; /* Culoare pentru weekend */
        }

        .calendar-day.weekend:hover,
        .calendar-day.weekend.selected {
          background-color: #007bff;
          color: white;
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
    </div>
    </div>
  );
};

export default CalendarComponent;
