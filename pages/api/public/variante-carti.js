// Public alias for the shared read path. Same handler as /api/mobile/variante-carti.
// Canonical going forward is /api/public/*; /api/mobile/* is kept permanently for the
// already-shipped mobile app. Logic lives once in lib/mobilePublicData.js.
export { default } from "../mobile/variante-carti";
