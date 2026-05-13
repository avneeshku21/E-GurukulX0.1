// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Response Helpers
// server/utils/response.js
// ─────────────────────────────────────────────────────────────────────────────

/**
 * sendSuccess — send a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {*}       data        - Payload to return (object, array, null, etc.)
 * @param {string}  [message]   - Human-readable success message
 * @param {number}  [statusCode=200] - HTTP status code
 */
export function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * sendError — send a failure JSON response.
 *
 * @param {import('express').Response} res
 * @param {string}  message             - Human-readable error message
 * @param {number}  [statusCode=500]    - HTTP status code
 * @param {*}       [errors=null]       - Detailed error info (validation errors, etc.)
 */
export function sendError(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  const body = {
    success: false,
    message,
  };
  if (errors !== null && errors !== undefined) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
}

/**
 * sendPaginated — send a paginated list response.
 *
 * @param {import('express').Response} res
 * @param {Array}   data        - Page of results
 * @param {object}  pagination  - Pagination metadata
 * @param {number}  pagination.page        - Current page (1-based)
 * @param {number}  pagination.limit       - Items per page
 * @param {number}  pagination.totalItems  - Total number of matching records
 * @param {number}  pagination.totalPages  - Total number of pages
 * @param {boolean} pagination.hasNextPage
 * @param {boolean} pagination.hasPrevPage
 * @param {string}  [message='OK']
 */
export function sendPaginated(res, data = [], pagination = {}, message = 'OK') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page:        pagination.page        ?? 1,
      limit:       pagination.limit       ?? data.length,
      totalItems:  pagination.totalItems  ?? data.length,
      totalPages:  pagination.totalPages  ?? 1,
      hasNextPage: pagination.hasNextPage ?? false,
      hasPrevPage: pagination.hasPrevPage ?? false,
    },
  });
}

/**
 * buildPagination — helper to calculate pagination metadata from Prisma results.
 *
 * @param {number} page        - Current page (1-based)
 * @param {number} limit       - Items per page
 * @param {number} totalItems  - Total count from Prisma
 * @returns {{ page, limit, totalItems, totalPages, hasNextPage, hasPrevPage }}
 */
export function buildPagination(page, limit, totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
