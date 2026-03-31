import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { verify } from "crypto";

const app = express();
const PORT = 3001;

// Dit staat hier zodat requests van React mogen komen 
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
  id: Number,
  email: String,
  password: String,
  verified: {
    type: Boolean,
    default: false
  }
});

const Account = mongoose.model("momentum_accounts", accountSchema);

//  ROUTE: account maken
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

    const users = await Account.find();

    const newAccount = new Account({
      id: users.length + 1,
      email,
      password,
      verified: false
    });

    await newAccount.save();

    console.log("Saved:", newAccount);

    res.status(200).send("Account succesvol aangemaakt!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Account.findOne({ email });

    if (!user) {
      return res.status(400).send("Gebruiker bestaat niet");
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