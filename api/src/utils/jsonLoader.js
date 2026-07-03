const fs = require('fs/promises');
const path = require('path');

const EXPORT_DIR = process.env.JSON_FILE_PATH;

// Cache objects
const CACHE = {};        // store parsed JSON per file
const CACHE_MTIME = {};  // store last modified timestamp per file

/**
 * Load JSON file with caching
 * @param {string} filename
 * @returns {Promise<any[]>} parsed JSON
 */
async function loadJsonFast(filename) {
  const fullPath = path.join(EXPORT_DIR, filename);

  const stats = await fs.stat(fullPath);
  const mtime = stats.mtimeMs;

  if (CACHE[filename] && CACHE_MTIME[filename] === mtime) {
    return CACHE[filename];
  }

  let text = await fs.readFile(fullPath, 'utf8');

  // 🔥 REMOVE INVALID CONTROL CHARACTERS
  text = text.replace(/[\u0000-\u001F\u007F]/g, '');

  const data = JSON.parse(text);

  CACHE[filename] = data;
  CACHE_MTIME[filename] = mtime;

  return data;
}


module.exports = { loadJsonFast };