"use client";
import { useEffect, useState } from "react";
import "../userProfile/userProfile.css";
import Message from "../message/Message.jsx";
import Loading from "../loading/Loading.jsx";
import { API_URL } from "../../config";

const UserProfileView = ({ user, onBack, currentUserEmail, showMessage }) => {
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

  // Commentaar states
  const [showCommentsPostId, setShowCommentsPostId] = useState(null);
  const [showCommentFormPostId, setShowCommentFormPostId] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingAddComment, setLoadingAddComment] = useState(false);

  const showLocalMessage = (text, type = "success") => {
    if (showMessage) {
      showMessage(text, type);
    } else {
      setMessage(text);
      setMessageType(type);
      setMessageVisible(true);

      setTimeout(() => {
        setMessageVisible(false);
      }, 3000);
    }
  };

  useEffect(() => {
    // Fetch user info
    fetch(`${API_URL}/receive/userInfo/${user.email}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user info");
        return res.json();
      })
      .then((data) => {
        setUserInfo(data);
        setIsFollowing(data.isFollowing || false);
        setLoadingInfo(false);
      })
      .catch((err) => {
        console.error(err);
        showLocalMessage("Fout bij het laden van gebruikersinfo", "error");
        setLoadingInfo(false);
      });

    // Fetch user posts
    fetch(`${API_URL}/receive/userPosts/${user.email}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user posts");
        return res.json();
      })
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
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user tasks");
        return res.json();
      })
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
        const contentType = res.headers.get("content-type");
        let errorMsg = "Fout bij het volgen van deze gebruiker";
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } else {
          errorMsg = await res.text();
        }
        showLocalMessage(errorMsg, "error");
        return;
      }

      const data = await res.json();
      setIsFollowing(data.following);
      setUserInfo({
        ...userInfo,
        volgers: data.volgers,
      });
      window.dispatchEvent(new CustomEvent("followingChanged"));
      showLocalMessage(
        data.following
          ? "Je volgt deze gebruiker!"
          : "Je volgt deze gebruiker niet meer",
        "success",
      );
    } catch (err) {
      console.error(err);
      showLocalMessage("Server error", "error");
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
        showLocalMessage("Fout bij het liken van de post", "error");
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
      showLocalMessage("Server error", "error");
    }
  };

  const toggleCommentsView = async (postId) => {
    if (showCommentsPostId === postId) {
      setShowCommentsPostId(null);
    } else {
      setShowCommentsPostId(postId);
      if (!comments[postId]) {
        await fetchPostComments(postId);
      }
    }
  };

  const fetchPostComments = async (postId) => {
    setLoadingComments(true);
    try {
      const res = await fetch(
        `${API_URL}/receive/postComments/${postId}`,
        {
          credentials: "include",
        },
      );

      if (!res.ok) {
        setComments({ ...comments, [postId]: [] });
        setLoadingComments(false);
        return;
      }

      const data = await res.json();
      setComments({ ...comments, [postId]: Array.isArray(data) ? data : [] });
    } catch (err) {
      console.error(err);
      setComments({ ...comments, [postId]: [] });
    }
    setLoadingComments(false);
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) {
      showLocalMessage("Schrijf een commentaar", "error");
      return;
    }

    setLoadingAddComment(true);
    try {
      const res = await fetch(`${API_URL}/send/addComment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          email: currentUserEmail,
          text: newComment,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        showLocalMessage("Fout bij het toevoegen van commentaar", "error");
        setLoadingAddComment(false);
        return;
      }

      const newCommentData = await res.json();
      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), newCommentData.comment],
      });

      const updatedPosts = posts.map((post) =>
        post._id === postId
          ? {
              ...post,
              aantalComentaars: (post.aantalComentaars || 0) + 1,
            }
          : post,
      );
      setPosts(updatedPosts);

      setNewComment("");
      setShowCommentFormPostId(null);
      showLocalMessage("Commentaar toegevoegd!", "success");
    } catch (err) {
      console.error(err);
      showLocalMessage("Server error", "error");
    }
    setLoadingAddComment(false);
  };

  return (
    <div className="MiddenContainer">
      {!showMessage && (
        <Message text={message} type={messageType} visible={messageVisible} />
      )}

      {/* Back Button */}
      <button className="backButton" onClick={onBack}>
        <i className="fa-solid fa-arrow-left"></i>
        Terug
      </button>

      {loadingInfo ? (
        <Loading text="Profiel laden..." />
      ) : (
        <>
          {/* User Info Section */}
          <div className="gebruikerInfo">
            <div className="profilePhotoSection">
              <div
                className="bgfoto"
                style={
                  userInfo?.profileImage
                    ? {
                        backgroundImage: `url("${encodeURI(
                          userInfo.profileImage,
                        )}")`,
                      }
                    : undefined
                }
              ></div>
              <div className="userNameDescription">
                <h2>{userInfo?.naam || "Gebruiker"}</h2>
                <p>{userInfo?.about || "Geen beschrijving"}</p>
              </div>
            </div>

            <div className="statsSection">
              <div className="VolgerInfo">
                <div className="stat">
                  <h2>{userInfo?.posten || "0"}</h2>
                  <span>Posten</span>
                </div>
                <div className="stat">
                  <h2>{userInfo?.streaks || "0"}</h2>
                  <span>Streaks</span>
                </div>
                <div className="stat">
                  <h2>{userInfo?.volgers || "0"}</h2>
                  <span>Volgers</span>
                </div>
              </div>
              <div className="VolgerInfoLine"></div>
              <button
                className={`followBtn ${isFollowing ? "following" : ""}`}
                onClick={handleFollow}
              >
                <i
                  className={`fa-solid ${
                    isFollowing ? "fa-user-check" : "fa-user-plus"
                  }`}
                ></i>
                {isFollowing ? "Volgend" : "Volgen"}
              </button>
            </div>
          </div>

          {/* Posts Section */}
          <div className="postContainer">
            <div className="posten">
              {loadingPosts ? (
                <Loading text="Posts laden..." />
              ) : posts.length > 0 ? (
                posts.map((post, index) => (
                  <div key={post._id} className="post">
                    <div className="myComentaar">
                      <img
                        src={
                          userInfo?.profileImage
                            ? encodeURI(userInfo.profileImage)
                            : "/images/BackgroundAvatar.jpg"
                        }
                        alt=""
                      />
                      <div className="Myinfo">
                        <h2>{post.naam}</h2>
                        <p>{post.mijnComentaar}</p>
                      </div>
                    </div>
                    <div className="acties">
                      <button
                        className={`${
                          post.likes && post.likes.includes(currentUserEmail)
                            ? "liked"
                            : ""
                        }`}
                        onClick={() => handleLike(index)}
                      >
                        <i className="fa-solid fa-heart"></i>
                        <span>{post.aantalLikes || 0} Likes</span>
                      </button>
                      <button
                        className="commentBtn"
                        onClick={() => toggleCommentsView(post._id)}
                      >
                        <i className="fa-solid fa-comment"></i>
                        <span>{post.aantalComentaars || 0} Reageer</span>
                      </button>
                    </div>

                    {/* Comments Modal */}
                    {showCommentsPostId === post._id && (
                      <div className="commentsModal">
                        <div className="commentsHeader">
                          <h3>Commentaren</h3>
                          <button
                            className="closeCommentsBtn"
                            onClick={() => setShowCommentsPostId(null)}
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>

                        {showCommentFormPostId === post._id ? (
                          // Show form instead of comments
                          <div className="commentFormContainer">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Schrijf je commentaar..."
                              className="commentInput"
                              autoFocus
                            />
                            <div className="commentFormButtons">
                              <button
                                className="submitCommentBtn"
                                onClick={() => handleAddComment(post._id)}
                                disabled={loadingAddComment}
                              >
                                {loadingAddComment
                                  ? "Verzenden..."
                                  : "Verzenden"}
                              </button>
                              <button
                                className="cancelCommentBtn"
                                onClick={() => {
                                  setShowCommentFormPostId(null);
                                  setNewComment("");
                                }}
                              >
                                Annuleren
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Show comments list
                          <>
                            {loadingComments ? (
                              <Loading text="Commentaren laden..." />
                            ) : (
                              <div className="commentsList">
                                {comments[post._id] &&
                                comments[post._id].length > 0 ? (
                                  comments[post._id].map((comment, idx) => (
                                    <div key={idx} className="commentItem">
                                      <div className="commentAuthor">
                                        <img
                                          src="https://www.shutterstock.com/image-photo/close-headshot-portrait-smiling-young-260nw-1916406272.jpg"
                                          alt=""
                                        />
                                        <div>
                                          <h4>{comment.naam}</h4>
                                          <p>{comment.text}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="noComments">
                                    Nog geen commentaren
                                  </p>
                                )}
                              </div>
                            )}

                            <button
                              className="addCommentBtn"
                              onClick={() => setShowCommentFormPostId(post._id)}
                            >
                              <i className="fa-solid fa-plus"></i> Commentaar
                              toevoegen
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="noContent">Geen posts beschikbaar</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfileView;
