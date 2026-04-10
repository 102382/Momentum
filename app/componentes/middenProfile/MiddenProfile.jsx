"use client";
import { useEffect, useState } from "react";
import "../middenProfile/middensideProfile.css";
import Message from "../message/Message.jsx";
import Loading from "../loading/Loading.jsx";

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
  const [loadingInfo, setLoadingInfo] = useState(true);

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
        setLoadingInfo(false);
      })
      .catch(() => {
        console.log("Niet ingelogd");
        setLoadingInfo(false);
      });
  }, []);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/mijnPosts", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        console.log(data);
        setLoadingPosts(false); // h44efwgbsvdn uu4href/ hrwefbds / uu32rhvfwes
      })
      .catch(() => {
        setPosts([]);
        console.log("Niet ingelogd");
        setLoadingPosts(false);
      });
  }, []);

  const [formData, setFormData] = useState({
    mijnComentaar: "",
    email: "",
    naam: "",
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Update formData wanneer Email en Naam beschikbaar zijn
  useEffect(() => {
    setFormData({
      mijnComentaar: "",
      email: Email,
      naam: Naam,
    });
  }, [Email, Naam]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);

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
        setLoadingSubmit(false);
        return;
      }

      showMessage("Post aangemaakt!", "success");
      setFormData({
        mijnComentaar: "",
        email: Email,
        naam: Naam,
      });
      setShowPostFormulier(false);
      setLoadingSubmit(false);
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
      setLoadingSubmit(false);
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
          <input type="hidden" name="email" value={Email} readOnly />
          <input type="hidden" name="naam" value={Naam} readOnly />
          <textarea
            placeholder="Wat wil je delen?"
            name="mijnComentaar"
            onChange={handleChange}
          ></textarea>
          {/* Dit komt later wel, maar voor nu is het makkelijker om alleen tekst te posten
          <input
            type="file"
            accept="image/*"
            name="foto"
            onChange={handleChange}
          />
          */}
          <button type="submit" disabled={loadingSubmit}>
            {loadingSubmit ? "Posten..." : "Post publiceren"}
          </button>
        </form>
        <button onClick={() => setShowPostFormulier(false)}>Annuleren</button>
      </div>

      {loadingInfo ? (
        <Loading text="Profiel laden..." />
      ) : (
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
      )}

      <div className="VolgerInfoLine Grijs"></div>

      {loadingPosts ? (
        <Loading text="Posts laden..." />
      ) : (
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
                  {post.foto && (
                    <img src={post.foto} alt={`Post ${index + 1}`} />
                  )}
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
          <button
            className="voegPost"
            onClick={() => setShowPostFormulier(true)}
          >
            Voeg een post toe
          </button>
        </div>
      )}
    </div>
  );
};

export default MiddenProfile;
