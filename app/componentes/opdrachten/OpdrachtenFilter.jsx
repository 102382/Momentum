import "./opdrachtenFilter.css";

const OpdrachtenFilter = ({ filter, setFilter }) => {
  return (
    <div className="filterContainer">
      <div className="filterSection">
        <h3>
          <i className="fa-solid fa-filter"></i> Status
        </h3>
        <div className="filterButtons">
          <button
            className={`filterBtn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Alle
          </button>
          <button
            className={`filterBtn ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            <i className="fa-solid fa-clock"></i> In wachtrij
          </button>
          <button
            className={`filterBtn ${filter === "in-progress" ? "active" : ""}`}
            onClick={() => setFilter("in-progress")}
          >
            <i className="fa-solid fa-spinner"></i> Bezig
          </button>
          <button
            className={`filterBtn ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            <i className="fa-solid fa-check-circle"></i> Afgerond
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpdrachtenFilter;
