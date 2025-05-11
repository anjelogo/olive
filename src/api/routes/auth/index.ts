import cookieParser from "cookie-parser";
import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as DiscordStrategy, Profile } from "passport-discord";
import jwt from "jsonwebtoken";
import { VerifyCallback } from "passport-oauth2";

const authRoute = (): Router => {
  const router = Router();
  const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";
  const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"; // Adjust according to your environment

  // Middleware to use cookies
  router.use(cookieParser());

  // Passport Discord Strategy Setup (no session usage)
  passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID || "",
        clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
        callbackURL: "http://localhost:5000/api/auth/callback", // Dynamically set the callback URL
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
      const user = jwt.verify(token, JWT_SECRET);
      res.json(user);
      return;
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
  });

  return router;
};

export default authRoute;