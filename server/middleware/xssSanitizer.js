import DOMPurify from 'isomorphic-dompurify';

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const cleanObj = {};
    for (const [key, val] of Object.entries(value)) {
      cleanObj[key] = sanitizeValue(val);
    }
    return cleanObj;
  }
  return value;
}

export function xssSanitizer(req, res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}
