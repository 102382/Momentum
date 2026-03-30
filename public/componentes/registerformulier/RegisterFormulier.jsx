"use client";
import { useState, useEffect } from "react";
import "../registerformulier/registerFormulier.css";

const RegisterFormulier = ({ onToggle, isRegistering, showMessage  }) => {
  const [isHidden, setIsHidden] = useState(!isRegistering);

  // NIEUW: form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (!isRegistering) {
      const timer = setTimeout(() => {
        setIsHidden(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setIsHidden(false);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [isRegistering]);

  if (isHidden) return null;

  let Delay = 0;
  const getDelay = () => {
    Delay += 0.05;
    return Delay;
  };

  // NIEUW: input handler
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // NIEUW: submit handler
const handleSubmit = async (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    showMessage("Wachtwoorden komen niet overeen", "error");
    return;
  }

  try {
    const res = await fetch("http://localhost:3001/makeAccount", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const data = await res.text();

    if (!res.ok) {
      showMessage(data, "error");
      return;
    }

    showMessage("Account aangemaakt!", "success");

  } catch (err) {
    console.error(err);
    showMessage("Server error", "error");
  }
};

  return (
    <div className={`registerForm ${!isHidden ? "show" : ""}`}>
      <div className="registerFormContent">
        <h2
          className={`animateRegister ${isRegistering ? "showRegister" : "hideRegister"}`}
          style={{ animationDelay: `${getDelay()}s` }}
        >
          - REGISTREREN -
        </h2>

        {/* HIER zit de enige echte verandering */}
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="emailadres"
            className={`${isRegistering ? "showRegister" : "hideRegister"}`}
            style={{ animationDelay: `${getDelay()}s` }}
          >
            E-mail Adres
          </label>

          <input
            name="email"
            type="email"
            id="emailadres"
            placeholder="Email Adres"
            onChange={handleChange}
            required
            className={`${isRegistering ? "showRegister" : "hideRegister"}`}
            style={{ animationDelay: `${getDelay()}s` }}
          />

          <label
            htmlFor="Wachtwoord"
            className={`${isRegistering ? "showRegister" : "hideRegister"}`}
            style={{ animationDelay: `${getDelay()}s` }}
          >
            Wachtwoord
          </label>

          <input
            name="password"
            type="password"
            id="Wachtwoord"
            placeholder="Wachtwoord"
            onChange={handleChange}
            required
            className={`${isRegistering ? "showRegister" : "hideRegister"}`}
            style={{ animationDelay: `${getDelay()}s` }}
          />

          <label
            htmlFor="BevestigWachtwoord"
            className={`${isRegistering ? "showRegister" : "hideRegister"}`}
            style={{ animationDelay: `${getDelay()}s` }}
          >
            Bevestig Wachtwoord
          </label>

          <input
            name="confirmPassword"
            type="password"
            id="BevestigWachtwoord"
            placeholder="Bevestig Wachtwoord"
            onChange={handleChange}
            required
            className={`${isRegistering ? "showRegister" : "hideRegister"}`}
            style={{ animationDelay: `${getDelay()}s` }}
          />

          <button
            type="submit"
            className={`${isRegistering ? "showRegister" : "hideRegister"}`}
            style={{ animationDelay: `${getDelay()}s` }}
          >
            Registreren
          </button>
        </form>

        <div
          className={`divider ${isRegistering ? "showRegister" : "hideRegister"}`}
          style={{ animationDelay: `${getDelay()}s` }}
        >
          Of
        </div>

        <button
          type="button"
          id="registreren"
          onClick={onToggle}
          className={`${isRegistering ? "showRegister" : "hideRegister"}`}
          style={{ animationDelay: `${getDelay()}s` }}
        >
          Ik heb een account
        </button>
      </div>
    </div>
  );
};

export default RegisterFormulier;