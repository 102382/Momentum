"use client";
import "../gegevensFormulier/gegevensFormulier.css";
import { useState } from "react";
import Message from "../message/Message.jsx";

const GegevensFormulier = ({ email = "" }) => {
  const [formData, setFormData] = useState({
    naam: "",
    leeftijd: "",
    geslacht: "",
  });
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageType, setMessageType] = useState("success");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setMessageVisible(true);

    setTimeout(() => {
      setMessageVisible(false);
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting || submitted) return;

    if (!formData.naam || !formData.leeftijd || !formData.geslacht) {
      showMessage("Vul alle velden in", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:3001/gebruikerInfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, email }),
      });

      const data = await res.text();

      if (!res.ok) {
        showMessage(data, "error");
        return;
      }

      setSubmitted(true);
      showMessage("Gegevens succesvol opgeslagen!", "success");
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="formulierContainer">
      <Message text={message} type={messageType} visible={messageVisible} />
      <div className="gegevens-formulier">
        <h2>Vertel ons meer over jezelf</h2>

        <form onSubmit={handleSubmit}>
          <input type="hidden" id="email" value={email} readOnly />
          <div className="informatie">
            <div className="input-group">
              <label htmlFor="naam">Naam</label>
              <input
                type="text"
                id="naam"
                name="naam"
                placeholder="Jouw naam"
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="leeftijd">Leeftijd</label>
              <input
                type="number"
                id="leeftijd"
                name="leeftijd"
                placeholder="Jouw leeftijd"
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="geslacht">Geslacht</label>
              <select id="geslacht" name="geslacht" onChange={handleChange}>
                <option value="">Selecteer</option>
                <option value="man">Man</option>
                <option value="vrouw">Vrouw</option>
              </select>
            </div>
          </div>

          <button type="submit" className="Sumbitbtn" disabled={submitting || submitted}>
            {submitting ? "Bezig..." : submitted ? "Opgeslagen" : "Verstuur"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GegevensFormulier;
