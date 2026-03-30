"use client";
import { useState, useEffect, use } from "react";
import RegisterFormulier from "../registerformulier/RegisterFormulier.jsx";
import Login from "../loginformulier/Login.jsx";
import Message from "../message/Message.jsx";
import "./userAuthFroms.css";

const UserAuthForms = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [delayedRegistering, setDelayedRegistering] = useState(isRegistering);
  const [isHidden, setIsHidden] = useState(!isRegistering);

  // message state

  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageType, setMessageType] = useState("success");
  
  // toon messge functie

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
      // wacht 1 seconde voordat je switcht
      const timer = setTimeout(() => {
        setDelayedRegistering(true);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // meteen terug naar "Welkom terug"
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
          
          <img src="../fotos/logindesign.png" alt="" style={{ display: !isHidden ? 'none' : 'block' }} />
        </div>

        <Login onToggle={toggleForm} isRegistering={isRegistering} showMessage={showMessage} />

      </div>
    </div>
    
  );
};

export default UserAuthForms;