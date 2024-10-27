import React, { useState } from "react";
import CalendarSlotComponent from "./CalendarSlotComponent";
import moment from 'moment';
import 'moment/locale/ro'; // Importăm localizarea în română

// Setăm moment la limba română
moment.locale('ro'); 

const CalendarComponent = ({ yearlySlots, onEditDaySlots, editedDaySlots }) => {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  // Determinăm ziua curentă
  const today = new Date();
  const isToday = (day, month) => day === today.getDate() && month === today.getMonth();

  // Zilele săptămânii în română (prescurtat)
  const daysOfWeek = ["L", "Ma", "Mi", "J", "V", "S", "D"];

  const generateDaysInMonth = (year, month) => {
    const startOfMonth = moment(`${year}-${month + 1}`, 'YYYY-MM').startOf('month');
    const daysInMonth = startOfMonth.daysInMonth(); // Numărul total de zile din lună
    const firstDayOfMonth = startOfMonth.day(); // Ziua săptămânii în care începe luna
  
    const daysArray = [];
    const emptyDaysCount = (firstDayOfMonth + 6) % 7; // Aliniem pentru a începe cu Luni (0 = Luni)
  
    // Adăugăm zile goale pentru aliniere
    for (let i = 0; i < emptyDaysCount; i++) {
      daysArray.push(null); // Zile goale
    }
    console.log("test------------------.....")
    console.log("test.....", daysInMonth)
    console.log("test.....", daysInMonth)
    console.log("test.....", month + 1)
    // Adăugăm zilele reale ale lunii și asociem cu sloturile din yearlySlots
    for (let day = 1; day <= daysInMonth - 1; day++) {
      const daySlots = yearlySlots[month + 1]?.find(slot => slot.day === day)?.slots || [];
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
              <div key={index} className="day-header">{dayName}</div>
            ))}

            {/* Afișarea zilelor din luna selectată cu aliniere corectă */}
            {daysInSelectedMonth.map((dayObj, index) => (
              <div
                key={index}
                className={`calendar-day ${dayObj?.slots.length > 0 ? "has-slots" : ""} 
                ${isToday(dayObj?.day, selectedMonth) ? "today" : ""} 
                ${selectedDay?.day === dayObj?.day ? "selected" : ""}`}
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
                onAddSlot={() => handleEditSlotsForDay([...selectedDay.slots, "New Slot"])}
                onDeleteAll={() => handleEditSlotsForDay([])}
                onDeleteSlot={(slot) =>
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

            .calendar-day.has-slots {
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
