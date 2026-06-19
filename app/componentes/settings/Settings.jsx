"use client";
import { useEffect, useState } from "react";
import "./settings.css";
import Message from "../message/Message.jsx";
import Loading from "../loading/Loading.jsx";
import { API_URL, mediaUrl } from "../../config";

const Settings = () => {
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageType, setMessageType] = useState("success");

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setMessageVisible(true);

    setTimeout(() => {
      setMessageVisible(false);
    }, 3000);
  };

  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    naam: "",
    about: "",
    leeftijd: "",
    geslacht: "",
  });
  const [profileImage, setProfileImage] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");

  const [loadingInfo, setLoadingInfo] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/receive/mijnInfo`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setEmail(data.email || "");
        setFormData({
          naam: data.naam || "",
          about: data.about || "",
          leeftijd: data.leeftijd || "",
          geslacht: data.geslacht || "",
        });
        setProfileImage(data.profileImage || "");
        setLoadingInfo(false);
      })
      .catch(() => {
        console.log("Niet ingelogd");
        setLoadingInfo(false);
      });
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    if (!formData.naam || !formData.geslacht) {
      showMessage("Vul minstens je naam en geslacht in", "error");
      return;
    }

    setSaving(true);

    try {
      let imageUrl = profileImage;

      // Ik upload de nieuwe profielfoto als ik er een heb gekozen.
      if (fotoFile) {
        const fotoFormData = new FormData();
        fotoFormData.append("file", fotoFile);

        const fotoRes = await fetch(`${API_URL}/send/uploadFoto`, {
          method: "POST",
          body: fotoFormData,
          credentials: "include",
        });

        if (!fotoRes.ok) {
          const errorMsg = await fotoRes.text();
          showMessage(errorMsg || "Fout bij het uploaden van de foto", "error");
          setSaving(false);
          return;
        }

        const fotoData = await fotoRes.json();
        imageUrl = fotoData.url;
      }

      const res = await fetch(`${API_URL}/send/updateInfo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          naam: formData.naam,
          about: formData.about,
          leeftijd: formData.leeftijd,
          geslacht: formData.geslacht,
          profileImage: imageUrl,
        }),
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        showMessage(errorMsg || "Fout bij het opslaan", "error");
        setSaving(false);
        return;
      }

      const data = await res.json();
      setProfileImage(data.profileImage || imageUrl);
      setFotoFile(null);
      setFotoPreview("");
      showMessage("Gegevens succesvol opgeslagen!", "success");
    } catch (err) {
      console.error(err);
      showMessage("Server error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/send/logout`, {
      method: "POST",
      credentials: "include",
    });

    window.location.href = "/";
  };

  const avatar =
    fotoPreview || profileImage || "/images/BackgroundAvatar.jpg";

  return (
    <div className="SettingsContainer">
      <Message text={message} type={messageType} visible={messageVisible} />

      {loadingInfo ? (
        <Loading text="Instellingen laden..." />
      ) : (
        <div className="settings-page">
          <header className="settings-header">
            <div className="settings-header-text">
              <h1>Instellingen</h1>
              <p>Beheer je profiel en accountgegevens</p>
            </div>
            <button
              type="button"
              className="logoutBtn"
              onClick={handleLogout}
            >
              <i className="fa-solid fa-sign-out-alt"></i>
              Uitloggen
            </button>
          </header>

          {/* Ik toon hier de profielbanner met de avatar. */}
          <section className="settings-banner">
            <div className="avatar-wrap">
              <div
                className="avatar"
                style={{ backgroundImage: `url("${encodeURI(mediaUrl(avatar))}")` }}
              ></div>
              <label
                htmlFor="profileFoto"
                className="avatar-edit"
                title="Profielfoto wijzigen"
              >
                <i className="fa-solid fa-camera"></i>
              </label>
              <input
                type="file"
                id="profileFoto"
                accept="image/*"
                onChange={handleFotoChange}
              />
            </div>
            <div className="banner-info">
              <h2>{formData.naam || "Gebruiker"}</h2>
              <span className="banner-email">{email}</span>
              {fotoFile ? (
                <p className="foto-status changed">
                  <i className="fa-solid fa-circle-check"></i> Nieuwe foto
                  gekozen — klik op opslaan
                </p>
              ) : (
                <p className="foto-status">
                  Klik op het camera-icoon om je foto te wijzigen
                </p>
              )}
            </div>
          </section>

          <form onSubmit={handleSubmit}>
            <section className="settings-section">
              <div className="section-head">
                <h3>Persoonlijke gegevens</h3>
                <p>Deze informatie is zichtbaar op je profiel.</p>
              </div>

              <div className="setting-row">
                <div className="setting-label">
                  <label htmlFor="naam">Naam</label>
                </div>
                <div className="setting-control">
                  <input
                    id="naam"
                    type="text"
                    name="naam"
                    placeholder="Jouw naam"
                    value={formData.naam}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-label">
                  <label htmlFor="about">Over jezelf</label>
                  <span className="setting-hint">Een korte bio</span>
                </div>
                <div className="setting-control">
                  <textarea
                    id="about"
                    name="about"
                    placeholder="Vertel iets over jezelf"
                    value={formData.about}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-label">
                  <label htmlFor="leeftijd">Leeftijd</label>
                </div>
                <div className="setting-control">
                  <input
                    id="leeftijd"
                    type="number"
                    name="leeftijd"
                    placeholder="Jouw leeftijd"
                    value={formData.leeftijd}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-label">
                  <label htmlFor="geslacht">Geslacht</label>
                </div>
                <div className="setting-control">
                  <select
                    id="geslacht"
                    name="geslacht"
                    value={formData.geslacht}
                    onChange={handleChange}
                  >
                    <option value="">Selecteer</option>
                    <option value="man">Man</option>
                    <option value="vrouw">Vrouw</option>
                  </select>
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-label">
                  <label htmlFor="email">Email</label>
                  <span className="setting-hint">Kan niet gewijzigd worden</span>
                </div>
                <div className="setting-control">
                  <input id="email" type="text" value={email} readOnly />
                </div>
              </div>
            </section>

            <div className="settings-actions">
              <button type="submit" className="saveBtn" disabled={saving}>
                {saving ? (
                  "Bezig met opslaan..."
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk"></i> Wijzigingen
                    opslaan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Settings;
