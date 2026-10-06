import type { Request } from "express";
import { validationError } from "./errors.js";

/** Returns a single string query param, rejecting repeated params like ?a=1&a=2. */
export function queryString(req: Request, name: string): string | undefined {
  const value = req.query[name];
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string") throw validationError(`"${name}" must be given once`);
  return value.trim();
}

export function queryNumber(req: Request, name: string, label: string): number | undefined {
  const raw = queryString(req, name);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw validationError(`${label} must be a valid non-negative number`);
  return value;
}

export function queryInt(req: Request, name: string, label: string, min: number, max: number, fallback: number): number {
  const raw = queryString(req, name);
  if (raw === undefined) return fallback;
  if (!/^\d+$/.test(raw)) throw validationError(`${label} must be a whole number between ${min} and ${max}`);
  const value = Number(raw);
  if (value < min || value > max) throw validationError(`${label} must be a whole number between ${min} and ${max}`);
  return value;
}

/** Splits a comma-separated list, dropping blanks and duplicates. */
export function queryList(req: Request, name: string): string[] {
  const raw = queryString(req, name);
  if (raw === undefined) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}
