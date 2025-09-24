import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message || "Internal Server Error";
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error("API error:", err);
  }
  res.status(status).json({ message });
}

export default errorHandler;
