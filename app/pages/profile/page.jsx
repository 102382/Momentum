"use client";
import { useEffect, useState } from "react";
import LeftSideprofile from "../../componentes/leftSideprofile/LeftSideprofile.jsx"
import MiddenProfile from "../../componentes/middenProfile/MiddenProfile.jsx"
import "../profile/profile.css"

export default function ProfilePage() {

  return (
    <div className="profileContainer">
      <LeftSideprofile/>
      <MiddenProfile/>
      <div className="right">

      </div>
    </div>

  );
}


