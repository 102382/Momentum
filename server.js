import express from "express";
import mongoose, { mongo, set } from "mongoose";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connectie
mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.DB_NAME,
});
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
});
mongoose.connection.on("error", (err) => {
  console.error("MongoDB Error:", err.message);
});

// Schema
const accountSchema = new mongoose.Schema({
  email: String,
  password: String,
  verified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  registrationToken: String,
  registrationTokenExpires: Date,
});

// Gberuikers informatie schema
const gebruikerInfoSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  naam: String,
  about: String,
  leeftijd: Number,
  geslacht: String,
  posten: Number,
  streaks: Number,
  volgers: Number
});


// Gberuikers post schema
const  GberuikersPostSceham = new mongoose.Schema({
  email: String,
  naam: String,
  foto: String,
  mijnComentaar: String,
  aantalLikes: Number,
  aantalComentaars: Number,
});

// Gberuikers Opdrachten schema
const GebruikersOpdrachtenSchema = new mongoose.Schema({
  _id: Number,
  email: String,
  titel: String,
  beschrijving: String,
  prioriteit: String,
  status: String,
  deadline: Date,
  categorie: String,
  progress: {
    type: Number,
    min: 0,
    max: 100
  },
})


const Account = mongoose.model("momentum_accounts", accountSchema);
const GebruikerInfo = mongoose.model("momentum_gebruikers_info",gebruikerInfoSchema,);
const GberuikersPost = mongoose.model("momentum_gebruikers_posts", GberuikersPostSceham);
const GebruikersOpdrachten = mongoose.model("momentum_gebruiker_opdrachten", GebruikersOpdrachtenSchema, "momentum_gebruiker_opdrachten");

// =========================
// 📧 Nodemailer Gmail setup
// =========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // je Gmail adres
    pass: process.env.GMAIL_APP_PASSWORD, // je App-wachtwoord
  },
});

// =========================
// 📌 REGISTER + EMAIL
// =========================
app.post("/makeAccount", async (req, res) => {
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

    // 🔐 wachtwoord hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔑 token genereren
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpires = Date.now() + 5 * 60 * 1000; // 5 minuten geldig

    const newAccount = new Account({
      email,
      password: hashedPassword,
      verified: false,
      verificationToken: token,
      verificationTokenExpires: tokenExpires,
    });

    await newAccount.save();

    const verifyLink = `${process.env.BACKEND_URL}/verify/${token}`;

    //  Verstuur email via Gmail
    try {
      await transporter.sendMail({
        from: `"Momentum App" <${process.env.GMAIL_USER}>`, // afzender
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
//  VERIFY EMAIL
// =========================
app.get("/verify/:token", async (req, res) => {
  try {
    const user = await Account.findOne({ verificationToken: req.params.token });
    if (!user) {
      return res.status(400).send("Ongeldige link");
    }

    //  Token verlopen → account verwijderen
    if (user.verificationTokenExpires < Date.now()) {
      await Account.deleteOne({ _id: user._id });
      return res
        .status(400)
        .send("Token verlopen, account verwijderd. Registreer opnieuw.");
    }
    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    const regToken = crypto.randomBytes(32).toString("hex");
    user.registrationToken = regToken;
    user.registrationTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minuten
    await user.save();

    res.send(`
  Email succesvol geverifieerd! Je wordt doorgestuurd...
  <script>
    setTimeout(() => {
      window.location.href = "${process.env.FRONTEND_URL}/pages/extraInfoPage?token=${regToken}";
    }, 2000);
  </script>
`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// =========================
// 🎫 PENDING REGISTRATION
// =========================
app.get("/pendingRegistration/:token", async (req, res) => {
  try {
    const user = await Account.findOne({ registrationToken: req.params.token });
    if (!user || user.registrationTokenExpires < Date.now()) {
      return res.status(400).json({ error: "Ongeldige of verlopen link" });
    }

    const email = user.email;
    user.registrationToken = undefined;
    user.registrationTokenExpires = undefined;
    await user.save();

    res.json({ email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// Gebruiker info opslaan
// =========================
app.post("/gebruikerInfo", async (req, res) => {
  try {
    const { email, about, naam, leeftijd, geslacht } = req.body;

    // Prevent NoSQL injection: all fields must be plain primitives, not objects
    if (
      typeof email !== "string" ||
      typeof naam !== "string" ||
      typeof about !== "string" ||
      typeof geslacht !== "string" ||
      (typeof leeftijd !== "string" && typeof leeftijd !== "number")
    ) {
      return res.status(400).send("Ongeldige invoer");
    }

    // Sanitize
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

    // Reject if already submitted
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
    // Unique index violation — race condition safety net
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
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Account.findOne({ email });
    if (!user) return res.status(400).send("Gebruiker bestaat niet");
    if (!user.verified) return res.status(400).send("Verifieer eerst je email");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send("Wachtwoord klopt niet");

    // 🔑 JWT token maken
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // blijft ingelogd
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production (https)
      sameSite: "lax",
    });

    res.send("ok");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// =========================
// authMiddleware
// =========================

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Niet ingelogd" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Ongeldige token" });
  }
};

app.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await Account.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Gebruiker niet gevonden" });
    }

    res.json({
      email: user.email,
      verified: user.verified,
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});


// =========================
// MIJN INFO
// =========================
app.get("/mijnInfo", authMiddleware, async (req, res) => {
  try {
    const gebruikerInfo = await GebruikerInfo.findOne({
      email: req.user.email,
    });

    if (!gebruikerInfo) {
      return res.status(404).json({ error: "Geen info gevonden" });
    }

    res.json({
      naam: gebruikerInfo.naam,
      email: gebruikerInfo.email,
      leeftijd: gebruikerInfo.leeftijd,
      geslacht: gebruikerInfo.geslacht,
      about: gebruikerInfo.about,
      posten: gebruikerInfo.posten,
      streaks: gebruikerInfo.streaks,
      volgers: gebruikerInfo.volgers,
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.get("/mijnPosts", authMiddleware, async (req, res) => {
  try {
    const gebruikerPosts = await GberuikersPost.find({
      email: req.user.email,
    });

    if (gebruikerPosts.length === 0) {
      return res.status(404).json({ error: "Geen info gevonden" });
    }

    res.json(gebruikerPosts);
  } catch (err) {
    res.status(500).send("Server error");
  }
});




app.get("/mijnOpdrachten", authMiddleware, async (req, res) => {
  try {
    const GebruikerOpdrachten = await GebruikersOpdrachten.find({
      email: req.user.email,
    });
  

    if (GebruikerOpdrachten.length === 0) {
      return res.status(404).json({ error: "Geen info gevonden" });
    }

    res.json(GebruikerOpdrachten);
  } catch (err) {
    res.status(500).send("Server error");
  }
});



app.post("/makePost", async (req, res) => {
  try {
    const { email, naam, mijnComentaar} = req.body;

    if (
      typeof email !== "string" ||
      typeof naam !== "string" ||
      typeof mijnComentaar !== "string"
    ) {
      return res.status(400).send("Ongeldige invoer");
    }

    // Sanitize
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
      foto: "", // Placeholder, foto upload nog niet geïmplementeerd
      aantalLikes: 0,
      aantalComentaars: 0,
    });
    await newPost.save();
    res.send("Gegevens opgeslagen!");
  } catch (err) {
    // Unique index violation — race condition safety net
    if (err.code === 11000) {
      return res.status(409).send("Gegevens zijn al opgeslagen");
    }
    console.error(err);
    res.status(500).send(err.message);
  }
});


// =========================
// Opdracht toevoegen
// =========================

app.post("/makeOpdracht", async (req, res) => {
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

    // Sanitize
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
      _id: GebruikersOpdrachten.length + 1,
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
    // Unique index violation — race condition safety net
    if (err.code === 11000) {
      return res.status(409).send("Opdracht bestaat al");
    }
    console.error(err);
    res.status(500).send("Server error");
  }
});



// =========================
// Uitloggen
// =========================

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`Server running on ${process.env.BACKEND_URL}`);
});
