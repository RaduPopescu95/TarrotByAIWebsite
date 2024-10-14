import React, { useState, useEffect } from "react";
import DoctorSidebar from "../sidebar";
import DoctorFooter from "../../common/doctorFooter";
import Home1Header from "../../home/home-1/header";
import HeaderComponent from "./HeaderComponent";
import TabsComponent from "./TabsComponent";
import ModalComponent from "./ModalComponent";
import CalendarComponent from "./CalendarComponent";
import moment from 'moment';
import 'moment/locale/ro'; // Importăm localizarea în română
import { TimePicker } from "antd";
import { handleGetFirestore, handleUpdateFirestore, handleUploadFirestore, handleUploadFirestoreGeneral } from "../../../../utils/firestoreUtils";


moment.locale('ro');

const CalendarAdmin = () => {
  const [yearlySlots, setYearlySlots] = useState({}); // inițializăm cu null pentru a verifica dacă sloturile sunt generate
  const [activeDay, setActiveDay] = useState(null); // ziua curentă pentru modalul de adăugare slot
  const [deleteDay, setDeleteDay] = useState(null); // ziua curentă pentru modalul de ștergere toate sloturile
  const [deleteSlot, setDeleteSlot] = useState({ day: null, slot: null }); // ziua și slotul curent pentru ștergerea unui slot
  const [refreshKey, setRefreshKey] = useState(0); // Stare pentru a forța refresh-ul
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [repeatDayModalVisible, setRepeatDayModalVisible] = useState(false);
  const [submitModal, setSubmitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdate, setIsUpdate] = useState(null);

  

  const generateEmptyYearWithSlots = (year) => {
    const allSlotsPerMonth = {};
    for (let month = 0; month < 12; month++) {
      const daysInMonth = moment(`${year}-${month + 1}`, 'YYYY-MM').daysInMonth();
      const monthSlots = [];
      for (let day = 1; day <= daysInMonth; day++) {
        monthSlots.push({ day, slots: [] });
      }
      allSlotsPerMonth[month] = monthSlots;
    }
    return allSlotsPerMonth;
  };

  const handleGetYearlySlots = async ()  => {
    const data = await handleGetFirestore("YearlySlots")
    return data[0]
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await handleGetYearlySlots();
        const currentYear = moment().year();
        if (data?.yearlySlots && data?.currentYear === currentYear) {
          console.log("yes it is....", data);
          setYearlySlots(data.yearlySlots);
          setIsLoading(false)
          setIsUpdate(data.documentId)
        } else {
          console.log("no it is....", data);
          const emptyYearWithSlots = generateEmptyYearWithSlots(currentYear);
          setYearlySlots(emptyYearWithSlots);
          setIsLoading(false)
        }
        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
        console.error("Error fetching yearly slots:", error);
      }
      
    };
  
    fetchData();
  }, []);  // <- dependențele rămân goale pentru a executa doar o dată la montare
  

  const handleAddSlot = (day, newSlot) => {
    setYearlySlots(prevYearlySlots => {
      const [month, dayKey] = day.split("-").map(Number);
      const updatedMonth = prevYearlySlots[month].map(slotObj =>
        slotObj.day === dayKey 
          ? { 
              ...slotObj, 
              slots: [...slotObj.slots, newSlot].sort((a, b) => a.localeCompare(b)) // Sortează sloturile
            } 
          : slotObj
      );
      
      const updatedDay = updatedMonth.find(slotObj => slotObj.day === dayKey);
      setSelectedDay(updatedDay);
  
      return { ...prevYearlySlots, [month]: updatedMonth };
    });
    setActiveDay(null);  
    setSelectedTime(null);
  };
  
  const confirmDeleteSlot = () => {
    const { day, slot } = deleteSlot;
    setYearlySlots(prevYearlySlots => {
      const [month, dayKey] = day.split("-").map(Number);
      const updatedMonth = prevYearlySlots[month].map(slotObj =>
        slotObj.day === dayKey
          ? { 
              ...slotObj, 
              slots: slotObj.slots.filter(s => s !== slot).sort((a, b) => a.localeCompare(b)) // Sortează sloturile după ștergere
            }
          : slotObj
      );
  
      const updatedDay = updatedMonth.find(slotObj => slotObj.day === dayKey);
      setSelectedDay(updatedDay);
  
      return { ...prevYearlySlots, [month]: updatedMonth };
    });
    setDeleteSlot({ day: null, slot: null });
  };
  
  
  const handleDeleteSlots = (day) => {
    console.log(day)
    setYearlySlots(prevYearlySlots => {
      const [month, dayKey] = day.split("-").map(Number);
      const updatedMonth = prevYearlySlots[month].map(slotObj =>
        slotObj.day === dayKey ? { ...slotObj, slots: [] } : slotObj
      );
  
      // Actualizează selectedDay pentru a reflecta ștergerea tuturor sloturilor
      const updatedDay = updatedMonth.find(slotObj => slotObj.day === dayKey);
      setSelectedDay(updatedDay);
  
      return { ...prevYearlySlots, [month]: updatedMonth };
    });
    setDeleteDay(null);
  };
  
 
  
  

  const openAddSlotModal = (day) => setActiveDay(day);
  const openDeleteAllSlotsModal = (day) => setDeleteDay(day);
  const openDeleteSingleSlotModal = (day, slot) => setDeleteSlot({ day, slot });
  const openRepeatDayModal = () => setRepeatDayModalVisible(true);
  const closeRepeatDayModal = () => setRepeatDayModalVisible(false);
  const openSubmitFirebaseModal = () => setSubmitModal(true);
  const closeSubmitFirebaseModal = () => setSubmitModal(false);
  


  const closeModal = () => {
    setActiveDay(null);
    setDeleteDay(null);
    setDeleteSlot({ day: null, slot: null });
  };


  const handleSubmitInfo = async () => {
    setIsLoading(true)
    const currentYear = moment().year();
    const data= {yearlySlots, currentYear}
    console.log("yearly slots...", data)
    await handleUploadFirestoreGeneral(data,"YearlySlots").then(()=>{

      setIsLoading(false)
    })
  }
  const handleUpdateInfo = async () => {
    setIsLoading(true)
    const currentYear = moment().year();
    const data= {yearlySlots, currentYear}
    console.log("yearly slots...", data)
    await handleUpdateFirestore(`YearlySlots/${isUpdate}`, data).then(() =>{
      setIsLoading(false)

    })
  }

  const handleRepeatDay = () => {
    if (!selectedDay) return;
    const currentYear = moment().year();
  
    // Obținem ziua săptămânii din selectedDay (ex. "Luni", "Marți")
    const dayOfWeek = moment(`${currentYear}-${selectedMonth + 1}-${selectedDay.day}`, 'YYYY-MM-DD').format('dddd').toLowerCase();
    
    // Mapare pentru ziua săptămânii fără diacritice
    const dayMapping = {
      "luni": "L",
      "marți": "Ma",
      "miercuri": "Mi",
      "joi": "J",
      "vineri": "V",
      "sâmbătă": "S",
      "duminică": "D"
    };
    
    const mappedDay = dayMapping[dayOfWeek];
    const selectedSlots = selectedDay.slots; // Orele din ziua selectată
    
    setYearlySlots(prevYearlySlots => {
      const updatedYearlySlots = { ...prevYearlySlots };
  
      // Iterăm peste fiecare lună
      Object.keys(updatedYearlySlots).forEach(month => {
        updatedYearlySlots[month] = updatedYearlySlots[month].map(slotObj => {
          // Pentru fiecare zi a lunii, verificăm dacă este aceeași zi a săptămânii cu ziua selectată
          const dayOfWeekForCurrentDay = moment(`${currentYear}-${parseInt(month) + 1}-${slotObj.day}`, 'YYYY-MM-DD').format('dddd').toLowerCase();
          
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
                <TabsComponent activeTab={"calendar"} setActiveTab={() => {}} />
                <div className="tab-content pt-0">
                  {yearlySlots && (
                    <div className="tab-pane fade show active" id="calendar-availability">
                      <CalendarComponent
                       key={refreshKey} 
                        yearlySlots={yearlySlots}
                        onEditDaySlots={handleAddSlot}
                        openAddSlotModal={openAddSlotModal}
                        openDeleteAllSlotsModal={openDeleteAllSlotsModal}
                        onDeleteSlot={openDeleteSingleSlotModal}
                        selectedDay={selectedDay}
                        setSelectedDay={setSelectedDay}
                        selectedMonth={selectedMonth}
                        setSelectedMonth={setSelectedMonth}
                        handleSubmitInfo={openSubmitFirebaseModal}
                        repeatDay={openRepeatDayModal}
                        isLoading={isLoading}
                        isUpdate={isUpdate}
                        handleUpdateSubmitInfo={openSubmitFirebaseModal}
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

      {/* Modal pentru adăugarea unui slot */}
      {activeDay && (
        <ModalComponent
          id="add_slot"
          title={`Adauga ore pentru ziua ${activeDay}`}
          bodyContent={
            <TimePicker
              onChange={(value) => setSelectedTime(value.format("HH:mm"))}
              placeholder="Selecteaz ora"
            />
          }
          confirmText="Adauga ora"
          cancelText="Anuleaza"
          isVisible={!!activeDay}
          onClose={closeModal}
          onConfirm={() => handleAddSlot(activeDay, selectedTime)}
        />
      )}

      {/* Modal pentru ștergerea tuturor sloturilor */}
      {deleteDay && (
  <ModalComponent
    id="delete_all_slots"
    title={`Sterge toate orele pentru ziua ${deleteDay}`}
    bodyContent={<p>Esti sigur ca vrei sa stergi toate orele pentru ziua {deleteDay}?</p>}
    confirmText="Sterge toate"
    cancelText="Anuleaza"
    isVisible={!!deleteDay}
    onClose={closeModal}
    onConfirm={() => handleDeleteSlots(deleteDay)}
  />
)}


      {/* Modal pentru ștergerea unui slot specific */}
      {deleteSlot.day && deleteSlot.slot && (
  <ModalComponent
    id="delete_single_slot"
    title={`Sterge ora pentru ziua ${deleteSlot.day}`}
    bodyContent={<p>Esti sigur ca vrei sa stergi slotul {deleteSlot.slot} pentru ziua {deleteSlot.day}?</p>}
    confirmText="Sterge ora"
    cancelText="Anuleaza"
    isVisible={!!deleteSlot.day}
    onClose={closeModal}
    onConfirm={confirmDeleteSlot}
  />
)}

      {/* Modal pentru repetarea zilei */}
      {repeatDayModalVisible && (
        <ModalComponent
          id="repeat_day"
          title="Repetați ziua selectată"
          bodyContent={<p>Esti sigur ca vrei sa copiezi toate orele din ziua selectata în toate zilele corespunzătoare din anul in curs?</p>}
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
          bodyContent={<p>{`Doriti sa ${isUpdate ?  "actualizati" : "salvati"} informatiile?`}</p>}
          confirmText={isUpdate ?  "Actualizeaza"  : "Salveaza"}
          cancelText="Anuleaza"
          isVisible={submitModal}
          onClose={closeSubmitFirebaseModal}
          onConfirm={() => {
            if(isUpdate){

              handleUpdateInfo();
            }else{

              handleSubmitInfo();
            }
            closeSubmitFirebaseModal();
          }}
        />
      )}
    </>
  );
};

export default CalendarAdmin;
