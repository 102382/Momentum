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
      const user = await Account.findOne({ verificationToken: req.params.token });
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

  return router;
};

export default setupOphaalRoutes;