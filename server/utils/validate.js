/**
 * Request validation helpers – UUID, etc.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  if (value == null || typeof value !== 'string') return false;
  return UUID_REGEX.test(value.trim());
}

/** Express middleware: validate req.params.id is a valid UUID; 400 if not. */
export function validateUuidParam(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !isUuid(id)) {
      return res.status(400).json({ error: 'Invalid ID format.', code: 'INVALID_INPUT' });
    }
    next();
  };
}
