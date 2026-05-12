"use client";
import { useEffect, useState } from "react";
import "./rightSideProfile.css";

const FollowingList = ({ onUserSelect, onSetCurrentUserEmail }) => {
  const [followingUsers, setFollowingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  useEffect(() => {
    // Fetch current user info
    fetch("http://localhost:3001/receive/mijnInfo", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setCurrentUserEmail(data.email);
        onSetCurrentUserEmail(data.email);
      })
      .catch(() => {
        console.log("Niet ingelogd");
      });
  }, []);

  useEffect(() => {
    if (!currentUserEmail) return;

    // Fetch following users
    fetch(`http://localhost:3001/receive/followingUsers/${currentUserEmail}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setFollowingUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        console.log("Fout bij het laden van volgende gebruikers");
        setFollowingUsers([]);
        setLoading(false);
      });
  }, [currentUserEmail]);

  if (loading) {
    return (
      <div className="followingContainer">
        <div className="followingHeader">
          <h3 className="followingTitle">Ik volg</h3>
          <div className="followingLine"></div>
        </div>
        <div className="followingList">Laden...</div>
      </div>
    );
  }

  return (
    <div className="followingContainer">
      <div className="followingHeader">
        <h3 className="followingTitle">Ik volg</h3>
        <div className="followingLine"></div>
      </div>

      <div className="followingList">
        {followingUsers.length === 0 ? (
          <p className="noFollowing">Je volgt nog geen gebruikers</p>
        ) : (
          followingUsers.map((user) => (
            <div
              key={user.email}
              className="followingUserCard"
              onClick={() => onUserSelect(user)}
            >
              <div className="followingUserInfo">
                <img
                  src="https://www.shutterstock.com/image-photo/close-headshot-portrait-smiling-young-260nw-1916406272.jpg"
                  alt={user.naam}
                  className="followingUserImage"
                />
                <div className="followingUserDetails">
                  <p className="followingUserName">{user.naam}</p>
                </div>
              </div>
              <div className="followingUserStreaks">
                <span className="streakValue">{user.streaks || 0}</span>
                <span className="streakLabel">🔥</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FollowingList;
