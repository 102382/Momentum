"use client";
import { useState, useEffect } from "react";
import RegisterFormulier from "../registerformulier/RegisterFormulier.jsx";
import Login from "../loginformulier/Login.jsx";
import Message from "../message/Message.jsx";
import "./userAuthFroms.css";

const UserAuthForms = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [delayedRegistering, setDelayedRegistering] = useState(isRegistering);
  const [isHidden, setIsHidden] = useState(!isRegistering);

  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageType, setMessageType] = useState("success");

  // Ik laat hier een bericht zien aan de gebruiker.
  // Na 3 seconden verberg ik het bericht weer.
  const showMessage = (text, type = "success") => {
  setMessage(text);
  setMessageType(type);
  setMessageVisible(true);

  setTimeout(() => {
    setMessageVisible(false);
  }, 3000);
  };


  const toggleForm = () => {
    setIsRegistering(prev => !prev);
  };


  useEffect(() => {
    if (!isRegistering) {
      const timer = setTimeout(() => {
        setIsHidden(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsHidden(false);
    }
  }, [isRegistering]);

  useEffect(() => {
    if (isRegistering) {
      // Ik wacht 1 seconde voordat ik wissel.
      const timer = setTimeout(() => {
        setDelayedRegistering(true);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // Ik ga meteen terug naar "Welkom terug".
      setDelayedRegistering(false);
    }
  }, [isRegistering]);


  return (
    <div>
      <Message text={message} type={messageType} visible={messageVisible} />

      <div className={"container" + (isRegistering ? " byRegistering" : " byLogin")}>

        <RegisterFormulier onToggle={toggleForm} isRegistering={isRegistering} showMessage={showMessage}/>

      <div className={"loginBackground" + (!isRegistering ? " byRegistering" : " byLogin")}>

      <h1 className={delayedRegistering ? "RegisterTitle" : ""}>
        {delayedRegistering ? (
          <>
            Welkom bij <br />
            <span className="Momentum">Momentum</span>
          </>
        ) : (
          "Welkom terug"
        )}
      </h1>
      <img src="../fotos/Group 1.svg" alt="" />
        </div>

        <Login onToggle={toggleForm} isRegistering={isRegistering} showMessage={showMessage} />

      </div>
    </div>
    
  );
};

export default UserAuthForms;