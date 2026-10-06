import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { unauthorized } from "../lib/errors.js";
import { getLocalUserId } from "../lib/users.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

async function userIdFromToken(req: Request): Promise<string | undefined> {
  const header = req.header("authorization");
  if (!header) return undefined;
  if (!header.startsWith("Bearer ")) throw unauthorized("Token is invalid or expired");
  let sub: string | undefined;
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret);
    sub = typeof payload === "object" ? payload.sub : undefined;
  } catch {
    throw unauthorized("Token is invalid or expired");
  }
  if (!sub || !(await prisma.user.findUnique({ where: { id: sub }, select: { id: true } }))) {
    throw unauthorized("Token is invalid or expired");
  }
  return sub;
}

/** Requires a valid bearer token. */
export async function requireUser(req: Request, _res: Response, next: NextFunction) {
  const userId = await userIdFromToken(req);
  if (!userId) throw unauthorized();
  req.userId = userId;
  next();
}

/**
 * Resolves the user for resource routes. With AUTH_REQUIRED=true a token is
 * mandatory; otherwise an absent token falls back to the built-in local user.
 */
export async function resolveUser(req: Request, res: Response, next: NextFunction) {
  if (config.authRequired) return requireUser(req, res, next);
  req.userId = (await userIdFromToken(req)) ?? (await getLocalUserId());
  next();
}

export const currentUserId = (req: Request) => {
  if (!req.userId) throw unauthorized();
  return req.userId;
};
