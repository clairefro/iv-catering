// File-based cache for Contentful data during development
// Persists cache across hot reloads

import fs from "fs";
import path from "path";

const CACHE_PATH = path.resolve(process.cwd(), ".contentful-cache.json");

function readCacheFile() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const raw = fs.readFileSync(CACHE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return {};
}

function writeCacheFile(data) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    // ignore
  }
}

export function getGalleryCache() {
  return readCacheFile().gallery || null;
}

export function setGalleryCache(data) {
  const cache = readCacheFile();
  cache.gallery = data;
  writeCacheFile(cache);
}

export function getMenuCache() {
  return readCacheFile().menu || null;
}

export function setMenuCache(data) {
  const cache = readCacheFile();
  cache.menu = data;
  writeCacheFile(cache);
}
