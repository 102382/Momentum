"use client";
import { useEffect, useState } from "react";
import "../exploreUsers/exploreUsers.css";
import Message from "../message/Message.jsx";
import Loading from "../loading/Loading.jsx";
import UserCard from "../exploreUsers/UserCard.jsx";
import UserProfileView from "../userProfile/UserProfileView.jsx";
import { API_URL } from "../../config";

const ExploreUsers = ({ onUserSelect = null }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageType, setMessageType] = useState("success");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState("users");
  const [allPosts, setAllPosts] = useState([]);

  // Commentaar states
  const [showCommentsPostId, setShowCommentsPostId] = useState(null);
  const [showCommentFormPostId, setShowCommentFormPostId] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingAddComment, setLoadingAddComment] = useState(false);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setMessageVisible(true);

    setTimeout(() => {
      setMessageVisible(false);
    }, 3000);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    const filtered = users.filter((user) =>
      user.naam.toLowerCase().includes(value.toLowerCase()),
    );

    const sorted = filtered.sort((a, b) => {
      const aIsFollowed = a.followers && a.followers.includes(currentUserEmail);
      const bIsFollowed = b.followers && b.followers.includes(currentUserEmail);
      if (aIsFollowed && !bIsFollowed) return -1;
      if (!aIsFollowed && bIsFollowed) return 1;
      return 0;
    });
    setFilteredUsers(sorted);
  };

  useEffect(() => {
    fetch(`${API_URL}/receive/mijnInfo`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setCurrentUserEmail(data.email);
      })
      .catch(() => console.log("Niet ingelogd"));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/receive/allUsers`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data) => {
        const usersArray = Array.isArray(data) ? data : [];
        // Sort users so followed users come first
        const sorted = usersArray.sort((a, b) => {
          const aIsFollowed =
            a.followers && a.followers.includes(currentUserEmail);
          const bIsFollowed =
            b.followers && b.followers.includes(currentUserEmail);
          if (aIsFollowed && !bIsFollowed) return -1;
          if (!aIsFollowed && bIsFollowed) return 1;
          return 0;
        });
        setUsers(sorted);
        setFilteredUsers(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showMessage("Fout bij het laden van gebruikers", "error");
        setLoading(false);
      });
  }, [currentUserEmail]);

  useEffect(() => {
    // Fetch all posts when entering posts view mode
    if (viewMode === "posts" && allPosts.length === 0) {
      fetch(`${API_URL}/receive/allPosts`, {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch posts");
          return res.json();
        })
        .then((data) => {
          const postsArray = Array.isArray(data) ? data : [];
          setAllPosts(postsArray);
        })
        .catch((err) => {
          console.error(err);
          showMessage("Fout bij het laden van posten", "error");
        });
    }
  }, [viewMode]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  const handleBackClick = () => {
    setSelectedUser(null);
    if (onUserSelect) {
      onUserSelect(null);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/send/likePost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, email: currentUserEmail }),
        credentials: "include",
      });

      if (!res.ok) {
        showMessage("Fout bij het liken van de post", "error");
        return;
      }

      const data = await res.json();
      setAllPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                aantalLikes: data.aantalLikes,
                likes: data.liked
                  ? [...(post.likes || []), currentUserEmail]
                  : (post.likes || []).filter((e) => e !== currentUserEmail),
              }
            : post,
        ),
      );
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
    }
  };

  const toggleCommentsView = async (postId) => {
    if (showCommentsPostId === postId) {
      setShowCommentsPostId(null);
      setShowCommentFormPostId(null);
    } else {
      setShowCommentsPostId(postId);
      setShowCommentFormPostId(null);
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
        setComments((prev) => ({ ...prev, [postId]: [] }));
        setLoadingComments(false);
        return;
      }

      const data = await res.json();
      setComments((prev) => ({
        ...prev,
        [postId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error(err);
      setComments((prev) => ({ ...prev, [postId]: [] }));
    }
    setLoadingComments(false);
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) {
      showMessage("Schrijf een commentaar", "error");
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
        showMessage("Fout bij het toevoegen van commentaar", "error");
        setLoadingAddComment(false);
        return;
      }

      const newCommentData = await res.json();
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newCommentData.comment],
      }));

      setAllPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                aantalComentaars: (post.aantalComentaars || 0) + 1,
              }
            : post,
        ),
      );

      setNewComment("");
      setShowCommentFormPostId(null);
      showMessage("Commentaar toegevoegd!", "success");
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
    }
    setLoadingAddComment(false);
  };

  if (loading) {
    return <Loading text="Gebruikers laden..." />;
  }

  if (selectedUser) {
    return (
      <UserProfileView
        user={selectedUser}
        onBack={handleBackClick}
        currentUserEmail={currentUserEmail}
        showMessage={showMessage}
      />
    );
  }

  return (
    <div className="MiddenContainer exploreUsersContainer">
      <Message text={message} type={messageType} visible={messageVisible} />

      {/* View Mode Toggle */}
      <div className="viewModeToggle">
        <button
          className={`toggleBtn ${viewMode === "users" ? "active" : ""}`}
          onClick={() => setViewMode("users")}
        >
          <i className="fa-solid fa-users"></i> Gebruikers
        </button>
        <button
          className={`toggleBtn ${viewMode === "posts" ? "active" : ""}`}
          onClick={() => setViewMode("posts")}
        >
          <i className="fa-solid fa-images"></i> Posten
        </button>
      </div>

      {viewMode === "users" ? (
        <>
          <div className="exploreSearchSection">
            <input
              type="text"
              className="exploreSearchInput"
              placeholder="Zoek gebruikers op naam..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="usersGrid">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  onClick={() => handleUserClick(user)}
                />
              ))
            ) : searchQuery ? (
              <div className="noUsers">
                <p>Geen gebruikers gevonden met de naam "{searchQuery}"</p>
              </div>
            ) : (
              <div className="noUsers">
                <p>Nog geen gebruikers gevonden</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="postsGrid">
          {allPosts.length > 0 ? (
            allPosts.map((post) => (
              <div key={post._id} className="post">
                {post.foto && (
                  <img src={post.foto} alt={`Post by ${post.naam}`} />
                )}
                <div className="myComentaar">
                  <div className="Myinfo">
                    <h2>{post.naam}</h2>
                    <p>{post.mijnComentaar}</p>
                  </div>
                </div>
                <div className="acties">
                  <button
                    className={
                      post.likes && post.likes.includes(currentUserEmail)
                        ? "liked"
                        : ""
                    }
                    onClick={() => handleLikePost(post._id)}
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
                        onClick={() => {
                          setShowCommentsPostId(null);
                          setShowCommentFormPostId(null);
                        }}
                      >
                        <i className="fa-solid fa-times"></i>
                      </button>
                    </div>

                    {showCommentFormPostId === post._id ? (
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
                            {loadingAddComment ? "Verzenden..." : "Verzenden"}
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
                                    <div>
                                      <h4>{comment.naam}</h4>
                                      <p>{comment.text}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="noComments">Nog geen commentaren</p>
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
            <div className="noUsers">
              <p>Nog geen posten beschikbaar</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExploreUsers;
