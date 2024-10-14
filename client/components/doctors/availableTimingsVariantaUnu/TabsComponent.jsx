import Link from "next/link";

const TabsComponent = ({ activeTab, setActiveTab }) => (
  <div className="appointment-tabs">
    <ul className="nav">
      <li className="nav-item" role="presentation">
        <Link
          className={`nav-link ${activeTab === 'intervale' ? 'active' : ''}`}
          href="#"
          onClick={() => setActiveTab('intervale')}
        >
          Intervale de lucru
        </Link>
      </li>
      <li className="nav-item" role="presentation">
        <Link
          className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
          href="#"
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </Link>
      </li>
    </ul>
  </div>
);

export default TabsComponent;
