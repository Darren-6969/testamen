// lib/jwt.ts
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

// ---- SECRET (runtime + type safe) ----
const SECRET_ENV = process.env.JWT_SECRET;

if (!SECRET_ENV) {
  throw new Error("JWT_SECRET is not set");
}

// After the guard, we can safely narrow the type
const SECRET: string = SECRET_ENV;

// ---- Types ----
type ExpiresIn = SignOptions["expiresIn"];

// ---- Sign ----
export function signToken(
  payload: Record<string, any>,
  expiresIn: ExpiresIn = "7d"
): string {
  return jwt.sign(payload, SECRET, { expiresIn });
}

// ---- Verify ----
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
}
