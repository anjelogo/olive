import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "oceanic.js";
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
      const decrypted = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

      const user = client.findUser(decrypted.discordID as string);

      if (!user) {
        res.status(401).json({ message: "Unauthorized: User not found" });
        return;
      }

      const allowed = await client.getModule("Main").hasPerm(user as User, "main.web.view", req.params.id);
      if (!allowed) {
        res.status(403).json({ message: "Forbidden: You do not have permission to access this resource" });
        return;
      }

      req.user = user; // Attach the user to the request object
      next();
    } catch (err) {
      res.status(401).json({ message: "Unauthorized: Invalid token", error: err });
    }
  };
};