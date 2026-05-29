"use client";
import "./opdrachtenCard.css";
import { useState, useEffect } from "react";
import Message from "../message/Message.jsx";
import OpdrachtenForm from "./OpdrachtenForm.jsx";
import OpdrachtUpdateForm from "./OpdrachtUpdateForm.jsx";
import { API_URL } from "../../config";

const OpdrachtenCard = ({ opdracht_id }) => {
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageType, setMessageType] = useState("success");

  const [showForm, setShowForm] = useState(false);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setMessageVisible(true);

    setTimeout(() => {
      setMessageVisible(false);
    }, 3000);
  };

  const [opdracht, setOpdracht] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/receive/mijnOpdrachten`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        const gevondenOpdracht = data.find((o) => o._id === opdracht_id);
        setOpdracht(gevondenOpdracht);
        setLoading(false);
      })
      .catch(() => {
        console.log("Niet ingelogd");
        setLoading(false);
      });
  }, [opdracht_id]);

  if (loading || !opdracht) {
    return <div>Laden...</div>;
  }

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

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/send/deleteOpdracht`, {
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

  const handleCompleteOpdracht = async () => {
    try {
      const res = await fetch(`${API_URL}/send/completeOpdracht`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ id: _id }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Error", "error");
        return;
      }

      showMessage("Opdracht afgerond!", "success");
      setOpdracht({ ...opdracht, status: "completed", progress: 100 });
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
    }
  };

  return (
    <div>
      {showForm && (
        <div className="modalOverlay" onClick={() => setShowForm(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <OpdrachtUpdateForm id={_id} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}
      <div>
        <Message text={message} type={messageType} visible={messageVisible} />

        {!showForm && (
          <div className={`opdrachtenCard ${status}`} id={_id}>
            <div className="cardHeader">
              <div
                className="statusBadge"
                style={{ borderColor: getPrioriteitColor(prioriteit) }}
              >
                <span>{prioriteit}</span>
              </div>
              <div className="actionButtons">
                <button
                  className="btnAction edit"
                  type="button"
                  data-opdracht-id={_id}
                  title="Bewerk opdracht"
                  onClick={() => {
                    console.log("Bewerk opdracht:", _id);
                    setShowForm(true);
                  }}
                >
                  <i className="fa-solid fa-edit"></i>
                </button>
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

            <h3 className="cardTitle">{titel}</h3>
            <p className="cardDescription">{beschrijving}</p>
            <div className="categoryTag">{kategorie}</div>

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

            <div className="cardFooter">
              <div className="footerInfo">
                <div
                  className="deadlineInfo"
                  style={{
                    color: isOverdue ? "#FF6B6B" : "rgba(255,255,255,0.8)",
                  }}
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
                  onClick={handleCompleteOpdracht}
                  title="Voltooi opdracht"
                >
                  <i className={`fa-solid ${getStatusIcon(status)}`}></i>
                </button>
              )}
              {isCompleted && <div className="completedBadge">✓ Afgerond</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpdrachtenCard;
