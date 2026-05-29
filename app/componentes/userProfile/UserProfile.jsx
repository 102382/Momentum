"use client";
import { useEffect, useState } from "react";
import "../userProfile/userProfile.css";
import Message from "../message/Message.jsx";
import Loading from "../loading/Loading.jsx";
import { API_URL } from "../../config";

const UserProfile = ({ user, onBack, currentUserEmail }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [opdrachten, setOpdrachten] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingOpdrachten, setLoadingOpdrachten] = useState(true);
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageType, setMessageType] = useState("success");
  const [isFollowing, setIsFollowing] = useState(false);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setMessageVisible(true);

    setTimeout(() => {
      setMessageVisible(false);
    }, 3000);
  };

  useEffect(() => {
    // Fetch user info
    fetch(`${API_URL}/receive/userInfo/${user.email}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUserInfo(data);
        setIsFollowing(data.isFollowing || false);
        setLoadingInfo(false);
      })
      .catch((err) => {
        console.error(err);
        showMessage("Fout bij het laden van gebruikersinfo", "error");
        setLoadingInfo(false);
      });

    // Fetch user posts
    fetch(`${API_URL}/receive/userPosts/${user.email}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoadingPosts(false);
      })
      .catch((err) => {
        console.error(err);
        setPosts([]);
        setLoadingPosts(false);
      });

    // Fetch user opdrachten
    fetch(`${API_URL}/receive/userOpdrachten/${user.email}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setOpdrachten(Array.isArray(data) ? data : []);
        setLoadingOpdrachten(false);
      })
      .catch((err) => {
        console.error(err);
        setOpdrachten([]);
        setLoadingOpdrachten(false);
      });
  }, [user.email]);

  const handleFollow = async () => {
    try {
      const res = await fetch(`${API_URL}/send/followUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserEmail: user.email,
          followerEmail: currentUserEmail,
        }),
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
      setUserInfo({
        ...userInfo,
        volgers: data.volgers,
      });
      showMessage(
        data.following
          ? "Je volgt deze gebruiker!"
          : "Je volgt deze gebruiker niet meer",
        "success",
      );
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
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
        body: JSON.stringify({ postId: post._id, email: currentUserEmail }),
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
          ? [...(post.likes || []), currentUserEmail]
          : (post.likes || []).filter((e) => e !== currentUserEmail),
      };
      setPosts(updatedPosts);
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
    }
  };

  return (
    <div className="userProfileContainer">
      <Message text={message} type={messageType} visible={messageVisible} />

      {/* Back Button */}
      <button className="backButton" onClick={onBack}>
        <i className="fa-solid fa-arrow-left"></i>
        Terug naar alle gebruikers
      </button>

      {loadingInfo ? (
        <Loading text="Profiel laden..." />
      ) : (
        <div className="userProfileContent">
          {/* User Info Section */}
          <div className="userInfoSection">
            <div className="userInfoCard">
              <div className="bgfoto"></div>
              <h2>{userInfo?.naam || "Gebruiker"}</h2>
              <p>{userInfo?.about || "Geen beschrijving"}</p>
            </div>

            <div className="userStatsSection">
              <div className="statsInfo">
                <div className="stat">
                  <h3>{userInfo?.posten || "0"}</h3>
                  <span>Posten</span>
                </div>
                <div className="stat">
                  <h3>{userInfo?.streaks || "0"}</h3>
                  <span>Streaks</span>
                </div>
                <div className="stat">
                  <h3>{userInfo?.volgers || "0"}</h3>
                  <span>Volgers</span>
                </div>
              </div>
              <div className="followLine"></div>
              <button
                className={`followBtn ${isFollowing ? "following" : ""}`}
                onClick={handleFollow}
              >
                <i
                  className={`fa-solid ${isFollowing ? "fa-user-check" : "fa-user-plus"}`}
                ></i>
                {isFollowing ? "Volgend" : "Volgen"}
              </button>
            </div>
          </div>

          {/* Posts Section */}
          <div className="postSection">
            <h2>Posts van {userInfo?.naam}</h2>
            {loadingPosts ? (
              <Loading text="Posts laden..." />
            ) : posts.length > 0 ? (
              <div className="postsList">
                {posts.map((post, index) => (
                  <div key={post._id} className="postItem">
                    <div className="postHeader">
                      <div className="postAuthor">
                        <div className="authorAvatar"></div>
                        <div>
                          <h4>{post.naam}</h4>
                          <span className="postDate">Recent</span>
                        </div>
                      </div>
                    </div>
                    <p className="postContent">{post.mijnComentaar}</p>
                    <div className="postActions">
                      <button
                        className={`likeBtn ${
                          post.likes && post.likes.includes(currentUserEmail)
                            ? "liked"
                            : ""
                        }`}
                        onClick={() => handleLike(index)}
                      >
                        <i className="fa-solid fa-heart"></i>
                        <span>{post.aantalLikes || 0} Likes</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="noContent">Geen posts beschikbaar</p>
            )}
          </div>

          {/* Opdrachten Section */}
          <div className="opdrachtenSection">
            <h2>Opdrachten van {userInfo?.naam}</h2>
            {loadingOpdrachten ? (
              <Loading text="Opdrachten laden..." />
            ) : opdrachten.length > 0 ? (
              <div className="opdrachtenList">
                {opdrachten.map((opdracht) => (
                  <div key={opdracht._id} className="opdrachtItem">
                    <div className="opdrachtHeader">
                      <h4>{opdracht.titel}</h4>
                      <span
                        className={`statusBadge ${opdracht.status?.toLowerCase()}`}
                      >
                        {opdracht.status}
                      </span>
                    </div>
                    <p className="opdrachtDescription">
                      {opdracht.beschrijving}
                    </p>
                    <div className="opdrachtMeta">
                      <span
                        className="priority"
                        data-priority={opdracht.prioriteit?.toLowerCase()}
                      >
                        {opdracht.prioriteit}
                      </span>
                      <div className="progressBar">
                        <div
                          className="progressFill"
                          style={{ width: `${opdracht.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="progressText">
                        {opdracht.progress || 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="noContent">Geen opdrachten beschikbaar</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
