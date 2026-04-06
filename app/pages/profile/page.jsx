"use client";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [Naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [leeftijd, setLeeftijd] = useState("");
  const [geslacht, setGeslacht] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/mijnInfo", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setNaam(data.naam);
        setEmail(data.email);
        setLeeftijd(data.leeftijd);
        setGeslacht(data.geslacht);
      })
      .catch(() => console.log("Niet ingelogd"));
  }, []);

  return (
    <div>
      <h1>Welkom, {Naam}!</h1>
      <p>Email: {email}</p>
      <p>Leeftijd: {leeftijd}</p>
      <p>Geslacht: {geslacht}</p>
    </div>
  );
}
