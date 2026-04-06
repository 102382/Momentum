"use client";
import GegevensFormulier from "../../componentes/gegevensFormulier/GegevensFormulier";
import { useEffect, useState } from "react";

export default function ExtraInfoPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setEmail(data.email))
      .catch(() => console.log("Niet ingelogd"));
  }, []);

  return (
    <div>
      <GegevensFormulier />
    </div>
  );
}
