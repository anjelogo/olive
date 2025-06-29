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
      const decrypted = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

      const user = client.findUser(decrypted.discordID as string);

      if (!user) {
        res.status(401).json({ message: "Unauthorized: User not found" });
        return;
      }

      req.user = user; // Attach the user to the request object
      next();
    } catch (err) {
      res.status(401).json({ message: "Unauthorized: Invalid token", error: err });
    }
  };
};