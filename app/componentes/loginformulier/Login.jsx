"use client";
import { useState, useEffect } from "react";
import "../loginformulier/Login.css";

const Login = ({ onToggle, isRegistering, showMessage  }) =>{
    const [isHidden, setIsHidden] = useState(isRegistering);
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.id]: e.target.value
        });
    };

    useEffect(() => {
        if (isRegistering) {
            // Wacht tot animatie klaar is
            const timer = setTimeout(() => {
                setIsHidden(true);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setIsHidden(false);
        }
    }, [isRegistering]);

    if (isHidden) return null;

    let Delay = 1.8;
    const getDelay = () => {
        Delay += 0.05;
        return Delay;
    };

    let delaybySchaklen = 0;
    const getDelaybySchakelen = () => {
        delaybySchaklen += 0.05;
        return delaybySchaklen;
    };

    const handleSubmit = async (e) => {
  e.preventDefault();
    formData.email = formData.email.trim().toLowerCase();

  try {
    const res = await fetch("http://localhost:3001/login", {
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

    showMessage("Succesvol ingelogd!", "success");

  } catch (err) {
    console.error(err);
    showMessage("Server error", "error");
  }
    };
    return (
        <div className= "loginForm">
            <div className="loginFormContent">
                <h2 className={"animateLoginForm " + (isRegistering ? "hideLogin" : "showLogin")} style={(!isRegistering ? { animationDelay: `${getDelay()}s` } : {animationDelay: `${getDelaybySchakelen()}s`})}>- LOGIN -</h2>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="emailadres" className={"animateLoginForm " + (isRegistering ? "hideLogin" : "showLogin")} style={(!isRegistering ? { animationDelay: `${getDelay()}s` } : {animationDelay: `${getDelaybySchakelen()}s`})}>
                        E-mail Adres
                    </label>
                    <input
                        className={"animateLoginForm " + (isRegistering ? "hideLogin" : "showLogin")}
                        type="email"
                        id="email"
                        placeholder="Email Adres"
                        style={(!isRegistering ? { animationDelay: `${getDelay()}s` } : {animationDelay: `${getDelaybySchakelen()}s`})}
                        required
                        onChange={handleChange}
                    />

                    <label htmlFor="Wachtwoord" className={"animateLoginForm " + (isRegistering ? "hideLogin" : "showLogin")} style={(!isRegistering ? { animationDelay: `${getDelay()}s` } : {animationDelay: `${getDelaybySchakelen()}s`})}>
                        Wachtwoord
                    </label>
                    <input
                        className={"animateLoginForm " + (isRegistering ? "hideLogin" : "showLogin")}
                        type="password"
                        id="password"
                        placeholder="Wachtwoord"
                        style={(!isRegistering ? { animationDelay: `${getDelay()}s` } : {animationDelay: `${getDelaybySchakelen()}s`})}
                        required
                        onChange={handleChange}
                    />

                    <button type="submit" className={"animateLoginForm " + (isRegistering ? "hideLogin" : "showLogin")} style={(!isRegistering ? { animationDelay: `${getDelay()}s` } : {animationDelay: `${getDelaybySchakelen()}s`})}>
                        Inloggen
                    </button>
                </form>

                <div className={"divider animateLoginForm " + (isRegistering ? "hideLogin" : "showLogin")} style={(!isRegistering ? { animationDelay: `${getDelay()}s` } : {animationDelay: `${getDelaybySchakelen()}s`})}>Of</div>

                <button
                    type="button"
                    id="registreren"
                    onClick={onToggle}
                    className={"animateLoginForm " + (isRegistering ? "hideLogin" : "showLogin")}
                    style={(!isRegistering ? { animationDelay: `${getDelay()}s` } : {animationDelay: `${getDelaybySchakelen()}s`})}
                >
                    Nog geen account?
                </button>
            </div>
        </div>
    );
};

export default Login;