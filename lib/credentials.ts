import { z } from "zod";

/** Common weak passwords rejected at registration */
const COMMON_PASSWORDS = new Set(
  [
    "password",
    "password1",
    "password123",
    "123456",
    "12345678",
    "123456789",
    "qwerty",
    "abc123",
    "letmein",
    "welcome",
    "admin",
    "admin123",
    "iloveyou",
    "monkey",
    "dragon",
    "master",
    "login",
    "passw0rd",
    "heartspace",
  ].map((p) => p.toLowerCase())
);

const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "help",
  "mod",
  "moderator",
  "official",
  "heartspace",
  "api",
  "null",
  "undefined",
]);

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be at most 24 characters")
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Username must start with a letter and contain only letters, numbers, and underscores")
  .refine((u) => !RESERVED_USERNAMES.has(u.toLowerCase()), {
    message: "That username is reserved",
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254, "Email is too long");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((p) => /[a-zA-Z]/.test(p), {
    message: "Password must include at least one letter",
  })
  .refine((p) => /[0-9]/.test(p), {
    message: "Password must include at least one number",
  })
  .refine((p) => !COMMON_PASSWORDS.has(p.toLowerCase()), {
    message: "This password is too common. Choose a stronger one.",
  })
  .refine((p) => !/\s/.test(p), {
    message: "Password cannot contain spaces",
  });

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  bio: z.string().trim().max(280, "Bio must be at most 280 characters").optional(),
});

export const loginIdentifierSchema = z
  .string()
  .trim()
  .min(1, "Enter your username or email")
  .max(254, "Identifier is too long");

export const loginPasswordSchema = z
  .string()
  .min(1, "Enter your password")
  .max(128, "Password is too long");

export const loginSchema = z.object({
  identifier: loginIdentifierSchema,
  password: loginPasswordSchema,
});

/** Generic message — do not reveal whether account exists */
export const INVALID_CREDENTIALS_MESSAGE =
  "Invalid username/email or password.";
