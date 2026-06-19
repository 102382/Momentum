"use client";
import { useState } from "react";
import "../exploreUsers/exploreUsers.css";
import { mediaUrl } from "../../config";

const UserCard = ({ user, onClick }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="userCard"
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="userCardImage">
        <div
          className="profileImage"
          style={
            user.profileImage
              ? { backgroundImage: `url("${encodeURI(mediaUrl(user.profileImage))}")` }
              : undefined
          }
        ></div>
      </div>
      <div className="userCardContent">
        <h3>{user.naam}</h3>
        <p className="userAbout">{user.about || "Geen beschrijving"}</p>
        <div className="userStats">
          <div className="stat">
            <span className="statValue">{user.posten || 0}</span>
            <span className="statLabel">Posten</span>
          </div>
          <div className="stat">
            <span className="statValue">{user.streaks || 0}</span>
            <span className="statLabel">Streaks</span>
          </div>
          <div className="stat">
            <span className="statValue">{user.volgers || 0}</span>
            <span className="statLabel">Volgers</span>
          </div>
        </div>
      </div>
      <div className={`cardHoverOverlay ${isHovering ? "active" : ""}`}>
        <button className="viewProfileBtn">
          <i className="fa-solid fa-arrow-right"></i>
          Bekijk Profiel
        </button>
      </div>
    </div>
  );
};

export default UserCard;
