import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response } from "express";
import { SessionModel, UserModel, id, plain } from "./mongo";
import type { Role, User } from "./store";

const scrypt = promisify(scryptCallback);
const sessionCookie = "smartstock.sid";
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required.");
}

export const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL,
);

function signSessionId(sessionId: string) {
  return createHmac("sha256", sessionSecret as string)
    .update(sessionId)
    .digest("base64url");
}

function readSignedSessionId(value: unknown) {
  if (typeof value !== "string") return null;
  const [sessionId, signature] = value.split(".");
  if (!sessionId || !signature) return null;
  const expected = signSessionId(sessionId);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  )
    return null;
  return sessionId;
}

export async function setSession(res: Response, userId: string) {
  const sessionId = randomBytes(32).toString("hex");
  await SessionModel.create({
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + sessionDurationMs),
  });
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(sessionCookie, `${sessionId}.${signSessionId(sessionId)}`, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: sessionDurationMs,
    path: "/",
  });
}

export async function clearSession(req: Request, res: Response) {
  const sessionId = readSignedSessionId(req.cookies?.[sessionCookie]);
  if (sessionId) await SessionModel.deleteOne({ id: sessionId });
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(sessionCookie, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
  });
}

export async function currentUser(req: Request): Promise<User | null> {
  const sessionId = readSignedSessionId(req.cookies?.[sessionCookie]);
  if (!sessionId) return null;
  const session = plain<any>(
    await SessionModel.findOne({
      id: sessionId,
      expiresAt: { $gt: new Date() },
    }),
  );
  if (!session) return null;
  return plain<User>(await UserModel.findOne({ id: session.userId })) ?? null;
}

export function userResponse(user: User | null) {
  return user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
      }
    : null;
}

export async function requireRole(req: Request, res: Response, role?: Role) {
  const user = await currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in to continue." });
    return null;
  }
  if (role && user.role !== role) {
    res
      .status(403)
      .json({ error: "You do not have permission for this area." });
    return null;
  }
  return user;
}

export function adminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL?.trim(),
    hash: process.env.ADMIN_PASSWORD_HASH,
    // For local development convenience only. Do NOT set in production.
    plain: process.env.ADMIN_PASSWORD_PLAIN,
  };
}

export async function verifyAdminPassword(password: string, encoded?: string) {
  if (!encoded) return false;
  try {
    const [scheme, n, r, p, salt, hash] = encoded.split("$");
    if (scheme !== "scrypt" || !n || !r || !p || !salt || !hash) return false;
    const expected = Buffer.from(hash, "base64");
    const derived = (await (scrypt as any)(
      password,
      Buffer.from(salt, "base64"),
      expected.length,
      {
        N: Number(n),
        r: Number(r),
        p: Number(p),
        maxmem: 128 * Number(n) * Number(r) + 1024,
      },
    )) as Buffer;
    return (
      expected.length === derived.length && timingSafeEqual(expected, derived)
    );
  } catch {
    return false;
  }
}

export function frontendRedirect(pathname: string) {
  const origin = process.env.CLIENT_ORIGIN?.trim() || "http://localhost:20091";
  const safePath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${origin}${safePath}`;
}

export function getGoogleRedirect() {
  return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: process.env.GOOGLE_CALLBACK_URL ?? "",
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  })}`;
}

export async function exchangeGoogleCode(code: string) {
  const token = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: process.env.GOOGLE_CALLBACK_URL ?? "",
      grant_type: "authorization_code",
    }),
  });
  if (!token.ok) throw new Error("Google token exchange failed");
  const { access_token: accessToken } = (await token.json()) as {
    access_token?: string;
  };
  if (!accessToken) throw new Error("Google access token missing");
  const profile = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!profile.ok) throw new Error("Google profile lookup failed");
  return (await profile.json()) as {
    sub: string;
    name?: string;
    email?: string;
    picture?: string;
  };
}
