import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupVerstuurRoutes = ({
  Account,
  GebruikerInfo,
  GberuikersPost,
  GebruikersOpdrachten,
  resend,
  bcrypt,
  crypto,
  jwt,
  authMiddleware,
  io, // Socket.io instance for real-time updates
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
        await resend.emails.send({
          from: "Momentum App <onboarding@resend.dev>",
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
        res.status(500).send("Account created, but email failed: " + emailErr.message);
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
      if (
        !Number.isInteger(cleanLeeftijd) ||
        cleanLeeftijd < 1 ||
        cleanLeeftijd > 120
      ) {
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
        volgers: 0,
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
  // GEBRUIKER INFO BIJWERKEN
  // =========================
  router.post("/updateInfo", authMiddleware, async (req, res) => {
    try {
      const { naam, about, leeftijd, geslacht, profileImage } = req.body;

      const update = {};

      if (naam !== undefined) {
        if (typeof naam !== "string" || !naam.trim()) {
          return res.status(400).send("Ongeldige naam");
        }
        update.naam = naam.trim();
      }

      if (about !== undefined) {
        if (typeof about !== "string") {
          return res.status(400).send("Ongeldige beschrijving");
        }
        update.about = about.trim();
      }

      if (leeftijd !== undefined && leeftijd !== "") {
        const cleanLeeftijd = Number(leeftijd);
        if (
          !Number.isInteger(cleanLeeftijd) ||
          cleanLeeftijd < 1 ||
          cleanLeeftijd > 120
        ) {
          return res.status(400).send("Ongeldige leeftijd");
        }
        update.leeftijd = cleanLeeftijd;
      }

      if (geslacht !== undefined) {
        const cleanGeslacht = String(geslacht).trim();
        if (!["man", "vrouw"].includes(cleanGeslacht)) {
          return res.status(400).send("Ongeldig geslacht");
        }
        update.geslacht = cleanGeslacht;
      }

      if (profileImage !== undefined) {
        if (typeof profileImage !== "string") {
          return res.status(400).send("Ongeldige profielfoto");
        }
        update.profileImage = profileImage;
      }

      if (Object.keys(update).length === 0) {
        return res.status(400).send("Niets om bij te werken");
      }

      const updated = await GebruikerInfo.findOneAndUpdate(
        { email: req.user.email },
        update,
        { new: true },
      );

      if (!updated) {
        return res.status(404).send("Gebruiker niet gevonden");
      }

      res.json({
        message: "Gegevens bijgewerkt!",
        naam: updated.naam,
        about: updated.about,
        leeftijd: updated.leeftijd,
        geslacht: updated.geslacht,
        profileImage: updated.profileImage || "",
      });
    } catch (err) {
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
      if (!user.verified)
        return res.status(400).send("Verifieer eerst je email");

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).send("Wachtwoord klopt niet");

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
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
      const { email, naam, mijnComentaar, fotoURL, videoURL } = req.body;

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
        foto: fotoURL || "",
        video: videoURL || "",
        aantalLikes: 0,
        aantalComentaars: 0,
        likes: [],
      });
      await newPost.save();

      // Update the post count for the user
      await GebruikerInfo.findOneAndUpdate(
        { email: cleanEmail },
        { $inc: { posten: 1 } },
      );

      if (io) {
        io.emit("new_post", {
          _id: newPost._id,
          email: cleanEmail,
          naam: cleanNaam,
          mijnComentaar: cleanMijnComentaar,
          foto: fotoURL || "",
          video: videoURL || "",
          aantalLikes: 0,
          aantalComentaars: 0,
          likes: [],
        });
      }

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
      const {
        email,
        titel,
        beschrijving,
        prioriteit,
        status,
        deadline,
        categorie,
        progress,
      } = req.body;

      if (
        typeof email !== "string" ||
        typeof titel !== "string" ||
        typeof beschrijving !== "string" ||
        typeof prioriteit !== "string" ||
        typeof status !== "string" ||
        typeof categorie !== "string" ||
        typeof progress !== "number" ||
        progress < 0 ||
        progress > 100
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

      if (
        !cleanEmail ||
        !cleanTitel ||
        !cleanBeschrijving ||
        !cleanPrioriteit ||
        !cleanStatus ||
        !cleanCategorie ||
        isNaN(cleanDeadline.getTime())
      ) {
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

      if (io) {
        io.emit("new_opdracht", {
          _id: newOpdracht._id,
          email: cleanEmail,
          titel: cleanTitel,
          beschrijving: cleanBeschrijving,
          prioriteit: cleanPrioriteit,
          status: cleanStatus,
          deadline: cleanDeadline,
          categorie: cleanCategorie,
          progress: progress,
        });
      }

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
  // UPDATE OPDRACHT
  // =========================
  router.post("/updateOpdracht", async (req, res) => {
    try {
      const {
        id,
        titel,
        beschrijving,
        prioriteit,
        status,
        deadline,
        categorie,
        progress,
      } = req.body;

      if (!id) {
        return res.status(400).send("ID is vereist");
      }

      const updatedOpdracht = await GebruikersOpdrachten.findByIdAndUpdate(
        id,
        {
          titel,
          beschrijving,
          prioriteit,
          status,
          deadline,
          categorie,
          progress,
        },
        { new: true },
      );

      if (!updatedOpdracht) {
        return res.status(404).send("Opdracht niet gevonden");
      }

      // EMIT: Broadcast opdracht update to all connected clients
      if (io) {
        io.emit("opdracht_updated", {
          _id: updatedOpdracht._id,
          email: updatedOpdracht.email,
          titel: updatedOpdracht.titel,
          beschrijving: updatedOpdracht.beschrijving,
          prioriteit: updatedOpdracht.prioriteit,
          status: updatedOpdracht.status,
          deadline: updatedOpdracht.deadline,
          categorie: updatedOpdracht.categorie,
          progress: updatedOpdracht.progress,
        });
      }

      res.send("Opdracht geüpdatet!");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  // =========================
  // Like POST
  // =========================
  router.post("/likePost", async (req, res) => {
    try {
      const { postId, email } = req.body;
      if (!postId || !email) {
        return res.status(400).send("Post ID en email zijn vereist");
      }
      const post = await GberuikersPost.findById(postId);
      if (!post) {
        return res.status(404).send("Post niet gevonden");
      }

      const cleanEmail = email.trim().toLowerCase();
      const hasLiked = post.likes && post.likes.includes(cleanEmail);

      if (hasLiked) {
        // Remove like (toggle)
        post.likes = post.likes.filter((e) => e !== cleanEmail);
        post.aantalLikes = Math.max(0, post.aantalLikes - 1);
      } else {
        // Add like
        if (!post.likes) {
          post.likes = [];
        }
        post.likes.push(cleanEmail);
        post.aantalLikes += 1;
      }

      await post.save();

      if (io) {
        io.emit("post_like_changed", {
          postId: postId,
          email: cleanEmail,
          liked: !hasLiked,
          aantalLikes: post.aantalLikes,
        });
      }

      res.json({ liked: !hasLiked, aantalLikes: post.aantalLikes });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  // =========================
  // DELETE POST
  // =========================
  router.post("/deletePost", async (req, res) => {
    try {
      const { postId, email } = req.body;

      if (!postId || !email) {
        return res.status(400).send("Post ID en email zijn vereist");
      }

      const post = await GberuikersPost.findById(postId);

      if (!post) {
        return res.status(404).send("Post niet gevonden");
      }

      if (post.email.toLowerCase() !== email.trim().toLowerCase()) {
        return res.status(403).send("Je kan alleen je eigen posts verwijderen");
      }

      // Delete the post
      await GberuikersPost.findByIdAndDelete(postId);

      // Update the post count for the user
      await GebruikerInfo.findOneAndUpdate(
        { email: email.trim().toLowerCase() },
        { $inc: { posten: -1 } },
      );

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  // =========================
  // FOLLOW USER
  // =========================
  router.post("/followUser", async (req, res) => {
    try {
      const { targetUserEmail, followerEmail } = req.body;

      if (!targetUserEmail || !followerEmail) {
        return res.status(400).send("Email vereist");
      }

      const cleanTargetEmail = targetUserEmail.trim().toLowerCase();
      const cleanFollowerEmail = followerEmail.trim().toLowerCase();

      const targetUser = await GebruikerInfo.findOne({
        email: cleanTargetEmail,
      });

      if (!targetUser) {
        return res.status(404).send("Gebruiker niet gevonden");
      }

      if (!targetUser.followers) {
        targetUser.followers = [];
      }

      const isFollowing = targetUser.followers.includes(cleanFollowerEmail);

      if (isFollowing) {
        // Unfollow
        targetUser.followers = targetUser.followers.filter(
          (e) => e !== cleanFollowerEmail,
        );
        targetUser.volgers = Math.max(0, targetUser.volgers - 1);
      } else {
        // Follow
        targetUser.followers.push(cleanFollowerEmail);
        targetUser.volgers = (targetUser.volgers || 0) + 1;
      }

      await targetUser.save();

      if (io) {
        io.emit("follow_status_changed", {
          targetUserEmail: cleanTargetEmail,
          followerEmail: cleanFollowerEmail,
          following: !isFollowing,
          volgers: targetUser.volgers,
        });
      }

      res.json({ following: !isFollowing, volgers: targetUser.volgers });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  // =========================
  // COMPLETE OPDRACHT
  // =========================
  router.post("/completeOpdracht", async (req, res) => {
    try {
      const { id } = req.body;
      const token = req.cookies.token;

      if (!id || !token) {
        return res
          .status(400)
          .json({ message: "ID en authenticatie zijn vereist" });
      }

      let userEmail;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userEmail = decoded.email.toLowerCase();
      } catch (err) {
        return res.status(401).json({ message: "Ongeldige token" });
      }

      // Update opdracht status to completed and set progress to 100
      const updatedOpdracht = await GebruikersOpdrachten.findByIdAndUpdate(
        id,
        {
          status: "completed",
          progress: 100,
          completedAt: new Date(),
        },
        { new: true },
      );

      if (!updatedOpdracht) {
        return res.status(404).json({ message: "Opdracht niet gevonden" });
      }

      // Get user info to check streak status
      const user = await GebruikerInfo.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }

      // Check if 24 hours have passed since last completed task
      let currentStreaks = user.streaks || 0;
      if (user.lastCompletedAt) {
        const lastCompleted = new Date(user.lastCompletedAt);
        const now = new Date();
        const hoursDifference = (now - lastCompleted) / (1000 * 60 * 60);

        // If more than 24 hours have passed, reset streaks to 0
        if (hoursDifference > 24) {
          currentStreaks = 0;
        } else {
          // Otherwise, increment streaks
          currentStreaks += 1;
        }
      } else {
        // First task completion
        currentStreaks = 1;
      }

      // Update user streaks and lastCompletedAt
      await GebruikerInfo.findOneAndUpdate(
        { email: userEmail },
        {
          streaks: currentStreaks,
          lastCompletedAt: new Date(),
        },
      );

      // 🔴 EMIT: Broadcast opdracht completion to all connected clients
      if (io) {
        io.emit("opdracht_completed", {
          _id: updatedOpdracht._id,
          email: userEmail,
          status: "completed",
          progress: 100,
          streaks: currentStreaks,
        });
      }

      res.json({
        success: true,
        message: "Opdracht afgerond!",
        updatedOpdracht,
        streaks: currentStreaks,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  // =========================
  // ADD COMMENT TO POST
  // =========================
  router.post("/addComment", authMiddleware, async (req, res) => {
    try {
      const { postId, email, text } = req.body;

      if (!postId || !email || !text) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const post = await GberuikersPost.findById(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const user = await GebruikerInfo.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const newComment = {
        email,
        naam: user.naam,
        text,
        createdAt: new Date(),
      };

      post.comments = post.comments || [];
      post.comments.push(newComment);
      post.aantalComentaars = (post.aantalComentaars || 0) + 1;

      await post.save();

      // 🔴 EMIT: Broadcast new comment to all connected clients
      if (io) {
        io.emit("post_comment_added", {
          postId: postId,
          comment: newComment,
          aantalComentaars: post.aantalComentaars,
        });
      }

      res.json({
        success: true,
        comment: newComment,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // =========================
  // FOTO UPLOAD (Lokaal)
  // =========================
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "public", "images");
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Maak de originele bestandsnaam veilig voor gebruik in een URL:
      // spaties en speciale tekens vervangen door een streepje.
      const safeOriginal = file.originalname
        .normalize("NFKD")
        .replace(/[^\w.\-]+/g, "-")
        .replace(/-+/g, "-");
      const uniqueName =
        Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + safeOriginal;
      cb(null, uniqueName);
    },
  });

  const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Alleen afbeeldingen zijn toegestaan"));
      }
    },
  });

  router.post("/uploadFoto", (req, res) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Foto upload fout:", err);
        const isLimit = err instanceof multer.MulterError;
        return res
          .status(isLimit ? 400 : 500)
          .json({ error: err.message || "Fout bij uploaden van de foto" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Geen bestand geupload" });
      }

      const imageUrl = `/images/${req.file.filename}`;
      res.json({ success: true, url: imageUrl });
    });
  });

  // =========================
  // VIDEO UPLOAD (Lokaal)
  // =========================
  const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "public", "videos");
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const safeOriginal = file.originalname
        .normalize("NFKD")
        .replace(/[^\w.\-]+/g, "-")
        .replace(/-+/g, "-");
      const uniqueName =
        Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + safeOriginal;
      cb(null, uniqueName);
    },
  });

  const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Alleen video's zijn toegestaan (mp4, webm, ogg, mov)"));
      }
    },
  });

  router.post("/uploadVideo", (req, res) => {
    uploadVideo.single("file")(req, res, (err) => {
      if (err) {
        console.error("Video upload fout:", err);
        const isLimit = err instanceof multer.MulterError;
        return res
          .status(isLimit ? 400 : 500)
          .json({ error: err.message || "Fout bij uploaden van de video" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Geen bestand geupload" });
      }

      const videoUrl = `/videos/${req.file.filename}`;
      res.json({ success: true, url: videoUrl });
    });
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
