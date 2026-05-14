// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Zod Validation Middleware
// server/middleware/validate.middleware.js
// ─────────────────────────────────────────────────────────────────────────────

import { ZodError } from 'zod';

/**
 * validate(schema)
 *
 * Returns an Express middleware that validates `req.body` against the
 * provided Zod schema.  On failure, responds immediately with HTTP 400 and
 * a structured error object. On success, replaces `req.body` with the parsed
 * (and coerced / stripped) result before calling next().
 *
 * @param {import('zod').ZodTypeAny} schema - A Zod schema to validate against.
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.post('/register', validate(registerSchema), registerController);
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      // parse() throws ZodError on failure; also strips unknown keys by default
      // when the schema uses z.object({ ... }).strict() or .strip()
      const parsed = schema.parse(req.body);
      req.body = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed. Please check the submitted data.',
          errors:  err.flatten(),
          // err.flatten() → { formErrors: string[], fieldErrors: Record<string, string[]> }
        });
      }
      // Unexpected error — pass to global error handler
      return next(err);
    }
  };
}

/**
 * validateQuery(schema)
 *
 * Same as validate() but operates on `req.query` instead of `req.body`.
 * Useful for GET endpoints with query-string parameters.
 *
 * @param {import('zod').ZodTypeAny} schema
 * @returns {import('express').RequestHandler}
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters.',
          errors:  err.flatten(),
        });
      }
      return next(err);
    }
  };
}

/**
 * validateParams(schema)
 *
 * Same as validate() but operates on `req.params`.
 *
 * @param {import('zod').ZodTypeAny} schema
 * @returns {import('express').RequestHandler}
 */
export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid route parameters.',
          errors:  err.flatten(),
        });
      }
      return next(err);
    }
  };
}
