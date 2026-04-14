import express from "express";

const setupVerstuurRoutes = ({
  Account,
  GebruikerInfo,
  GberuikersPost,
  GebruikersOpdrachten,
  transporter,
  bcrypt,
  crypto,
  jwt,
}) => {
  const router = express.Router();

  // =========================
  // REGISTER + EMAIL
  // =========================
  router.post("/makeAccount", async (req, res) => {
    try {
      const { email, password, confirmPassword } = req.body;

      if (!email || !password || !confirmPassword) {
        return res.status(400).send("Missing fields");
      }
      if (password !== confirmPassword) {
        return res.status(400).send("Wachtwoorden komen niet overeen");
      }

      const existingUser = await Account.findOne({ email });
      if (existingUser) {
        return res.status(400).send("Email bestaat al");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const token = crypto.randomBytes(32).toString("hex");
      const tokenExpires = Date.now() + 5 * 60 * 1000;

      const newAccount = new Account({
        email,
        password: hashedPassword,
        verified: false,
        verificationToken: token,
        verificationTokenExpires: tokenExpires,
      });

      await newAccount.save();

      const verifyLink = `${process.env.BACKEND_URL}/receive/verify/${token}`;

      try {
        await transporter.sendMail({
          from: `"Momentum App" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: "Verify je account",
          html: `
            <h2>Email verificatie</h2>
            <p>Klik hieronder om je account te activeren:</p>
            <a href="${verifyLink}">${verifyLink}</a>
          `,
        });
        console.log("Email sent to:", email);
        res.status(200).send("Account aangemaakt! Check je inbox.");
      } catch (emailErr) {
        console.error("Email Error:", emailErr.message);
        res
          .status(500)
          .send("Account created, but email failed: " + emailErr.message);
      }
    } catch (err) {
      console.error("ERROR:", err.message);
      res.status(500).send("Server error");
    }
  });

  // =========================
  // GEBRUIKER INFO OPSLAAN
  // =========================
  router.post("/gebruikerInfo", async (req, res) => {
    try {
      const { email, about, naam, leeftijd, geslacht } = req.body;

      if (
        typeof email !== "string" ||
        typeof naam !== "string" ||
        typeof about !== "string" ||
        typeof geslacht !== "string" ||
        (typeof leeftijd !== "string" && typeof leeftijd !== "number")
      ) {
        return res.status(400).send("Ongeldige invoer");
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanNaam = naam.trim();
      const cleanAbout = about.trim();
      const cleanLeeftijd = Number(leeftijd);
      const cleanGeslacht = geslacht.trim();

      if (!cleanEmail || !cleanNaam || !cleanGeslacht) {
        return res.status(400).send("Vul alle velden in");
      }
      if (!["man", "vrouw"].includes(cleanGeslacht)) {
        return res.status(400).send("Ongeldig geslacht");
      }
      if (!Number.isInteger(cleanLeeftijd) || cleanLeeftijd < 1 || cleanLeeftijd > 120) {
        return res.status(400).send("Ongeldige leeftijd");
      }

      const existing = await GebruikerInfo.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).send("Gegevens zijn al opgeslagen");
      }

      const newUser = new GebruikerInfo({
        email: cleanEmail,
        naam: cleanNaam,
        about: cleanAbout,
        leeftijd: cleanLeeftijd,
        geslacht: cleanGeslacht,
        posten: 0,
        streaks: 0,
        volgers: 0
      });
      await newUser.save();
      res.send("Gegevens opgeslagen!");
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).send("Gegevens zijn al opgeslagen");
      }
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  // =========================
  // LOGIN
  // =========================
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await Account.findOne({ email });
      if (!user) return res.status(400).send("Gebruiker bestaat niet");
      if (!user.verified) return res.status(400).send("Verifieer eerst je email");

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).send("Wachtwoord klopt niet");

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      res.send("ok");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  // =========================
  // MAKE POST
  // =========================
  router.post("/makePost", async (req, res) => {
    try {
      const { email, naam, mijnComentaar } = req.body;

      if (
        typeof email !== "string" ||
        typeof naam !== "string" ||
        typeof mijnComentaar !== "string"
      ) {
        return res.status(400).send("Ongeldige invoer");
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanNaam = naam.trim();
      const cleanMijnComentaar = mijnComentaar.trim();

      if (!cleanEmail || !cleanNaam || !cleanMijnComentaar) {
        return res.status(400).send("Vul alle velden in");
      }

      const newPost = new GberuikersPost({
        email: cleanEmail,
        naam: cleanNaam,
        mijnComentaar: cleanMijnComentaar,
        foto: "",
        aantalLikes: 0,
        aantalComentaars: 0,
      });
      await newPost.save();
      res.send("Gegevens opgeslagen!");
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).send("Gegevens zijn al opgeslagen");
      }
      console.error(err);
      res.status(500).send(err.message);
    }
  });

  // =========================
  // MAKE OPDRACHT
  // =========================
  router.post("/makeOpdracht", async (req, res) => {
    try {
      const { email, titel, beschrijving, prioriteit, status, deadline, categorie, progress } = req.body;

      if (
        typeof email !== "string" ||
        typeof titel !== "string" ||
        typeof beschrijving !== "string" ||
        typeof prioriteit !== "string" ||
        typeof status !== "string" ||
        typeof categorie !== "string" ||
        (typeof progress !== "number" || progress < 0 || progress > 100)
      ) {
        return res.status(400).send("Ongeldige invoer");
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanTitel = titel.trim();
      const cleanBeschrijving = beschrijving.trim();
      const cleanPrioriteit = prioriteit.trim();
      const cleanStatus = status.trim();
      const cleanCategorie = categorie.trim();
      const cleanDeadline = new Date(deadline);

      if (!cleanEmail || !cleanTitel || !cleanBeschrijving || !cleanPrioriteit || !cleanStatus || !cleanCategorie || isNaN(cleanDeadline.getTime())) {
        return res.status(400).send("Vul alle velden in");
      }

      const newOpdracht = new GebruikersOpdrachten({
        email: cleanEmail,
        titel: cleanTitel,
        beschrijving: cleanBeschrijving,
        prioriteit: cleanPrioriteit,
        status: cleanStatus,
        deadline: cleanDeadline,
        categorie: cleanCategorie,
        progress: progress,
      });
      await newOpdracht.save();
      res.send("Opdracht aangemaakt!");
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).send("Opdracht bestaat al");
      }
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  // =========================
  // DELETE OPDRACHT
  // =========================
  router.post("/deleteOpdracht", async (req, res) => {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).send("ID is vereist");
      }

      const deleted = await GebruikersOpdrachten.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).send("Opdracht niet gevonden");
      }

      res.send("Opdracht verwijderd!");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  // =========================
  // BEWERK OPDRACHT
  // =========================
  router.post("/bewerkOpdracht", async (req, res) => {
    try {
      const { id, titel, beschrijving, prioriteit, status, deadline, categorie, progress } = req.body;

      if (!id) {
        return res.status(400).send("ID is vereist");
      }

      const updateData = {};
      if (titel) updateData.titel = titel.trim();
      if (beschrijving) updateData.beschrijving = beschrijving.trim();
      if (prioriteit) updateData.prioriteit = prioriteit.trim();
      if (status) updateData.status = status.trim();
      if (categorie) updateData.categorie = categorie.trim();
      if (deadline) {
        const cleanDeadline = new Date(deadline);
        if (isNaN(cleanDeadline.getTime())) {
          return res.status(400).send("Ongeldige deadline");
        }
        updateData.deadline = cleanDeadline;
      }
      if (typeof progress === "number") {
        if (progress < 0 || progress > 100) {
          return res.status(400).send("Progress moet tussen 0 en 100 zijn");
        }
        updateData.progress = progress;
      }

      const updated = await GebruikersOpdrachten.findByIdAndUpdate(id, updateData, { new: true });
      if (!updated) {
        return res.status(404).send("Opdracht niet gevonden");
      }

      res.send("Opdracht bijgewerkt!");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  // =========================
  // LOGOUT
  // =========================
  router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
  });

  return router;
};

export default setupVerstuurRoutes;
