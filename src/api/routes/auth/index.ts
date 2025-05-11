import cookieParser from "cookie-parser";
import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as DiscordStrategy, Profile } from "passport-discord";
import jwt from "jsonwebtoken";
import { VerifyCallback } from "passport-oauth2";
import ExtendedClient from "../../../Base/Client";

const authRoute = (client: ExtendedClient): Router => {
  const router = Router();
  const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";
  const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"; // Adjust according to your environment
  const API_URL = process.env.API_URL || "http://localhost:5000"; // Adjust according to your environment

  // Middleware to use cookies
  router.use(cookieParser());

  // Passport Discord Strategy Setup (no session usage)
  passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.CLIENT_ID || "",
        clientSecret: process.env.CLIENT_SECRET || "",
        callbackURL: `${API_URL}/api/auth/callback`, // Dynamically set the callback URL
        scope: ["identify", "email", "guilds"]
      },
      (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
        done(null, profile); // After success, pass the profile
      }
    )
  );

  // Initialize Passport (no session support)
  router.use(passport.initialize());

  // Login route to start OAuth2 flow (disable session)
  router.get("/login", (req: Request, res: Response) => {
    passport.authenticate("discord", { session: false })(req, res); // Explicitly disable sessions here
  });

  // Callback route after successful Discord OAuth
  router.get(
    "/callback",
    passport.authenticate("discord", { failureRedirect: "/", session: false }), // Explicitly disable sessions here
    (req: Request, res: Response) => {
      const user = req.user as Profile;

      // Generate JWT token
      const token = jwt.sign(
        {
          discordID: user.id,
          username: user.username,
        },
        JWT_SECRET,
        { expiresIn: "1h" } // Token expires in 1 hour
      );

      // Set the JWT in an HttpOnly cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: true, // Set secure only in production
        sameSite: "none",
        maxAge: 3600000, // 1 hour
      });

      res.redirect(CLIENT_URL + "/dashboard"); // Redirect to the frontend
    }
  );

  // Protected route to get user information (from JWT)
  router.get("/me", (req: Request, res: Response) => {
    console.log(req.cookies, "req");
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json({ message: "Not Logged In" });
      return;
    }

    try {
      // Verify the token and get the user data
      const { discordID } = jwt.verify(token, JWT_SECRET) as { discordID: string };

      const user = client.users.get(discordID);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      user.avatar = user.avatarURL();

      res.json(user);
      return;
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(401).json({ message: "Invalid token" });
      return;
    }
  });

  return router;
};

export default authRoute;