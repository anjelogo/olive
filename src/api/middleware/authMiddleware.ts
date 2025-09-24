import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ExtendedClient from "../../Base/Client";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export const authenticateJWT = (client: ExtendedClient) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    try {
      const decrypted = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { discordID?: string };
      const userID = decrypted.discordID;
      if (!userID) {
        res.status(401).json({ message: "Unauthorized: Invalid token (no discordID)" });
        return;
      }

      // Prefer live cache when available, otherwise just set userId for downstream checks
      const user = client?.users?.get(userID);
      if (user) req.user = user;
      // Always provide userId for API-only flows
      (req as any).userId = userID;
      next();
    } catch (err) {
      res.status(401).json({ message: "Unauthorized: Invalid token", error: err });
    }
  };
};