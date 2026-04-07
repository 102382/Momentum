"use client";
import { useEffect, useState } from "react";
import "../leftSideprofile/leftsideprofile.css";

const LeftSideprofile = () => {
  const [Naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [leeftijd, setLeeftijd] = useState("");
  const [geslacht, setGeslacht] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/mijnInfo", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setNaam(data.naam);
        setEmail(data.email);
        setLeeftijd(data.leeftijd);
        setGeslacht(data.geslacht);
      })
      .catch(() => console.log("Niet ingelogd"));
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:3001/logout", {
      method: "POST",
      credentials: "include",
    });

    window.location.href = "/";
  };

  return (
    <div className="LeftprofileContainer">
      <div>
        <h1>Mometum</h1>
      </div>

      <div className="MijnSideProfile">
        <div className="bgFoto"></div>
        <h2>{Naam}</h2>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit
          autem quasi ut ullam, quae sapiente ipsam consequatur perferendis nisi
          impedit veniam! Illo, unde corporis tempora eius doloremque dolore
          placeat. Aut fuga architecto molestiae tempora?
        </p>
      </div>

      <div className="underline"></div>

      <div className="SideNavbar">
        <button>
          {" "}
          <i className="fa-solid fa-house"></i>Home
        </button>
        <button className="active">
          {" "}
          <i className="fa-solid fa-user"></i>Mijn profiel
        </button>
        <button>
          {" "}
          <i className="fa-solid fa-compass"></i>Explore
        </button>
        <button>
          {" "}
          <i className="fa-solid fa-align-justify"></i>Opdrachten
        </button>
      </div>
    </div>
  );
};

export default LeftSideprofile;
