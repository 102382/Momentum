"use client";
import { useState } from "react";
import LeftSideprofile from "../../componentes/leftSideprofile/LeftSideprofile.jsx";
import ExploreUsers from "../../componentes/exploreUsers/ExploreUsers.jsx";
import RightSideProfile from "../../componentes/rightSideProfile/RightSideProfile.jsx";
import "../profile/profile.css";

export default function ExplorePage() {
  const [selectedUserFromExplore, setSelectedUserFromExplore] = useState(null);

  const handleUserDeselect = () => {
    setSelectedUserFromExplore(null);
  };

  return (
    <div className="profileContainer">
      <LeftSideprofile />
      <ExploreUsers onUserSelect={setSelectedUserFromExplore} />
      <RightSideProfile
        externalSelectedUser={selectedUserFromExplore}
        onUserDeselect={handleUserDeselect}
      />
    </div>
  );
}
