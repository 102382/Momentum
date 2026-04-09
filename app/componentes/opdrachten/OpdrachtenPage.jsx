"use client";
import { useEffect, useState } from "react";
import "./opdrachten.css";
import OpdrachtenCard from "../opdrachten/OpdrachtenCard";
import OpdrachtenForm from "../opdrachten/OpdrachtenForm";
import OpdrachtenFilter from "../opdrachten/OpdrachtenFilter";

const OpdrachtenPage = () => {
  const [opdrachten, setOpdrachten] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");

  const getFilteredOpdrachten = () => {
    let filtered = opdrachten;

    if (filter !== "all") {
      filtered = filtered.filter((o) => o.status === filter);
    }

    return filtered;
  };

  const handleAddOpdracht = (formData) => {
    if (editingId) {
      setOpdrachten(
        opdrachten.map((o) => (o.id === editingId ? { ...o, ...formData } : o)),
      );
      setEditingId(null);
    } else {
      const newOpdracht = {
        id: Math.max(...opdrachten.map((o) => o.id), 0) + 1,
        ...formData,
        progress: 0,
      };
      setOpdrachten([...opdrachten, newOpdracht]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setOpdrachten(opdrachten.filter((o) => o.id !== id));
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleCompleteOpdracht = (id) => {
    setOpdrachten(
      opdrachten.map((o) =>
        o.id === id ? { ...o, status: "completed", progress: 100 } : o,
      ),
    );
  };

  const filteredOpdrachten = getFilteredOpdrachten();

  return (
    <div className="opdrachtenPageContainer middenSection">
      {/* Header */}
      <div className="opdrachtenHeader">
        <h1>Mijn Opdrachten</h1>
        <button
          className="btnCreateOpdracht"
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <i className="fa-solid fa-plus"></i> Nieuw
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modalOverlay" onClick={() => setShowForm(false)}>
          <OpdrachtenForm
            onSubmit={handleAddOpdracht}
            onCancel={() => setShowForm(false)}
            editingOpdracht={
              editingId ? opdrachten.find((o) => o.id === editingId) : null
            }
          />
        </div>
      )}

      {/* Filter */}
      <OpdrachtenFilter filter={filter} setFilter={setFilter} />

      {/* Opdrachten Grid */}
      <div className="opdrachtenGridContainer">
        {filteredOpdrachten.length > 0 ? (
          <div className="opdrachtenGrid">
            {filteredOpdrachten.map((opdracht) => (
              <OpdrachtenCard
                key={opdracht.id}
                opdracht={opdracht}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onComplete={handleCompleteOpdracht}
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
