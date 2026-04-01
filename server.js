import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connectie
mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.DB_NAME
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
    default: false
  },
  verificationToken: String
});

const Account = mongoose.model("momentum_accounts", accountSchema);

// =========================
// 📧 Nodemailer Gmail setup
// =========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,           // je Gmail adres
    pass: process.env.GMAIL_APP_PASSWORD    // je App-wachtwoord
  }
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

    const newAccount = new Account({
      email,
      password: hashedPassword,
      verified: false,
      verificationToken: token
    });

    await newAccount.save();

    const verifyLink = `${process.env.BACKEND_URL}/verify/${token}`;

    // ✉️ Verstuur email via Gmail
    try {
      await transporter.sendMail({
        from: `"Momentum App" <${process.env.GMAIL_USER}>`, // afzender
        to: email,
        subject: "Verify je account",
        html: `
          <h2>Email verificatie</h2>
          <p>Klik hieronder om je account te activeren:</p>
          <a href="${verifyLink}">${verifyLink}</a>
        `
      });
      console.log("✅ Email sent to:", email);
      res.status(200).send("Account aangemaakt! Check je inbox.");
    } catch (emailErr) {
      console.error("❌ Email Error:", emailErr.message);
      res.status(500).send("Account created, but email failed: " + emailErr.message);
    }
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    res.status(500).send("Server error");
  }
});

// =========================
// ✅ VERIFY EMAIL
// =========================
app.get("/verify/:token", async (req, res) => {
  try {
    const user = await Account.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).send("Ongeldige of verlopen link");

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send("✅ Email succesvol geverifieerd!");
  } catch (err) {
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
    if (!user) return res.status(400).send("Gebruiker bestaat niet");
    if (!user.verified) return res.status(400).send("Verifieer eerst je email");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send("Wachtwoord klopt niet");

    res.status(200).send("Login success");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// =========================
// 🚀 START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${process.env.BACKEND_URL}`);
});