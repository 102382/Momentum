import express from "express";
import mongoose, { set } from "mongoose";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";

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
  console.log("✅ Connected to MongoDB");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Error:", err.message);
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
  leeftijd: Number,
  geslacht: String,
});

const Account = mongoose.model("momentum_accounts", accountSchema);
const GebruikerInfo = mongoose.model(
  "momentum_gebruikers_info",
  gebruikerInfoSchema,
);

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
// ✅ VERIFY EMAIL
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
    const { email, naam, leeftijd, geslacht } = req.body;

    // Prevent NoSQL injection: all fields must be plain primitives, not objects
    if (
      typeof email !== "string" ||
      typeof naam !== "string" ||
      typeof geslacht !== "string" ||
      (typeof leeftijd !== "string" && typeof leeftijd !== "number")
    ) {
      return res.status(400).send("Ongeldige invoer");
    }

    // Sanitize
    const cleanEmail = email.trim().toLowerCase();
    const cleanNaam = naam.trim();
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
      leeftijd: cleanLeeftijd,
      geslacht: cleanGeslacht,
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
// 🔐 LOGIN
// =========================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Account.findOne({ email });
    const gebruikerInfo = await GebruikerInfo.findOne({ email });

    if (!user) return res.status(400).send("Gebruiker bestaat niet");
    if (!user.verified) return res.status(400).send("Verifieer eerst je email");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send("Wachtwoord klopt niet");

    const userData = {
      naam: gebruikerInfo.naam,
      email: gebruikerInfo.email,
      leeftijd: gebruikerInfo.leeftijd,
      geslacht: gebruikerInfo.geslacht,
    };

    res.cookie("user", JSON.stringify(userData), {
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

app.get("/me", (req, res) => {
  const user = req.cookies.user;

  if (!user) {
    return res.status(401).json({ error: "Niet ingelogd" });
  }

  res.json(JSON.parse(user));
});

// =========================
// MIJN INFO
// =========================
app.get("/mijnInfo", (req, res) => {
  const user = req.cookies.user;

  if (!user) {
    return res.status(401).json({ error: "Niet ingelogd" });
  }

  const data = JSON.parse(user);

  res.json({
    naam: data.naam,
    email: data.email,
    leeftijd: data.leeftijd,
    geslacht: data.geslacht,
  });
});

// =========================
// 🚀 START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${process.env.BACKEND_URL}`);
});
