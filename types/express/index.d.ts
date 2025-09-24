import { User } from "oceanic.js";

declare namespace Express {
  export interface Request {
    user?: User;
    userId?: string;
  }
}