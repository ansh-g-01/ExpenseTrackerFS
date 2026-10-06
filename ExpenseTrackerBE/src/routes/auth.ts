import bcrypt from "bcryptjs";
import { Router } from "express";
import { prisma } from "../db.js";
import { ApiError, validationError } from "../lib/errors.js";
import { LOCAL_USER_EMAIL, seedDefaultCategories } from "../lib/users.js";
import { currentUserId, requireUser, signToken } from "../middleware/auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const invalidCredentials = () => new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
const emailTaken = () => new ApiError(409, "EMAIL_EXISTS", "An account with this email already exists");
const publicUser = (u: { id: string; name: string; email: string }) => ({ id: u.id, name: u.name, email: u.email });
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const name = str(req.body?.name);
  const email = str(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!name) throw validationError("Name is required");
  if (name.length > 100) throw validationError("Name must be 100 characters or fewer");
  if (!EMAIL_RE.test(email)) throw validationError("A valid email is required");
  if (password.length < 8) throw validationError("Password must be at least 8 characters");
  if (password.length > 72) throw validationError("Password must be 72 characters or fewer");
  if (email === LOCAL_USER_EMAIL) throw emailTaken();

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) throw emailTaken();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { name, email, passwordHash } });
    await seedDefaultCategories(tx, created.id);
    return created;
  }).catch((err) => {
    if (err?.code === "P2002") throw emailTaken();
    throw err;
  });

  res.status(201).json({ user: publicUser(user), token: signToken(user.id) });
});

authRouter.post("/login", async (req, res) => {
  const email = str(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) throw invalidCredentials();
  res.json({ user: publicUser(user), token: signToken(user.id) });
});

// Tokens are stateless JWTs, so logout is handled client-side by discarding the token.
authRouter.post("/logout", requireUser, (_req, res) => {
  res.status(204).end();
});

authRouter.get("/me", requireUser, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: currentUserId(req) } });
  res.json(publicUser(user));
});
