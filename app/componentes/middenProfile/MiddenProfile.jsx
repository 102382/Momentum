"use client";
import { useEffect, useState } from "react";
import "../middenProfile/middensideProfile.css";
import Message from "../message/Message.jsx";
import Loading from "../loading/Loading.jsx";
import { API_URL } from "../../config";

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
  const [profileImage, setProfileImage] = useState("");
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [showPostFormulier, setShowPostFormulier] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/receive/mijnInfo`, {
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
        setProfileImage(data.profileImage || "");
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
    fetch(`${API_URL}/receive/mijnPosts`, {
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
    fetch(`${API_URL}/receive/mijnOpdrachten`, {
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
    videoFile: null,
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Update formData wanneer Email en Naam beschikbaar zijn
  useEffect(() => {
    setFormData({
      mijnComentaar: "",
      email: Email,
      naam: Naam,
      fotoFile: null,
      videoFile: null,
    });
  }, [Email, Naam]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "foto" && files && files.length > 0) {
      setFormData({ ...formData, fotoFile: files[0], videoFile: null });
    } else if (name === "video" && files && files.length > 0) {
      setFormData({ ...formData, videoFile: files[0], fotoFile: null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);

    try {
      let fotoURL = null;
      let videoURL = null;

      if (formData.fotoFile) {
        setUploadingFoto(true);
        const fotoFormData = new FormData();
        fotoFormData.append("file", formData.fotoFile);

        const fotoRes = await fetch(`${API_URL}/send/uploadFoto`, {
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

      if (formData.videoFile) {
        setUploadingVideo(true);
        const videoFormData = new FormData();
        videoFormData.append("file", formData.videoFile);

        const videoRes = await fetch(`${API_URL}/send/uploadVideo`, {
          method: "POST",
          body: videoFormData,
          credentials: "include",
        });

        if (!videoRes.ok) {
          const errorMsg = await videoRes.text();
          showMessage(errorMsg || "Fout bij het uploaden van de video", "error");
          setLoadingSubmit(false);
          setUploadingVideo(false);
          return;
        }

        const videoData = await videoRes.json();
        videoURL = videoData.url;
        setUploadingVideo(false);
      }

      const res = await fetch(`${API_URL}/send/makePost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mijnComentaar: formData.mijnComentaar,
          email: Email,
          naam: Naam,
          fotoURL: fotoURL,
          videoURL: videoURL,
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
        videoFile: null,
      });
      setShowPostFormulier(false);
      setPosten((prev) => (prev || 0) + 1);

      // Refresh posts
      fetch(`${API_URL}/receive/mijnPosts`, {
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

      const res = await fetch(`${API_URL}/send/likePost`, {
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
      const res = await fetch(`${API_URL}/send/followUser`, {
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

  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [loadingComments, setLoadingComments] = useState(false);

  const handleToggleComments = async (postId) => {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId(null);
      return;
    }
    setOpenCommentsPostId(postId);
    if (postComments[postId]) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_URL}/receive/postComments/${postId}`, {
        credentials: "include",
      });
      const data = await res.json();
      setPostComments((prev) => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
    } catch {
      setPostComments((prev) => ({ ...prev, [postId]: [] }));
    }
    setLoadingComments(false);
  };

  const handleDeletePost = async (postId, postIndex) => {
    try {
      const res = await fetch(`${API_URL}/send/deletePost`, {
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
    <div className="MiddenContainer MijnProfielView">
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
          <div className="mediaUploadContainer">
            <div className="fotoUploadContainer">
              <label htmlFor="foto" className={formData.videoFile ? "uploadDisabled" : ""}>
                <i className="fa-solid fa-image"></i> Foto toevoegen
              </label>
              <input
                type="file"
                id="foto"
                accept="image/*"
                name="foto"
                onChange={handleChange}
                disabled={!!formData.videoFile}
              />
              {formData.fotoFile && (
                <p className="fotoSelected">
                  <i className="fa-solid fa-check"></i> {formData.fotoFile.name}
                </p>
              )}
            </div>
            <div className="fotoUploadContainer">
              <label htmlFor="video" className={formData.fotoFile ? "uploadDisabled" : ""}>
                <i className="fa-solid fa-video"></i> Video toevoegen
              </label>
              <input
                type="file"
                id="video"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                name="video"
                onChange={handleChange}
                disabled={!!formData.fotoFile}
              />
              {formData.videoFile && (
                <p className="fotoSelected">
                  <i className="fa-solid fa-check"></i> {formData.videoFile.name}
                </p>
              )}
            </div>
          </div>
          <button type="submit" disabled={loadingSubmit || uploadingFoto || uploadingVideo}>
            {uploadingFoto
              ? "Foto uploaden..."
              : uploadingVideo
                ? "Video uploaden..."
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
            <div
              className="bgfoto"
              style={
                profileImage
                  ? { backgroundImage: `url("${encodeURI(API_URL + profileImage)}")` }
                  : undefined
              }
            ></div>
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
                    <img src={API_URL + post.foto} alt={`Post ${index + 1}`} />
                  )}
                  {post.video && (
                    <video controls>
                      <source src={post.video} />
                    </video>
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
                    <button
                      onClick={() => handleToggleComments(post._id)}
                      style={{
                        color: openCommentsPostId === post._id ? "var(--primary-color)" : "inherit",
                      }}
                    >
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
                      src={
                        profileImage
                          ? encodeURI(profileImage)
                          : "/images/BackgroundAvatar.jpg"
                      }
                      alt=""
                    />
                    <div className="Myinfo">
                      <h2>{Naam}</h2>
                      <p>{post.mijnComentaar}</p>
                    </div>
                  </div>
                  {openCommentsPostId === post._id && (
                    <div className="comentaarsLijst">
                      <h3>
                        <i className="fa-solid fa-comments"></i> Comentaars
                      </h3>
                      {loadingComments && !postComments[post._id] ? (
                        <p className="comentaarsLaden">Laden...</p>
                      ) : postComments[post._id] && postComments[post._id].length > 0 ? (
                        postComments[post._id].map((comment, ci) => (
                          <div className="comentaarItem" key={ci}>
                            <div className="comentaarAvatar">
                              <i className="fa-solid fa-user"></i>
                            </div>
                            <div className="comentaarInhoud">
                              <span className="comentaarNaam">{comment.naam}</span>
                              <p>{comment.text}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="geenComentaars">Nog geen comentaars.</p>
                      )}
                    </div>
                  )}
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
