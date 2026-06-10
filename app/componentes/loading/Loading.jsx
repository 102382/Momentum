"use client";
import "./loading.css";

const Loading = ({ text = "Laden..." }) => {
  return (
    <div className="loadingContainer">
      <div className="spinnerWrapper">
        <div className="spinner"></div>
        <div className="glowRing"></div>
      </div>
      <p className="loadingText">{text}</p>
    </div>
  );
};

export default Loading;
