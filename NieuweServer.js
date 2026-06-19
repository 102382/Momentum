import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";
import { Resend } from "resend";

import setupVerstuurRoutes from "./VerstuurServer.js";
import setupOphaalRoutes from "./OphaalServer.js";

dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
});
const PORT = process.env.PORT || 3001;

// =========================
// Middleware
// =========================
// Ik laat alle origins toe en stuur cookies mee, zodat de app ook werkt
// als iemand hem via mijn IP-adres opent en niet alleen via localhost.
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ik serveer de bestanden uit de map "public" (oude foto's en avatars).
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
  profileImage: String, // Hier bewaar ik de link naar de profielfoto.
  followers: [String], // Hier zet ik de e-mails van mensen die deze gebruiker volgen.
  lastCompletedAt: Date, // Hiermee houd ik bij wanneer de laatste opdracht af was (voor de streak).
});

const GberuikersPostSceham = new mongoose.Schema({
  email: String,
  naam: String,
  foto: String,
  video: String,
  mijnComentaar: String,
  aantalLikes: Number,
  aantalComentaars: Number,
  likes: [String], // Hier zet ik de e-mails van mensen die deze post leuk vinden.
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
// Auth Middleware
// =========================
// Ik controleer bij elke beveiligde route of er een geldige token-cookie is.
// Zo niet, dan stuur ik de gebruiker weg met een foutmelding.
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
  resend,
  bcrypt,
  crypto,
  jwt,
  authMiddleware,
  io, // Ik geef Socket.io door zodat ik live updates kan sturen.
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
// Ik log wanneer iemand verbinding maakt of de verbinding verbreekt.
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
