"use client";
import { useEffect, useState } from "react";
import "./opdrachten.css";
import OpdrachtenCard from "../opdrachten/OpdrachtenCard";
import OpdrachtenForm from "../opdrachten/OpdrachtenForm";
import OpdrachtenFilter from "../opdrachten/OpdrachtenFilter";
import Loading from "../loading/Loading.jsx";
import { API_URL } from "../../config";

const OpdrachtenPage = () => {
  const [opdrachten, setOpdrachten] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/receive/mijnOpdrachten`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setOpdrachten(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        console.log("Niet ingelogd");
        setLoading(false);
      });
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");

  const getFilteredOpdrachten = () => {
    let filtered = opdrachten;

    if (filter !== "all") {
      filtered = filtered.filter((o) => o.status === filter);
    }

    return filtered;
  };

  const filteredOpdrachten = getFilteredOpdrachten();

  return (
    <div className="opdrachtenPageContainer middenSection">
      <div className="opdrachtenHeader">
        <h1>Mijn Opdrachten</h1>
        <button
          className="btnCreateOpdracht"
          onClick={() => {
            setShowForm(true);
          }}
        >
          <i className="fa-solid fa-plus"></i> Nieuw
        </button>
      </div>

      {showForm && (
        <div className="modalOverlay" onClick={() => setShowForm(false)}>
          <OpdrachtenForm
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <OpdrachtenFilter filter={filter} setFilter={setFilter} />

      <div className="opdrachtenGridContainer">
        {loading ? (
          <Loading text="Opdrachten laden..." />
        ) : filteredOpdrachten.length > 0 ? (
          <div className="opdrachtenGrid">
            {filteredOpdrachten.map((opdracht) => (
              <OpdrachtenCard
                key={opdracht._id}
                opdracht_id={opdracht._id}
              />
            ))}
          </div>
        ) : (
          <div className="emptyState">
            <i className="fa-solid fa-inbox"></i>
            <h2>Geen opdrachten</h2>
            <p>
              {filter !== "all"
                ? "Geen opdrachten gevonden"
                : "Je bent helemaal klaar!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpdrachtenPage;
