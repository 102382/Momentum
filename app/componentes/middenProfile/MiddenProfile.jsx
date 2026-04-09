"use client";
import { useEffect, useState } from "react";
import "../middenProfile/middensideProfile.css";
import Message from "../message/Message.jsx";

const MiddenProfile = () => {
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageType, setMessageType] = useState("success");

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setMessageVisible(true);

    setTimeout(() => {
      setMessageVisible(false);
    }, 3000);
  };

  const [Naam, setNaam] = useState("");
  const [Email, setEmail] = useState("");
  const [About, setAbout] = useState("");
  const [Posten, setPosten] = useState();
  const [Streaks, setStreaks] = useState();
  const [Volgers, setVolgers] = useState();
  const [isFollowing, setIsFollowing] = useState(false);

  const [showPostFormulier, setShowPostFormulier] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/mijnInfo", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setNaam(data.naam);
        setEmail(data.email);
        setAbout(data.about);
        setPosten(data.posten);
        setStreaks(data.streaks);
        setVolgers(data.volgers);
      })
      .catch(() => console.log("Niet ingelogd"));
  }, []);

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/mijnPosts", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        console.log(data);
      })
      .catch(() => {
        setPosts([]);
        console.log("Niet ingelogd");
      });
  }, []);

  const [formData, setFormData] = useState({
    comentaar: "",
    foto: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3001/makePost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.text();

      if (!res.ok) {
        showMessage(data, "error");
        return;
      }

      showMessage("Post aangemaakt!", "success");
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
    }
  };

  return (
    <div className="MiddenContainer">
      <Message text={message} type={messageType} visible={messageVisible} />
      <div
        className="postFormulierContainer"
        style={showPostFormulier ? { display: "block" } : { display: "none" }}
      >
        <h2>Maak een nieuwe post</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Wat wil je delen?"
            name="comentaar"
            onChange={handleChange}
          ></textarea>
          <input
            type="file"
            accept="image/*"
            name="foto"
            onChange={handleChange}
          />
          <button type="submit">Post publiceren</button>
        </form>
        <button onClick={() => setShowPostFormulier(false)}>Annuleren</button>
      </div>

      <div className="gebruikerInfo">
        <div>
          <div className="bgfoto"></div>
          <h2>{Naam || "Gebruiker"}</h2>
          <p>{About || "Geen beschrijving"}</p>
        </div>

        <div className="statsSection">
          <div className="VolgerInfo">
            <div className="stat">
              <h2>{Posten || "0"}</h2>
              <span>Posten</span>
            </div>
            <div className="stat">
              <h2>{Streaks || "0"}</h2>
              <span>Streaks</span>
            </div>
            <div className="stat">
              <h2>{isFollowing ? Volgers + 1 : Volgers || "0"}</h2>
              <span>Volgers</span>
            </div>
          </div>
          <div className="VolgerInfoLine"></div>
          <div className="followButtonContainer">
            <button
              className={`followBtn ${isFollowing ? "following" : ""}`}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              <i
                className={`fa-solid ${isFollowing ? "fa-user-check" : "fa-user-plus"}`}
              ></i>
              {isFollowing ? "Volgend" : "Volgen"}
            </button>
            <button
              className="followBtn"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <i className="fa-solid fa-message"></i>
              Bericht
            </button>
          </div>
          <div className="OpdrachtenBar">
            <h2>3 van de 5 opdrachten gemaakt</h2>
            <div className="Bar"></div>
          </div>
        </div>
      </div>

      <div className="VolgerInfoLine Grijs"></div>

      <div
        className="postContainer"
        style={showPostFormulier ? { filter: "blur(12px)" } : {}}
      >
        <div className="posten">
          {!posts || posts.length === 0 ? (
            <p></p>
          ) : (
            posts.map((post, index) => (
              <div className="post" key={index}>
                {post.foto && <img src={post.foto} alt={`Post ${index + 1}`} />}
                <div className="acties">
                  <button>
                    <i className="fa-solid fa-heart"></i> {post.aantalLikes}
                  </button>
                  <button>
                    <i className="fa-solid fa-comment"></i>{" "}
                    {post.aantalComentaars}
                  </button>
                </div>
                <div className="myComentaar">
                  <img
                    src="https://www.shutterstock.com/image-photo/close-headshot-portrait-smiling-young-260nw-1916406272.jpg"
                    alt=""
                  />
                  <div className="Myinfo">
                    <h2>{Naam}</h2>
                    <p>{post.mijnComentaar}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <button className="voegPost" onClick={() => setShowPostFormulier(true)}>
          Voeg een post toe
        </button>
      </div>
    </div>
  );
};

export default MiddenProfile;
