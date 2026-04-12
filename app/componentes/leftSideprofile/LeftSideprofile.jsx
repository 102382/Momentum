"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../leftSideprofile/leftsideprofile.css";

const LeftSideprofile = () => {
  const [Naam, setNaam] = useState("");
  const [About, setAbout] = useState("");
  const [Posten, setPosten] = useState();
  const [Streaks, setStreaks] = useState();
  const [Volgers, setVolgers] = useState();
  const pathname = usePathname();

  useEffect(() => {
    fetch("http://localhost:3001/receive/mijnInfo", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setNaam(data.naam);
        setAbout(data.about);
        setPosten(data.posten);
        setStreaks(data.streaks);
        setVolgers(data.volgers);
      })
      .catch(() => console.log("Niet ingelogd"));
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:3001/send/logout", {
      method: "POST",
      credentials: "include",
    });

    window.location.href = "/";
  };

  return (
    <div className="LeftprofileContainer">
      <div className="logout-section">
        <button className="logoutBtn" onClick={handleLogout}>
          <i className="fa-solid fa-sign-out-alt"></i>
          Uitloggen
        </button>
      </div>

      <div className="logo-section">
        <h1>Momentum</h1>
      </div>

      <div className="MijnSideProfile">
        <div className="bgFoto"></div>
        <h2>{Naam || "Gebruiker"}</h2>
        <p>{About || "Geen beschrijving"}</p>
      </div>

      <div className="underline"></div>

      <div className="SideNavbar">
        <Link href="/pages/Home">
          <button className={pathname.includes("/Home") ? "active" : ""}>
            <i className="fa-solid fa-house"></i>
            Home
          </button>
        </Link>
        <Link href="/pages/profile">
          <button
            className={
              pathname.includes("/profile") && !pathname.includes("/opdrachten")
                ? "active"
                : ""
            }
          >
            <i className="fa-solid fa-user"></i>
            Mijn profiel
          </button>
        </Link>
        <Link href="/pages/explore">
          <button className={pathname.includes("/explore") ? "active" : ""}>
            <i className="fa-solid fa-compass"></i>
            Explore
          </button>
        </Link>
        <Link href="/pages/opdrachten">
          <button className={pathname.includes("/opdrachten") ? "active" : ""}>
            <i className="fa-solid fa-tasks"></i>
            Opdrachten
          </button>
        </Link>
      </div>
    </div>
  );
};

export default LeftSideprofile;
