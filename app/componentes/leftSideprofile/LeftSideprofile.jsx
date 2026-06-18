"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../leftSideprofile/leftsideprofile.css";
import { API_URL } from "../../config";

const LeftSideprofile = () => {
  const [Naam, setNaam] = useState("");
  const [About, setAbout] = useState("");
  const [Posten, setPosten] = useState();
  const [Streaks, setStreaks] = useState();
  const [Volgers, setVolgers] = useState();
  const [profileImage, setProfileImage] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    fetch(`${API_URL}/receive/mijnInfo`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setNaam(data.naam);
        setAbout(data.about);
        setPosten(data.posten);
        setStreaks(data.streaks);
        setVolgers(data.volgers);
        setProfileImage(data.profileImage || "");
      })
      .catch(() => console.log("Niet ingelogd"));
  }, []);

  return (
    <div className="LeftprofileContainer">
      <div className="logo-section">
        <h1>Momentum</h1>
      </div>

      <div className="MijnSideProfile">
        <div
          className="bgFoto"
          style={
            profileImage
              ? { backgroundImage: `url("${encodeURI(API_URL + profileImage)}")` }
              : undefined
          }
        ></div>
        <h2>{Naam || "Gebruiker"}</h2>
        <p>{About || "Geen beschrijving"}</p>
      </div>

      <div className="underline"></div>

      <div className="SideNavbar">
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
        <Link href="/pages/settings">
          <button className={pathname.includes("/settings") ? "active" : ""}>
            <i className="fa-solid fa-gear"></i>
            Instellingen
          </button>
        </Link>
      </div>
    </div>
  );
};

export default LeftSideprofile;
