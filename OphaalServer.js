import express from "express";

const setupOphaalRoutes = ({
  Account,
  GebruikerInfo,
  GberuikersPost,
  GebruikersOpdrachten,
  authMiddleware,
}) => {
  const router = express.Router();

  // =========================
  // VERIFY EMAIL
  // =========================
  router.get("/verify/:token", async (req, res) => {
    try {
      const user = await Account.findOne({
        verificationToken: req.params.token,
      });
      if (!user) {
        return res.status(400).send("Ongeldige link");
      }

      if (user.verificationTokenExpires < Date.now()) {
        await Account.deleteOne({ _id: user._id });
        return res
          .status(400)
          .send("Token verlopen, account verwijderd. Registreer opnieuw.");
      }
      user.verified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;

      const crypto = (await import("crypto")).default;
      const regToken = crypto.randomBytes(32).toString("hex");
      user.registrationToken = regToken;
      user.registrationTokenExpires = Date.now() + 10 * 60 * 1000;
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
  // PENDING REGISTRATION
  // =========================
  router.get("/pendingRegistration/:token", async (req, res) => {
    try {
      const user = await Account.findOne({
        registrationToken: req.params.token,
      });
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
  // /me
  // =========================
  router.get("/me", authMiddleware, async (req, res) => {
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
  router.get("/mijnInfo", authMiddleware, async (req, res) => {
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

  // =========================
  // MIJN POSTS
  // =========================
  router.get("/mijnPosts", authMiddleware, async (req, res) => {
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

  // =========================
  // MIJN OPDRACHTEN
  // =========================
  router.get("/mijnOpdrachten", authMiddleware, async (req, res) => {
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

  // =========================
  // GET UPDATED OPDRACH
  // =========================

  router.get("/updatedOpdracht/:id", (req, res) => {
    const id = req.params.id;
    GebruikersOpdrachten.findById(id)
      .then((opdracht) => {
        if (!opdracht) {
          return res.status(404).json({ error: "Opdracht niet gevonden" });
        }
        res.json(opdracht);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: "Server error" });
      });
  });

  // =========================
  // ALL USERS FOR EXPLORE
  // =========================
  router.get("/allUsers", authMiddleware, async (req, res) => {
    try {
      const users = await GebruikerInfo.find({
        email: { $ne: req.user.email }, // Exclude current user
      }).select("email naam about volgers posten streaks followers");

      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // =========================
  // USER INFO BY EMAIL
  // =========================
  router.get("/userInfo/:email", authMiddleware, async (req, res) => {
    try {
      const userEmail = req.params.email;

      const userInfo = await GebruikerInfo.findOne({ email: userEmail });

      if (!userInfo) {
        return res.status(404).json({ error: "Gebruiker niet gevonden" });
      }

      // Check if current user is following this user
      const isFollowing =
        userInfo.followers && userInfo.followers.includes(req.user.email);

      res.json({
        email: userInfo.email,
        naam: userInfo.naam,
        about: userInfo.about,
        leeftijd: userInfo.leeftijd,
        geslacht: userInfo.geslacht,
        posten: userInfo.posten,
        streaks: userInfo.streaks,
        volgers: userInfo.volgers,
        isFollowing: isFollowing,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // =========================
  // USER POSTS BY EMAIL
  // =========================
  router.get("/userPosts/:email", authMiddleware, async (req, res) => {
    try {
      const userEmail = req.params.email;

      const userPosts = await GberuikersPost.find({ email: userEmail });

      if (userPosts.length === 0) {
        return res.json([]);
      }

      res.json(userPosts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // =========================
  // USER OPDRACHTEN BY EMAIL
  // =========================
  router.get("/userOpdrachten/:email", authMiddleware, async (req, res) => {
    try {
      const userEmail = req.params.email;

      const userOpdrachten = await GebruikersOpdrachten.find({
        email: userEmail,
      });

      if (userOpdrachten.length === 0) {
        return res.json([]);
      }

      res.json(userOpdrachten);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // =========================
  // FOLLOWING USERS
  // =========================
  router.get("/followingUsers/:email", authMiddleware, async (req, res) => {
    try {
      const currentUserEmail = req.params.email;

      // Find all users that the current user is following
      // (where the current user's email is in their followers array)
      const followingUsers = await GebruikerInfo.find({
        followers: currentUserEmail,
      }).select("email naam streaks profileImage");

      if (followingUsers.length === 0) {
        return res.json([]);
      }

      res.json(followingUsers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // =========================
  // GET POST COMMENTS
  // =========================
  router.get("/postComments/:postId", authMiddleware, async (req, res) => {
    try {
      const post = await GberuikersPost.findById(req.params.postId);
      if (!post) {
        return res.json([]);
      }
      res.json(post.comments || []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // =========================
  // GET ALL POSTS
  // =========================
  router.get("/allPosts", async (req, res) => {
    try {
      const posts = await GberuikersPost.find().sort({ _id: -1 });
      res.json(posts || []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
};

export default setupOphaalRoutes;
