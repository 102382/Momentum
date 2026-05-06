"use client";
import { useEffect, useState } from "react";
import LeftSideprofile from "../../componentes/leftSideprofile/LeftSideprofile.jsx";
import ExploreUsers from "../../componentes/exploreUsers/ExploreUsers.jsx";
import "../profile/profile.css";

export default function ExplorePage() {
  return (
    <div className="profileContainer">
      <LeftSideprofile />
      <ExploreUsers />
      <div className="right"></div>
    </div>
  );
}
