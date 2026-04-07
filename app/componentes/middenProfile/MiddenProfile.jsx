"use client";
import { useEffect, useState } from "react";
import "../middenProfile/middensideProfile.css";

const MiddenProfile = () => {
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

  return (
    <div className="MiddenContainer">
      <div className="gebruikerInfo">
        <div>
          <div className="bgfoto"></div>
          <h2>{Naam}</h2>
          <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quod perferendis dolor consequuntur facere saepe enim eum, nesciunt, reprehenderit sapiente vel commodi pariatur porro assumenda vitae et cum nostrum eos voluptate quos dicta dolores ullam!</p>
        </div>

        <div className="">
          <div className="VolgerInfo">
            <h2>
              1555 <br />
              Posten
            </h2>
            <h2>
              1555 <br />
              Posten
            </h2>
            <h2>
              1555 <br />
              Posten
            </h2>
          </div>
          <div className="VolgerInfoLine"></div>
            <br /> <br /> <br /><b></b>
          <div className="OpdrachtenBar">
            <h2>3 van de 5 opdrachten gemaakt</h2>
            <div className="Bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiddenProfile;
