import { useEffect, useState } from "react";
import "./opdrachtenForm.css";
import { API_URL } from "../../config";
const OpdrachtUpdateForm = ({ id, onCancel, onSuccess }) => {
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    titel: "",
    beschrijving: "",
    categorie: "gezondheid",
    prioriteit: "middel",
    deadline: "",
    status: "pending",
    progress: 0,
  });

  const getOpdrachtDetails = async (opdId) => {
    try {
      const res = await fetch(`${API_URL}/receive/updatedOpdracht/${opdId}`);
      const data = await res.json();
      setFormData(data);
      setLoadingData(false);
    } catch (error) {
      console.error("Error fetching opdracht details:", error);
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (id) {
      getOpdrachtDetails(id);
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);

    try {
      const res = await fetch(`${API_URL}/send/updateOpdracht`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, id }),
      });

      if (!res.ok) {
        throw new Error("Failed to update opdracht");
      }

      if (onSuccess) onSuccess(formData);
      else onCancel();
    } catch (error) {
      console.error("Error updating opdracht:", error);
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingData) {
    return <div className="formLoading">Laden...</div>;
  }

  return (
    <div className="opdrachtenForm" onClick={(e) => e.stopPropagation()}>
      <div className="formHeader">
        <h2>Nieuwe Opdracht</h2>
        <button className="btnClose" onClick={onCancel}>
          <i className="fa-solid fa-times"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="titel">
            <i className="fa-solid fa-heading"></i> Titel
          </label>
          <input
            type="text"
            id="titel"
            name="titel"
            value={formData.titel}
            onChange={handleChange}
            placeholder="Bijv. Dagelijkse workout"
            maxLength="50"
          />
          <small>{formData.titel.length}/50</small>
        </div>

        <div className="formGroup">
          <label htmlFor="beschrijving">
            <i className="fa-solid fa-align-left"></i> Beschrijving
          </label>
          <textarea
            id="beschrijving"
            name="beschrijving"
            value={formData.beschrijving}
            onChange={handleChange}
            placeholder="Wat moet je doen?"
            maxLength="200"
            rows="4"
          ></textarea>
          <small>{formData.beschrijving.length}/200</small>
        </div>

        <div className="formRow">
          <div className="formGroup">
            <label htmlFor="kategorie">
              <i className="fa-solid fa-tag"></i> Categorie
            </label>
            <select
              id="kategorie"
              name="categorie"
              value={formData.categorie}
              onChange={handleChange}
            >
              <option value="gezondheid">Gezondheid</option>
              <option value="welzijn">Welzijn</option>
              <option value="voeding">Voeding</option>
              <option value="sociaal">Sociaal</option>
              <option value="leren">Leren</option>
              <option value="hobby">Hobby</option>
            </select>
          </div>

          <div className="formGroup">
            <label htmlFor="prioriteit">
              <i className="fa-solid fa-arrow-up"></i> Prioriteit
            </label>
            <select
              id="prioriteit"
              name="prioriteit"
              value={formData.prioriteit}
              onChange={handleChange}
            >
              <option value="laag">Laag</option>
              <option value="middel">Middel</option>
              <option value="hoog">Hoog</option>
            </select>
          </div>
        </div>

        <div className="formRow">
          <div className="formGroup">
            <label htmlFor="deadline">
              <i className="fa-solid fa-calendar"></i> Deadline
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="status">
              <i className="fa-solid fa-check"></i> Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="pending">In wachtrij</option>
              <option value="in-progress">Bezig</option>
              <option value="completed">Voltooid</option>
            </select>
          </div>
        </div>

        <div className="formRow">
          <div className="formGroup">
            <label htmlFor="progress">
              <i className="fa-solid fa-chart-simple"></i> Voortgang
            </label>
            <div className="sliderContainer">
              <input
                type="range"
                id="progress"
                name="progress"
                min="0"
                max="100"
                value={formData.progress}
                onChange={handleChange}
              />
              <span className="sliderValue">{formData.progress}%</span>
            </div>
          </div>
        </div>

        <div className="formActions">
          <button type="button" className="btnCancel" onClick={onCancel}>
            Annuleren
          </button>
          <button type="submit" className="btnSubmit" disabled={loadingSubmit}>
            {loadingSubmit ? "Bezig..." : "Opdracht bijwerken"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default OpdrachtUpdateForm;