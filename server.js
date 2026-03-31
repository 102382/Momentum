import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import crypto from "crypto";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3001;

// CORS (React toestaan)
app.use(cors({
  origin: "http://localhost:3000"
}));

// JSON support
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connectie
mongoose.connect(
  "mongodb+srv://102382_db_user:MoMMV2005.@testdb.ifj5mdr.mongodb.net",
  { dbName: "Users" }
);

const db = mongoose.connection;

db.once("open", () => {
  console.log("Connected to MongoDB");
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

// 📧 Mailtrap transporter
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "1326d40b97a18a",
    pass: "4c67ea9e8434b4"
  }
});

// ROUTE: account maken + email sturen
app.post("/makeAccount", async (req, res) => {
  try {
    console.log("BODY:", req.body);

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

    // token genereren
    const token = crypto.randomBytes(32).toString("hex");

    const newAccount = new Account({
      email,
      password,
      verified: false,
      verificationToken: token
    });

    await newAccount.save();

    console.log("Saved:", newAccount);

    const verifyLink = `http://localhost:3001/verify/${token}`;

    // 📧 email versturen via Mailtrap
    await transporter.sendMail({
      from: '"Momentum App" <no-reply@momentum.com>',
      to: email,
      subject: "Verify je account",
      html: `
        <h2>Email verificatie</h2>
        <p>Klik op de link hieronder om je account te activeren:</p>
        <a href="${verifyLink}">${verifyLink}</a>
      `
    });

    res.status(200).send("Account aangemaakt! Check Mailtrap inbox.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ROUTE: email verificatie
app.get("/verify/:token", async (req, res) => {
  try {
    const user = await Account.findOne({
      verificationToken: req.params.token
    });

    if (!user) {
      return res.status(400).send("Ongeldige of verlopen link");
    }

    user.verified = true;
    user.verificationToken = undefined;

    await user.save();

    res.send("Email succesvol geverifieerd!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ROUTE: login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Account.findOne({ email });

    if (!user) {
      return res.status(400).send("Gebruiker bestaat niet");
    }

    if (!user.verified) {
      return res.status(400).send("Verifieer eerst je email");
    }

    if (user.password !== password) {
      return res.status(400).send("Wachtwoord klopt niet");
    }

    res.status(200).send("Login success");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});