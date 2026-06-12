"use client";
import { useEffect, useState } from "react";
import "./opdrachtenForm.css";
import Message from "../message/Message.jsx";
import { API_URL } from "../../config";

const OpdrachtenForm = ({ onCancel, onSuccess }) => {
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageType, setMessageType] = useState("success");

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setMessageVisible(true);

    setTimeout(() => {
      setMessageVisible(false);
    }, 3000);
  };

  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/receive/mijnInfo`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setEmail(data.email);
      })
      .catch(() => console.log("Niet ingelogd"));
  }, []);

  const [formData, setFormData] = useState({
    email: email,
    titel: "",
    beschrijving: "",
    prioriteit: "middel",
    status: "pending",
    deadline: "",
    categorie: "gezondheid",
    progress: 0,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      email: email,
    }));
  }, [email]);

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "progress" ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);

    try {
      const res = await fetch(`${API_URL}/send/makeOpdracht`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, email }),
      });

      const data = await res.text();

      if (!res.ok) {
        showMessage(data, "error");
        setLoadingSubmit(false);
        return;
      }

      showMessage("Opdracht aangemaakt!", "success");
      setFormData({
        email: email,
        titel: "",
        beschrijving: "",
        prioriteit: "middel",
        status: "pending",
        deadline: "",
        categorie: "gezondheid",
        progress: 0,
      });
      setLoadingSubmit(false);
      if (onSuccess) onSuccess();
      else onCancel();
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="opdrachtenForm" onClick={(e) => e.stopPropagation()}>
      <Message text={message} type={messageType} visible={messageVisible} />
      <div className="formHeader">
        <h2>Nieuwe Opdracht</h2>
        <button className="btnClose" onClick={onCancel}>
          <i className="fa-solid fa-times"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="email" value={email} readOnly />
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
            {loadingSubmit ? "Bezig..." : "Opdracht maken"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OpdrachtenForm;
