"use client";
import GegevensFormulier from "../../componentes/gegevensFormulier/GegevensFormulier";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ExtraInfoPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`http://localhost:3001/pendingRegistration/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.email) setEmail(data.email);
      })
      .catch(() => console.log("Token ophalen mislukt"));
  }, [token]);

  return (
    <div>
      <GegevensFormulier email={email} />
    </div>
  );
}

export default function ExtraInfoPage() {
  return (
    <Suspense>
      <ExtraInfoPageContent />
    </Suspense>
  );
}
