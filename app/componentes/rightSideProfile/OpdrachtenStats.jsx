"use client";
import { useEffect, useState } from "react";
import "./rightSideProfile.css";

const OpdrachtenStats = () => {
  const [opdrachten, setOpdrachten] = useState([]);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/receive/mijnOpdrachten", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setOpdrachten(Array.isArray(data) ? data : []);

        // Calculate statistics
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
        console.log("Niet ingelogd");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="opdrachtenStatsContainer">
        <div className="opdrachtenStatsBox">Laden...</div>
      </div>
    );
  }

  const handleCompleteOpdracht = async (opdracht) => {
    try {
      const res = await fetch("http://localhost:3001/send/completeOpdracht", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ id: opdracht._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.message || "Error");
        return;
      }

      // Update the opdrachten list
      setOpdrachten(opdrachten.map(o =>
        o._id === opdracht._id ? { ...o, status: "completed", progress: 100 } : o
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        completed: prev.completed + 1,
        pending: prev.pending - 1
      }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="opdrachtenStatsContainer">
      <div
        className="opdrachtenStatsBox"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="statsHeader">
          <h3 className="statsTitle">Mijn Opdrachten</h3>
          <div className="statsSummary">
            <div className="statItem">
              <span className="statLabel">Gemaakt:</span>
              <span className="statValue">{stats.completed}</span>
            </div>
            <div className="statItem">
              <span className="statLabel">Nog te doen:</span>
              <span className="statValue">{stats.pending}</span>
            </div>
          </div>
        </div>

        {isExpanded && opdrachten.length > 0 && (
          <div className="opdrachtenList">
            <div className="opdrachtenListLine"></div>
            {opdrachten.map((opdracht) => (
              <div key={opdracht._id} className="opdrachtenListItem">
                <div className="opdrachtenItemContent">
                  <h4 className="opdrachtenItemTitle">{opdracht.titel}</h4>
                  <div className="opdrachtenstatusContainer">
                    <p className="opdrachtenItemStatus">
                      {opdracht.status === "completed"
                        ? "✓ Voltooid"
                        : "○ In progress"}
                    </p>
                    {opdracht.status !== "completed" ?
                      <button
                        className="btnComplete"
                        title="Voltooi opdracht"
                        onClick={() => handleCompleteOpdracht(opdracht)}
                        disabled={opdracht.status === "completed"}
                      >
                        <i className="fa-solid fa-spinner"></i>
                      </button> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpdrachtenStats;
