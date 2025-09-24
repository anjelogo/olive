import { Request, Response, NextFunction, RequestHandler } from "express";
// Ensure our express type augmentation is visible
import "../../../types/express";

interface HitInfo { count: number; windowStart: number }
const buckets = new Map<string, HitInfo>();

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
const MAX_HITS = Number(process.env.RATE_LIMIT_MAX_HITS ?? 120);

function keyFrom(req: Request) {
  // Prefer authenticated user, fallback to IP
  const anyReq = req as Request & { userId?: string };
  return anyReq.userId || (req.ip || (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown");
}

export const rateLimit: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const key = keyFrom(req);
  const now = Date.now();
  const info = buckets.get(key);
  if (!info || now - info.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    next();
    return;
  }

  if (info.count >= MAX_HITS) {
    const retryAfter = Math.ceil((info.windowStart + WINDOW_MS - now) / 1000);
    res.setHeader("Retry-After", retryAfter.toString());
    res.status(429).json({ message: "Too Many Requests" });
    return;
  }

  info.count++;
  next();
};

export default rateLimit;
