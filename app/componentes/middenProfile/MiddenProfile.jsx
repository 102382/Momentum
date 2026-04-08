"use client";
import { useEffect, useState } from "react";
import "../middenProfile/middensideProfile.css";

const MiddenProfile = () => {
  const [Naam, setNaam] = useState("");
  const [About, setAbout] = useState("")
  const [Posten, setPosten] = useState();
  const [Streaks, setStreaks] = useState();
  const [Volgers, setVolgers] = useState();

  useEffect(() => {
    fetch("http://localhost:3001/mijnInfo", {
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


  const [Foto, setFoto] = useState("");
  const [MijnComentaar, setMijnComentaar] = useState("");
  const [AantalLikes, setAantalLikes] = useState();
  const [AantalComentaars, setAantalComentaars] = useState();
  

  useEffect(() => {
    fetch("http://localhost:3001/mijnPosts", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setFoto(data.foto);
        setMijnComentaar(data.mijnComentaar);
        setAantalLikes(data.aantalLikes);
        setAantalComentaars(data.aantalComentaars);
        console.log(data);
      })
      .catch(() => console.log("Niet ingelogd"));
  }, []);
  return (
    <div className="MiddenContainer">
      <div className="gebruikerInfo">
        <div>
          <div className="bgfoto"></div>
          <h2>{Naam}</h2>
          <p>{About}</p>
        </div>

        <div className="">
          <div className="VolgerInfo">
            <h2>
              {Posten} <br />
              Posten
            </h2>
            <h2>
              {Streaks} <br />
              Streaks
            </h2>
            <h2>
              {Volgers} <br />
              Volgers
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


      <div className="VolgerInfoLine Grijs"></div>

      <div className="postContainer">
        <div className="posten">
          <div className="post">
            <img src={Foto} alt="" />
            <div className="acties">
              <button><i className="fa-solid fa-heart"></i> {AantalLikes}</button>
              <button><i className="fa-solid fa-comment"></i>{AantalComentaars}</button>
            </div>

            <div className="myComentaar">
              <img src="https://www.shutterstock.com/image-photo/close-headshot-portrait-smiling-young-260nw-1916406272.jpg" alt="" />
              <div className="Myinfo">
                <h2>{Naam}</h2>
                <p>{MijnComentaar}</p>
              </div>
            </div>
          </div>

          <div className="post">
            <img src="https://s3-eu-north-1.amazonaws.com/py3.visitsweden.com/original_images/20180730-gsta_reiland-sunrays_in_a_pine_forest-6901-2_CMSTemplate.jpg" alt="" />
            <div className="acties">
              <button><i className="fa-solid fa-heart"></i> 550</button>
              <button><i className="fa-solid fa-comment"></i> 550</button>
            </div>

            <div className="myComentaar">
              <img src="https://www.shutterstock.com/image-photo/close-headshot-portrait-smiling-young-260nw-1916406272.jpg" alt="" />
              <div className="Myinfo">
                <h2>{Naam}</h2>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Illum distinctio earum fuga! Mollitia repellat odio consectetur odit, dolore ullam explicabo quasi modi velit rerum ex suscipit, aperiam fugit, eveniet praesentium?</p>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default MiddenProfile;
