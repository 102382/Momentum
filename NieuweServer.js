import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";
import dns from "dns";

import setupVerstuurRoutes from "./VerstuurServer.js";
import setupOphaalRoutes from "./OphaalServer.js";

dns.setDefaultResultOrder("ipv4first");
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
});
const PORT = process.env.PORT || 3001;

// =========================
// Middleware
// =========================
// origin: true weerkaatst het aanvragende origin, zodat de app ook werkt
// wanneer iemand hem via je IP-adres opent (niet alleen via localhost).
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische files serveren (voor foto's)
app.use(express.static("public"));

// =========================
// MongoDB Connectie
// =========================
mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.DB_NAME,
});
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
});
mongoose.connection.on("error", (err) => {
  console.error("MongoDB Error:", err.message);
});

// =========================
// Schemas
// =========================
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

const gebruikerInfoSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  naam: String,
  about: String,
  leeftijd: Number,
  geslacht: String,
  posten: Number,
  streaks: Number,
  volgers: Number,
  profileImage: String, // URL naar de profielfoto van de gebruiker
  followers: [String], // Array of email addresses of users who follow this user
  lastCompletedAt: Date, // Track last completed task for streak reset logic
});

const GberuikersPostSceham = new mongoose.Schema({
  email: String,
  naam: String,
  foto: String,
  video: String,
  mijnComentaar: String,
  aantalLikes: Number,
  aantalComentaars: Number,
  likes: [String], // Array of email addresses of users who liked this post
  comments: [
    {
      email: String,
      naam: String,
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const GebruikersOpdrachtenSchema = new mongoose.Schema({
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
    max: 100,
  },
});

// =========================
// Models
// =========================
const Account = mongoose.model("momentum_accounts", accountSchema);
const GebruikerInfo = mongoose.model(
  "momentum_gebruikers_info",
  gebruikerInfoSchema,
);
const GberuikersPost = mongoose.model(
  "momentum_gebruikers_posts",
  GberuikersPostSceham,
);
const GebruikersOpdrachten = mongoose.model(
  "momentum_gebruiker_opdrachten",
  GebruikersOpdrachtenSchema,
  "momentum_gebruiker_opdrachten",
);

// =========================
// 📧 Nodemailer Gmail Setup
// =========================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// =========================
// Auth Middleware
// =========================
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Niet ingelogd" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Ongeldige token" });
  }
};

// =========================
// Routes Koppelen
// =========================
const verstuurRoutes = setupVerstuurRoutes({
  Account,
  GebruikerInfo,
  GberuikersPost,
  GebruikersOpdrachten,
  transporter,
  bcrypt,
  crypto,
  jwt,
  authMiddleware,
  io, // Pass Socket.io instance
});

const ophaalRoutes = setupOphaalRoutes({
  Account,
  GebruikerInfo,
  GberuikersPost,
  GebruikersOpdrachten,
  authMiddleware,
});

app.use("/receive", ophaalRoutes);
app.use("/send", verstuurRoutes);

// =========================
// Socket.io Connection Handler
// =========================
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// =========================
// Start Server
// =========================
httpServer.listen(PORT, () => {
  console.log(`Server running on ${process.env.BACKEND_URL}`);
});
