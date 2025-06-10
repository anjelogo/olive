import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "oceanic.js";
import ExtendedClient from "../../Base/Client";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export const authenticateJWT = (client: ExtendedClient) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    console.log("Token received:", token);

    if (!token) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    try {
      const decrypted = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

      const user = client.findUser(decrypted.discordID as string);

      if (!user) {
        res.status(401).json({ message: "Unauthorized: User not found" });
        return;
      }

      if (!await client.getModule("Main").hasPerm(req.user as User, "roles.save.toggle")) {
        res.status(403).json({ message: "You do not have permission to access this endpoint." });
        return;
      }
      next();
    } catch (err) {
      res.status(401).json({ message: "Unauthorized: Invalid token", error: err });
    }
  };
};