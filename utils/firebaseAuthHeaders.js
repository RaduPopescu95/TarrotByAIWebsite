import { authentication } from "../firebase";

export async function getFirebaseIdToken({ required = false, forceRefresh = false } = {}) {
  const user = authentication.currentUser;

  if (!user) {
    if (required) {
      const error = new Error("Authentication required");
      error.code = "auth/missing-user";
      throw error;
    }
    return null;
  }

  try {
    return await user.getIdToken(forceRefresh === true);
  } catch (cause) {
    if (required) {
      const error = new Error("Failed to retrieve auth token");
      error.code = "auth/token-error";
      error.cause = cause;
      throw error;
    }
    return null;
  }
}

export async function getFirebaseBearerHeader({ required = false, forceRefresh = false } = {}) {
  const token = await getFirebaseIdToken({ required, forceRefresh });
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
