import "./opdrachtenCard.css";
import { useState } from "react";
import Message from "../message/Message.jsx";

const OpdrachtenCard = ({ opdracht, onComplete }) => {

  // message state

  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageType, setMessageType] = useState("success");

  // toon messge functie

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setMessageVisible(true);

    setTimeout(() => {
      setMessageVisible(false);
    }, 3000);
  };
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


  const bewerkOpdracht = () => {
    showMessage("Bewerk opdracht functie nog niet geïmplementeerd", "info");
  }


  {/* Hier Behandel ik de Delete actie van de opdracht */ }

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3001/send/deleteOpdracht", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: _id }),
      });

      const data = await res.text();

      if (!res.ok) {
        showMessage(data, "error");
        return;
      }

      showMessage("Opdracht verwijderd!", "success");
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
    }
  };


  return (
    <div>
      <Message text={message} type={messageType} visible={messageVisible} />
      <div className={`opdrachtenCard ${status}`} id={_id}>
        {/* Header */}
        <div className="cardHeader">
          <div
            className="statusBadge"
            style={{ borderColor: getPrioriteitColor(prioriteit) }}
          >
            <span>{prioriteit}</span>
          </div>
          <div className="actionButtons">
            {(
                <button
                  className="btnAction edit"
                  type="submit"
                  title="Bewerk opdracht"
                  onClick={bewerkOpdracht}
                >
                  <i className="fa-solid fa-edit"></i>
                </button>
            )}
            <form onSubmit={handleDeleteSubmit}>
              <input type="hidden" name="id" value={_id} readOnly />
              <button
                className="btnAction delete"
                title="Verwijder opdracht"
                type="submit"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </form>
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
    </div>
  );
};

export default OpdrachtenCard;
