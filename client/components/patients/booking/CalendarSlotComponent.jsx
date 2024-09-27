import { useEffect } from "react";

const CalendarSlotComponent = ({
  reservedSlots,
  day,
  slots,
  onAddSlot,
  onDeleteAll,
  onDeleteSlot,
  repeatDay,
  selectedSlot,
}) => {
  useEffect(() => {
    console.log("selected...slot...", selectedSlot);
    console.log("selected...slots...", slots);
  }, [selectedSlot, slots]); // Actualizăm de fiecare dată când selectedSlot sau slots se schimbă

  return (
    <div className="tab-pane active show" id={day.toLowerCase()}>
      <div className="slot-box">
        <div className="slot-header">
          <h5>{day}</h5>
        </div>
        <div className="slot-body">
          {slots.length > 0 ? (
            <ul className="time-slots-client">
              {slots.map((slot, index) => {
                // Verificăm dacă slot-ul se află în reservedSlots
                const isReserved = reservedSlots && reservedSlots.includes(slot);

                return (
                  <li
                    key={index}
                    // Blochează onClick dacă este rezervat
                    onClick={() => {
                      if (!isReserved) {
                        onDeleteSlot(day, slot);
                      }
                    }}
                    className={`time-slot-item ${
                      isReserved ? "Rezervat" : selectedSlot?.slot === slot ? "selected-slot" : "not-selected-slot"
                    }`}
                    style={{
                      cursor: isReserved ? "not-allowed" : "pointer", // Modificare cursor pentru a indica blocarea
                    }}
                    title={isReserved ? "Rezervat" : ""} // Afișează Rezervat la hover
                  >
                    <i className="fa-regular fa-clock" /> {slot}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No Slots Available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarSlotComponent;
