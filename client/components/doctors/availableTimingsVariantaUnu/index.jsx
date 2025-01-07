import React, { useState } from "react";
import DoctorSidebar from "../sidebar";
import DoctorFooter from "../../common/doctorFooter";
import { TimePicker } from "antd";
import Link from "next/link";
import Home1Header from "../../home/home-1/header";
import HeaderComponent from "./HeaderComponent";
import TabsComponent from "./TabsComponent";
import AvailableDays from "./AvailableDays";
import SlotComponent from "./SlotComponent";
import ModalComponent from "./ModalComponent";
import CalendarComponent from "./CalendarComponent";
import moment from 'moment';
import 'moment/locale/ro'; // Importăm localizarea în română

// Setăm moment la limba română
moment.locale('ro');

const AvailableTimings = () => {
  const [selectedDays, setSelectedDays] = useState([]); // zilele selectate
  const [slots, setSlots] = useState({}); // slots per zi
  const [activeDay, setActiveDay] = useState(null); // ziua curentă pentru modalul de adăugare slot
  const [deleteDay, setDeleteDay] = useState(null); // ziua curentă pentru modalul de ștergere toate sloturile
  const [deleteSlot, setDeleteSlot] = useState({ day: null, slot: null }); // ziua și slotul curent pentru ștergerea unui slot
  const [activeTab, setActiveTab] = useState("intervale"); // tab-ul activ
  const [editedDaySlots, setEditedDaySlots] = useState({}); // sloturile modificate pentru o zi specifică
  const [yearlySlots, setYearlySlots] = useState(null); // inițializăm cu null pentru a verifica dacă sloturile sunt încă generate

  // Ordinea zilelor săptămânii
  const dayOrder = ["Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata", "Duminica"];

  const handleDaySelection = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((selectedDay) => selectedDay !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddSlot = (day, newSlot) => {
    setSlots({
      ...slots,
      [day]: [...(slots[day] || []), newSlot],
    });
    setActiveDay(null);
  };

  const handleDeleteSlots = (day) => {
    const updatedSlots = { ...slots };
    delete updatedSlots[day];
    setSlots(updatedSlots);
    setDeleteDay(null);
  };

  const handleDeleteSingleSlot = (day, slot) => {
    setDeleteSlot({ day, slot });
  };

  const confirmDeleteSlot = () => {
    const { day, slot } = deleteSlot;
    setSlots({
      ...slots,
      [day]: slots[day].filter((s) => s !== slot),
    });
    setDeleteSlot({ day: null, slot: null });
  };

  const handleCloseModal = () => {
    setActiveDay(null);
    setDeleteDay(null);
    setDeleteSlot({ day: null, slot: null });
  };

  const handleEditDaySlots = (day, newSlots) => {
    setEditedDaySlots({
      ...editedDaySlots,
      [day]: newSlots,
    });
  };

  const sortedSelectedDays = selectedDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  const daysOfWeek = ["Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata", "Duminica"];

   // Maparea zilelor de la moment (diacritice) la zilele din array-ul tău (fără diacritice)
   const dayMapping = {
    "luni": "Luni",
    "marți": "Marti",
    "miercuri": "Miercuri",
    "joi": "Joi",
    "vineri": "Vineri",
    "sâmbătă": "Sambata",
    "duminică": "Duminica"
  };

 // Functie pentru a genera toate zilele din anul curent cu sloturile asociate pe fiecare zi a săptămânii
 const generateYearWithSlots = (year, slotsPerDay) => {
  const allSlotsPerMonth = {};

  // Parcurgem lunile anului (index de la 0 la 11, așa cum Moment.js așteaptă)
  for (let month = 0; month < 12; month++) {
    // Obținem numărul de zile din lună corect
    const daysInMonth = moment(`${year}-${month + 1}`, 'YYYY-MM').daysInMonth();
    const monthSlots = [];
    
    console.log("days in month....", year);
    console.log("days in month....", month);
    console.log("days in month....", daysInMonth - 1);

    // Parcurgem zilele fiecărei luni
    for (let day = 1; day <= daysInMonth - 1; day++) {
      const date = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
      const weekdayWithDiacritics = date.format('dddd').toLowerCase(); // Obținem numele complet al zilei (ex. 'luni', 'marți')
      const weekday = dayMapping[weekdayWithDiacritics]; // Convertim numele cu diacritice la cel din array-ul tău

      // Verificăm dacă avem sloturi pentru ziua săptămânii respective
      const slotsForDay = slotsPerDay[weekday] || [];

      console.log(`Calculating slots for: ${date.format('YYYY-MM-DD')} (Weekday: ${weekday})`);

      // Adăugăm ziua în sloturile lunii
      monthSlots.push({ day, slots: slotsForDay });
    }

    // Salvăm sloturile pentru lună în allSlotsPerMonth
    allSlotsPerMonth[month] = monthSlots;
  }

  console.log("All Slots per Month:", allSlotsPerMonth);
  return allSlotsPerMonth;
};

  
  const handleSaveChanges = (e) => {
    e.preventDefault();
    const currentYear = moment().year();
    const yearWithSlots = generateYearWithSlots(currentYear, slots); // Generăm zilele pe întregul an cu sloturi

    setYearlySlots(yearWithSlots); // Salvăm sloturile în state
    console.log("Saved slots for the entire year:", yearWithSlots);
  };

  // FUNCTII PENTRU CALENDAR COMPONENT CRUD FUNCTION

    // Funcția pentru a edita sloturile dintr-o zi din `yearlySlots`
    const handleEditDaySlotsCalendar = (dayKey, newSlots) => {
      setYearlySlots(prevYearlySlots => {
        const [month, day] = dayKey.split("-").map(Number);
        const updatedMonth = prevYearlySlots[month].map(slotObj =>
          slotObj.day === day ? { ...slotObj, slots: newSlots } : slotObj
        );
        return { ...prevYearlySlots, [month]: updatedMonth };
      });
    };
  
    // Funcția pentru adăugarea unui slot
    const handleAddSlotCalendar = (day, newSlot) => {
      setYearlySlots(prevYearlySlots => {
        const [month, dayKey] = day.split("-").map(Number);
        const updatedMonth = prevYearlySlots[month].map(slotObj =>
          slotObj.day === dayKey ? { ...slotObj, slots: [...slotObj.slots, newSlot] } : slotObj
        );
        return { ...prevYearlySlots, [month]: updatedMonth };
      });
      setActiveDay(null);
    };
  
    // Funcția pentru ștergerea tuturor sloturilor dintr-o zi
    const handleDeleteSlotsCalendar = (day) => {
      setYearlySlots(prevYearlySlots => {
        const [month, dayKey] = day.split("-").map(Number);
        const updatedMonth = prevYearlySlots[month].map(slotObj =>
          slotObj.day === dayKey ? { ...slotObj, slots: [] } : slotObj
        );
        return { ...prevYearlySlots, [month]: updatedMonth };
      });
      setDeleteDay(null);
    };
  
    // Funcția pentru ștergerea unui slot specific
    const confirmDeleteSlotCalendar = () => {
      const { day, slot } = deleteSlot;
      setYearlySlots(prevYearlySlots => {
        const [month, dayKey] = day.split("-").map(Number);
        const updatedMonth = prevYearlySlots[month].map(slotObj =>
          slotObj.day === dayKey
            ? { ...slotObj, slots: slotObj.slots.filter(s => s !== slot) }
            : slotObj
        );
        return { ...prevYearlySlots, [month]: updatedMonth };
      });
      setDeleteSlot({ day: null, slot: null });
    };
  

  return (
    <>
      <div className="main-wrapper">
        <Home1Header />
        <HeaderComponent />
        <div className="content doctor-content">
          <div className="container">
            <div className="row">
              <div className="col-lg-4 col-xl-3 theiaStickySidebar">
                <DoctorSidebar />
              </div>
              <div className="col-lg-8 col-xl-9">
                <div className="dashboard-header">
                  <h3>Intervale de lucru</h3>
                </div>
                <TabsComponent activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="tab-content pt-0">
                  {activeTab === 'intervale' && (
                    <div className="tab-pane fade show active" id="general-availability">
                      <div className="card custom-card">
                        <div className="card-body">
                          <div className="card-header">
                            <h3>Selecteaza Intervale de lucru</h3>
                          </div>
                          <AvailableDays handleDaySelection={handleDaySelection} selectedDays={selectedDays} />
                          <div className="tab-content pt-0">
                            {sortedSelectedDays.map((day) => (
                              <SlotComponent
                                key={day}
                                day={day}
                                slots={slots[day] || []}
                                onAddSlot={() => setActiveDay(day)}
                                onDeleteAll={() => setDeleteDay(day)}
                                onDeleteSlot={handleDeleteSingleSlot}
                              />
                            ))}
                            <div className="modal-btn text-end">
                              <Link href="#" className="btn btn-gray">
                                Anuleaza
                              </Link>
                              <button className="btn btn-primary prime-btn" onClick={handleSaveChanges}>
                                Salveaza
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                   {activeTab === 'calendar' && yearlySlots && (
                    <div className="tab-pane fade show active" id="calendar-availability">
                      <CalendarComponent
                        yearlySlots={yearlySlots}
                        onEditDaySlots={handleEditDaySlots}
                        editedDaySlots={editedDaySlots}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DoctorFooter />
      </div>

      {activeDay && (
        <ModalComponent
          id="add_slot"
          title={`Adauga ore pentru ${activeDay}`}
          bodyContent={
            <TimePicker
              onChange={(value) => handleAddSlot(activeDay, value.format("HH:mm"))}
              placeholder="Selecteaz ora"
            />
          }
          confirmText="Adauga ora"
          cancelText="Anuleaza"
          isVisible={!!activeDay}
          onClose={handleCloseModal}
        />
      )}

      {deleteDay && (
        <ModalComponent
          id="delete_slot"
          title={`Delete All Slots for ${deleteDay}`}
          bodyContent={<p>Esti sigur ca vrei sa stergi orele pentru {deleteDay}?</p>}
          confirmText="Sterge ore"
          cancelText="Anuleaza"
          isVisible={!!deleteDay}
          onClose={handleCloseModal}
          onConfirm={() => handleDeleteSlots(deleteDay)}
        />
      )}

      {deleteSlot.day && deleteSlot.slot && (
        <ModalComponent
          id="delete_single_slot"
          title={`Sterge ora pentru ${deleteSlot.day}`}
          bodyContent={<p>Esti sigur ca vrei sa stergi {deleteSlot.slot} pentru {deleteSlot.day}?</p>}
          confirmText="Sterge ora"
          cancelText="Anuleaza"
          isVisible={!!deleteSlot.day}
          onClose={handleCloseModal}
          onConfirm={confirmDeleteSlot}
        />
      )}
    </>
  );
};

export default AvailableTimings;
