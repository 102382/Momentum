"use client";
import { useEffect, useState } from "react";
import "./rightSideProfile.css";
import { API_URL } from "../../config";

const UserOpdrachten = ({ user, onBack }) => {
  const [opdrachten, setOpdrachten] = useState([]);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/receive/userOpdrachten/${user.email}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setOpdrachten(Array.isArray(data) ? data : []);

        // Ik bereken de statistieken.
        const completed = data.filter((o) => o.status === "completed").length;
        const total = data.length;

        setStats({
          completed: completed,
          total: total,
          pending: total - completed,
        });
        setLoading(false);
      })
      .catch(() => {
        console.log("Fout bij het laden van opdrachten");
        setLoading(false);
      });
  }, [user.email]);

  if (loading) {
    return (
      <div className="userOpdrachtenContainer">
        <button className="backButton" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
          Terug
        </button>
        <div className="userOpdrachtenBox">Laden...</div>
      </div>
    );
  }

  return (
    <div className="userOpdrachtenContainer">
      <button className="backButton" onClick={onBack}>
        <i className="fa-solid fa-arrow-left"></i>
        Terug
      </button>

      <div className="userOpdrachtenBox">
        <div className="userOpdrachtenHeader">
          <h3 className="userOpdrachtenTitle">Opdrachten van {user.naam}</h3>
          <div className="userStatsSummary">
            <div className="userStatItem">
              <span className="statLabel">Gemaakt:</span>
              <span className="statValue">{stats.completed}</span>
            </div>
            <div className="userStatItem">
              <span className="statLabel">Nog te doen:</span>
              <span className="statValue">{stats.pending}</span>
            </div>
          </div>
        </div>

        {opdrachten.length > 0 ? (
          <div className="userOpdrachtenList">
            <div className="userOpdrachtenListLine"></div>
            {opdrachten.map((opdracht) => (
              <div key={opdracht._id} className="userOpdrachtenItem">
                <div className="userOpdrachtenItemContent">
                  <h4 className="userOpdrachtenItemTitle">{opdracht.titel}</h4>
                  <p className="userOpdrachtenItemStatus">
                    {opdracht.status === "completed"
                      ? "✓ Voltooid"
                      : "○ In progress"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="noOpdrachten">Geen opdrachten beschikbaar</p>
        )}
      </div>
    </div>
  );
};

export default UserOpdrachten;
