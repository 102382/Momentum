"use client";
import { useEffect, useState } from "react";
import "../exploreUsers/exploreUsers.css";
import Message from "../message/Message.jsx";
import Loading from "../loading/Loading.jsx";
import UserCard from "../exploreUsers/UserCard.jsx";
import UserProfileView from "../userProfile/UserProfileView.jsx";

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
    fetch("http://localhost:3001/receive/mijnInfo", {
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
    fetch("http://localhost:3001/receive/allUsers", {
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
      fetch("http://localhost:3001/receive/allPosts", {
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
                <div className="acties">
                  <button>
                    <i className="fa-solid fa-heart"></i> {post.aantalLikes || 0}
                  </button>
                  <button>
                    <i className="fa-solid fa-comment"></i> {post.aantalComentaars || 0}
                  </button>
                </div>
                <div className="myComentaar">
                  <div className="Myinfo">
                    <h2>{post.naam}</h2>
                    <p>{post.mijnComentaar}</p>
                  </div>
                </div>
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
