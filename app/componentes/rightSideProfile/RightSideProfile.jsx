"use client";
import { useState } from "react";
import "./rightSideProfile.css";
import FollowingList from "./FollowingList.jsx";
import OpdrachtenStats from "./OpdrachtenStats.jsx";
import UserOpdrachten from "./UserOpdrachten.jsx";


const RightSideProfile = ({
  externalSelectedUser = null,
  onUserDeselect = null,
}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // Ik gebruik de gebruiker van buitenaf als die er is, anders mijn eigen state.
  const activeSelectedUser = externalSelectedUser || selectedUser;

  const handleUserDeselect = () => {
    setSelectedUser(null);
    if (onUserDeselect) {
      onUserDeselect();
    }
  };

  return (
    <div className="rightSideContainer">
      {activeSelectedUser && (
        <UserOpdrachten user={activeSelectedUser} onBack={handleUserDeselect} />
      )}
      <FollowingList
        onUserSelect={setSelectedUser}
        onSetCurrentUserEmail={setCurrentUserEmail}
      />
      <OpdrachtenStats />
    </div>
  );
};

export default RightSideProfile;
