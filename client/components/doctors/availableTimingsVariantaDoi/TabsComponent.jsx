const TabsComponent = ({
  activeYear,
  setActiveYear,
  currentYear,
  setSelectedDay,
}) => (
  <div className="appointment-tabs">
    <ul className="nav">
      <li className="nav-item" role="presentation">
        <span
          className={`nav-link ${activeYear === currentYear ? "active" : ""}`}
          onClick={() => {
            setActiveYear(currentYear), setSelectedDay(null);
          }}
          style={{ cursor: "pointer" }} // Stil pentru a arăta ca un link
        >
          {`Anul curent - ${currentYear}`}
        </span>
      </li>
      <li className="nav-item" role="presentation">
        <span
          className={`nav-link ${activeYear === currentYear + 1 ? "active" : ""}`}
          onClick={() => {
            setActiveYear(currentYear + 1), setSelectedDay(null);
          }}
          style={{ cursor: "pointer" }}
        >
          {`Anul următor - ${currentYear + 1}`}
        </span>
      </li>
    </ul>
  </div>
);

export default TabsComponent;
