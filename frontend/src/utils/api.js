/**
 * Resolves a relative API path to an absolute path using the app's base URL.
 * This ensures API calls work correctly both locally (/) and in production (/beantag/).
 *
 * @param {string} path - Relative API path, e.g. 'api/batches' or 'api/batches/123'
 * @returns {string} - Absolute path, e.g. '/beantag/api/batches'
 */
export function apiUrl(path) {
  const base = import.meta.env.BASE_URL; // e.g. '/beantag/' or '/'
  // Avoid double slashes: strip leading slash from path if base ends with one
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
