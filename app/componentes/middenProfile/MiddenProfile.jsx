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
    fetch("http://localhost:3001/receive/mijnInfo", {
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

  const [opdrachten, setOpdrachten] = useState([]);
  const [loadingOpdrachten, setLoadingOpdrachten] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/receive/mijnPosts", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        console.log(data);
        setLoadingPosts(false);
      })
      .catch(() => {
        setPosts([]);
        console.log("Niet ingelogd");
        setLoadingPosts(false);
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/receive/mijnOpdrachten", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setOpdrachten(Array.isArray(data) ? data : []);
        setLoadingOpdrachten(false);
      })
      .catch(() => {
        setOpdrachten([]);
        console.log("Niet ingelogd");
        setLoadingOpdrachten(false);
      });
  }, []);

  const [formData, setFormData] = useState({
    mijnComentaar: "",
    email: "",
    naam: "",
    fotoFile: null,
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Update formData wanneer Email en Naam beschikbaar zijn
  useEffect(() => {
    setFormData({
      mijnComentaar: "",
      email: Email,
      naam: Naam,
      fotoFile: null,
    });
  }, [Email, Naam]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "foto" && files && files.length > 0) {
      setFormData({
        ...formData,
        fotoFile: files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);

    try {
      let fotoURL = null;

      // Upload foto naar Cloudflare als die bestaat
      if (formData.fotoFile) {
        setUploadingFoto(true);
        const fotoFormData = new FormData();
        fotoFormData.append("file", formData.fotoFile);

        const fotoRes = await fetch("http://localhost:3001/send/uploadFoto", {
          method: "POST",
          body: fotoFormData,
          credentials: "include",
        });

        if (!fotoRes.ok) {
          const errorMsg = await fotoRes.text();
          showMessage(errorMsg || "Fout bij het uploaden van de foto", "error");
          setLoadingSubmit(false);
          setUploadingFoto(false);
          return;
        }

        const fotoData = await fotoRes.json();
        fotoURL = fotoData.url;
        setUploadingFoto(false);
      }

      const res = await fetch("http://localhost:3001/send/makePost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mijnComentaar: formData.mijnComentaar,
          email: Email,
          naam: Naam,
          fotoURL: fotoURL,
        }),
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
        fotoFile: null,
      });
      setShowPostFormulier(false);
      setPosten((prev) => (prev || 0) + 1);

      // Refresh posts
      fetch("http://localhost:3001/receive/mijnPosts", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setPosts(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          console.log("Fout bij het laden van posts");
        });

      setLoadingSubmit(false);
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
      setLoadingSubmit(false);
    }
  };

  const handleLike = async (postIndex) => {
    try {
      const post = posts[postIndex];

      const res = await fetch("http://localhost:3001/send/likePost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId: post._id, email: Email }),
        credentials: "include",
      });

      if (!res.ok) {
        showMessage("Fout bij het liken van de post", "error");
        return;
      }

      const data = await res.json();
      const updatedPosts = [...posts];
      updatedPosts[postIndex] = {
        ...post,
        aantalLikes: data.aantalLikes,
        likes: data.liked
          ? [...(post.likes || []), Email]
          : (post.likes || []).filter((e) => e !== Email),
      };
      setPosts(updatedPosts);
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
    }
  };

  const handleFollow = async () => {
    try {
      const res = await fetch("http://localhost:3001/send/followUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserEmail: Email, followerEmail: Email }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        showMessage(
          errorMsg || "Fout bij het volgen van deze gebruiker",
          "error",
        );
        return;
      }

      const data = await res.json();
      setIsFollowing(data.following);
      setVolgers(data.volgers);
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
    }
  };

  const handleDeletePost = async (postId, postIndex) => {
    try {
      const res = await fetch("http://localhost:3001/send/deletePost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, email: Email }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        showMessage(
          errorMsg || "Fout bij het verwijderen van de post",
          "error",
        );
        return;
      }

      showMessage("Post verwijderd!", "success");
      const updatedPosts = posts.filter((_, index) => index !== postIndex);
      setPosts(updatedPosts);
      setPosten((prev) => Math.max(0, (prev || 0) - 1));
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
          <input type="hidden" name="email" value={Email} readOnly />
          <input type="hidden" name="naam" value={Naam} readOnly />
          <textarea
            placeholder="Wat wil je delen?"
            name="mijnComentaar"
            value={formData.mijnComentaar}
            onChange={handleChange}
          ></textarea>
          <div className="fotoUploadContainer">
            <label htmlFor="foto">
              <i className="fa-solid fa-image"></i> Foto toevoegen
            </label>
            <input
              type="file"
              id="foto"
              accept="image/*"
              name="foto"
              onChange={handleChange}
            />
            {formData.fotoFile && (
              <p className="fotoSelected">
                <i className="fa-solid fa-check"></i> {formData.fotoFile.name}
              </p>
            )}
          </div>
          <button type="submit" disabled={loadingSubmit || uploadingFoto}>
            {uploadingFoto
              ? "Foto uploaden..."
              : loadingSubmit
                ? "Posten..."
                : "Post publiceren"}
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
                <h2>{Volgers || "0"}</h2>
                <span>Volgers</span>
              </div>
            </div>
            <div className="VolgerInfoLine"></div>
            <div className="OpdrachtenBar">
              <h2>
                {opdrachten.filter((o) => o.status === "completed").length} van
                de {opdrachten.length} opdrachten gemaakt
              </h2>
              <div
                className="Bar"
                style={{
                  "--progress": `${
                    opdrachten.length > 0
                      ? (opdrachten.filter((o) => o.status === "completed")
                          .length /
                          opdrachten.length) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
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
                    <button
                      onClick={() => handleLike(index)}
                      style={{
                        color:
                          post.likes && post.likes.includes(Email)
                            ? "#FF6B6B"
                            : "inherit",
                      }}
                    >
                      <i className="fa-solid fa-heart"></i> {post.aantalLikes}
                    </button>
                    <button>
                      <i className="fa-solid fa-comment"></i>{" "}
                      {post.aantalComentaars}
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id, index)}
                      title="Verwijder post"
                      style={{ color: "#FF6B6B" }}
                    >
                      <i className="fa-solid fa-trash"></i>
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
