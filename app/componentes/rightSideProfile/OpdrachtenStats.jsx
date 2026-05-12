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
                  <p className="opdrachtenItemStatus">
                    {opdracht.status === "completed"
                      ? "✓ Voltooid"
                      : "○ In progress"}
                  </p>
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
