import React, { useEffect, useState } from "react";
import Link from "next/link";
import "bootstrap-daterangepicker/daterangepicker.css";

import Footer from "../../footer";
import Home1Header from "../../home/home-1/header";
import { handleGetFirestore } from "../../../../utils/firestoreUtils";
import moment from "moment";
import "moment/locale/ro"; // Importăm localizarea în română
import CalendarComponent from "./CalendarComponent";
import ModalComponent from "./ModalComponent";
import { useAuth } from "../../../../context/AuthContext";

moment.locale("ro");

const Booking = (props) => {
  const [yearlySlots, setYearlySlots] = useState({}); // inițializăm cu null pentru a verifica dacă sloturile sunt generate
  const [activeDay, setActiveDay] = useState(null); // ziua curentă pentru modalul de adăugare slot
  const [deleteDay, setDeleteDay] = useState(null); // ziua curentă pentru modalul de ștergere toate sloturile
  const [refreshKey, setRefreshKey] = useState(0); // Stare pentru a forța refresh-ul
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [repeatDayModalVisible, setRepeatDayModalVisible] = useState(false);
  const [submitModal, setSubmitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdate, setIsUpdate] = useState(null);
  const [rezervariCalendar, setRezervariCalendar] = useState([]);
  const { selectedSlot, setSelectedSlot } = useAuth();

  const generateEmptyYearWithSlots = (year) => {
    const allSlotsPerMonth = {};
    for (let month = 0; month < 12; month++) {
      const daysInMonth = moment(
        `${year}-${month + 1}`,
        "YYYY-MM"
      ).daysInMonth();
      const monthSlots = [];
      for (let day = 1; day <= daysInMonth; day++) {
        monthSlots.push({ day, slots: [] });
      }
      allSlotsPerMonth[month] = monthSlots;
    }
    return allSlotsPerMonth;
  };

  // Fetch Yearly Slots from Firestore
  const handleGetYearlySlots = async () => {
    const data = await handleGetFirestore("YearlySlots");
    return data[0];
  };

  // Fetch Reserved Slots from Firestore
  const handleReservedSlots = async () => {
    const data = await handleGetFirestore("RezervariConsultatii");
    return data;
  };

  // Function to update yearlySlots with reservedSlots
  const updateYearlySlotsWithReservations = (yearlySlots, rezervari) => {
    // Iterăm prin fiecare rezervare
    rezervari.forEach((rezervare) => {
      const { day, slot } = rezervare.selectedSlot;
      // Separăm luna și ziua din `day` (exemplu: "8-9" -> luna 8, ziua 9)
      const [month, dayOfMonth] = day.split("-").map(Number);

      // Căutăm luna corespunzătoare în `yearlySlots`
      if (yearlySlots[month]) {
        // Căutăm ziua corespunzătoare în lista de zile din luna respectivă
        const dayObject = yearlySlots[month].find((d) => d.day === dayOfMonth);

        if (dayObject) {
          // Adăugăm `reservedSlots` dacă nu există deja
          if (!dayObject.reservedSlots) {
            dayObject.reservedSlots = [];
          }

          // Adăugăm ora rezervată în `reservedSlots`
          if (!dayObject.reservedSlots.includes(slot)) {
            dayObject.reservedSlots.push(slot);
          }
        }
      }
    });

    return yearlySlots;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch data from Firestore
        const data = await handleGetYearlySlots();
        const rezervari = await handleReservedSlots();

        if (rezervari.length > 0) {
          setRezervariCalendar(rezervari);
        }

        const currentYear = moment().year();
        if (data?.yearlySlots && data?.currentYear === currentYear) {
          console.log("Yearly Slots found in database:", data);

          // Actualizăm `yearlySlots` cu `reservedSlots` din `rezervari`
          const updatedYearlySlots = updateYearlySlotsWithReservations(
            data.yearlySlots,
            rezervari
          );
          console.log("updatedYearlySlots....", updatedYearlySlots);
          setYearlySlots(updatedYearlySlots);
          setIsLoading(false);
          setIsUpdate(data.documentId);
        } else {
          console.log(
            "No slots found or the year is not current. Generating empty slots for the year:",
            currentYear
          );

          const emptyYearWithSlots = generateEmptyYearWithSlots(currentYear);
          setYearlySlots(emptyYearWithSlots);
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
        console.error("Error fetching yearly slots or reservations:", error);
      }
    };

    fetchData();
  }, []); // <- dependențele rămân goale pentru a executa doar o dată la montare

  const handleAddSlot = (day, newSlot) => {
    setYearlySlots((prevYearlySlots) => {
      const [month, dayKey] = day.split("-").map(Number);
      const updatedMonth = prevYearlySlots[month].map((slotObj) =>
        slotObj.day === dayKey
          ? {
              ...slotObj,
              slots: [...slotObj.slots, newSlot].sort((a, b) =>
                a.localeCompare(b)
              ), // Sortează sloturile
            }
          : slotObj
      );

      const updatedDay = updatedMonth.find((slotObj) => slotObj.day === dayKey);
      setSelectedDay(updatedDay);

      return { ...prevYearlySlots, [month]: updatedMonth };
    });
    setActiveDay(null);
    setSelectedTime(null);
  };

  const confirmDeleteSlot = () => {
    const { day, slot } = selectedSlot;
    setYearlySlots((prevYearlySlots) => {
      const [month, dayKey] = day.split("-").map(Number);
      const updatedMonth = prevYearlySlots[month].map((slotObj) =>
        slotObj.day === dayKey
          ? {
              ...slotObj,
              slots: slotObj.slots
                .filter((s) => s !== slot)
                .sort((a, b) => a.localeCompare(b)), // Sortează sloturile după ștergere
            }
          : slotObj
      );

      const updatedDay = updatedMonth.find((slotObj) => slotObj.day === dayKey);
      setSelectedDay(updatedDay);

      return { ...prevYearlySlots, [month]: updatedMonth };
    });
    setSelectedSlot({ day: null, slot: null });
  };

  const handleDeleteSlots = (day) => {
    console.log(day);
    setYearlySlots((prevYearlySlots) => {
      const [month, dayKey] = day.split("-").map(Number);
      const updatedMonth = prevYearlySlots[month].map((slotObj) =>
        slotObj.day === dayKey ? { ...slotObj, slots: [] } : slotObj
      );

      // Actualizează selectedDay pentru a reflecta ștergerea tuturor sloturilor
      const updatedDay = updatedMonth.find((slotObj) => slotObj.day === dayKey);
      setSelectedDay(updatedDay);

      return { ...prevYearlySlots, [month]: updatedMonth };
    });
    setDeleteDay(null);
  };

  const openAddSlotModal = (day) => setActiveDay(day);
  const openDeleteAllSlotsModal = (day) => setDeleteDay(day);
  const selectASlot = (day, slot) => setSelectedSlot({ day, slot });
  const openRepeatDayModal = () => setRepeatDayModalVisible(true);
  const closeRepeatDayModal = () => setRepeatDayModalVisible(false);
  const openSubmitFirebaseModal = () => setSubmitModal(true);
  const closeSubmitFirebaseModal = () => setSubmitModal(false);

  const closeModal = () => {
    setActiveDay(null);
    setDeleteDay(null);
    setSelectedSlot({ day: null, slot: null });
  };

  const handleSubmitInfo = async () => {
    setIsLoading(true);
    const currentYear = moment().year();
    const data = { yearlySlots, currentYear };
    console.log("yearly slots...", data);
    await handleUploadFirestoreGeneral(data, "YearlySlots").then(() => {
      setIsLoading(false);
    });
  };

  const handleRepeatDay = () => {
    if (!selectedDay) return;
    const currentYear = moment().year();

    // Obținem ziua săptămânii din selectedDay (ex. "Luni", "Marți")
    const dayOfWeek = moment(
      `${currentYear}-${selectedMonth + 1}-${selectedDay.day}`,
      "YYYY-MM-DD"
    )
      .format("dddd")
      .toLowerCase();

    // Mapare pentru ziua săptămânii fără diacritice
    const dayMapping = {
      luni: "L",
      marți: "Ma",
      miercuri: "Mi",
      joi: "J",
      vineri: "V",
      sâmbătă: "S",
      duminică: "D",
    };

    const mappedDay = dayMapping[dayOfWeek];
    const selectedSlots = selectedDay.slots; // Orele din ziua selectată

    setYearlySlots((prevYearlySlots) => {
      const updatedYearlySlots = { ...prevYearlySlots };

      // Iterăm peste fiecare lună
      Object.keys(updatedYearlySlots).forEach((month) => {
        updatedYearlySlots[month] = updatedYearlySlots[month].map((slotObj) => {
          // Pentru fiecare zi a lunii, verificăm dacă este aceeași zi a săptămânii cu ziua selectată
          const dayOfWeekForCurrentDay = moment(
            `${currentYear}-${parseInt(month) + 1}-${slotObj.day}`,
            "YYYY-MM-DD"
          )
            .format("dddd")
            .toLowerCase();

          if (dayMapping[dayOfWeekForCurrentDay] === mappedDay) {
            // Dacă este aceeași zi a săptămânii, copiem sloturile
            return { ...slotObj, slots: selectedSlots };
          }

          return slotObj; // Dacă nu se potrivește, păstrăm ziua neschimbată
        });
      });

      return updatedYearlySlots;
    });
  };

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
              {yearlySlots && (
                <div
                  className="tab-pane fade show active"
                  id="calendar-availability"
                >
                  <CalendarComponent
                    key={refreshKey}
                    yearlySlots={yearlySlots}
                    onEditDaySlots={handleAddSlot}
                    openAddSlotModal={openAddSlotModal}
                    openDeleteAllSlotsModal={openDeleteAllSlotsModal}
                    onDeleteSlot={selectASlot}
                    selectedDay={selectedDay}
                    setSelectedDay={setSelectedDay}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    handleSubmitInfo={openSubmitFirebaseModal}
                    repeatDay={openRepeatDayModal}
                    isLoading={isLoading}
                    isUpdate={isUpdate}
                    handleUpdateSubmitInfo={openSubmitFirebaseModal}
                    setSelectedSlot={setSelectedSlot}
                    selectedSlot={selectedSlot} // Aici trecem selectedSlot ca prop
                  />
                </div>
              )}

              <div></div>
              <div className="submit-section proceed-btn text-end">
                {selectedSlot.slot && (
                  <Link
                    href="/informatii-utilizator"
                    className="btn btn-primary submit-btn"
                  >
                    Rezerva si plateste
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer {...props} />
      {/* Modal pentru ștergerea tuturor sloturilor */}
      {deleteDay && (
        <ModalComponent
          id="delete_all_slots"
          title={`Sterge toate orele pentru ziua ${deleteDay}`}
          bodyContent={
            <p>
              Esti sigur ca vrei sa stergi toate orele pentru ziua {deleteDay}?
            </p>
          }
          confirmText="Sterge toate"
          cancelText="Anuleaza"
          isVisible={!!deleteDay}
          onClose={closeModal}
          onConfirm={() => handleDeleteSlots(deleteDay)}
        />
      )}

      {/* Modal pentru ștergerea unui slot specific */}
      {/* {selectedSlot.day && selectedSlot.slot && (
  <ModalComponent
    id="delete_single_slot"
    title={`Sterge ora pentru ziua ${selectedSlot.day}`}
    bodyContent={<p>Doriti sa rezervati ora {selectedSlot.slot} pentru ziua {selectedSlot.day}?</p>}
    confirmText="Sterge ora"
    cancelText="Anuleaza"
    isVisible={!!selectedSlot.day}
    onClose={closeModal}
    onConfirm={confirmDeleteSlot}
  />
)} */}

      {/* Modal pentru repetarea zilei */}
      {repeatDayModalVisible && (
        <ModalComponent
          id="repeat_day"
          title="Repetați ziua selectată"
          bodyContent={
            <p>
              Esti sigur ca vrei sa copiezi toate orele din ziua selectata în
              toate zilele corespunzătoare din anul in curs?
            </p>
          }
          confirmText="Repeta zi"
          cancelText="Anuleaza"
          isVisible={repeatDayModalVisible}
          onClose={closeRepeatDayModal}
          onConfirm={() => {
            handleRepeatDay();
            closeRepeatDayModal();
          }}
        />
      )}
      {submitModal && (
        <ModalComponent
          id="submit_firebase"
          title="Salveaza date disponibilitati"
          bodyContent={
            <p>
              Doriti sa rezervati ora {selectedSlot.slot} pentru ziua{" "}
              {selectedSlot.day}?
            </p>
          }
          confirmText={isUpdate ? "Actualizeaza" : "Salveaza"}
          cancelText="Anuleaza"
          isVisible={submitModal}
          onClose={closeSubmitFirebaseModal}
          onConfirm={() => {
            handleSubmitInfo();

            closeSubmitFirebaseModal();
          }}
        />
      )}
    </div>
  );
};

export default Booking;
