// Public alias for the shared read path. Same handler as /api/public-tarot-data.
// Both web and mobile already consume /api/public-tarot-data; this exposes the same
// handler under the standardized /api/public/* namespace. Logic lives once in
// lib/loadPublicTarotData.js.
export { default } from "../public-tarot-data";
