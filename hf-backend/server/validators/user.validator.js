// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – User Validators
// server/validators/user.validator.js
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Each category ID must be a valid MongoDB ObjectId.');

// ─────────────────────────────────────────────────────────────────────────────
// Reusable password rule (shared between register + changePassword)
// ─────────────────────────────────────────────────────────────────────────────

const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one digit.')
  .regex(
    /[!@#$%^&*]/,
    'Password must contain at least one special character (!@#$%^&*).',
  );

// ─────────────────────────────────────────────────────────────────────────────
// Optional URL — accepts a valid URL or an empty string (clears the field)
// ─────────────────────────────────────────────────────────────────────────────

const optionalUrl = z
  .string()
  .optional()
  .refine(
    (val) => val === undefined || val === '' || z.string().url().safeParse(val).success,
    { message: 'Must be a valid URL or empty.' },
  );

// ─────────────────────────────────────────────────────────────────────────────
// registerSchema
// ─────────────────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters.')
      .max(100, 'Name must be at most 100 characters.')
      .trim(),

    email: z
      .string()
      .email('Please enter a valid email address.')
      .toLowerCase()
      .trim(),

    password: passwordRules,

    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path:    ['confirmPassword'],
  });

// ─────────────────────────────────────────────────────────────────────────────
// loginSchema
// ─────────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address.')
    .toLowerCase()
    .trim(),

  password: z.string().min(1, 'Password is required.'),

  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address.')
    .toLowerCase()
    .trim(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32, 'Reset token is invalid.'),
    newPassword: passwordRules,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match.',
    path: ['confirmNewPassword'],
  });

// ─────────────────────────────────────────────────────────────────────────────
// updateProfileSchema
// ─────────────────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be at most 100 characters.')
    .trim()
    .optional(),

  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters.')
    .trim()
    .optional(),

  githubUrl:   optionalUrl,
  linkedinUrl: optionalUrl,
  twitterUrl:  optionalUrl,
});

// ─────────────────────────────────────────────────────────────────────────────
// changePasswordSchema
// ─────────────────────────────────────────────────────────────────────────────

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),

    newPassword: passwordRules,

    confirmNewPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match.',
    path:    ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password.',
    path:    ['newPassword'],
  });

// ─────────────────────────────────────────────────────────────────────────────
// categorySelectionSchema
// ─────────────────────────────────────────────────────────────────────────────

export const categorySelectionSchema = z.object({
  categoryIds: z
    .array(
      objectIdSchema,
    )
    .min(1, 'Please select at least one category.')
    .max(8, 'You may select at most 8 categories.'),
});
