import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "ecotrack-dev-secret-change-in-prod";

export const COOKIE_NAME = "ecotrack_token";
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface JwtPayload {
  userId: number;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
