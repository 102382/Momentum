"use client";
import "../gegevensFormulier/gegevensFormulier.css";
import { useState, useEffect } from "react";
import Message from "../message/Message.jsx";
import { useRouter, useSearchParams } from "next/navigation";

const GegevensFormulier = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    email: "",
    naam: "",
    about: "",
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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ✅ API call
  const getEmail = async (token) => {
    try {
      const res = await fetch(
        `http://localhost:3001/receive/pendingRegistration/${token}`
      );

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();
      return data.email;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // ✅ Fetch email when token exists
  useEffect(() => {
    const fetchEmail = async () => {
      if (!token) return;

      const emailFromToken = await getEmail(token);

      if (emailFromToken) {
        setFormData((prev) => ({
          ...prev,
          email: emailFromToken,
        }));
      } else {
        showMessage("Link ongeldig of verlopen", "error");
      }
    };

    fetchEmail();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting || submitted) return;

    if (!formData.naam || !formData.leeftijd || !formData.geslacht) {
      showMessage("Vul alle velden in", "error");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        "http://localhost:3001/send/gebruikerInfo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.text();

      if (!res.ok) {
        showMessage(data, "error");
        return;
      }

      setSubmitted(true);
      showMessage(
        "Gegevens succesvol opgeslagen! Je kan inloggen",
        "success"
      );

      setTimeout(() => {
        router.replace("/");
      }, 2000);
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
          <input type="text" value={formData.email} readOnly />

          <div className="informatie">
            <div className="input-group">
              <label>Naam</label>
              <input
                type="text"
                name="naam"
                placeholder="Jouw naam"
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Over jezelf</label>
              <input
                type="text"
                name="about"
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Leeftijd</label>
              <input
                type="number"
                name="leeftijd"
                placeholder="Jouw leeftijd"
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Geslacht</label>
              <select name="geslacht" onChange={handleChange}>
                <option value="">Selecteer</option>
                <option value="man">Man</option>
                <option value="vrouw">Vrouw</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="Sumbitbtn"
            disabled={submitting || submitted}
          >
            {submitting
              ? "Bezig..."
              : submitted
              ? "Opgeslagen"
              : "Verstuur"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GegevensFormulier;