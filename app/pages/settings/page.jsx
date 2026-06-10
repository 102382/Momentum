"use client";
import LeftSideprofile from "../../componentes/leftSideprofile/LeftSideprofile.jsx";
import Settings from "../../componentes/settings/Settings.jsx";
import RightSideProfile from "../../componentes/rightSideProfile/RightSideProfile.jsx";
import "../profile/profile.css";

export default function SettingsPage() {
  return (
    <div className="profileContainer settingsPage">
      <LeftSideprofile />
      <Settings />
      <RightSideProfile />
    </div>
  );
}
