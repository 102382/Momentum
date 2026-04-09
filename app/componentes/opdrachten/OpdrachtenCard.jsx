import "./opdrachtenCard.css";

const OpdrachtenCard = ({ opdracht, onEdit, onDelete, onComplete }) => {
  const {
    _id,
    titel,
    beschrijving,
    prioriteit,
    status,
    deadline,
    kategorie,
    progress,
  } = opdracht;

  const getPrioriteitColor = (p) => {
    switch (p) {
      case "hoog":
        return "#FF6B6B";
      case "middel":
        return "#FFB84D";
      case "laag":
        return "#4ECDC4";
      default:
        return "#999";
    }
  };

  const getStatusIcon = (s) => {
    switch (s) {
      case "completed":
        return "fa-check-circle";
      case "in-progress":
        return "fa-spinner";
      case "pending":
        return "fa-clock";
      default:
        return "fa-circle";
    }
  };

  const isCompleted = status === "completed";
  const isOverdue = new Date(deadline) < new Date() && status !== "completed";

  return (
    <div className={`opdrachtenCard ${status}`}>
      {/* Header */}
      <div className="cardHeader">
        <div
          className="statusBadge"
          style={{ borderColor: getPrioriteitColor(prioriteit) }}
        >
          <span>{prioriteit}</span>
        </div>
        <div className="actionButtons">
          {!isCompleted && (
            <button
              className="btnAction edit"
              onClick={() => onEdit(_id)}
              title="Bewerk opdracht"
            >
              <i className="fa-solid fa-edit"></i>
            </button>
          )}
          <button
            className="btnAction delete"
            onClick={() => onDelete(_id)}
            title="Verwijder opdracht"
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      {/* Titel */}
      <h3 className="cardTitle">{titel}</h3>

      {/* Beschrijving */}
      <p className="cardDescription">{beschrijving}</p>

      {/* Categorie Tag */}
      <div className="categoryTag">{kategorie}</div>

      {/* Progress Bar */}
      {!isCompleted && (
        <div className="progressContainer">
          <div className="progressLabel">
            <span>Voortgang</span>
            <span className="progressValue">{progress}%</span>
          </div>
          <div className="progressBar">
            <div
              className="progressFill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="cardFooter">
        <div className="footerInfo">
          <div
            className="deadlineInfo"
            style={{ color: isOverdue ? "#FF6B6B" : "rgba(255,255,255,0.8)" }}
          >
            <i
              className={`fa-solid ${isOverdue ? "fa-exclamation-triangle" : "fa-calendar"}`}
            ></i>
            <span>
              {new Date(deadline).toLocaleDateString("nl-NL", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {!isCompleted && (
          <button
            className="btnComplete"
            onClick={() => onComplete(_id)}
            title="Voltooi opdracht"
          >
            <i className={`fa-solid ${getStatusIcon(status)}`}></i>
          </button>
        )}
        {isCompleted && <div className="completedBadge">✓ Afgerond</div>}
      </div>
    </div>
  );
};

export default OpdrachtenCard;
