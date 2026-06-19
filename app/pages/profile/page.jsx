"use client";
import LeftSideprofile from "../../componentes/leftSideprofile/LeftSideprofile.jsx";
import MiddenProfile from "../../componentes/middenProfile/MiddenProfile.jsx";
import RightSideProfile from "../../componentes/rightSideProfile/RightSideProfile.jsx";
import "../profile/profile.css";

export default function ProfilePage() {
  return (
    <div className="profileContainer">
      <LeftSideprofile />
      <MiddenProfile />
      <RightSideProfile />
    </div>
  );
}
