"use client";
import OpdrachtenPage from "../../componentes/opdrachten/OpdrachtenPage";
import LeftSideprofile from "../../componentes/leftSideprofile/LeftSideprofile";
import "../profile/profile.css";

export default function OpdrachtenPageWrapper() {
  return (
    <div className="profileContainer">
      <LeftSideprofile />
      <OpdrachtenPage />
      <div className="right"></div>
    </div>
  );
}
