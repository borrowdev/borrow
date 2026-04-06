import { resolve } from "path";

const CACHE_DIR = resolve(import.meta.dirname, ".docval", "cache");
const CONTENT_CACHE_DIR = resolve(CACHE_DIR, "content");

export { CACHE_DIR, CONTENT_CACHE_DIR };
