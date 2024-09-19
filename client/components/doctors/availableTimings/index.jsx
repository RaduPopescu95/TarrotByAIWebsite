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

const AvailableTimings = () => {
  const [selectedDays, setSelectedDays] = useState([]); // zilele selectate
  const [slots, setSlots] = useState({}); // slots per zi
  const [activeDay, setActiveDay] = useState(null); // ziua curentă pentru modalul de adăugare slot
  const [deleteDay, setDeleteDay] = useState(null); // ziua curentă pentru modalul de ștergere toate sloturile
  const [deleteSlot, setDeleteSlot] = useState({ day: null, slot: null }); // ziua și slotul curent pentru ștergerea unui slot
  const [activeTab, setActiveTab] = useState('intervale'); // tab-ul activ
  const [editedDaySlots, setEditedDaySlots] = useState({}); // sloturile modificate pentru o zi specifică

  // Ordinea zilelor săptămânii
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleDaySelection = (day) => {
    // Verifică dacă ziua este deja selectată
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
                  <h3>Available Timings</h3>
                </div>
                <TabsComponent activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="tab-content pt-0">
                  {activeTab === 'intervale' && (
                    <div className="tab-pane fade show active" id="general-availability">
                      <div className="card custom-card">
                        <div className="card-body">
                          <div className="card-header">
                            <h3>Select Available Slots</h3>
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
                                Cancel
                              </Link>
                              <button className="btn btn-primary prime-btn">
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'calendar' && (
                    <div className="tab-pane fade show active" id="calendar-availability">
                      <CalendarComponent
                        weeklySlots={slots}
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
          title={`Add Slot for ${activeDay}`}
          bodyContent={
            <TimePicker
              onChange={(value) => handleAddSlot(activeDay, value.format("HH:mm"))}
              placeholder="Select Time"
            />
          }
          confirmText="Add Slot"
          cancelText="Cancel"
          isVisible={!!activeDay}
          onClose={handleCloseModal}
        />
      )}

      {deleteDay && (
        <ModalComponent
          id="delete_slot"
          title={`Delete All Slots for ${deleteDay}`}
          bodyContent={<p>Are you sure you want to delete all slots for {deleteDay}?</p>}
          confirmText="Delete All"
          cancelText="Cancel"
          isVisible={!!deleteDay}
          onClose={handleCloseModal}
          onConfirm={() => handleDeleteSlots(deleteDay)}
        />
      )}

      {deleteSlot.day && deleteSlot.slot && (
        <ModalComponent
          id="delete_single_slot"
          title={`Delete Slot for ${deleteSlot.day}`}
          bodyContent={<p>Are you sure you want to delete slot {deleteSlot.slot} for {deleteSlot.day}?</p>}
          confirmText="Delete Slot"
          cancelText="Cancel"
          isVisible={!!deleteSlot.day}
          onClose={handleCloseModal}
          onConfirm={confirmDeleteSlot}
        />
      )}
    </>
  );
};

export default AvailableTimings;
